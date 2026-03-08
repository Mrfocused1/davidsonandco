import { Octokit } from '@octokit/rest';

const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';
const LISTINGS_FILE = 'public/listings.json';
const INDEX_FILE = 'index.html';
const LISTINGS_INDEX_FILE = 'listings/index.html';

export const config = {
  api: {
    bodyParser: { sizeLimit: '50mb' }
  }
};

// ── GitHub helpers ────────────────────────────────────────────────────────────

async function getFile(octokit, path) {
  const { data } = await octokit.repos.getContent({
    owner: REPO_OWNER, repo: REPO_NAME, path, ref: 'main'
  });
  return { content: Buffer.from(data.content, 'base64').toString('utf-8'), sha: data.sha };
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

async function getListings(octokit) {
  try {
    const { content, sha } = await getFile(octokit, LISTINGS_FILE);
    return { listings: JSON.parse(content), sha };
  } catch (err) {
    if (err.status === 404) return { listings: [], sha: null };
    throw err;
  }
}

// ── HTML card template ────────────────────────────────────────────────────────

function cardHtml(listing) {
  const { id, title, area, postcode, price, priceUnit, beds, type, status, image } = listing;
  const imgPath = image.startsWith('listings/') ? `/${image}` : `/${image}`;
  const statusBg = status === 'Available' ? 'bg-green-600' : status === 'Let Agreed' || status === 'Sold' ? 'bg-gray-600' : 'bg-brand-gold';
  const statusText = status === 'Available' ? 'text-white' : 'text-brand-black';
  return `
        <!-- Property Card: ${title} -->
        <a href="/listings/${id}" class="property-card group block">
          <div class="relative overflow-hidden bg-brand-black border border-white/5 hover:border-brand-gold/30 transition-all duration-500">
            <div class="relative h-80 overflow-hidden">
              <img src="${imgPath}" alt="${title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
              <div class="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent opacity-60"></div>
              <div class="absolute top-4 left-4 px-3 py-1 ${statusBg} ${statusText} text-xs tracking-widest font-semibold">
                ${status.toUpperCase()}
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center justify-between mb-3">
                <span class="text-brand-gold text-xs tracking-widest">${type.toUpperCase()}</span>
                <span class="text-gray-500 text-xs">${postcode}</span>
              </div>
              <h3 class="text-xl font-serif mb-2 group-hover:text-brand-gold transition-colors duration-300">${title}</h3>
              <p class="text-gray-400 text-sm mb-4">${area}</p>
              <div class="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <span class="text-2xl font-serif text-brand-gold">£${price}</span>
                  <span class="text-gray-500 text-sm ml-1">${priceUnit}</span>
                </div>
                <div class="text-xs text-gray-500">
                  <span>${beds}</span>
                </div>
              </div>
            </div>
          </div>
        </a>`;
}

// ── HTML manipulation ─────────────────────────────────────────────────────────

function addCardToHtml(html, listing, gridEndPattern) {
  const card = cardHtml(listing);
  return html.replace(gridEndPattern, card + '\n        \n      </div>');
}

function removeCardFromHtml(html, slug) {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `\\n?\\s*<!-- Property Card:[^>]*-->\\s*<a href="/listings/${escaped}"[\\s\\S]*?</a>`,
    'g'
  );
  return html.replace(pattern, '');
}

// ── Listing detail page generator ────────────────────────────────────────────

function generateListingPage(listing) {
  const { id, title, area, postcode, price, priceUnit, type, status, description, features, image, images } = listing;
  const mainImg = image.startsWith('listings/') ? `/${image}` : `/${image}`;
  const allImages = [image, ...(images || [])].filter(Boolean);
  const galleryImages = allImages.slice(1);

  const featuresHtml = (features || []).map(f =>
    `            <li class="flex items-start gap-3">
              <span class="text-brand-gold mt-1">✦</span>
              <span class="text-gray-300">${f}</span>
            </li>`
  ).join('\n');

  const galleryHtml = galleryImages.length > 0 ? `

  <!-- GALLERY -->
  <section class="py-24 bg-brand-black">
    <div class="max-w-6xl mx-auto px-8">
      <div class="flex items-center gap-8 mb-16">
        <div class="w-24 h-[1px] bg-brand-gold"></div>
        <h2 class="text-4xl font-serif">Gallery</h2>
        <div class="w-24 h-[1px] bg-brand-gold"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${galleryImages.map(img => `
        <div class="relative h-64 overflow-hidden">
          <img src="/${img}" alt="${title}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700">
        </div>`).join('')}
      </div>
    </div>
  </section>` : '';

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}, ${area} | Davidson &amp; Co London</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&family=Manrope:wght@200;300;400;500&display=swap" rel="stylesheet">

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: { black: '#080808', charcoal: '#121212', gold: '#D4AF37', white: '#F5F5F5' }
          },
          fontFamily: { serif: ['Cinzel', 'serif'], sans: ['Manrope', 'sans-serif'] }
        }
      }
    }
  </script>

  <style>
    body { background-color: #080808; color: #F5F5F5; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
    .grain-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 9999;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
    }
  </style>
