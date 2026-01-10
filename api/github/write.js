import { Octokit } from '@octokit/rest';

const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';

// Files that should not be writable for security
const BLOCKED_PATTERNS = [
  /\.env/i,
  /secrets?\./i,
  /credentials?\./i,
  /\.pem$/i,
  /\.key$/i,
  /password/i,
  /api\//i,  // Prevent modifying API files
  /package\.json$/i,
  /package-lock\.json$/i,
  /node_modules\//i
];

// Only allow these file extensions
const ALLOWED_EXTENSIONS = [
  '.html',
  '.css',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.md',
  '.txt',
  '.svg'
];

function isBlockedPath(path) {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(path));
}

function hasAllowedExtension(path) {
  return ALLOWED_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path, content, message } = req.body;

  if (!path || content === undefined || !message) {
    return res.status(400).json({ error: 'Path, content, and message are required' });
  }

  if (isBlockedPath(path)) {
    return res.status(403).json({ error: 'Modifying this file is not allowed for security reasons' });
  }

  if (!hasAllowedExtension(path)) {
    return res.status(403).json({ error: 'File type not allowed' });
  }

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    // Try to get existing file to get its SHA
    let sha;
    try {
      const existing = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: path,
        ref: 'main'
      });
      sha = existing.data.sha;
    } catch (e) {
      // File doesn't exist, that's okay for new files
      if (e.status !== 404) throw e;
    }

    const response = await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: path,
      message: `[Davidson AI] ${message}`,
      content: Buffer.from(content).toString('base64'),
      sha: sha,
      branch: 'main'
    });

    return res.status(200).json({
      success: true,
      path: path,
      sha: response.data.content.sha,
      commit: response.data.commit.sha,
      message: `File ${sha ? 'updated' : 'created'} successfully`
    });

  } catch (error) {
    console.error('GitHub write error:', error);
    return res.status(500).json({
      error: 'Failed to write file',
      details: error.message
    });
  }
}
