export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const deployHook = process.env.VERCEL_DEPLOY_HOOK;

  if (!deployHook) {
    console.error('VERCEL_DEPLOY_HOOK not configured');
    return res.status(500).json({
      success: false,
      error: 'Deployment system not configured. Please contact support.'
    });
  }

  try {
    console.log('Triggering deployment...');
    const response = await fetch(deployHook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Deployment service responded with status ${response.status}`);
    }

    console.log('✅ Deployment triggered successfully');
    return res.status(200).json({
      success: true,
      message: 'Your changes are being published to the live website.'
    });
  } catch (error) {
    console.error('Deployment trigger failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start deployment. Please try again.'
    });
  }
}
