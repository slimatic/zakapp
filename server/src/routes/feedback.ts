/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import express from 'express';
import axios from 'axios';
import { Logger } from '../utils/logger';

const logger = new Logger('FeedbackRoute');


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
      logger.info('Feedback received (No webhook configured):', feedback);

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
    logger.error(`Feedback submission error: ${error.message}`);
    if (error.response) {
      logger.error(`Webhook response: ${error.response.status}`, error.response.data);
    }


    return res.status(502).json({
      success: false,
      message: 'Failed to forward feedback to external service'
    });
  }
});

export default router;
