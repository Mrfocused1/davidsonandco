import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';

// Models to try in order of preference (glm-4.7 is the newest, used by EastD)
const MODELS = ['glm-4.7', 'glm-4-flash', 'glm-4-air', 'glm-4', 'glm-4-plus'];

// GitHub config
const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';

// Initialize GLM client using OpenAI SDK (GLM is OpenAI-compatible)
const glmClient = new OpenAI({
  apiKey: process.env.GLM_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4'
});

const SYSTEM_PROMPT = `You are Davidson, the AI development assistant for the Davidson & Co London website. You can:
- Read and analyze website files
- Make targeted edits to HTML, CSS, and JavaScript code
- Create new pages and sections
- Delete pages or files that are no longer needed
- Fix bugs and implement new features
- Deploy changes to the live site
- Use uploaded images in new pages/sections
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
You: "Done! I've removed the partner page. The /partner URL will no longer be accessible after publishing. Anything else?"

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
- Uploaded images are saved to src/assets/ with sanitized filenames
- When a user uploads images, you'll see "[Uploaded image: src/assets/filename.png]" in their message
- Use these exact paths when referencing the images in HTML code
- Example: <img src="src/assets/uploaded-image.png" alt="Description">

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
      name: 'delete_file',
      description: 'Delete a file or page from the repository. Use this to remove pages, sections, or files that are no longer needed.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path to delete (e.g., "partner/index.html" to delete the partner page)'
          },
          message: {
            type: 'string',
            description: 'Commit message describing what was deleted'
          }
        },
        required: ['path', 'message']
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
      activities = JSON.parse(content);
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

        // Replace old_text with new_text
        const newContent = currentContent.replace(args.old_text, args.new_text);

        // Verify the change was made
        if (newContent === currentContent) {
          return { error: 'No changes made - old_text and new_text might be the same' };
        }

        // Commit the change
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

        // Create the new file
        const commitMessage = args.message || `Create ${args.path}`;
        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          message: `[Davidson AI] ${commitMessage}`,
          content: Buffer.from(args.content).toString('base64'),
          branch: 'main'
        });

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

        // Delete the file
        const commitMessage = args.message || `Delete ${args.path}`;
        await octokit.repos.deleteFile({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          message: `[Davidson AI] ${commitMessage}`,
          sha: fileSha,
          branch: 'main'
        });

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
          const response = await fetch(args.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DavidsonBot/1.0)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          });

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
          return { error: `Failed to fetch URL: ${fetchError.message}` };
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key
  if (!process.env.GLM_API_KEY) {
    console.error('GLM_API_KEY environment variable not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
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

    // Try each model with tools first (with retry)
    for (const model of MODELS) {
      try {
        console.log(`Trying model: ${model} with tools`);
        response = await retryWithBackoff(async () => {
          return await glmClient.chat.completions.create({
            model: model,
            messages: fullMessages,
            tools: tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 2048
          });
        });
        usedModel = model;
        console.log(`Success with model: ${model}`);
        break;
      } catch (err) {
        console.error(`Model ${model} with tools failed:`, err.message);
        lastError = err;
      }
    }

    // If tools failed, try without tools (with retry)
    if (!response) {
      console.log('Trying without tools...');
      toolsEnabled = false;
      for (const model of MODELS) {
        try {
          console.log(`Trying model: ${model} without tools`);
          response = await retryWithBackoff(async () => {
            return await glmClient.chat.completions.create({
              model: model,
              messages: fullMessages,
              temperature: 0.7,
              max_tokens: 2048
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

    if (!response) {
      throw lastError || new Error('All models failed');
    }

    let assistantMessage = response.choices[0].message;
    let madeChanges = false; // Track if file changes were made

    // Handle tool calls (only if tools are enabled)
    if (toolsEnabled) {
      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        fullMessages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`Executing tool: ${functionName}`, functionArgs);
          const result = await executeFunction(functionName, functionArgs);

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

        response = await retryWithBackoff(async () => {
          return await glmClient.chat.completions.create({
            model: usedModel,
            messages: fullMessages,
            tools: tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 2048
          });
        });

        assistantMessage = response.choices[0].message;
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

    return res.status(200).json({
      message: finalMessage,
      usage: response.usage,
      toolsEnabled: toolsEnabled,
      madeChanges: madeChanges
    });

  } catch (error) {
    console.error('Chat API error:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to process request';
    let userFriendlyMessage = 'I encountered an issue. Please try again.';

    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      userFriendlyMessage = 'The request took too long. Please try again with a simpler request.';
    } else if (error.message?.includes('rate') || error.status === 429) {
      userFriendlyMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message?.includes('network') || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      userFriendlyMessage = 'Network connection issue. Please check your connection and try again.';
    } else if (error.status === 401 || error.status === 403) {
      userFriendlyMessage = 'Authentication issue. Please contact support.';
    } else if (error.status >= 500) {
      userFriendlyMessage = 'The AI service is temporarily unavailable. Please try again in a moment.';
    }

    return res.status(500).json({
      error: errorMessage,
      message: userFriendlyMessage,
      details: error.message
    });
  }
}
