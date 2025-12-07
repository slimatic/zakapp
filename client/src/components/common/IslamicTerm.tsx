import React from 'react';
import { HelpTooltip } from './HelpTooltip';
import { TOOLTIP_CONTENT, type TooltipKey } from './TooltipContent';

interface IslamicTermProps {
  term: TooltipKey;
  children?: React.ReactNode;
  className?: string;
}

/**
 * IslamicTerm component - Wraps Islamic terminology with contextual tooltips
 * 
 * Provides inline educational tooltips for Islamic terms used throughout the application.
 * The term is displayed with an underline decoration to indicate it has additional information.
 * 
 * Usage:
 * ```tsx
 * <IslamicTerm term="NISAB">Nisab</IslamicTerm>
 * <IslamicTerm term="HAWL">Hawl</IslamicTerm>
 * ```
 * 
 * @param term - The key for the tooltip content (e.g., 'NISAB', 'HAWL')
 * @param children - The text to display (defaults to the term name if not provided)
 * @param className - Additional CSS classes to apply
 */
export const IslamicTerm: React.FC<IslamicTermProps> = ({
  term,
  children,
  className = '',
}) => {
  const content = TOOLTIP_CONTENT[term];
  
  // Default to term name if children not provided
  const displayText = children || term.charAt(0) + term.slice(1).toLowerCase();

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="underline decoration-dotted decoration-gray-400 decoration-1 underline-offset-2">
        {displayText}
      </span>
      <HelpTooltip content={content} />
    </span>
  );
};

export default IslamicTerm;
