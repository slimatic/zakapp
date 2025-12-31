# Feedback Widget Webhook Integration Guide

## Overview

The feedback widget supports sending submissions to external webhooks. This allows you to automatically create GitHub issues, send to Slack/Discord, or integrate with any custom backend.

## Quick Setup

### 1. Set Webhook URL

Add to `.env.docker` or set as environment variable:

```bash
REACT_APP_FEEDBACK_WEBHOOK_URL=https://your-webhook-url.com/endpoint
```

### 2. Restart Docker

```bash
docker compose down && docker compose up -d
```

### 3. Test

Submit feedback and check webhook receives the payload.

---

## Webhook Payload Format

The widget sends a POST request with this JSON structure:

```json
{
  "id": "feedback_1733500000_abc123xyz",
  "timestamp": "2025-12-06T12:34:56.789Z",
  "userId": "user_uuid_here",
  "email": "user@example.com",
  "pageUrl": "http://localhost:3000/dashboard",
  "category": "bug",
  "message": "The zakat calculation shows incorrect values when...",
  "browserInfo": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

### Request Headers

```
POST /your-endpoint
Content-Type: application/json
```

---

## Integration Examples

### Option 1: Slack Webhook

**Step 1**: Create Slack Webhook
1. Go to https://api.slack.com/apps
2. Create new app or select existing
3. Enable "Incoming Webhooks"
4. Create webhook for your channel
5. Copy webhook URL (e.g., `https://hooks.slack.com/services/T00/B00/XXX`)

**Step 2**: Create Middleware (Optional - for formatting)

Since Slack expects a different format, you have two options:

**Option A**: Use a middleware service (Zapier, Make.com, n8n)
- Connect webhook to middleware
- Transform payload to Slack format
- Forward to Slack

**Option B**: Create custom proxy endpoint

```javascript
// Example Express.js proxy
app.post('/api/feedback-to-slack', async (req, res) => {
  const feedback = req.body;
  
  // Transform to Slack format
  const slackMessage = {
    text: `🔔 New Feedback: ${feedback.category}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New ${feedback.category} feedback from ${feedback.email}*`
        }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Page:*\n${feedback.pageUrl}` },
          { type: "mrkdwn", text: `*Category:*\n${feedback.category}` }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Message:*\n${feedback.message}`
        }
      }
    ]
  };
  
  // Forward to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage)
  });
  
  res.json({ success: true });
});
```

**Step 3**: Configure
```bash
# In .env.docker
REACT_APP_FEEDBACK_WEBHOOK_URL=http://localhost:3001/api/feedback-to-slack
```

---

### Option 2: Discord Webhook

**Step 1**: Create Discord Webhook
1. Go to Discord server → Channel Settings → Integrations
2. Create webhook
3. Copy webhook URL (e.g., `https://discord.com/api/webhooks/123/abc`)

**Step 2**: Transform Payload (Discord Format)

Discord also needs transformation. Create proxy endpoint:

```javascript
// Example Express.js proxy
app.post('/api/feedback-to-discord', async (req, res) => {
  const feedback = req.body;
  
  const discordMessage = {
    content: `🔔 **New ${feedback.category} Feedback**`,
    embeds: [{
      title: `Feedback from ${feedback.email}`,
      description: feedback.message,
      color: feedback.category === 'bug' ? 0xFF0000 : 0x00FF00,
      fields: [
        { name: 'Category', value: feedback.category, inline: true },
        { name: 'Page', value: feedback.pageUrl, inline: false },
        { name: 'Browser', value: feedback.browserInfo.userAgent.substring(0, 100), inline: false }
      ],
      timestamp: feedback.timestamp
    }]
  };
  
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discordMessage)
  });
  
  res.json({ success: true });
});
```

**Step 3**: Configure
```bash
# In .env.docker
REACT_APP_FEEDBACK_WEBHOOK_URL=http://localhost:3001/api/feedback-to-discord
```

---

### Option 3: GitHub Issues (via GitHub Actions)

**Step 1**: Create GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate token with `repo` scope
3. Save token securely

**Step 2**: Create Backend Endpoint

