import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// GitHub config
const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';

// Activity logging function
async function logActivity(octokit, action, description, files) {
  try {
    let activities = [];
    let sha = null;

    try {
      // Get current activity log
      const { data: activityFile } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: 'activity-log.json',
        ref: 'main'
      });

      const parsed = JSON.parse(
        Buffer.from(activityFile.content, 'base64').toString('utf-8')
      );

      // Handle both formats: flat array or object with activities property
      activities = Array.isArray(parsed) ? parsed : (parsed.activities || []);
      sha = activityFile.sha;
    } catch (error) {
      if (error.status !== 404) {
        console.error('Failed to read activity log:', error.message);
      }
      // If file doesn't exist or can't be read, start with empty array
    }

    // Add new activity
    activities.unshift({
      id: Date.now().toString(),
      action: action,
      description: description,
      files: files,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });

    // Keep only last 100 activities (consistent with chat.js)
    if (activities.length > 100) {
      activities = activities.slice(0, 100);
    }

    // Update activity log - save as flat array
    const updateParams = {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'activity-log.json',
      message: `[Activity Log] ${action}: ${description}`,
      content: Buffer.from(JSON.stringify(activities, null, 2)).toString('base64'),
      branch: 'main'
    };

    if (sha) updateParams.sha = sha;

    await octokit.repos.createOrUpdateFileContents(updateParams);
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path: filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({
      success: false,
      error: 'File path is required'
    });
  }

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    const octokit = new Octokit({ auth: githubToken });

    console.log(`Deleting file: ${filePath}`);

    // Get the file's SHA (required for deletion)
    let fileSha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        ref: 'main'
      });
      fileSha = data.sha;
    } catch (err) {
      if (err.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
      throw err;
    }

    // Delete the file from GitHub
    await octokit.repos.deleteFile({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: `[User Confirmed] Delete ${filePath}`,
      sha: fileSha,
      branch: 'main'
    });

    console.log(`✅ Deleted from GitHub: ${filePath}`);

    // Also delete from local filesystem (for development)
    try {
      const localPath = path.join(PROJECT_ROOT, filePath);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`✅ Deleted local file: ${localPath}`);

        // Try to remove empty parent directory if it exists
        const parentDir = path.dirname(localPath);
        try {
          if (fs.readdirSync(parentDir).length === 0) {
            fs.rmdirSync(parentDir);
            console.log(`✅ Removed empty directory: ${parentDir}`);
          }
        } catch (e) {
          // Ignore errors removing directory
        }
      }
    } catch (fsError) {
      console.warn(`Warning: Could not delete local file: ${fsError.message}`);
    }

    // Log activity
    await logActivity(octokit, 'delete', `Deleted ${filePath}`, [filePath]);

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${filePath}`,
      path: filePath
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete file'
    });
  }
}
