import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { getApiBaseUrl } from '../config';

type FeedbackCategory = 'general' | 'bug' | 'feature' | 'question';

interface FeedbackSubmission {
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

const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [
  { value: 'general', label: 'General Feedback' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'question', label: 'Question' },
];

const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;

export const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const widgetRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle ESC key to close widget
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Handle click outside to close widget
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus textarea when widget opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Close widget on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (message.trim().length < MIN_MESSAGE_LENGTH) {
      setError(`Please provide at least ${MIN_MESSAGE_LENGTH} characters of feedback.`);
      return;
    }

    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      setError(`Feedback must be less than ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare feedback submission
      const feedback: FeedbackSubmission = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        userId: isAuthenticated && user ? user.userId : 'anonymous',
        email: isAuthenticated && user ? user.email : 'anonymous',
        pageUrl: window.location.href,
        category,
        message: message.trim(),
        browserInfo: {
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      };

      // Send to backend proxy
      const response = await fetch(`${getApiBaseUrl()}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error(`Feedback submission failed: ${response.status} ${response.statusText}`);
      }

      // Success!
      setShowSuccess(true);
      setMessage('');
      setCategory('general');

      // Close widget after brief delay
      setTimeout(() => {
        setIsOpen(false);
        setShowSuccess(false);
      }, 2000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = message.length;
  const isValidLength = characterCount >= MIN_MESSAGE_LENGTH && characterCount <= MAX_MESSAGE_LENGTH;

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50">
      {/* Feedback Bubble */}
      <button
        onClick={toggleWidget}
        className={`
          w-16 h-16 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isOpen 
            ? 'bg-gray-700 hover:bg-gray-800 focus:ring-gray-600' 
            : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'}
        `}
        aria-label={isOpen ? 'Close feedback widget' : 'Open feedback widget'}
        title={isOpen ? 'Close feedback' : 'Give feedback'}
      >
        {isOpen ? (
          // Close icon (X)
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Message/Chat icon
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Feedback Panel */}
      {isOpen && (
        <div
          className={`
            absolute bottom-20 right-0
            w-96 max-w-[calc(100vw-3rem)]
            bg-white rounded-lg shadow-2xl
            transition-all duration-300 ease-in-out
            transform origin-bottom-right
            ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
        >
          {showSuccess ? (
            // Success Message
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h3>
              <p className="text-sm text-gray-600">Your feedback has been submitted successfully.</p>
            </div>
          ) : (
            // Feedback Form
            <>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Send Feedback</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Help us improve ZakApp by sharing your thoughts
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Category Selector */}
                <div>
                  <label htmlFor="feedback-category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="feedback-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message Textarea */}
                <div>
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    rows={6}
                    maxLength={MAX_MESSAGE_LENGTH}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs ${isValidLength ? 'text-gray-500' : 'text-red-500'}`}>
                      {characterCount} / {MAX_MESSAGE_LENGTH} characters
                      {characterCount < MIN_MESSAGE_LENGTH && ` (min ${MIN_MESSAGE_LENGTH})`}
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Privacy Notice */}
                <p className="text-xs text-gray-500">
                  Your feedback helps us improve. We may use it to enhance features and fix issues.
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isValidLength}
                  className={`
                    w-full py-2 px-4 rounded-md font-medium
                    transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
                    ${isSubmitting || !isValidLength
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'}
                  `}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};
