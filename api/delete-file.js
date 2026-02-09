import { Octokit } from '@octokit/rest';
import path from 'path';

// GitHub config
const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';

// Security: Block dangerous file paths
const BLOCKED_PATTERNS = [
  /^api\//i,           // Block api/ directory
  /^\.env/i,           // Block .env files
  /^\.git/i,           // Block .git directory
  /^package\.json$/i,  // Block package.json
  /^vercel\.json$/i,   // Block vercel.json
  /^node_modules\//i   // Block node_modules
];

const ALLOWED_EXTENSIONS = ['.html', '.css', '.js', '.json', '.md', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

function isPathSafe(filePath) {
  // Check for path traversal
  if (filePath.includes('..') || filePath.includes('//')) {
    return { safe: false, reason: 'Path traversal detected' };
  }

  // Check blocked patterns
  if (BLOCKED_PATTERNS.some(pattern => pattern.test(filePath))) {
    return { safe: false, reason: 'Path matches blocked pattern (api/, .env, etc.)' };
  }

  // Check file extension
  const ext = path.extname(filePath).toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return { safe: false, reason: `File extension ${ext} not allowed` };
  }

  return { safe: true };
}

// Activity logging function with retry-on-conflict logic
async function logActivity(octokit, action, description, files) {
  const MAX_RETRIES = 3;
  const ACTIVITY_FILE = 'activity-log.json';

  const newActivity = {
    id: Date.now().toString(),
    action: action,
    description: description,
    files: files,
    timestamp: new Date().toISOString(),
    status: 'completed'
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      let activities = [];
      let sha = null;

      try {
        // Get current activity log (fresh on each retry)
        const { data: activityFile } = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: ACTIVITY_FILE,
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
      activities.unshift(newActivity);

      // Keep only last 100 activities (consistent with chat.js)
      if (activities.length > 100) {
        activities = activities.slice(0, 100);
      }

      // Update activity log - save as flat array
      const updateParams = {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: ACTIVITY_FILE,
        message: `[Activity Log] ${action}: ${description}`,
        content: Buffer.from(JSON.stringify(activities, null, 2)).toString('base64'),
        branch: 'main'
      };

      if (sha) updateParams.sha = sha;

      await octokit.repos.createOrUpdateFileContents(updateParams);

      // Success!
      if (attempt > 0) {
        console.log(`✅ Activity log updated successfully on attempt ${attempt + 1}`);
      }
      return;

    } catch (error) {
      // Check if it's a 409 conflict (stale SHA)
      if (error.status === 409 && attempt < MAX_RETRIES - 1) {
        console.warn(`⚠️ Activity log conflict on attempt ${attempt + 1}, retrying...`);
        // Wait a bit before retrying (exponential backoff with jitter)
        const delay = 100 * Math.pow(2, attempt) + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry with fresh SHA
      }

      console.error('Failed to log activity:', error.message);
      return; // Don't throw - activity logging shouldn't break the main operation
    }
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

  // SECURITY: Validate file path
  const pathCheck = isPathSafe(filePath);
  if (!pathCheck.safe) {
    console.warn(`🚫 Blocked delete attempt: ${filePath} - ${pathCheck.reason}`);
    return res.status(403).json({
      success: false,
      error: `Cannot delete this file: ${pathCheck.reason}`
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

    // Note: Local filesystem operations removed (serverless environment)

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
