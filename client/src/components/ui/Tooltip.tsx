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

/**
 * Tooltip Component
 * 
 * Reusable tooltip component for displaying educational content
 * throughout the application with keyboard accessibility.
 */

import React, { useState, useRef, useEffect, useId } from 'react';

export interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
  className?: string;
  trigger?: 'hover' | 'click' | 'both';
  /**
   * Override the accessible name of the trigger. Omit it and the trigger's own
   * text is the name, which is what you want for a glossary term ("Zakat") -
   * the definition then rides along as a description, not a replacement.
   */
  ariaLabel?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  maxWidth = '300px',
  className = '',
  trigger = 'hover',
  ariaLabel
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        isVisible &&
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      // Handle touch events for mobile fast-click
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' || trigger === 'both') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if ((trigger === 'hover' || trigger === 'both') && !isFocused) {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' || trigger === 'both') {
      setIsVisible(!isVisible);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (trigger === 'hover' || trigger === 'both') {
      setTimeout(() => {
        if (!isFocused) {
          setIsVisible(false);
        }
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsVisible(false);
    }
  };

  const positionClasses = {
    top: 'bottom-full inline-start-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full inline-start-1/2 -translate-x-1/2 mt-2',
    left: 'inline-end-0 top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowPositionClasses = {
    top: 'top-full inline-start-1/2 -translate-x-1/2 border-t-secondary border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full inline-start-1/2 -translate-x-1/2 border-b-secondary border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-secondary border-t-transparent border-b-transparent border-r-transparent',
    right: 'inline-end-0 top-1/2 -translate-y-1/2 border-r-secondary border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <span className={`relative inline-block ${className}`}>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        // No aria-label here. A label REPLACES the element's accessible name, so
        // aria-label="Show tooltip" made every glossary term announce as "Show
        // tooltip, button" and the word itself (Zakat, Nisab, Hawl) was never
        // read. The visible word is the name; aria-describedby carries the
        // definition. GlossaryTerm overrides this via ariaLabel.
        aria-label={ariaLabel}
        aria-describedby={isVisible ? tooltipId : undefined}
        className="cursor-help inline"
      >
        {children}
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          className={`absolute z-50 ${positionClasses[position]} animate-fadeIn`}
          style={{ maxWidth }}
          role="tooltip"
        >
          {/* Added w-64 to force rectangular box shape instead of narrow column */}
          <div className="bg-secondary text-secondary-foreground text-sm rounded-lg p-3 shadow-elev-2 w-64">
            {typeof content === 'string' ? (
              <p className="leading-relaxed">{content}</p>
            ) : (
              content
            )}
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowPositionClasses[position]}`}
          />
        </div>
      )}
    </span>
  );
};

/**
 * InfoIcon Component
 * 
 * Small info icon to trigger tooltips
 */
export const InfoIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-accent-foreground text-xs font-bold ${className}`}
      aria-hidden="true"
    >
      ?
    </span>
  );
};
