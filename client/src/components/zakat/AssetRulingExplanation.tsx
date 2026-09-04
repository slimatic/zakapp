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
 * AssetRulingExplanation Component
 *
 * Shows WHY an asset is zakatable or exempt under the chosen methodology,
 * with the madhab default reasoning and scholarly citations (with links).
 * Renders the user-override explanation when one is present.
 * Presentational only — data comes from data/rulings.ts.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Scale, AlertTriangle } from 'lucide-react';
import type { AssetRuling, RulingStatus } from '../../data/rulings';

export interface AssetRulingExplanationProps {
  ruling: AssetRuling;
  assetName: string;
  className?: string;
  /** Start expanded (used in detail views); default collapsed */
  defaultExpanded?: boolean;
}

const STATUS_LABELS: Record<RulingStatus, { label: string; classes: string }> = {
  zakatable: { label: 'Zakatable', classes: 'bg-green-100 text-green-800 border-green-200' },
  exempt: { label: 'Exempt', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
  'override-zakatable': { label: 'Zakatable (your override)', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  'override-exempt': { label: 'Exempt (your override)', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
};

export const AssetRulingExplanation: React.FC<{
  ruling: AssetRuling;
  assetName: string;
  className?: string;
  defaultExpanded?: boolean;
}> = ({ ruling, assetName, className = '', defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const status = STATUS_LABELS[ruling.status];

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50/60 ${className}`} data-testid="asset-ruling-explanation">
      {/* Status line + toggle */}
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Scale className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${status.classes}`}
            data-testid="ruling-status"
          >
            {status.label}
          </span>
          {ruling.override && (
            <span className="hidden sm:inline text-xs text-blue-700 truncate" data-testid="override-hint">
              you marked this yourself — see why below
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          aria-controls={`ruling-detail-${assetName.replace(/\s+/g, '-').toLowerCase()}`}
          className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 shrink-0"
          data-testid="ruling-toggle"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Why?
        </button>
      </div>

      {/* Detail */}
      {expanded && (
        <div
          id={`ruling-detail-${assetName.replace(/\s+/g, '-').toLowerCase()}`}
          className="px-3 pb-3 space-y-2 text-sm"
        >
          {/* Madhab default */}
          <div>
            <p className="font-medium text-slate-900">{ruling.madhabDefault.ruling}</p>
            <p className="text-slate-600 mt-0.5">{ruling.madhabDefault.reasoning}</p>
          </div>

          {/* Override explanation */}
          {ruling.override && (
            <div className="border-l-2 border-blue-300 bg-blue-50/70 rounded-r-md px-3 py-2" data-testid="override-block">
              <p className="font-medium text-blue-900">{ruling.override.ruling}</p>
              <p className="text-blue-800 mt-0.5">{ruling.override.reasoning}</p>
            </div>
          )}

          {/* Citations */}
          {ruling.citations.length > 0 && (
            <div className="pt-1 border-t border-slate-200">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-2 mb-1">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Sources
              </p>
              <ul className="space-y-1">
                {ruling.citations.map((citation, i) => (
                  <li key={i} className="text-xs">
                    {citation.url ? (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-700 hover:underline break-words"
                      >
                        {citation.text}
                      </a>
                    ) : (
                      <span className="text-slate-600">{citation.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Standing disclaimer */}
          <p className="flex items-start gap-1.5 text-xs text-slate-500 pt-1" data-testid="ruling-disclaimer">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            Educational summary — consult a qualified scholar for your specific situation.
          </p>
        </div>
      )}
    </div>
  );
};

AssetRulingExplanation.displayName = 'AssetRulingExplanation';

export default AssetRulingExplanation;