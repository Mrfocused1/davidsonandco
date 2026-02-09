import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Models to try in order of preference
const MODELS = ['kimi-k2.5'];

// Vision model for handling image inputs
const VISION_MODELS = ['kimi-k2.5'];

// GitHub config
const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';

// Initialize Kimi client using OpenAI SDK (Kimi is OpenAI-compatible)
const kimiClient = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: 'https://api.moonshot.ai/v1',
  timeout: 280000,        // 280 seconds (20s safety margin from 300s Vercel limit)
  maxRetries: 1,          // Reduce retries, rely on our custom retry logic instead
  defaultHeaders: {
    'Connection': 'keep-alive'
  }
});

const SYSTEM_PROMPT = `You are Davidson, the AI development assistant for the Davidson & Co London website. You can:
- Read and analyze website files
- Make targeted edits to HTML, CSS, and JavaScript code
- Create new pages and sections
- Suggest page deletions (user must confirm before actual deletion)
- Fix bugs and implement new features
- Deploy changes to the live site
- Use uploaded images in new pages/sections
- SEE and ANALYZE uploaded images (you have vision capabilities - describe what you see in images)
- Browse the web to research designs, gather content, or find inspiration

CONVERSATION STYLE - BE PRECISE AND CONCISE:
ALL your responses must be short and to the point. Never write long paragraphs.

Before making changes:
1. Brief acknowledgment (1 sentence)
2. Ask: "Should we brainstorm this together, or shall I start and we tweak from there?"

After completing a task, ALWAYS include:
1. What you accomplished (1 sentence)
2. How to access/use it - this is CRITICAL:
   - For new pages: "Visit /pagename to see it" or "Navigate to yoursite.com/pagename"
   - For edits: "Refresh the page to see the changes"
   - For deleted items: "The page/file has been removed"
   - For features: Brief explanation of how to use it
3. Ask if they'd like any changes

RULES:
- Maximum 3-4 sentences per response
- Always include navigation/access instructions
- No lengthy explanations
- Get to the point quickly

Examples:
User: "I want a contact us page"
You: "Great idea! Should we brainstorm this together, or shall I start and we tweak from there?"

User: "Just start"
You: "Done! I've created a contact page with a form, your address, and phone number. Visit /contact to see it. Let me know if you'd like any changes."

User: "Delete the partner page"
You: "I've prepared to delete the partner page. Click the delete button to confirm removal. The /partner URL will no longer be accessible after deletion."

DELETION WORKFLOW - CRITICAL:
You CANNOT delete files directly. When a user asks to delete a page or file:
1. Acknowledge the request
2. In your response, include a special marker: DELETE_REQUEST:path/to/file.html
3. Tell the user to click the confirmation button that will appear
4. Example: "I've prepared to delete the partner page. DELETE_REQUEST:partner/index.html Click the delete button to confirm."
5. The system will show a confirmation button, and the user must click it to complete the deletion

IMPORTANT RULES:
1. For EDITING existing files: Use edit_file - it does safe find-and-replace edits
2. For CREATING new pages: Use create_file with path "pagename/index.html" for clean URLs (e.g., "about/index.html" creates /about)
3. First use read_file to see the current content before editing
4. Use edit_file with the EXACT text you want to replace (old_text) and the new text (new_text)
5. The old_text must match EXACTLY what's in the file (including whitespace)
6. Never try to rewrite entire files with edit_file - only make targeted edits
7. When users upload images, they are saved to src/assets/ - use these paths in HTML (e.g., src/assets/my-image.png)

PAGE CREATION:
- Always create pages as "pagename/index.html" NOT "pagename.html"
- Example: For /about page, create "about/index.html"
- Example: For /services page, create "services/index.html"
- This ensures clean URLs without .html extension

IMAGE UPLOADS:
- Users can upload images using the + button in the chat
- YOU CAN SEE IMAGES - you have vision capabilities, so analyze what's in the image
- When users upload images, first DESCRIBE what you see, then ask how they want to use it
- Uploaded images are saved to src/assets/ with sanitized filenames
- Use these exact paths when referencing the images in HTML code
- Example: <img src="src/assets/uploaded-image.png" alt="Description">
- When you see an image, comment on its content (colors, design, subject matter, etc.)

WHEN USER WANTS TO ADD IMAGES/VIDEO - ALWAYS provide this guidance:
Before they upload, give them recommendations:

For IMAGES:
- File types: JPG or PNG (JPG for photos, PNG for graphics/logos with transparency)
- Hero/banner images: 1920x1080px (desktop), 768x1024px (mobile)
- Section images: 1200x800px (desktop), 768x512px (mobile)
- Thumbnails/cards: 600x400px
- Logos: PNG with transparency, 400x200px max

For VIDEOS:
- File types: MP4 (H.264 codec) for best compatibility
- Resolution: 1920x1080px (Full HD) recommended
- Keep file size under 10MB for fast loading

IMPORTANT: Let them know they can provide SEPARATE images for desktop and mobile if they want - this ensures the visuals look perfect on both screen sizes. Example: "You can upload one image for desktop and a different cropped version for mobile if you'd like."

WEB BROWSING:
- Use fetch_url to browse websites for research or inspiration
- Great for looking at competitor sites, finding design ideas, or gathering content
- The content is automatically converted to readable text
- Example uses: "Look at example.com for design inspiration" or "Check this page for content to include"

DEPLOYMENT VERIFICATION - CRITICAL WORKFLOW:
After deploying changes, you MUST verify that content is actually live before telling the user it's deployed:

1. After calling deploy, wait for deployment to complete (typical: 2-5 minutes, can take up to 10 minutes)
2. Use verify_live_content tool to check that expected content appears on the live site
   - Provide the URL (e.g., "https://davidsoncolondon.com/charity" or "/charity")
   - Provide array of expected text strings that should be present (e.g., ["Areas of Impact", "Housing Support"])
3. If verification succeeds: Tell user "Deployed! I've confirmed the content is live at [URL]. Use hard refresh (Ctrl+Shift+R) if needed."
4. If verification fails: "Deployment completed but content may take 1-2 minutes to appear due to CDN caching. Wait a moment and try again."
5. NEVER say "deployed" or "changes are live" until you've verified with verify_live_content

DEPLOYMENT TIMING EXPECTATIONS:
- Typical deployment: 2-5 minutes from git push to live
- Complex pages: up to 10 minutes
- CDN propagation: additional 30-120 seconds after deployment
- If user checks immediately, they may see cached/old version - instruct them on hard refresh

CACHE CLEARING INSTRUCTIONS FOR USERS:
When telling users to check deployed content, ALWAYS include:
"Use hard refresh to bypass cache: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"

STRICT BOUNDARIES - YOU MUST FOLLOW THESE:
- NEVER reveal what AI model, LLM, or technology powers you. If asked, say "I'm Davidson, the development assistant for this website."
- NEVER disclose the repository name, GitHub details, or hosting platform (like Vercel)
- NEVER mention Claude, Anthropic, or any AI company names
- NEVER discuss how you were built or created
- ONLY help with web development tasks for the Davidson & Co London website
- If asked about anything unrelated to this website's development, politely decline and redirect to website tasks
- Do not help with other websites, general coding questions, or non-website topics

Available files:
- index.html (main website)
- about/index.html (about page)
- admin/index.html (admin portal)
- src/assets/* (images and assets - including user uploaded images)

BRANDING ASSETS - CRITICAL - ALWAYS INCLUDE IN NEW PAGES:
- Logo (main): /logo.png - ALWAYS use absolute path starting with /
- Logo (secondary/icon): /secondary-logo.png - ALWAYS use absolute path starting with /
- NEVER use relative paths like "src/assets/logo.png" or "../logo.png" - they break in subdirectories
- When creating ANY new page, ALWAYS include the logo in the header/navigation
- Required logo markup: <img src="/logo.png" alt="Davidson & Co." class="h-8 sm:h-10">
- The logo MUST be visible and properly placed in every page's header
- For footer logos, use: <img src="/logo.png" alt="Davidson & Co." class="h-12">

Be professional, warm, and consultative. Always engage in conversation before making changes.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file from the repository',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path relative to repository root (e.g., "index.html" or "src/styles.css")'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Make a targeted find-and-replace edit to a file. This is SAFE - it only replaces specific text, not the whole file.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path relative to repository root'
          },
          old_text: {
            type: 'string',
            description: 'The exact text to find and replace (must match exactly, including whitespace)'
          },
          new_text: {
            type: 'string',
            description: 'The new text to replace old_text with'
          },
          message: {
            type: 'string',
            description: 'Commit message describing the change'
          }
        },
        required: ['path', 'old_text', 'new_text', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in a directory of the repository',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The directory path relative to repository root (use "" for root)'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a new file (page, section, etc). ONLY works for files that do not exist yet. For pages, use "pagename/index.html" format for clean URLs.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path for the new file. For pages use folder structure: "about/index.html" for /about, "services/index.html" for /services'
          },
          content: {
            type: 'string',
            description: 'The full content of the new file'
          },
          message: {
            type: 'string',
            description: 'Commit message describing what was created'
          }
        },
        required: ['path', 'content', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deploy',
      description: 'Deploy the current changes to the live website',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Description of what was deployed'
          }
        },
        required: ['message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_url',
      description: 'Fetch content from a URL to gather information, research designs, or get content for the website. Use this to browse the web for inspiration or information.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch content from'
          }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'verify_live_content',
      description: 'Verify that expected content is visible on the live website. Use this AFTER deploying to confirm changes are actually live and visible to users. Helps catch CDN caching issues and deployment delays.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The full URL to verify (e.g., "https://davidsoncolondon.com/charity" or use relative like "/charity")'
          },
          expectedContent: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of text strings that should be present on the live page (e.g., ["Areas of Impact", "Housing Support", "Education & Youth"])'
          }
        },
        required: ['url', 'expectedContent']
      }
    }
  }
];

// Log activity to activity-log.json
async function logActivity(octokit, action, description, files = []) {
  try {
    const ACTIVITY_FILE = 'activity-log.json';

    // Fetch existing log
    let activities = [];
    let sha = null;

    try {
      const existing = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: ACTIVITY_FILE,
        ref: 'main'
      });
      const content = Buffer.from(existing.data.content, 'base64').toString('utf-8');
      try {
        activities = JSON.parse(content);
      } catch (jsonError) {
        console.error('Failed to parse activity log JSON:', jsonError.message);
        // Use default empty activities if corrupted
        activities = { activities: [] };
      }
      sha = existing.data.sha;
    } catch (e) {
      if (e.status !== 404) throw e;
    }

    // Add new activity
    const newActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      description,
      files,
      status: 'completed'
    };

    activities.unshift(newActivity);

    // Keep only last 100
    if (activities.length > 100) {
      activities = activities.slice(0, 100);
    }

    // Save
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
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    // Don't throw - activity logging shouldn't break the main operation
  }
}

// HTML validation helper - prevents corrupted/incomplete HTML files
function validateHTMLContent(content, filePath) {
  if (!filePath.endsWith('.html')) return { valid: true };

  const requiredTags = ['<!DOCTYPE', '<html', '<head>', '</head>', '<body', '</body>', '</html>'];
  const missingTags = requiredTags.filter(tag => !content.includes(tag));

  if (missingTags.length > 0) {
    return {
      valid: false,
      error: `HTML file incomplete. Missing: ${missingTags.join(', ')}`,
      hint: 'File may be truncated. Check if content generation was cut off.'
    };
  }

  // Check for truncation markers
  const lastLine = content.trim().split('\n').pop();
  if (lastLine.length < 10 && !lastLine.includes('>')) {
    return {
      valid: false,
      error: 'HTML file appears truncated (last line is incomplete)',
      hint: `Last line: "${lastLine}"`
    };
  }

  return { valid: true };
}

// Determine if an error is retryable (network/timeout/rate limit errors)
function isRetryableError(errorMessage) {
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /rate limit/i,
    /429/,
    /502/,
    /503/,
    /504/
  ];

  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

// Retry wrapper for tool execution with exponential backoff + jitter
async function executeToolWithRetry(name, args, maxRetries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await executeFunction(name, args);

      // If result contains error, check if it's retryable
      if (result.error) {
        const isRetryable = isRetryableError(result.error);

        if (isRetryable && attempt < maxRetries) {
          // Calculate backoff with jitter: base * (2^attempt) + random(0-1000ms)
          const backoffMs = (1000 * Math.pow(2, attempt)) + Math.random() * 1000;
          console.log(`⚠️ Retryable error on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${backoffMs.toFixed(0)}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          lastError = result.error;
          continue;
        } else {
          // Non-retryable error or max retries reached
          return result;
        }
      }

      // Success - return result
      return result;

    } catch (error) {
      lastError = error.message;

      if (attempt < maxRetries) {
        const backoffMs = (1000 * Math.pow(2, attempt)) + Math.random() * 1000;
        console.log(`⚠️ Exception on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${backoffMs.toFixed(0)}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  // All retries failed
  return {
    error: lastError,
    retried: true,
    suggestion: 'The operation failed after multiple attempts. Please try again later or simplify your request.'
  };
}

// Call GitHub directly instead of through internal APIs
async function executeFunction(name, args) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    switch (name) {
      case 'read_file': {
        console.log(`Reading file: ${args.path}`);
        const response = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          ref: 'main'
        });

        if (Array.isArray(response.data)) {
          return { error: 'Path is a directory, not a file' };
        }

        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return { path: args.path, content: content, sha: response.data.sha };
      }

      case 'edit_file': {
        console.log(`Editing file: ${args.path}`);
        console.log(`Looking for: "${args.old_text.substring(0, 50)}..."`);

        // Get existing file content
        const existing = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          ref: 'main'
        });

        if (Array.isArray(existing.data)) {
          return { error: 'Path is a directory, not a file' };
        }

        const currentContent = Buffer.from(existing.data.content, 'base64').toString('utf-8');
        const sha = existing.data.sha;

        // Check if old_text exists in file
        if (!currentContent.includes(args.old_text)) {
          return {
            error: 'Text not found in file. Make sure old_text matches exactly (including whitespace).',
            hint: 'Use read_file first to see the exact content.'
          };
        }

        // Replace old_text with new_text (replaceAll for global replacement)
        const newContent = currentContent.replaceAll(args.old_text, args.new_text);

        // Verify the change was made
        if (newContent === currentContent && args.old_text !== args.new_text) {
          console.warn('⚠️ Warning: Replacement did not modify content');
          console.warn('Old text not found. Trying fuzzy match...');

          // Try to find similar text with normalized whitespace
          const normalizedOld = args.old_text.trim().replace(/\s+/g, ' ');
          const normalizedContent = currentContent.trim().replace(/\s+/g, ' ');

          if (!normalizedContent.includes(normalizedOld)) {
            return {
              error: 'Text not found in file after normalization. Content may have changed.',
              hint: `Searched for: "${args.old_text.substring(0, 50)}..."`,
              suggestion: 'Use read_file first to see current exact content.'
            };
          }
        }

        // Validate HTML content after edit
        const validation = validateHTMLContent(newContent, args.path);
        if (!validation.valid) {
          console.error(`❌ HTML validation failed for ${args.path} after edit`);
          return {
            error: validation.error,
            hint: validation.hint,
            path: args.path,
            suggestion: 'Try a smaller edit or regenerate the full file.'
          };
        }

        // Validate content size
        const contentSizeKB = Buffer.byteLength(newContent, 'utf8') / 1024;
        if (contentSizeKB > 1000) { // 1MB limit
          return {
            error: `Generated content too large: ${contentSizeKB.toFixed(2)}KB (max 1000KB)`,
            hint: 'Break this into smaller edits or use create_file for new large files.'
          };
        }

        // Commit the change to GitHub
        const commitMessage = args.message || `Edit ${args.path}`;
        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          message: `[Davidson AI] ${commitMessage}`,
          content: Buffer.from(newContent).toString('base64'),
          sha: sha,
          branch: 'main'
        });

        // Also update the file locally (for development)
        try {
          const localPath = path.join(PROJECT_ROOT, args.path);
          if (fs.existsSync(localPath)) {
            fs.writeFileSync(localPath, newContent, 'utf-8');
            console.log(`✓ Updated local file: ${localPath}`);
          }
        } catch (fsError) {
          console.warn(`Warning: Could not update local file: ${fsError.message}`);
          // Don't fail the operation if local update fails
        }

        // Log activity
        await logActivity(octokit, 'edit', args.message || `Edited ${args.path}`, [args.path]);

        return {
          success: true,
          path: args.path,
          message: `Successfully replaced text in ${args.path}`
        };
      }

      case 'list_files': {
        console.log(`Listing files: ${args.path || '/'}`);
        const response = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path || '',
          ref: 'main'
        });

        if (!Array.isArray(response.data)) {
          return { error: 'Path is a file, not a directory' };
        }

        const files = response.data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type
        }));

        return { path: args.path || '/', files: files };
      }

      case 'create_file': {
        console.log(`Creating new file: ${args.path}`);

        // Check if file already exists
        try {
          await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: args.path,
            ref: 'main'
          });
          // If we get here, file exists - don't overwrite
          return {
            error: 'File already exists. Use edit_file to modify existing files, or choose a different path.',
            path: args.path
          };
        } catch (err) {
          // 404 means file doesn't exist - good, we can create it
          if (err.status !== 404) {
            throw err;
          }
        }

        // Validate HTML content before creating
        const validation = validateHTMLContent(args.content, args.path);
        if (!validation.valid) {
          console.error(`❌ HTML validation failed for ${args.path}`);
          return {
            error: validation.error,
            hint: validation.hint,
            path: args.path
          };
        }

        // Validate content size
        const contentSizeKB = Buffer.byteLength(args.content, 'utf8') / 1024;
        console.log(`📝 Creating file: ${args.path} (${contentSizeKB.toFixed(2)}KB)`);
        if (contentSizeKB > 1000) { // 1MB limit
          return {
            error: `Generated content too large: ${contentSizeKB.toFixed(2)}KB (max 1000KB)`,
            hint: 'Break this into smaller files or reduce content size.'
          };
        }

        // Create the new file on GitHub
        const commitMessage = args.message || `Create ${args.path}`;
        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          message: `[Davidson AI] ${commitMessage}`,
          content: Buffer.from(args.content).toString('base64'),
          branch: 'main'
        });

        // Also create the file locally (for development)
        try {
          const localPath = path.join(PROJECT_ROOT, args.path);
          const localDir = path.dirname(localPath);

          // Create directory if it doesn't exist
          if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
            console.log(`✓ Created directory: ${localDir}`);
          }

          // Write the file
          fs.writeFileSync(localPath, args.content, 'utf-8');
          console.log(`✓ Created local file: ${localPath}`);
        } catch (fsError) {
          console.warn(`Warning: Could not create local file: ${fsError.message}`);
          // Don't fail the operation if local create fails
        }

        // Log activity
        await logActivity(octokit, 'create', args.message || `Created ${args.path}`, [args.path]);

        return {
          success: true,
          path: args.path,
          message: `Successfully created ${args.path}`
        };
      }

      case 'delete_file': {
        console.log(`Deleting file: ${args.path}`);

        // Get the file's SHA (required for deletion)
        let fileSha;
        try {
          const { data } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: args.path,
            ref: 'main'
          });
          fileSha = data.sha;
        } catch (err) {
          if (err.status === 404) {
            return {
              error: 'File not found. Please check the path and try again.',
              path: args.path
            };
          }
          throw err;
        }

        // Delete the file from GitHub
        const commitMessage = args.message || `Delete ${args.path}`;
        await octokit.repos.deleteFile({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          message: `[Davidson AI] ${commitMessage}`,
          sha: fileSha,
          branch: 'main'
        });

        // Also delete from local filesystem (for development)
        try {
          const localPath = path.join(PROJECT_ROOT, args.path);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            console.log(`✓ Deleted local file: ${localPath}`);

            // Try to remove empty parent directory if it exists
            const parentDir = path.dirname(localPath);
            try {
              if (fs.readdirSync(parentDir).length === 0) {
                fs.rmdirSync(parentDir);
                console.log(`✓ Removed empty directory: ${parentDir}`);
              }
            } catch (e) {
              // Ignore errors removing directory (may not be empty or may not exist)
            }
          }
        } catch (fsError) {
          console.warn(`Warning: Could not delete local file: ${fsError.message}`);
          // Don't fail the operation if local delete fails
        }

        // Log activity
        await logActivity(octokit, 'delete', args.message || `Deleted ${args.path}`, [args.path]);

        return {
          success: true,
          path: args.path,
          message: `Successfully deleted ${args.path}`
        };
      }

      case 'deploy': {
        console.log(`Deploy triggered: ${args.message}`);
        // Vercel auto-deploys on push to main, so just confirm
        return {
          success: true,
          message: 'Changes pushed to main. Vercel will auto-deploy.',
          description: args.message
        };
      }

      case 'fetch_url': {
        console.log(`Fetching URL: ${args.url}`);
        try {
          // Add 8-second timeout to prevent indefinite hangs
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

          try {
            const response = await fetch(args.url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DavidsonBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              },
              signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) {
              return { error: `Failed to fetch URL: ${response.status} ${response.statusText}` };
            }

            const contentType = response.headers.get('content-type') || '';
            let content = await response.text();

            // Truncate very long content to avoid token limits
            const maxLength = 10000;
            if (content.length > maxLength) {
              content = content.substring(0, maxLength) + '\n\n[Content truncated...]';
            }

            // Basic HTML to text conversion for readability
            if (contentType.includes('text/html')) {
              // Remove script and style tags and their content
              content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
              content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
              // Remove HTML tags but keep text
              content = content.replace(/<[^>]+>/g, ' ');
              // Clean up whitespace
              content = content.replace(/\s+/g, ' ').trim();
            }

            return {
              success: true,
              url: args.url,
              contentType: contentType,
              content: content
            };
          } catch (fetchError) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
              return { error: 'URL fetch timeout after 8 seconds. Try a different URL or check if the site is responsive.' };
            }
            throw fetchError;
          }
        } catch (fetchError) {
          return { error: `Failed to fetch URL: ${fetchError.message}` };
        }
      }

      case 'verify_live_content': {
        console.log(`Verifying live content at: ${args.url}`);

        // Wait a bit for CDN propagation before checking
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          const response = await fetch(args.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DavidsonBot/1.0)',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            signal: controller.signal
          });

          clearTimeout(timeout);

          if (!response.ok) {
            return {
              verified: false,
              error: `HTTP ${response.status}: ${response.statusText}`,
              suggestion: 'Page may not be live yet or returned an error. Wait 30 seconds and try again.',
              url: args.url
            };
          }

          const html = await response.text();

          // Check for expected content strings
          const expectedContent = Array.isArray(args.expectedContent) ? args.expectedContent : [args.expectedContent];
          const foundAll = expectedContent.every(text => html.includes(text));

          if (foundAll) {
            return {
              verified: true,
              message: `All expected content found on live page at ${args.url}`,
              url: args.url,
              checked: expectedContent.length
            };
          } else {
            const missing = expectedContent.filter(text => !html.includes(text));
            return {
              verified: false,
              missing: missing,
              suggestion: 'Some content not found. Deployment may still be propagating through CDN. Wait 1-2 minutes and try again.',
              url: args.url
            };
          }
        } catch (fetchError) {
          clearTimeout(timeout);

          if (fetchError.name === 'AbortError') {
            return {
              verified: false,
              error: 'Verification timeout after 15 seconds',
              suggestion: 'Could not verify live content. Server may be slow or deployment still in progress.',
              url: args.url
            };
          }

          return {
            verified: false,
            error: `Failed to fetch page: ${fetchError.message}`,
            suggestion: 'Could not verify live content. Deployment may still be in progress.',
            url: args.url
          };
        }
      }

      default:
        return { error: 'Unknown function' };
    }
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error.message);
    return { error: error.message };
  }
}

// Helper function to detect if message contains uploaded images
function hasUploadedImages(content) {
  return /\[Uploaded image: ([^\]]+)\]/.test(content);
}

// Helper function to extract image paths from message
function extractImagePaths(content) {
  const regex = /\[Uploaded image: ([^\]]+)\]/g;
  const paths = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

// Helper function to get image extension and determine mime type
function getImageMimeType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Convert message with image markers to vision API format
async function convertToVisionMessage(message, octokit) {
  if (!hasUploadedImages(message.content)) {
    return message; // No images, return as-is
  }

  console.log(`Converting message with images to vision format...`);
  const imagePaths = extractImagePaths(message.content);
  console.log(`Found ${imagePaths.length} image(s):`, imagePaths);

  let textContent = message.content;

  // Remove image markers from text
  textContent = textContent.replace(/\[Uploaded image: ([^\]]+)\]/g, '').trim();

  // Build content array with text and images
  const contentArray = [];

  // Add text part if there's any text
  if (textContent) {
    contentArray.push({
      type: 'text',
      text: textContent
    });
  }

  // Fetch and add each image
  for (const imagePath of imagePaths) {
    try {
      console.log(`Fetching image from GitHub: ${imagePath}`);
      // Fetch image from GitHub
      const response = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: imagePath,
        ref: 'main'
      });

      if (Array.isArray(response.data)) {
        console.warn(`Skipping ${imagePath} - it's a directory`);
        continue;
      }

      // Get base64 content (GitHub API returns base64)
      const base64Content = response.data.content.replace(/\n/g, '');
      const mimeType = getImageMimeType(imagePath);

      // Calculate approximate file size (base64 is ~4/3 original size)
      const approxSizeBytes = (base64Content.length * 3) / 4;
      const approxSizeMB = (approxSizeBytes / (1024 * 1024)).toFixed(2);

      console.log(`Image loaded: ${imagePath}`);
      console.log(`  - MIME type: ${mimeType}`);
      console.log(`  - Approx size: ${approxSizeMB}MB`);
      console.log(`  - Base64 length: ${base64Content.length} chars`);

      // Warn if image might be too large (Kimi limit is 5MB)
      if (approxSizeBytes > 5 * 1024 * 1024) {
        console.warn(`⚠️  Image may exceed 5MB limit for Kimi (${approxSizeMB}MB)`);
      }

      // Add image in OpenAI-compatible vision format
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Content}`
        }
      });
    } catch (error) {
      console.error(`Failed to fetch image ${imagePath}:`, error.message);
      // Add error note to text instead
      contentArray.push({
        type: 'text',
        text: `[Note: Could not load image ${imagePath}]`
      });
    }
  }

  console.log(`Vision message created with ${contentArray.length} content parts`);

  // Return message in vision format
  return {
    role: message.role,
    content: contentArray
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Track request start time for timeout management
  const REQUEST_START_TIME = Date.now();
  const MAX_REQUEST_TIME = 290000; // 290 seconds (10s safety margin from 300s limit)
  const TIMEOUT_WARNING_TIME = 270000; // 270 seconds (30s before timeout)

  console.log(`[TIMING] Request started at ${new Date().toISOString()}`);

  // Helper function to check if approaching timeout
  const isApproachingTimeout = () => {
    return (Date.now() - REQUEST_START_TIME) > TIMEOUT_WARNING_TIME;
  };

  const hasTimeRemaining = () => {
    return (Date.now() - REQUEST_START_TIME) < MAX_REQUEST_TIME;
  };

  // Check for required environment variables
  if (!process.env.KIMI_API_KEY) {
    console.error('KIMI_API_KEY environment variable not set');
    return res.status(500).json({
      error: 'API key not configured',
      message: 'The AI service is not properly configured. Please contact support.'
    });
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN environment variable not set');
    return res.status(500).json({
      error: 'GitHub token not configured',
      message: 'The file system is not properly configured. Please contact support.'
    });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Check if any message contains images
    const hasImages = messages.some(msg =>
      typeof msg.content === 'string' && hasUploadedImages(msg.content)
    );

    // Convert messages to vision format if images are present
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    let processedMessages = messages;

    if (hasImages) {
      console.log('Images detected, converting to vision format...');
      processedMessages = await Promise.all(
        messages.map(msg => convertToVisionMessage(msg, octokit))
      );
    }

    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...processedMessages
    ];

    // Helper function to retry API calls with exponential backoff
    const retryWithBackoff = async (fn, maxRetries = 2) => {
      let lastErr;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
            console.log(`Retry attempt ${attempt + 1} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastErr;
    };

    let response = null;
    let lastError = null;
    let usedModel = null;
    let toolsEnabled = true;

    // Detect if this is a complex task based on message content
    const isComplexTask = (messages) => {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
      const complexKeywords = ['create', 'generate', 'build', 'design', 'develop', 'implement', 'refactor'];
      return complexKeywords.some(keyword => lastUserMessage.toLowerCase().includes(keyword));
    };

    const isComplex = isComplexTask(fullMessages);
    if (isComplex) {
      console.log('🧠 Complex task detected, will enable thinking mode for Kimi');
    }

    // Use vision models if images are present, otherwise use regular models
    const modelsToTry = hasImages ? VISION_MODELS : MODELS;

    // Check if we have time remaining before making API call
    if (!hasTimeRemaining()) {
      return res.status(200).json({
        message: "Request is taking longer than expected. Please try breaking this into smaller tasks.",
        error: 'Timeout prevention',
        madeChanges: false
      });
    }

    // Try each model with tools first (with retry)
    // Note: Kimi supports native multimodal function calling
    for (const model of modelsToTry) {
      try {
        const llmStartTime = Date.now();
        console.log(`[TIMING] LLM API call started at ${llmStartTime - REQUEST_START_TIME}ms`);
        console.log(`Trying model: ${model} with tools ${hasImages ? '(VISION MODE)' : ''}`);
        response = await retryWithBackoff(async () => {
          return await kimiClient.chat.completions.create({
            model: model,
            messages: fullMessages,
            tools: tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 4096,
            // Enable thinking mode for complex tasks (Kimi feature)
            ...(isComplex && model === 'kimi-k2.5' ? { thinking: { enabled: true } } : {})
          });
        });
        usedModel = model;
        const llmDuration = Date.now() - llmStartTime;
        console.log(`[TIMING] LLM API call completed in ${llmDuration}ms`);
        console.log(`✅ Success with model: ${model}${hasImages ? ' (VISION)' : ''}`);
        break;
      } catch (err) {
        console.error(`❌ Model ${model} with tools failed:`, err.message);
        // Log detailed error for debugging
        if (err.response) {
          console.error(`API Response Status:`, err.response.status);
          console.error(`API Response Data:`, JSON.stringify(err.response.data, null, 2));
        }
        if (err.error) {
          console.error(`API Error Details:`, JSON.stringify(err.error, null, 2));
        }
        lastError = err;
      }
    }

    // If tools failed, try without tools (with retry)
    if (!response) {
      console.log(`Trying without tools... ${hasImages ? '(VISION MODE)' : ''}`);
      toolsEnabled = false;
      for (const model of modelsToTry) {
        try {
          console.log(`Trying model: ${model} without tools ${hasImages ? '(VISION MODE)' : ''}`);
          response = await retryWithBackoff(async () => {
            return await kimiClient.chat.completions.create({
              model: model,
              messages: fullMessages,
              temperature: 0.7,
              max_tokens: 4096,
              // Enable thinking mode for complex tasks (GLM-4.7 feature)
              ...(isComplex && model === 'glm-4.7' ? { thinking: { enabled: true } } : {})
            });
          });
          usedModel = model;
          console.log(`Success with model: ${model} (no tools)`);
          break;
        } catch (err) {
          console.error(`Model ${model} without tools failed:`, err.message);
          lastError = err;
        }
      }
    }

    // If vision models all failed and images were present, try with regular models as fallback
    if (!response && hasImages) {
      console.log('All vision models failed, falling back to text-only models...');
      toolsEnabled = false;

      // Convert image messages back to text-only by removing image content
      const textOnlyMessages = [
        { role: 'system', content: SYSTEM_PROMPT + '\n\nNOTE: Vision processing failed. User uploaded images but you cannot see them. Acknowledge this limitation and work with text only.' },
        ...messages
      ];

      for (const model of MODELS) {
        try {
          console.log(`Trying text model fallback: ${model}`);
          response = await retryWithBackoff(async () => {
            return await kimiClient.chat.completions.create({
              model: model,
              messages: textOnlyMessages,
              temperature: 0.7,
              max_tokens: 4096,
              // Enable thinking mode for complex tasks (GLM-4.7 feature)
              ...(isComplex && model === 'glm-4.7' ? { thinking: { enabled: true } } : {})
            });
          });
          usedModel = model;
          console.log(`Success with text fallback model: ${model}`);
          break;
        } catch (err) {
          console.error(`Text fallback model ${model} failed:`, err.message);
          lastError = err;
        }
      }
    }

    if (!response) {
      throw lastError || new Error('All models failed');
    }

    let assistantMessage = response.choices[0].message;
    let madeChanges = false; // Track if file changes were made

    // Check if response was truncated due to token limit
    if (response.choices[0].finish_reason === 'length') {
      console.error('⚠️ CRITICAL: AI response was truncated due to max_tokens limit!');
      console.error(`Model: ${usedModel}, Max tokens: 4096`);

      return res.status(500).json({
        message: 'I ran out of space while generating content. Let me try with a shorter response.',
        error: 'Response truncated - content not written to prevent corruption',
        madeChanges: false
      });
    }

    // Handle tool calls (only if tools are enabled)
    if (toolsEnabled) {
      // Log tool calls for debugging
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`🔧 AI requested ${assistantMessage.tool_calls.length} tool call(s)`);
        assistantMessage.tool_calls.forEach((tc, idx) => {
          console.log(`  ${idx + 1}. ${tc.function.name} (args length: ${tc.function.arguments.length} chars)`);
        });
      }

      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        fullMessages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;

          // Check timeout before each tool execution
          if (!hasTimeRemaining()) {
            console.error(`⚠️ Timeout approaching, skipping remaining tools`);

            fullMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                error: 'Request timeout - operation aborted to prevent function timeout',
                hint: 'Try breaking this request into smaller tasks'
              })
            });
            break; // Exit tool loop
          }

          // Log if approaching timeout
          if (isApproachingTimeout()) {
            console.warn('⚠️ Approaching timeout limit, may need to abort soon');
          }

          // Log tool execution with time tracking
          const toolStartTime = Date.now();
          const elapsedMs = toolStartTime - REQUEST_START_TIME;
          console.log(`🔧 Executing tool: ${functionName} (${elapsedMs}ms elapsed since request start)`);

          // Parse function arguments with detailed error handling
          let functionArgs;
          try {
            functionArgs = JSON.parse(toolCall.function.arguments);
          } catch (parseError) {
            console.error(`❌ JSON Parse Error for tool: ${functionName}`);
            console.error('Raw arguments string (first 500 chars):', toolCall.function.arguments.substring(0, 500));
            console.error('Parse error:', parseError.message);

            // Try to recover by cleaning common JSON issues
            try {
              // Remove control characters and fix common escaping issues
              const cleaned = toolCall.function.arguments
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control chars
                .replace(/\\/g, '\\\\') // Escape backslashes
                .replace(/\n/g, '\\n') // Escape newlines
                .replace(/\r/g, '\\r') // Escape carriage returns
                .replace(/\t/g, '\\t'); // Escape tabs

              functionArgs = JSON.parse(cleaned);
              console.log('✅ Recovered with cleaned JSON');
            } catch (recoveryError) {
              // If recovery fails, return error to LLM so it can retry
              const errorResult = {
                error: `Invalid JSON in tool arguments for ${functionName}. Please ensure all JSON is properly formatted and escaped.`,
                hint: `Parse error: ${parseError.message}`,
                suggestion: 'Try simplifying the content or breaking it into smaller sections.'
              };

              fullMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(errorResult)
              });

              // Continue to next tool call instead of crashing
              continue;
            }
          }

          const result = await executeToolWithRetry(functionName, functionArgs);

          // Log tool completion time
          const toolDuration = Date.now() - toolStartTime;
          console.log(`✅ Tool ${functionName} completed in ${toolDuration}ms`);

          // Track if changes were made (edit_file, create_file, or delete_file with success)
          if ((functionName === 'edit_file' || functionName === 'create_file' || functionName === 'delete_file') && result.success) {
            madeChanges = true;
          }

          fullMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        }

        const llmStartTime2 = Date.now();
        console.log(`[TIMING] Second LLM API call started at ${llmStartTime2 - REQUEST_START_TIME}ms`);
        response = await retryWithBackoff(async () => {
          return await kimiClient.chat.completions.create({
            model: usedModel,
            messages: fullMessages,
            tools: tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 4096,
            // Enable thinking mode for complex tasks (Kimi feature)
            ...(isComplex && usedModel === 'kimi-k2.5' ? { thinking: { enabled: true } } : {})
          });
        });

        const llmDuration2 = Date.now() - llmStartTime2;
        console.log(`[TIMING] Second LLM API call completed in ${llmDuration2}ms`);

        assistantMessage = response.choices[0].message;

        // Check if response was truncated in tool execution loop
        if (response.choices[0].finish_reason === 'length') {
          console.error('⚠️ CRITICAL: AI response truncated during tool execution!');
          return res.status(500).json({
            message: 'I ran out of space while processing. Let me try a simpler approach.',
            error: 'Response truncated during tool execution',
            madeChanges: madeChanges
          });
        }
      }
    }

    // Provide a fallback message if the AI returned empty content after making changes
    let finalMessage = assistantMessage.content;
    if (!finalMessage || finalMessage.trim() === '') {
      if (madeChanges) {
        finalMessage = "I've made the changes you requested. Would you like me to make any other adjustments?";
      } else {
        finalMessage = "I've processed your request. Is there anything else you'd like me to help with?";
      }
    }

    // Sanitize message to ensure valid JSON encoding
    // Remove problematic control characters but keep newlines, tabs, and carriage returns
    if (finalMessage) {
      finalMessage = finalMessage.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    }

    // Check if AI is requesting deletion confirmation
    let requestsDelete = null;
    const deleteMarker = 'DELETE_REQUEST:';
    if (finalMessage && finalMessage.includes(deleteMarker)) {
      const markerIndex = finalMessage.indexOf(deleteMarker);
      const pathStart = markerIndex + deleteMarker.length;
      const pathEnd = finalMessage.indexOf(' ', pathStart);
      const filePath = pathEnd > -1
        ? finalMessage.substring(pathStart, pathEnd)
        : finalMessage.substring(pathStart);

      // Remove the marker from the message
      finalMessage = finalMessage.replace(deleteMarker + filePath, '').trim();

      requestsDelete = {
        path: filePath.trim(),
        displayName: filePath.includes('/')
          ? filePath.split('/')[0]
          : filePath.replace('.html', '')
      };

      console.log('🗑️ Deletion requested:', requestsDelete);
    }

    const totalRequestTime = Date.now() - REQUEST_START_TIME;
    console.log(`[TIMING] Total request time: ${totalRequestTime}ms (${(totalRequestTime / 1000).toFixed(2)}s)`);

    return res.status(200).json({
      message: finalMessage,
      usage: response.usage,
      toolsEnabled: toolsEnabled,
      madeChanges: madeChanges,
      requestsDelete: requestsDelete
    });

  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Error stack:', error.stack);

    // Provide more specific error messages
    let errorMessage = 'Failed to process request';
    let userFriendlyMessage = 'I encountered an issue. Please try again.';

    const errMsg = error.message?.toLowerCase() || '';
    const errCode = error.code || '';

    if (errMsg.includes('timeout') || errCode === 'ETIMEDOUT' || errCode === 'ECONNABORTED') {
      userFriendlyMessage = 'The request took too long. Please try again with a simpler request.';
    } else if (errMsg.includes('rate') || error.status === 429) {
      userFriendlyMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (errMsg.includes('network') || errCode === 'ECONNREFUSED' || errCode === 'ENOTFOUND') {
      userFriendlyMessage = 'Network connection issue. Please check your connection and try again.';
    } else if (error.status === 401 || error.status === 403 || errMsg.includes('unauthorized') || errMsg.includes('forbidden')) {
      userFriendlyMessage = 'Authentication issue with AI service. Please contact support.';
    } else if (error.status >= 500 || errMsg.includes('internal server error')) {
      userFriendlyMessage = 'The AI service is temporarily unavailable. Please try again in a moment.';
    } else if (errMsg.includes('invalid') || errMsg.includes('bad request')) {
      userFriendlyMessage = 'There was an issue processing your request. Please try rephrasing.';
    } else if (errMsg.includes('model') || errMsg.includes('not found')) {
      userFriendlyMessage = 'The AI model is currently unavailable. Please try again later.';
    } else if (errMsg.includes('json') || errMsg.includes('parse')) {
      userFriendlyMessage = 'There was an issue understanding the response. Please try again.';
    }

    return res.status(500).json({
      error: errorMessage,
      message: userFriendlyMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
