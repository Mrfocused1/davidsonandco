import { Octokit } from '@octokit/rest';

const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';

// Files that should not be readable for security
const BLOCKED_PATTERNS = [
  /\.env/i,
  /secrets?\./i,
  /credentials?\./i,
  /\.pem$/i,
  /\.key$/i,
  /password/i
];

function isBlockedPath(path) {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(path));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path } = req.body;

  if (!path) {
    return res.status(400).json({ error: 'Path is required' });
  }

  if (isBlockedPath(path)) {
    return res.status(403).json({ error: 'Access to this file is restricted' });
  }

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    const response = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: path,
      ref: 'main'
    });

    if (Array.isArray(response.data)) {
      return res.status(400).json({ error: 'Path is a directory, not a file' });
    }

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');

    return res.status(200).json({
      path: path,
      content: content,
      sha: response.data.sha,
      size: response.data.size
    });

  } catch (error) {
    console.error('GitHub read error:', error);

    if (error.status === 404) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.status(500).json({
      error: 'Failed to read file',
      details: error.message
    });
  }
}
