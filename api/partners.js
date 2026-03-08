import { Octokit } from '@octokit/rest';

const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';
const PARTNERS_FILE = 'public/partners.json';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb'
    }
  }
};

async function getPartners(octokit) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: PARTNERS_FILE,
      ref: 'main'
    });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { partners: JSON.parse(content), sha: data.sha };
  } catch (err) {
    if (err.status === 404) return { partners: [], sha: null };
    throw err;
  }
}

async function savePartners(octokit, partners, sha, message) {
  const params = {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: PARTNERS_FILE,
    message,
    content: Buffer.from(JSON.stringify(partners, null, 2)).toString('base64'),
    branch: 'main'
  };
  if (sha) params.sha = sha;
  await octokit.repos.createOrUpdateFileContents(params);
}

export default async function handler(req, res) {
  // Allow CORS for admin panel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // GET — list partners
  if (req.method === 'GET') {
    try {
      const { partners } = await getPartners(octokit);
      return res.status(200).json({ partners });
    } catch (err) {
      console.error('GET partners error:', err);
      return res.status(500).json({ error: 'Failed to fetch partners' });
    }
  }

  // POST — add partner (upload image + register in JSON)
  if (req.method === 'POST') {
    try {
      const { filename, content, contentType, name } = req.body;

      if (!filename || !content || !contentType) {
        return res.status(400).json({ error: 'filename, content, and contentType are required' });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(contentType)) {
        return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
      }

      const fileSize = Buffer.from(content, 'base64').length;
      if (fileSize > 8 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Maximum 8MB.' });
      }

      const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
      const imagePath = `src/assets/${sanitized}`;

      // Upload image to GitHub
      let imageSha = null;
      try {
        const existing = await octokit.repos.getContent({
          owner: REPO_OWNER, repo: REPO_NAME, path: imagePath, ref: 'main'
        });
        imageSha = existing.data.sha;
      } catch (e) { /* new file */ }

      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: imagePath,
        message: `[Partners] Add partner logo: ${sanitized}`,
        content,
        ...(imageSha && { sha: imageSha }),
        branch: 'main'
      });

      // Add to partners.json
      const { partners, sha } = await getPartners(octokit);
      const id = sanitized.replace(/\.[^.]+$/, '');
      const partnerName = name && name.trim() ? name.trim() : sanitized.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');

      if (!partners.find(p => p.id === id)) {
        const newPartner = { id, name: partnerName, path: imagePath };
        partners.push(newPartner);
        await savePartners(octokit, partners, sha, `[Partners] Add ${partnerName}`);
        return res.status(200).json({ success: true, partner: newPartner });
      }

      return res.status(200).json({ success: true, partner: partners.find(p => p.id === id) });
    } catch (err) {
      console.error('POST partners error:', err);
      return res.status(500).json({ error: 'Failed to add partner' });
    }
  }

  // DELETE — remove partner from JSON (image file stays)
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { partners, sha } = await getPartners(octokit);
      const partner = partners.find(p => p.id === id);
      if (!partner) return res.status(404).json({ error: 'Partner not found' });

      const updated = partners.filter(p => p.id !== id);
      await savePartners(octokit, updated, sha, `[Partners] Remove ${partner.name}`);

      return res.status(200).json({ success: true, removed: partner });
    } catch (err) {
      console.error('DELETE partners error:', err);
      return res.status(500).json({ error: 'Failed to remove partner' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
