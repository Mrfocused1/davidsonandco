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
      const activities = JSON.parse(content);

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
    try {
      const { action, description, files, status } = req.body;

      if (!action || !description) {
        return res.status(400).json({ error: 'Action and description required' });
      }

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
        // File doesn't exist, will create new
      }

      // Add new activity at the beginning
      const newActivity = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action,
        description,
        files: files || [],
        status: status || 'completed'
      };

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

      return res.status(200).json({ success: true, activity: newActivity });
    } catch (error) {
      console.error('Error saving activity:', error);
      return res.status(500).json({ error: 'Failed to save activity' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
