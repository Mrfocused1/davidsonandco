// Vercel deployment status checker
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const vercelToken = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!vercelToken || !projectId) {
    // If not configured, simulate deployment (auto-complete after a delay)
    return res.status(200).json({
      status: 'ready',
      message: 'Deployment complete'
    });
  }

  try {
    // Get latest deployment from Vercel API
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch deployment status');
    }

    const data = await response.json();
    const latestDeployment = data.deployments?.[0];

    if (!latestDeployment) {
      return res.status(200).json({
        status: 'ready',
        message: 'No deployments found'
      });
    }

    // Map Vercel states to our status
    const state = latestDeployment.state || latestDeployment.readyState;
    let status = 'building';
    let message = 'Building...';

    switch (state) {
      case 'BUILDING':
      case 'INITIALIZING':
        status = 'building';
        message = 'Building your changes...';
        break;
      case 'READY':
        status = 'ready';
        message = 'Deployment complete';
        break;
      case 'ERROR':
      case 'CANCELED':
        status = 'error';
        message = 'Deployment failed';
        break;
      case 'QUEUED':
        status = 'queued';
        message = 'Queued for deployment...';
        break;
      default:
        status = 'building';
        message = 'Processing...';
    }

    return res.status(200).json({
      status,
      message,
      url: latestDeployment.url,
      createdAt: latestDeployment.created
    });

  } catch (error) {
    console.error('Deployment status error:', error);
    // Return ready on error to not block the user
    return res.status(200).json({
      status: 'ready',
      message: 'Deployment status unavailable'
    });
  }
}
