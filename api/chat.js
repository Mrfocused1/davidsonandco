import OpenAI from 'openai';

// Models to try in order of preference (glm-4.7 is the newest, used by EastD)
const MODELS = ['glm-4.7', 'glm-4-flash', 'glm-4-air', 'glm-4', 'glm-4-plus'];

// Initialize GLM client using OpenAI SDK (GLM is OpenAI-compatible)
const glmClient = new OpenAI({
  apiKey: process.env.GLM_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4'
});

const SYSTEM_PROMPT = `You are Davidson, an AI development assistant for Davidson & Co. London's website. You can:
- Read and analyze website files
- Modify HTML, CSS, and JavaScript code
- Fix bugs and implement new features
- Deploy changes to the live site

When users ask you to make changes, use the available tools to read files, make modifications, and deploy.
Be professional and helpful. Explain what you're doing in a clear, concise manner.

Available files in the codebase:
- index.html (main website)
- admin.html (this admin portal)
- src/assets/* (images and assets)
- tailwind.config.js, vite.config.js (configuration)

IMPORTANT: Only modify files that are safe to edit. Never expose API keys or sensitive data.`;

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
      name: 'write_file',
      description: 'Write or update a file in the repository',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path relative to repository root'
          },
          content: {
            type: 'string',
            description: 'The new content for the file'
          },
          message: {
            type: 'string',
            description: 'Commit message describing the change'
          }
        },
        required: ['path', 'content', 'message']
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

async function executeFunction(name, args) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  switch (name) {
    case 'read_file': {
      const res = await fetch(`${baseUrl}/api/github/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: args.path })
      });
      return await res.json();
    }
    case 'write_file': {
      const res = await fetch(`${baseUrl}/api/github/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      return await res.json();
    }
    case 'list_files': {
      const res = await fetch(`${baseUrl}/api/github/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: args.path })
      });
      return await res.json();
    }
    case 'deploy': {
      const res = await fetch(`${baseUrl}/api/github/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: args.message })
      });
      return await res.json();
    }
    default:
      return { error: 'Unknown function' };
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
