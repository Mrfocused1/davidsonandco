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

const SYSTEM_PROMPT = `You are Davidson, an AI development assistant for Davidson & Co. London's website. You can:
- Read and analyze website files
- Make targeted edits to HTML, CSS, and JavaScript code
- Fix bugs and implement new features
- Deploy changes to the live site

IMPORTANT RULES:
1. Always use edit_file for changes - it does safe find-and-replace edits
2. First read_file to see the current content
3. Use edit_file with the EXACT text you want to replace (old_text) and the new text (new_text)
4. The old_text must match EXACTLY what's in the file (including whitespace)
5. Never try to rewrite entire files - only make targeted edits

Available files:
- index.html (main website)
- admin.html (this admin portal)
- src/assets/* (images and assets)

Be professional and helpful. Explain what you're doing.`;

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
        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          message: `[Davidson AI] ${args.message}`,
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

    // Handle tool calls (only if tools are enabled)
    if (toolsEnabled) {
      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        fullMessages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`Executing tool: ${functionName}`, functionArgs);
          const result = await executeFunction(functionName, functionArgs);

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

    return res.status(200).json({
      message: assistantMessage.content,
      usage: response.usage,
      toolsEnabled: toolsEnabled
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
}
