import React from 'react';

export interface MethodologyCardProps {
  /**
   * Methodology identifier
   */
  id: 'standard' | 'hanafi' | 'shafi' | 'custom';
  
  /**
   * Display name of the methodology
   */
  name: string;
  
  /**
   * Short description
   */
  description: string;
  
  /**
   * Key characteristics (3-4 bullet points)
   */
  characteristics: string[];
  
  /**
   * Icon or emoji to represent the methodology
   */
  icon?: string;
  
  /**
   * Whether this methodology is selected
   */
  isSelected?: boolean;
  
  /**
   * Whether this is the recommended methodology
   */
  isRecommended?: boolean;
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Learn more handler
   */
  onLearnMore?: () => void;
  
  /**
   * Whether the card is disabled
   */
  disabled?: boolean;
}

/**
 * MethodologyCard Component
 * 
 * Beautiful card component for displaying Islamic Zakat calculation methodologies.
 * Provides visual representation of each methodology with key characteristics
 * and interactive selection state.
 * 
 * Features:
 * - Visual selection state
 * - Recommendation badge
 * - Hover and focus effects
 * - Accessible keyboard navigation
 * - Responsive design
 */
export const MethodologyCard: React.FC<MethodologyCardProps> = ({
  id,
  name,
  description,
  characteristics,
  icon = '📖',
  isSelected = false,
  isRecommended = false,
  onClick,
  onLearnMore,
  disabled = false
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const handleLearnMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLearnMore?.();
  };

  const baseClasses = "relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer";
  const selectedClasses = isSelected
    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div
      className={`${baseClasses} ${selectedClasses} ${disabledClasses}`}
      onClick={!disabled ? onClick : undefined}
      onKeyPress={!disabled ? handleKeyPress : undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      aria-label={`${name} methodology${isRecommended ? ' (Recommended)' : ''}${isSelected ? ' (Selected)' : ''}`}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
          ⭐ Recommended
        </div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="text-4xl" role="img" aria-label="Methodology icon">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      {/* Characteristics */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Key Characteristics:
        </h4>
        <ul className="space-y-1">
          {characteristics.map((characteristic, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{characteristic}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Learn More Button */}
      <button
        onClick={handleLearnMoreClick}
        className="w-full mt-4 py-2 px-4 border border-blue-500 text-blue-600 dark:text-blue-400 
                 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors
                 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        disabled={disabled}
      >
        Learn More
      </button>
    </div>
  );
};

export default MethodologyCard;
