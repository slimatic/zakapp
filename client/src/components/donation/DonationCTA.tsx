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
import { useDonations } from '../../hooks/useDonations';

export const DonationCTA: React.FC<{ className?: string, variant?: 'sidebar' | 'footer' | 'minimal' }> = ({ className = '', variant = 'minimal' }) => {
    const { isEnabled, donationUrl } = useDonations();

    if (!isEnabled) return null;

    if (variant === 'footer') {
        return (
            <a
                href={donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 text-xs text-amber-600 hover:text-amber-700 transition-colors ${className}`}
            >
                <span>☕</span>
                <span>Sustain ZakApp</span>
            </a>
        );
    }

    return (
        <a
            href={donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors ${className}`}
        >
            <span>☕</span>
            <span>Sustain this Project</span>
        </a>
    );
};
