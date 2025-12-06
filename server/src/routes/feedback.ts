import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

/**
 * @route POST /api/feedback
 * @desc Submit feedback via webhook proxy
 * @access Public (or Protected if user info is needed)
 */
router.post('/', async (req, res) => {
  try {
    const feedback = req.body;
    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;

    if (!webhookUrl) {
      // If no webhook is configured, just log it
      console.log('=== FEEDBACK RECEIVED (NO WEBHOOK CONFIGURED) ===');
      console.log(JSON.stringify(feedback, null, 2));
      console.log('=================================================');
      return res.status(200).json({ success: true, message: 'Feedback received' });
    }

    // Proxy the request to the webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      console.error(`Webhook failed: ${response.status} ${response.statusText}`);
      return res.status(502).json({ 
        success: false, 
        message: 'Failed to forward feedback to external service' 
      });
    }

    return res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error processing feedback' 
    });
  }
});

export default router;
