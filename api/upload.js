import { Octokit } from '@octokit/rest';

const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb' // Increased to accommodate compressed images with base64 overhead
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { filename, content, contentType } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    if (!contentType) {
      return res.status(400).json({ error: 'Content type is required' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }

    // Validate file size (8MB limit to account for base64 encoding overhead)
    const fileSize = Buffer.from(content, 'base64').length;
    const maxSize = 8 * 1024 * 1024; // 8MB (images should be auto-compressed on client)
    if (fileSize > maxSize) {
      return res.status(400).json({
        error: `File too large. Maximum size is 8MB. Your file is ${(fileSize / 1024 / 1024).toFixed(2)}MB. Images should be automatically compressed before upload.`
      });
    }

    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    const path = `src/assets/${sanitizedFilename}`;

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Check if file already exists
    let sha = null;
    try {
      const existing = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: path,
        ref: 'main'
      });
      sha = existing.data.sha;
    } catch (err) {
      // File doesn't exist, that's fine
      if (err.status !== 404) {
        throw err;
      }
    }

    // Upload the file
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: path,
      message: `[Davidson AI] Upload image: ${sanitizedFilename}`,
      content: content, // Already base64 encoded from frontend
      sha: sha, // Include sha if updating existing file
      branch: 'main'
    });

    return res.status(200).json({
      success: true,
      path: path,
      filename: sanitizedFilename,
      message: `Image uploaded successfully to ${path}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
