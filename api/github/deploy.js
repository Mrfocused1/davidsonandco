export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Deploy message is required' });
  }

  try {
    // Vercel automatically deploys when changes are pushed to main
    // The write operation already pushes to main, so deployment is automatic
    // This endpoint can optionally trigger a manual redeploy via Vercel webhook

    const deployHook = process.env.VERCEL_DEPLOY_HOOK;

    if (deployHook) {
      const response = await fetch(deployHook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Deploy hook failed');
      }

      return res.status(200).json({
        success: true,
        message: 'Deployment triggered successfully',
        description: message
      });
    }

    // If no deploy hook, just confirm that auto-deploy will handle it
    return res.status(200).json({
      success: true,
      message: 'Changes pushed to main branch. Vercel will auto-deploy.',
      description: message
    });

  } catch (error) {
    console.error('Deploy error:', error);
    return res.status(500).json({
      error: 'Failed to trigger deployment',
      details: error.message
    });
  }
}
