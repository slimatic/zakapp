/**
 * User-Friendly Error Messages Utility
 * 
 * Provides helpful error messages with recovery guidance instead of technical jargon.
 * Follows UX best practices for error communication.
 */

export interface ErrorMessage {
  title: string;
  message: string;
  recovery?: string[];
  contactSupport?: boolean;
}

/**
 * Map technical errors to user-friendly messages with recovery steps
 */
export function getUserFriendlyError(error: any): ErrorMessage {
  // Network errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      title: 'Connection Timeout',
      message: 'We couldn\'t reach the server. This usually happens when your internet connection is slow.',
      recovery: [
        'Check your internet connection',
        'Try again in a moment',
        'If this continues, the server may be experiencing issues',
      ],
    };
  }

  if (error.code === 'ERR_NETWORK' || !navigator.onLine) {
    return {
      title: 'No Internet Connection',
      message: 'It looks like you\'re offline. Some features won\'t work without an internet connection.',
      recovery: [
        'Check your Wi-Fi or mobile data connection',
        'You can still view previously loaded data',
        'Changes will sync automatically when you\'re back online',
      ],
    };
  }

  // Authentication errors
  if (error.response?.status === 401) {
    return {
      title: 'Session Expired',
      message: 'Your login session has expired for security reasons.',
      recovery: [
        'Please log in again to continue',
        'Your data is safe and will be restored after login',
      ],
    };
  }

  if (error.response?.status === 403) {
    return {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      recovery: [
        'Make sure you\'re logged into the correct account',
        'Contact support if you think this is a mistake',
      ],
      contactSupport: true,
    };
  }

  // Validation errors
  if (error.response?.status === 400) {
    const validationMessage = error.response?.data?.message || error.message;
    return {
      title: 'Invalid Information',
      message: validationMessage || 'Some of the information you entered isn\'t quite right.',
      recovery: [
        'Please check the highlighted fields',
        'Make sure all required information is filled in',
        'Ensure dates and numbers are in the correct format',
      ],
    };
  }

  if (error.response?.status === 422) {
    return {
      title: 'Validation Error',
      message: error.response?.data?.message || 'Please check your input and try again.',
      recovery: [
        'Review the form for any errors',
        'Make sure all required fields are filled',
        'Check that values are within acceptable ranges',
      ],
    };
  }

  // Resource not found
  if (error.response?.status === 404) {
    return {
      title: 'Not Found',
      message: 'We couldn\'t find what you\'re looking for. It may have been deleted or moved.',
      recovery: [
        'Go back and try again',
        'Check if the item still exists in your list',
        'The link you followed might be outdated',
      ],
    };
  }

  // Server errors
  if (error.response?.status === 500) {
    return {
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected problem on our end. Don\'t worry, your data is safe.',
      recovery: [
        'Please try again in a moment',
        'If this keeps happening, contact support',
        'We\'ve been notified and are looking into it',
      ],
      contactSupport: true,
    };
  }

  if (error.response?.status === 503) {
    return {
      title: 'Service Temporarily Unavailable',
      message: 'The service is currently undergoing maintenance or experiencing high traffic.',
      recovery: [
        'Please try again in a few minutes',
        'Your data is safe and will be available soon',
      ],
    };
  }

  // Rate limiting
  if (error.response?.status === 429) {
    return {
      title: 'Too Many Requests',
      message: 'You\'ve made too many requests in a short time. Please slow down.',
      recovery: [
        'Wait a minute before trying again',
        'This helps us keep the service fast for everyone',
      ],
    };
  }

  // Database/data errors
  if (error.message?.includes('duplicate') || error.code === 'P2002') {
    return {
      title: 'Already Exists',
      message: 'An item with this information already exists.',
      recovery: [
        'Check if you\'ve already added this item',
        'Try updating the existing item instead',
        'Use a different name or identifier',
      ],
    };
  }

  // File upload errors
  if (error.message?.includes('file') || error.message?.includes('upload')) {
    return {
      title: 'Upload Failed',
      message: 'We couldn\'t upload your file.',
      recovery: [
        'Make sure the file is smaller than 10MB',
        'Check that the file format is supported',
        'Try uploading again',
      ],
    };
  }

  // Calculation errors
  if (error.message?.includes('calculation') || error.message?.includes('nisab')) {
    return {
      title: 'Calculation Error',
      message: 'We couldn\'t complete your Zakat calculation.',
      recovery: [
        'Make sure all asset values are entered correctly',
        'Check that dates are in the proper format',
        'Ensure your total assets meet the nisab threshold',
      ],
    };
  }

  // Generic fallback
  return {
    title: 'Unexpected Error',
    message: error.message || 'Something unexpected happened. We\'re not sure what went wrong.',
    recovery: [
      'Try refreshing the page',
      'If the problem continues, please contact support',
      'Include what you were trying to do when this happened',
    ],
    contactSupport: true,
  };
}

/**
 * Format error message for display in UI
 */
export function formatErrorForDisplay(error: any): {
  title: string;
  message: string;
  recoverySteps: string[];
  showSupport: boolean;
} {
  const errorInfo = getUserFriendlyError(error);
  
  return {
    title: errorInfo.title,
    message: errorInfo.message,
    recoverySteps: errorInfo.recovery || [],
    showSupport: errorInfo.contactSupport || false,
  };
}

/**
 * Get contact support message
 */
export function getSupportMessage(): string {
  return 'Need help? Contact us at support@zakapp.com or visit our help center.';
}

export default {
  getUserFriendlyError,
  formatErrorForDisplay,
  getSupportMessage,
};
