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

export const useDonations = () => {
    // Default to true for development if not set, otherwise respect the env var
    // In production, this should be strictly controlled
    const isEnabled = import.meta.env.VITE_ENABLE_DONATIONS !== 'false';
    const donationUrl = '/donate.html'; // Assuming simple redirection to the static page

    return {
        isEnabled,
        donationUrl
    };
};
