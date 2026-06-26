/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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

import React from 'react';
import { Tooltip } from './Tooltip';

interface TermHelpProps {
    term: string;
    arabic?: string;
    definition: string;
    children?: React.ReactNode;
}

export const TermHelp: React.FC<TermHelpProps> = ({ term, arabic, definition, children }) => {
    const tooltipContent = (
        <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-4 border-b border-gray-700 pb-1 mb-1">
                <span className="font-semibold text-emerald-300">{term}</span>
                {arabic && <span className="font-arabic text-emerald-100/80" lang="ar" dir="rtl">{arabic}</span>}
            </div>
            <p className="leading-relaxed opacity-90">{definition}</p>
        </div>
    );

    return (
        <Tooltip content={tooltipContent} trigger="both">
            <span className="inline-flex items-center gap-1 cursor-help group border-b border-dotted border-gray-400 decoration-gray-400/50 hover:border-emerald-500 hover:text-emerald-700 transition-colors" role="button" tabIndex={0}>
                {children || term}
                <span className="sr-only">Explanation available</span>
            </span>
        </Tooltip>
    );
};
