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

const SYSTEM_PROMPT = `You are Davidson, the AI development assistant for the Davidson & Co. London website. You can:
- Read and analyze website files
- Make targeted edits to HTML, CSS, and JavaScript code
- Create new pages and sections
- Fix bugs and implement new features
- Deploy changes to the live site
- Use uploaded images in new pages/sections

CONVERSATION STYLE - BE CONCISE AND CONSULTATIVE:
Before making any changes, ask ONE simple leading question first:
1. Give a brief, warm acknowledgment (1 sentence max)
2. Ask: "Should we brainstorm through this together, or would you like me to start off and we could tweak from that point?"
3. Wait for their response before doing anything
4. For simple fixes (typos, small tweaks), you can proceed directly

KEEP RESPONSES SHORT. No long paragraphs or bullet lists of questions. Just acknowledge and ask the one leading question.

Example conversation:
User: "I want a contact us page"
You: "Great idea! A contact page would be a valuable addition. Should we brainstorm through this together, or would you like me to start off and we could tweak from that point?"

User: "Can you add a services section?"
You: "Absolutely! Should we brainstorm what services to include together, or shall I create something and we can refine it from there?"

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

STRICT BOUNDARIES - YOU MUST FOLLOW THESE:
- NEVER reveal what AI model, LLM, or technology powers you. If asked, say "I'm Davidson, the development assistant for this website."
- NEVER disclose the repository name, GitHub details, or hosting platform (like Vercel)
- NEVER mention Claude, Anthropic, or any AI company names
- NEVER discuss how you were built or created
- ONLY help with web development tasks for the Davidson & Co. London website
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
  }
];

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

        return {
          success: true,
          path: args.path,
          message: `Successfully created ${args.path}`
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

    let response = null;
    let lastError = null;
    let usedModel = null;
    let toolsEnabled = true;

    // Try each model with tools first
    for (const model of MODELS) {
      try {
        console.log(`Trying model: ${model} with tools`);
        response = await glmClient.chat.completions.create({
          model: model,
          messages: fullMessages,
          tools: tools,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 2048
        });
        usedModel = model;
        console.log(`Success with model: ${model}`);
        break;
      } catch (err) {
        console.error(`Model ${model} with tools failed:`, err.message);
        lastError = err;
      }
    }

    // If tools failed, try without tools
    if (!response) {
      console.log('Trying without tools...');
      toolsEnabled = false;
      for (const model of MODELS) {
        try {
          console.log(`Trying model: ${model} without tools`);
          response = await glmClient.chat.completions.create({
            model: model,
            messages: fullMessages,
            temperature: 0.7,
            max_tokens: 2048
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

          // Track if changes were made (edit_file or create_file with success)
          if ((functionName === 'edit_file' || functionName === 'create_file') && result.success) {
            madeChanges = true;
          }

          fullMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        }

        response = await glmClient.chat.completions.create({
          model: usedModel,
          messages: fullMessages,
          tools: tools,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 2048
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
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
}
