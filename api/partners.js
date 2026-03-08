import { Octokit } from '@octokit/rest';

const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';
const PARTNERS_FILE = 'public/partners.json';
const INDEX_FILE = 'index.html';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb'
    }
  }
};

// ── GitHub helpers ────────────────────────────────────────────────────────────

async function getFile(octokit, path) {
  const { data } = await octokit.repos.getContent({
    owner: REPO_OWNER, repo: REPO_NAME, path, ref: 'main'
  });
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha
  };
}

async function saveFile(octokit, path, content, sha, message) {
  const params = {
    owner: REPO_OWNER, repo: REPO_NAME, path, message,
    content: Buffer.from(content).toString('base64'),
    branch: 'main'
  };
  if (sha) params.sha = sha;
  await octokit.repos.createOrUpdateFileContents(params);
}

async function getPartners(octokit) {
  try {
    const { content, sha } = await getFile(octokit, PARTNERS_FILE);
    return { partners: JSON.parse(content), sha };
  } catch (err) {
    if (err.status === 404) return { partners: [], sha: null };
    throw err;
  }
}

// ── HTML manipulation ─────────────────────────────────────────────────────────

const PARTNER_LOGO_HTML = (imagePath, name) => `
        <div class="partner-logo opacity-0 transform translate-y-8 group">
          <div class="w-full aspect-[2/1] bg-white/5 border border-white/10 flex items-center justify-center p-4 hover:border-brand-gold/30 transition-all duration-500 hover:bg-white/10">
            <img src="/${imagePath}" alt="${name}" class="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-500">
          </div>
        </div>`;

function addPartnerToHtml(html, imagePath, name) {
  // Insert before the closing </div> of #partners-grid
  return html.replace(
    /(<div id="partners-grid"[\s\S]*?)(\n\s*<\/div>(\s*\n\s*<\/div>\s*\n\s*<\/section>))/,
    (_, grid, closing) => grid + PARTNER_LOGO_HTML(imagePath, name) + '\n' + closing
  );
}

function removePartnerFromHtml(html, imagePath) {
  // Remove the partner-logo block containing this image src
  const escaped = imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `\\n?\\s*<div class="partner-logo[^"]*">\\s*<div[^>]*>\\s*<img[^>]*src="\\/${escaped}"[^>]*>\\s*<\\/div>\\s*<\\/div>`,
    'g'
  );
  return html.replace(pattern, '');
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
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

  // POST — add partner
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

      if (Buffer.from(content, 'base64').length > 8 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Maximum 8MB.' });
      }

      const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
      const imagePath = `public/partners/${sanitized}`;
      const publicPath = `partners/${sanitized}`;

      // Upload image to public/partners/
      let imageSha = null;
      try {
        const existing = await octokit.repos.getContent({
          owner: REPO_OWNER, repo: REPO_NAME, path: imagePath, ref: 'main'
        });
        imageSha = existing.data.sha;
      } catch (e) { /* new file */ }

      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER, repo: REPO_NAME,
        path: imagePath,
        message: `[Partners] Add partner logo: ${sanitized}`,
        content,
        ...(imageSha && { sha: imageSha }),
        branch: 'main'
      });

      const partnerName = name && name.trim() ? name.trim() : sanitized.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');
      const id = sanitized.replace(/\.[^.]+$/, '');

      // Update partners.json
      const { partners, sha: partnersSha } = await getPartners(octokit);
      const newPartner = { id, name: partnerName, path: publicPath };

      if (!partners.find(p => p.id === id)) {
        partners.push(newPartner);
        const updatedJson = JSON.stringify(partners, null, 2);
        await saveFile(octokit, PARTNERS_FILE, updatedJson, partnersSha, `[Partners] Add ${partnerName}`);
      }

      // Update index.html
      const { content: htmlContent, sha: htmlSha } = await getFile(octokit, INDEX_FILE);
      const updatedHtml = addPartnerToHtml(htmlContent, publicPath, partnerName);
      await saveFile(octokit, INDEX_FILE, updatedHtml, htmlSha, `[Partners] Add partner logo: ${partnerName}`);

      return res.status(200).json({ success: true, partner: newPartner });
    } catch (err) {
      console.error('POST partners error:', err);
      return res.status(500).json({ error: err.message || 'Failed to add partner' });
    }
  }

  // DELETE — remove partner
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { partners, sha: partnersSha } = await getPartners(octokit);
      const partner = partners.find(p => p.id === id);
      if (!partner) return res.status(404).json({ error: 'Partner not found' });

      // Remove from partners.json
      const updated = partners.filter(p => p.id !== id);
      await saveFile(
        octokit, PARTNERS_FILE,
        JSON.stringify(updated, null, 2),
        partnersSha,
        `[Partners] Remove ${partner.name}`
      );

      // Remove from index.html
      const { content: htmlContent, sha: htmlSha } = await getFile(octokit, INDEX_FILE);
      const updatedHtml = removePartnerFromHtml(htmlContent, partner.path);
      await saveFile(octokit, INDEX_FILE, updatedHtml, htmlSha, `[Partners] Remove partner: ${partner.name}`);

      return res.status(200).json({ success: true, removed: partner });
    } catch (err) {
      console.error('DELETE partners error:', err);
      return res.status(500).json({ error: err.message || 'Failed to remove partner' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
