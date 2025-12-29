import { useState } from 'react';
import { getApiBaseUrl, getFeedbackWebhookUrl } from '../config';
import toast from 'react-hot-toast';

export type FeedbackCategory = 'general' | 'bug' | 'feature' | 'question';

export interface FeedbackSubmission {
    id: string;
    timestamp: string;
    userId: string;
    email: string;
    pageUrl: string;
    category: FeedbackCategory;
    message: string;
    browserInfo: {
        userAgent: string;
        viewport: {
            width: number;
            height: number;
        };
    };
}

/**
 * useFeedbackRepository
 * 
 * Handles the logic for submitting feedback.
 * Prioritizes the Webhook URL if available (Serverless/No-Code backend).
 * Falls back to the standard API if not.
 */
export const useFeedbackRepository = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitFeedback = async (feedback: FeedbackSubmission): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);

        const webhookUrl = getFeedbackWebhookUrl();
        const apiUrl = `${getApiBaseUrl()}/feedback`;

        // Determine target URL
        // Design Decision: If a webhook is provided, we send a shaped payload compatible with common hooks (Discord/Slack/Zapier)
        // or just the raw JSON if it's a generic hook. For now, we assume generic JSON acceptance.
        const targetUrl = webhookUrl || apiUrl;

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback),
            });

            if (!response.ok) {
                throw new Error(`Submission failed: ${response.status} ${response.statusText}`);
            }

            return true;
        } catch (err) {
            console.error('Feedback submission error:', err);
            const msg = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(msg);
            // Don't toast here, let the UI decide how to show it, or toast generic
            toast.error('Failed to submit feedback. Check connection.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        submitFeedback,
        isSubmitting,
        error
    };
};