```javascript
// Example Express.js endpoint
app.post('/api/feedback-to-github', async (req, res) => {
  const feedback = req.body;
  
  const issueBody = `
## Feedback Details
- **Category**: ${feedback.category}
- **User**: ${feedback.email}
- **Page**: ${feedback.pageUrl}
- **Date**: ${feedback.timestamp}

## Message
${feedback.message}

## Browser Info
\`\`\`json
${JSON.stringify(feedback.browserInfo, null, 2)}
\`\`\`

---
*Submitted via Feedback Widget*
`;

  // Create GitHub issue
  const response = await fetch('https://api.github.com/repos/YOUR_ORG/YOUR_REPO/issues', {
    method: 'POST',
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      title: `[${feedback.category}] ${feedback.message.substring(0, 50)}...`,
      body: issueBody,
      labels: ['feedback', feedback.category]
    })
  });
  
  res.json({ success: true, issue: await response.json() });
});
```

**Step 3**: Configure
```bash
# In .env.docker
REACT_APP_FEEDBACK_WEBHOOK_URL=http://localhost:3001/api/feedback-to-github

# In server .env
GITHUB_TOKEN=your_github_token_here
```

---

### Option 4: Custom Backend Endpoint

**Step 1**: Create Backend Endpoint

```javascript
// Example Express.js endpoint
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

app.post('/api/feedback', async (req, res) => {
  try {
    const feedback = req.body;
    
    // Validate payload
    if (!feedback.message || !feedback.category) {
      return res.status(400).json({ error: 'Invalid feedback payload' });
    }
    
    // Store in database
    const savedFeedback = await prisma.feedback.create({
      data: {
        userId: feedback.userId,
        email: feedback.email,
        category: feedback.category,
        message: feedback.message,
        pageUrl: feedback.pageUrl,
        userAgent: feedback.browserInfo.userAgent,
        viewportWidth: feedback.browserInfo.viewport.width,
        viewportHeight: feedback.browserInfo.viewport.height,
        timestamp: new Date(feedback.timestamp)
      }
    });
    
    // Optional: Send notification email
    // await sendNotificationEmail(feedback);
    
    res.json({ success: true, id: savedFeedback.id });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});
```

**Step 2**: Add Database Schema

```prisma
// In prisma/schema.prisma
model Feedback {
  id              String   @id @default(uuid())
  userId          String
  email           String
  category        String
  message         String
  pageUrl         String
  userAgent       String
  viewportWidth   Int
  viewportHeight  Int
  timestamp       DateTime
  createdAt       DateTime @default(now())
  
  @@index([email])
  @@index([category])
  @@index([timestamp])
}
```

**Step 3**: Configure
```bash
# In .env.docker
REACT_APP_FEEDBACK_WEBHOOK_URL=http://localhost:3001/api/feedback
```

---

### Option 5: No Webhook (Console Only)

If you don't set a webhook URL, feedback is logged to the browser console:

```bash
# In .env.docker - leave webhook URL commented/unset
# REACT_APP_FEEDBACK_WEBHOOK_URL=

# Or explicitly set to empty
REACT_APP_FEEDBACK_WEBHOOK_URL=
```

You can view submissions in browser DevTools (F12) → Console tab.

---

## Testing Your Webhook

### 1. Test with cURL

```bash
curl -X POST https://your-webhook-url.com/endpoint \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_123",
    "timestamp": "2025-12-06T12:00:00Z",
    "userId": "test_user",
    "email": "test@example.com",
    "pageUrl": "http://localhost:3000/test",
    "category": "bug",
    "message": "Test feedback message",
    "browserInfo": {
      "userAgent": "Test Agent",
      "viewport": { "width": 1920, "height": 1080 }
    }
  }'
```

### 2. Test in App

1. Enable feedback widget: `REACT_APP_FEEDBACK_ENABLED=true`
2. Set webhook URL: `REACT_APP_FEEDBACK_WEBHOOK_URL=your-url`
3. Restart Docker: `docker compose restart`
4. Submit test feedback
5. Check webhook received payload

### 3. Monitor Logs

```bash
# Frontend logs (check for webhook errors)
docker compose logs frontend -f

