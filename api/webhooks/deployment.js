// Webhook handler for Vercel deployment events
// This receives instant notifications when deployments complete
import crypto from 'crypto';

export default async function handler(req, res) {
  // Verify this is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature
  const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers['x-vercel-signature'];

    if (!signature) {
      console.warn('⚠️ Webhook request missing signature header');
      return res.status(401).json({ error: 'Missing signature' });
    }

    try {
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha1', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Webhook signature verification failed');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      console.log('✅ Webhook signature verified');
    } catch (sigError) {
      console.error('❌ Signature verification error:', sigError);
      return res.status(401).json({ error: 'Signature verification failed' });
    }
  } else {
    console.warn('⚠️ VERCEL_WEBHOOK_SECRET not configured - webhook authentication disabled');
  }

  try {
    const event = req.body;

    console.log('📨 Webhook received:', {
      type: event.type,
      deploymentId: event.payload?.deployment?.id,
      state: event.payload?.deployment?.state,
      url: event.payload?.deployment?.url,
      commitSha: event.payload?.deployment?.meta?.githubCommitSha
    });

    // Handle deployment.ready event (deployment succeeded)
    if (event.type === 'deployment.ready') {
      const deployment = event.payload.deployment;

      console.log(`✅ Deployment ${deployment.id} is READY`);
      console.log(`   URL: ${deployment.url}`);
      console.log(`   Commit: ${deployment.meta?.githubCommitSha || 'unknown'}`);

      // TODO: Store deployment status for AI to check
      // For now, just log it - the AI will still use verify_live_content
      // Future enhancement: Store in Redis/database for instant status checks

      return res.status(200).json({
        received: true,
        deploymentId: deployment.id,
        status: 'ready',
        url: deployment.url
      });
    }

    // Handle deployment.error event (deployment failed)
    if (event.type === 'deployment.error') {
      const deployment = event.payload.deployment;
      const error = deployment.error || deployment.errorMessage || 'Unknown error';

      console.error(`❌ Deployment ${deployment.id} FAILED`);
      console.error(`   Error: ${error}`);
      console.error(`   Commit: ${deployment.meta?.githubCommitSha || 'unknown'}`);

      return res.status(200).json({
        received: true,
        deploymentId: deployment.id,
        status: 'error',
        error: error
      });
    }

    // Handle deployment.created event (deployment started)
    if (event.type === 'deployment.created') {
      const deployment = event.payload.deployment;

      console.log(`🚀 Deployment ${deployment.id} CREATED`);
      console.log(`   State: ${deployment.state}`);

      return res.status(200).json({
        received: true,
        deploymentId: deployment.id,
        status: 'created'
      });
    }

    // Handle deployment.canceled event
    if (event.type === 'deployment.canceled') {
      const deployment = event.payload.deployment;

      console.warn(`⚠️ Deployment ${deployment.id} CANCELED`);

      return res.status(200).json({
        received: true,
        deploymentId: deployment.id,
        status: 'canceled'
      });
    }

    // Handle other events (log but don't process)
    console.log(`ℹ️ Received event type: ${event.type} (not processed)`);

    return res.status(200).json({
      received: true,
      type: event.type,
      message: 'Event received but not processed'
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
}

// Vercel config for webhook endpoint
export const config = {
  api: {
    bodyParser: true // Parse JSON body automatically
  }
};
