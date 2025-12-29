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

import React, { useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import * as Tooltip from '@radix-ui/react-tooltip';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  learnMoreUrl?: string;
  className?: string;
}

/**
 * Contextual help tooltip component
 * Provides inline guidance and Islamic context for complex features
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  learnMoreUrl,
  className = '',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded-full transition-colors ${className}`}
            aria-label="Help information"
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
          </button>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-sm bg-gray-900 text-white text-sm rounded-lg shadow-xl p-3 z-50 animate-fade-in"
            sideOffset={5}
            side="top"
          >
            {title && (
              <div className="font-semibold mb-1 text-white">{title}</div>
            )}
            
            <div className="text-gray-100">
              {typeof content === 'string' ? <p>{content}</p> : content}
            </div>

            {learnMoreUrl && (
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-indigo-300 hover:text-indigo-200 underline text-xs"
              >
                Learn more →
              </a>
            )}

            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

/**
 * Islamic guidance tooltip for Zakat-related concepts
 */
export const IslamicGuidanceTooltip: React.FC<{
  concept: string;
  guidance: string;
  source?: string;
  className?: string;
}> = ({ concept, guidance, source, className }) => {
  return (
    <HelpTooltip
      title={concept}
      content={
        <div>
          <p className="mb-2">{guidance}</p>
          {source && (
            <p className="text-xs text-gray-300 italic">
              Source: {source}
            </p>
          )}
        </div>
      }
      learnMoreUrl="/help/islamic-guidance"
      className={className}
    />
  );
};

/**
 * Methodology explanation tooltip
 */
export const MethodologyTooltip: React.FC<{
  methodology: string;
  description: string;
  differences?: string;
  className?: string;
}> = ({ methodology, description, differences, className }) => {
  return (
    <HelpTooltip
      title={methodology}
      content={
        <div className="space-y-2">
          <p>{description}</p>
          {differences && (
            <p className="text-xs text-gray-300">
              <strong>Key Difference:</strong> {differences}
            </p>
          )}
        </div>
      }
      learnMoreUrl="/help/methodologies"
      className={className}
    />
  );
};

/**
 * Field help tooltip with examples
 */
export const FieldHelpTooltip: React.FC<{
  label: string;
  description: string;
  example?: string;
  className?: string;
}> = ({ label, description, example, className }) => {
  return (
    <HelpTooltip
      title={label}
      content={
        <div className="space-y-2">
          <p>{description}</p>
          {example && (
            <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
              <strong className="text-gray-300">Example:</strong>
              <p className="text-gray-100 mt-1">{example}</p>
            </div>
          )}
        </div>
      }
      className={className}
    />
  );
};

export default HelpTooltip;