# Backend logs (if using custom endpoint)
docker compose logs backend -f
```

---

## Error Handling

The widget handles webhook failures gracefully:

- **Network Error**: Shows "Failed to submit feedback" message with retry option
- **Timeout**: 30-second timeout on webhook requests
- **4xx/5xx Errors**: User-friendly error message displayed

You can check errors in browser console:

```javascript
// Console output on webhook failure
❌ Webhook failed: 500 Internal Server Error
```

---

## Security Considerations

### 1. Validate Webhook Payloads

Always validate incoming data on your backend:

```javascript
function validateFeedback(data) {
  if (!data.message || data.message.length < 10) {
    throw new Error('Invalid message');
  }
  if (!['general', 'bug', 'feature', 'question'].includes(data.category)) {
    throw new Error('Invalid category');
  }
  return true;
}
```

### 2. Rate Limiting

Implement rate limiting on your webhook endpoint:

```javascript
import rateLimit from 'express-rate-limit';

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP
  message: 'Too many feedback submissions, please try again later'
});

app.post('/api/feedback', feedbackLimiter, async (req, res) => {
  // ... handle feedback
});
```

### 3. Authentication (Optional)

For production, consider adding authentication:

```javascript
app.post('/api/feedback', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.FEEDBACK_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... handle feedback
});
```

Then add to frontend:

```typescript
// In FeedbackWidget.tsx
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.REACT_APP_FEEDBACK_API_KEY || ''
  },
  body: JSON.stringify(feedback),
});
```

---

## Troubleshooting

### Webhook Not Receiving Data

1. **Check URL is correct**:
   ```bash
   echo $REACT_APP_FEEDBACK_WEBHOOK_URL
   ```

2. **Check CORS settings** (if webhook is on different domain):
   ```javascript
   // On webhook server
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true
   }));
   ```

3. **Check network tab** in browser DevTools:
   - Look for POST request to webhook URL
   - Check request payload
   - Check response status

### "Failed to submit feedback" Error

1. **Check webhook is accessible**:
   ```bash
   curl -I https://your-webhook-url.com/endpoint
   ```

2. **Check webhook accepts POST**:
   ```bash
   curl -X POST https://your-webhook-url.com/endpoint -H "Content-Type: application/json" -d '{}'
   ```

3. **Check logs**:
   ```bash
   docker compose logs frontend | grep FEEDBACK
   ```

### Payload Not in Expected Format

Check the exact payload in console:
```javascript
// In FeedbackWidget.tsx, temporarily add:
console.log('Sending to webhook:', JSON.stringify(feedback, null, 2));
```

---

## Production Deployment

### Environment Variables

```bash
# Production .env.docker
REACT_APP_FEEDBACK_ENABLED=true
REACT_APP_FEEDBACK_WEBHOOK_URL=https://api.yourdomain.com/api/feedback
```

### HTTPS Required

Use HTTPS for production webhooks to protect user data:
- ✅ `https://api.yourdomain.com/feedback`
- ❌ `http://api.yourdomain.com/feedback` (not secure)

### Monitor Webhook

Set up monitoring for your webhook endpoint:
- Track success/failure rates
- Alert on high error rates
- Monitor response times

---

## Examples Repository

For complete working examples, see:
- [Slack Integration Example](../examples/slack-webhook/)
- [Discord Integration Example](../examples/discord-webhook/)
- [GitHub Issues Example](../examples/github-issues/)
- [Custom Backend Example](../examples/custom-backend/)

---

## Summary

| Integration | Difficulty | Requires Middleware | Best For |
|-------------|------------|---------------------|----------|
| Console Only | ✅ Easy | No | Development/testing |
| Custom Backend | ⭐ Medium | No | Full control, database storage |
| Slack | ⭐⭐ Medium | Yes | Team notifications |
| Discord | ⭐⭐ Medium | Yes | Community feedback |
| GitHub Issues | ⭐⭐⭐ Advanced | Optional | Bug tracking, feature requests |

**Recommended for production**: Custom Backend → Store in database → Optionally forward to Slack/Discord

---

**Questions?** Check the [main specification](spec.md) or [implementation guide](IMPLEMENTATION_COMPLETE.md).
