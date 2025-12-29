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

import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", showText = false }) => {
    return (
        <div className={`flex items-center ${showText ? 'gap-2' : ''}`}>
            <svg
                viewBox="0 0 512 512"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="logo_gradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#2dd4bf" />
                        <stop offset="1" stopColor="#0f766e" />
                    </linearGradient>
                </defs>

                <path d="M165.6 52H346.4C354.3 52 362 55.4 367.3 61.3L450.7 154.7C455.4 160 458 167 458 174.1V337.9C458 345 455.4 352 450.7 357.3L367.3 450.7C362 456.6 354.3 460 346.4 460H165.6C157.7 460 150 456.6 144.7 450.7L61.3 357.3C56.6 352 54 345 54 337.9V174.1C54 167 56.6 160 61.3 154.7L144.7 61.3C150 55.4 157.7 52 165.6 52Z"
                    fill="url(#logo_gradient)" />

                <path d="M175 75H337L437 185V327L337 437H175L75 327V185L175 75Z"
                    stroke="#fbbf24" strokeWidth="4" strokeOpacity="0.6" fill="none" />

                <path d="M180 170 H340 L180 342 H340"
                    stroke="white" strokeWidth="56" strokeLinecap="round" strokeLinejoin="round" />

                <circle cx="340" cy="140" r="16" fill="#fbbf24" />
            </svg>

            {showText && (
                <span className="text-xl font-bold text-gray-900">ZakApp</span>
            )}
        </div>
    );
};
