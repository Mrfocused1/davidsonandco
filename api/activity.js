import { Octokit } from '@octokit/rest';

// GitHub config
const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';
const ACTIVITY_FILE = 'activity-log.json';

export default async function handler(req, res) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // GET - Fetch activity log
  if (req.method === 'GET') {
    try {
      const response = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: ACTIVITY_FILE,
        ref: 'main'
      });

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      const parsed = JSON.parse(content);

      // Handle both formats: flat array or object with activities property
      const activities = Array.isArray(parsed) ? parsed : (parsed.activities || []);

      return res.status(200).json({ activities });
    } catch (error) {
      if (error.status === 404) {
        // File doesn't exist yet, return empty array
        return res.status(200).json({ activities: [] });
      }
      console.error('Error fetching activity log:', error);
      return res.status(500).json({ error: 'Failed to fetch activity log' });
    }
  }

  // POST - Add new activity
  if (req.method === 'POST') {
    const { action, description, files, status } = req.body;

    if (!action || !description) {
      return res.status(400).json({ error: 'Action and description required' });
    }

    const newActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      description,
      files: files || [],
      status: status || 'completed'
    };

    const MAX_RETRIES = 3;

    // Retry loop for handling 409 conflicts
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Fetch existing log (fresh on each retry)
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
          const parsed = JSON.parse(content);
          // Handle both formats
          activities = Array.isArray(parsed) ? parsed : (parsed.activities || []);
          sha = existing.data.sha;
        } catch (e) {
          if (e.status !== 404) throw e;
          // File doesn't exist, will create new
        }

        // Add new activity at the beginning
        activities.unshift(newActivity);

        // Keep only last 100 activities
        if (activities.length > 100) {
          activities = activities.slice(0, 100);
        }

        // Save updated log
        const updateParams = {
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: ACTIVITY_FILE,
          message: `[Activity Log] ${action}`,
          content: Buffer.from(JSON.stringify(activities, null, 2)).toString('base64'),
          branch: 'main'
        };

        if (sha) {
          updateParams.sha = sha;
        }

        await octokit.repos.createOrUpdateFileContents(updateParams);

        // Success!
        if (attempt > 0) {
          console.log(`✅ Activity saved successfully on attempt ${attempt + 1}`);
        }
        return res.status(200).json({ success: true, activity: newActivity });

      } catch (error) {
        // Check if it's a 409 conflict (stale SHA)
        if (error.status === 409 && attempt < MAX_RETRIES - 1) {
          console.warn(`⚠️ Activity save conflict on attempt ${attempt + 1}, retrying...`);
          // Wait a bit before retrying (exponential backoff with jitter)
          const delay = 100 * Math.pow(2, attempt) + Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry with fresh SHA
        }

        // Non-conflict error or max retries reached
        console.error('Error saving activity:', error);
        return res.status(500).json({ error: 'Failed to save activity' });
      }
    }
  }

  // DELETE - Clear all activities
  if (req.method === 'DELETE') {
    try {
      // Get current file to get SHA
      let sha = null;
      try {
        const existing = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: ACTIVITY_FILE,
          ref: 'main'
        });
        sha = existing.data.sha;
      } catch (e) {
        if (e.status === 404) {
          // File doesn't exist, nothing to clear
          return res.status(200).json({ success: true, message: 'Activity log already empty' });
        }
        throw e;
      }

      // Update file with empty array
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: ACTIVITY_FILE,
        message: '[Activity Log] Cleared all activity entries',
        content: Buffer.from(JSON.stringify([], null, 2)).toString('base64'),
        sha: sha,
        branch: 'main'
      });

      return res.status(200).json({ success: true, message: 'Activity log cleared' });
    } catch (error) {
      console.error('Error clearing activity log:', error);
      return res.status(500).json({ error: 'Failed to clear activity log' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
