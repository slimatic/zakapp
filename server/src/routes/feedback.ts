import express from 'express';
import axios from 'axios';

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
    // Format payload based on webhook type (simple heuristic)
    let payload: any = feedback;
    
    if (webhookUrl.includes('slack.com')) {
      payload = {
        text: `*New Feedback (${feedback.category})*\n${feedback.message}\n\n_From: ${feedback.email} on ${feedback.pageUrl}_`
      };
    } else if (webhookUrl.includes('discord.com')) {
      payload = {
        content: `**New Feedback (${feedback.category})**\n${feedback.message}\n\n*From: ${feedback.email} on ${feedback.pageUrl}*`
      };
    } else if (webhookUrl.includes('teams.microsoft.com')) {
      payload = {
        text: `**New Feedback (${feedback.category})**\n\n${feedback.message}\n\nFrom: ${feedback.email} on ${feedback.pageUrl}`
      };
    }

    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error: any) {
    console.error('Feedback submission error:', error.message);
    if (error.response) {
      console.error('Webhook response:', error.response.status, error.response.data);
    }
    
    return res.status(502).json({ 
      success: false, 
      message: 'Failed to forward feedback to external service' 
    });
  }
});

export default router;