</head>

<body class="relative font-sans">
  <div class="grain-overlay"></div>

  <!-- Navigation -->
  <nav class="fixed top-0 left-0 w-full z-50 flex justify-between items-center p-8 mix-blend-difference">
    <a href="/"><img src="/logo.png" alt="Davidson &amp; Co." class="h-8 sm:h-10"></a>
    <div class="hidden md:flex items-center gap-8">
      <a href="/" class="text-xs tracking-widest text-white/60 hover:text-brand-gold transition-colors">Home</a>
      <a href="/listings" class="text-xs tracking-widest text-white/60 hover:text-brand-gold transition-colors">Listings</a>
      <a href="/#contact" class="text-xs tracking-widest text-white/60 hover:text-brand-gold transition-colors">Contact</a>
    </div>
  </nav>

  <!-- HERO -->
  <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-black">
    <div class="absolute inset-0 z-0">
      <img src="${mainImg}" alt="${title}" class="w-full h-full object-cover opacity-30 scale-110" id="hero-bg">
      <div class="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/60 to-transparent opacity-90"></div>
    </div>
    <div class="relative z-10 max-w-4xl mx-auto px-8 text-center">
      <div class="inline-block px-4 py-2 border border-brand-gold/30 mb-6">
        <span class="text-brand-gold text-xs tracking-[0.3em] uppercase">${status}</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-serif font-bold leading-tight mb-6">${title}</h1>
      <p class="text-2xl md:text-3xl font-serif text-brand-gold mb-8">${area}, ${postcode}</p>
      <div class="h-[1px] w-32 bg-brand-gold mx-auto mb-8"></div>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-8">
        <div>
          <span class="text-4xl md:text-5xl font-serif text-brand-gold">£${price}</span>
          <span class="text-gray-400 text-sm ml-2">${priceUnit}</span>
        </div>
        <div class="w-[1px] h-8 bg-white/20 hidden sm:block"></div>
        <div><span class="text-xs text-gray-400 uppercase tracking-wider">${type}</span></div>
      </div>
    </div>
  </section>

  <!-- OVERVIEW -->
  <section class="py-24 bg-brand-charcoal">
    <div class="max-w-6xl mx-auto px-8">
      <div class="flex items-center gap-8 mb-16">
        <div class="w-24 h-[1px] bg-brand-gold"></div>
        <h2 class="text-4xl font-serif">Property Overview</h2>
        <div class="w-24 h-[1px] bg-brand-gold"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <p class="text-gray-300 font-light leading-relaxed text-lg mb-8">${description}</p>
        </div>
        <div class="bg-brand-black/50 p-8 border border-white/5">
          <h3 class="text-xl font-serif mb-6 text-brand-gold">Key Features</h3>
          <ul class="space-y-4">
${featuresHtml}
          </ul>
        </div>
      </div>
    </div>
  </section>
