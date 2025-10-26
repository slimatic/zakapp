import React from 'react';

/**
 * SkipLink component provides a keyboard-accessible way to skip navigation
 * and jump directly to the main content. This is a WCAG 2.1 AA requirement.
 * 
 * The link is visually hidden by default but becomes visible when focused,
 * allowing keyboard users to bypass repetitive navigation elements.
 */
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="skip-link"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
};

export default SkipLink;
