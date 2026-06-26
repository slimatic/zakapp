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

import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface BestAction {
    type: 'URGENT' | 'WARNING' | 'SETUP' | 'MAINTENANCE';
    title: string;
    description: string;
    label: string;
    href: string;
    variant: 'urgent' | 'primary' | 'success' | 'warning' | 'neutral';
    stepNumber: 1 | 2 | 3; // Mapped to Onboarding Steps
}

export const useBestAction = (
    user: any,
    assets: any[],
    activeRecord: any,
    hasAssets: boolean,
    hasActiveRecord: boolean,
    totalWealth: number,
    isOnboardingComplete: boolean = false
): BestAction | null => {
    return useMemo(() => {
        const isZakatDue = activeRecord?.hawlCompletionDate &&
            new Date(activeRecord.hawlCompletionDate) <= new Date();

        console.log('[useBestAction] State:', { isZakatDue, activeRecordId: activeRecord?.id, hasActiveRecord, isOnboardingComplete });

        if (isZakatDue) {
            return {
                type: 'URGENT',
                title: 'Zakat Payment Due',
                description: `Your Hawl period ended on ${new Date(activeRecord.hawlCompletionDate!).toLocaleDateString()}. Finalize record & pay Zakat.`,
                label: 'Pay Zakat Now',
                href: `/payments`,
                variant: 'urgent',
                stepNumber: 3
            };
        }

        // 2. Critical: New User / No Assets -> Step 1 (Assets)
        if (!hasAssets) {
            return {
                type: 'SETUP',
                title: 'Start Your Journey',
                description: 'Begin by adding your first asset to track your wealth.',
                label: 'Add First Asset',
                href: '/assets/new',
                variant: 'primary',
                stepNumber: 1
            };
        }

        // 3. Setup: Has Assets but No Record -> Step 2 (Records)
        if (!hasActiveRecord && totalWealth > 0) {
            return {
                type: 'SETUP',
                title: 'Activate Zakat Tracking',
                description: 'You have assets. Create a Nisab Record to start your Hawl year.',
                label: 'Start Tracking',
                href: '/nisab-records',
                variant: 'primary',
                stepNumber: 2
            };
        }

        // --- Onboarding Barrier ---
        // If user is still navigating the initial setup (e.g. hasn't paid yet/finished step 3),
        // do NOT show maintenance warnings or default "Keep up good work" messages.
        // Allow the linear OnboardingGuide to handle the display (showing Step 3 as active).
        if (!isOnboardingComplete) {
            return null;
        }

        // 4. Maintenance: Stale Assets (> 30 days) -> Step 1 (Assets)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const hasStaleAssets = assets.some(asset => new Date(asset.updatedAt) < thirtyDaysAgo);

        if (hasStaleAssets) {
            return {
                type: 'WARNING',
                title: 'Update Asset Values',
                description: 'Some assets haven\'t been updated in over 30 days. Regular updates ensure Zakat accuracy.',
                label: 'Review Assets',
                href: '/assets',
                variant: 'warning',
                stepNumber: 1
            };
        }

        // 5. Default -> Step 1 (Growth)
        return {
            type: 'MAINTENANCE',
            title: 'Keep Up the Good Work',
            description: 'Your wealth tracking is up to date. Add new assets or review portfolio.',
            label: 'Add New Asset',
            href: '/assets/new',
            variant: 'neutral',
            stepNumber: 1
        };
    }, [user, assets, activeRecord, hasAssets, hasActiveRecord, totalWealth, isOnboardingComplete]);
};