${galleryHtml}

  <!-- CONTACT -->
  <section class="py-24 bg-brand-charcoal border-t border-white/5">
    <div class="max-w-4xl mx-auto px-8 text-center">
      <div class="w-[1px] h-16 bg-brand-gold mx-auto mb-8"></div>
      <h2 class="text-3xl md:text-4xl font-serif text-brand-white mb-4">Enquire About This Property</h2>
      <p class="text-gray-400 text-sm mb-8">Contact Davidson &amp; Co London to arrange a viewing or request further information.</p>
      <a href="/#contact" class="inline-block px-12 py-4 bg-brand-gold text-brand-black text-xs tracking-[0.2em] hover:bg-brand-white transition-all duration-300 font-semibold">
        GET IN TOUCH
      </a>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-black text-white/40 py-12 px-8 border-t border-white/5 text-center">
    <a href="/"><img src="/logo.png" alt="Davidson &amp; Co." class="h-8 mx-auto mb-4 opacity-60"></a>
    <p class="text-xs tracking-widest">© ${new Date().getFullYear()} Davidson &amp; Co London. All rights reserved.</p>
  </footer>

  <script>
    gsap.registerPlugin(ScrollTrigger);
    gsap.to('#hero-bg', { yPercent: 15, ease: 'none', scrollTrigger: { trigger: 'body', start: 'top top', end: '30% top', scrub: true } });
  </script>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // GET
  if (req.method === 'GET') {
    try {
      const { listings } = await getListings(octokit);
      return res.status(200).json({ listings });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch listings' });
    }
  }

  // POST — add listing
  if (req.method === 'POST') {
    try {
      const { title, area, postcode, price, priceUnit, beds, type, status, description, features, images } = req.body;

      if (!title || !area || !price) {
        return res.status(400).json({ error: 'title, area, and price are required' });
      }

      // Generate slug
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Upload images to public/listings/SLUG/
      const uploadedImages = [];
      for (const img of (images || [])) {
        const { filename, content, contentType } = img;
        if (!filename || !content) continue;
        const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
        const imgPath = `public/listings/${slug}/${sanitized}`;

        let sha = null;
        try {
          const ex = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: imgPath, ref: 'main' });
          sha = ex.data.sha;
        } catch (e) { /* new */ }

        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER, repo: REPO_NAME,
          path: imgPath,
          message: `[Listings] Add image for ${slug}: ${sanitized}`,
          content,
          ...(sha && { sha }),
          branch: 'main'
        });
        uploadedImages.push(`listings/${slug}/${sanitized}`);
      }

      const listing = {
        id: slug, title, area, postcode: postcode || '',
        price, priceUnit: priceUnit || 'PCM',
        beds: beds || '', type: type || 'For Let',
        status: status || 'Available',
        description: description || '',
        features: features || [],
        image: uploadedImages[0] || 'src/assets/coming-soon.jpg',
        images: uploadedImages.slice(1)
      };

      // Update listings.json
      const { listings, sha: listingsSha } = await getListings(octokit);
      if (!listings.find(l => l.id === slug)) {
        listings.push(listing);
        await saveFile(octokit, LISTINGS_FILE, JSON.stringify(listings, null, 2), listingsSha, `[Listings] Add ${title}`);
      }

      // Create listing detail page
      const listingPagePath = `listings/${slug}/index.html`;
      let listingPageSha = null;
      try {
        const ex = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: listingPagePath, ref: 'main' });
        listingPageSha = ex.data.sha;
      } catch (e) { /* new */ }
      await saveFile(octokit, listingPagePath, generateListingPage(listing), listingPageSha, `[Listings] Create page for ${title}`);

      // Add card to index.html (homepage)
      const { content: homeHtml, sha: homeSha } = await getFile(octokit, INDEX_FILE);
      const updatedHome = homeHtml.replace(
        /(\s*<\/div>\s*\n\s*<!-- View All Properties CTA -->)/,
        cardHtml(listing) + '\n        \n      </div>\n\n      <!-- View All Properties CTA -->'
      );
      if (updatedHome !== homeHtml) {
        await saveFile(octokit, INDEX_FILE, updatedHome, homeSha, `[Listings] Add ${title} to homepage`);
      }

      // Add card to listings/index.html
      const { content: listingsHtml, sha: listingsSha2 } = await getFile(octokit, LISTINGS_INDEX_FILE);
      const updatedListings = listingsHtml.replace(
        /(\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/section>\s*\n\s*<!-- SECTION 5)/,
        cardHtml(listing) + '\n        \n      </div>\n    </div>\n  </section>\n\n  <!-- SECTION 5'
      );
      if (updatedListings !== listingsHtml) {
        await saveFile(octokit, LISTINGS_INDEX_FILE, updatedListings, listingsSha2, `[Listings] Add ${title} to listings page`);
      }

      return res.status(200).json({ success: true, listing });
    } catch (err) {
      console.error('POST listings error:', err);
      return res.status(500).json({ error: err.message || 'Failed to add listing' });
    }
  }

  // DELETE — remove listing
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { listings, sha: listingsSha } = await getListings(octokit);
      const listing = listings.find(l => l.id === id);
      if (!listing) return res.status(404).json({ error: 'Listing not found' });

      // Remove from listings.json
      await saveFile(octokit, LISTINGS_FILE, JSON.stringify(listings.filter(l => l.id !== id), null, 2), listingsSha, `[Listings] Remove ${listing.title}`);

      // Remove card from index.html
      const { content: homeHtml, sha: homeSha } = await getFile(octokit, INDEX_FILE);
      const updatedHome = removeCardFromHtml(homeHtml, id);
      if (updatedHome !== homeHtml) {
        await saveFile(octokit, INDEX_FILE, updatedHome, homeSha, `[Listings] Remove ${listing.title} from homepage`);
      }

      // Remove card from listings/index.html
      const { content: listingsHtml, sha: listingsSha2 } = await getFile(octokit, LISTINGS_INDEX_FILE);
      const updatedListings = removeCardFromHtml(listingsHtml, id);
      if (updatedListings !== listingsHtml) {
        await saveFile(octokit, LISTINGS_INDEX_FILE, updatedListings, listingsSha2, `[Listings] Remove ${listing.title} from listings page`);
      }

      // Delete listing detail page
      try {
        const { data } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: `listings/${id}/index.html`, ref: 'main' });
        await octokit.repos.deleteFile({
          owner: REPO_OWNER, repo: REPO_NAME,
          path: `listings/${id}/index.html`,
          message: `[Listings] Delete page for ${listing.title}`,
          sha: data.sha, branch: 'main'
        });
      } catch (e) { /* page may not exist */ }

      return res.status(200).json({ success: true, removed: listing });
    } catch (err) {
      console.error('DELETE listings error:', err);
      return res.status(500).json({ error: err.message || 'Failed to remove listing' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
