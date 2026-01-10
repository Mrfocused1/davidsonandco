import { Octokit } from '@octokit/rest';

const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path = '' } = req.body;

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

    if (!Array.isArray(response.data)) {
      return res.status(400).json({ error: 'Path is a file, not a directory' });
    }

    const files = response.data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size
    }));

    return res.status(200).json({
      path: path || '/',
      files: files
    });

  } catch (error) {
    console.error('GitHub list error:', error);

    if (error.status === 404) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    return res.status(500).json({
      error: 'Failed to list files',
      details: error.message
    });
  }
}
