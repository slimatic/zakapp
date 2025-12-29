import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useFeedbackRepository, FeedbackSubmission, FeedbackCategory } from '../hooks/useFeedbackRepository';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { submitFeedback, isSubmitting, error: submitError } = useFeedbackRepository();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const widgetRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle ESC key to close widget
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        // Return focus to the trigger button when closed via keyboard
        // note: we don't have a ref to the trigger button easily accessible if it's outside
        // but typically focus management should handle this.
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

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // slight delay to allow render
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close widget on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (message.trim().length < MIN_MESSAGE_LENGTH) {
      setValidationError(`Please provide at least ${MIN_MESSAGE_LENGTH} characters of feedback.`);
      return;
    }

    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      setValidationError(`Feedback must be less than ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    // Prepare feedback submission
    const feedback: FeedbackSubmission = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: isAuthenticated && user ? user.id : 'anonymous',
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

    const success = await submitFeedback(feedback);

    if (success) {
      setShowSuccess(true);
      setMessage('');
      setCategory('general');

      // Close widget after delay
      setTimeout(() => {
        setIsOpen(false);
        setShowSuccess(false);
      }, 2500);
    }
  };

  const characterCount = message.length;
  const isValidLength = characterCount >= MIN_MESSAGE_LENGTH && characterCount <= MAX_MESSAGE_LENGTH;

  return (
    <div ref={widgetRef} className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 print:hidden">
      {/* Feedback Trigger Bubble */}
      <button
        onClick={toggleWidget}
        className={`
          w-16 h-16 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2
          ${isOpen
            ? 'bg-slate-700 hover:bg-slate-800 focus:ring-slate-500'
            : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'}
        `}
        aria-label={isOpen ? 'Close feedback form' : 'Open feedback form'}
        aria-expanded={isOpen}
        aria-controls="feedback-panel"
        title={isOpen ? 'Close feedback' : 'Give feedback'}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Feedback Panel */}
      {isOpen && (
        <div
          id="feedback-panel"
          className={`
            absolute bottom-20 right-0
            w-80 md:w-96 max-w-[calc(100vw-2rem)]
            bg-white rounded-lg shadow-2xl
            transition-all duration-300 ease-in-out
            transform origin-bottom-right
            border border-slate-100
            ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          {showSuccess ? (
            // Success Message
            <div className="p-8 text-center" role="alert">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h3>
              <p className="text-sm text-gray-600">
                Your feedback has been sent securely to our team. <br />
                JazakAllah Khair for your contribution.
              </p>
            </div>
          ) : (
            // Feedback Form
            <>
              <div className="p-5 border-b border-gray-100 bg-slate-50/50 rounded-t-lg flex justify-between items-start">
                <div>
                  <h3 id="feedback-title" className="text-lg font-semibold text-gray-900">Send Feedback</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Found a bug or have an idea?
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Category Selector */}
                <div>
                  <label htmlFor="feedback-category" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    id="feedback-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
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
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Your Feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    rows={5}
                    maxLength={MAX_MESSAGE_LENGTH}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none text-sm"
                    aria-required="true"
                    aria-invalid={!!validationError}
                    aria-describedby={validationError ? "feedback-error" : "feedback-desc"}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span
                      id="feedback-desc"
                      className={`text-xs transition-colors ${isValidLength ? 'text-gray-500' : 'text-amber-600 font-medium'}`}
                    >
                      {characterCount} / {MAX_MESSAGE_LENGTH}
                      {characterCount < MIN_MESSAGE_LENGTH && ` (min ${MIN_MESSAGE_LENGTH})`}
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {(validationError || submitError) && (
                  <div id="feedback-error" className="p-3 bg-red-50 border border-red-100 rounded-md flex items-start" role="alert">
                    <svg className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-red-700">{validationError || submitError}</p>
                  </div>
                )}

                {/* Privacy Notice with Trust Signal */}
                <div className="flex items-start bg-slate-50 p-3 rounded border border-slate-100">
                  <svg className="w-4 h-4 text-teal-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-gray-500">
                    {isAuthenticated ?
                      `Logged as ${user?.email}. We value your privacy and only use this data to improve ZakApp.` :
                      "Sending anonymously. We value your privacy and only use this data to improve ZakApp."
                    }
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isValidLength}
                  className={`
                    w-full py-2.5 px-4 rounded-md font-medium text-sm
                    transition-colors duration-200 shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
                    ${isSubmitting || !isValidLength
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-md'}
                  `}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
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
