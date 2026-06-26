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

/**
 * DashboardActionCards.tsx
 *
 * Next Best Action cards replacing the legacy OnboardingGuide + Smart Navigation.
 * Shows contextual, tappable cards based on user state.
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickActionCard } from './QuickActionCard';
import {
  Wallet,
  CreditCard,
  CalendarDays,
  Settings,
} from 'lucide-react';

export interface DashboardActionCardsProps {
  hasAssets: boolean;
  hasActiveRecord: boolean;
  hasPayments: boolean;
  isSetupComplete?: boolean;
  currency?: string;
  userName?: string;
}

/** Build the list of action cards from current user state. */
function buildActions(props: DashboardActionCardsProps) {
  const { hasAssets, hasActiveRecord, hasPayments, isSetupComplete, currency } = props;
  type CardDef = {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    variant: 'default' | 'primary' | 'alert' | 'warning';
    hidden?: boolean;
  };

  const cards: CardDef[] = [
    {
      id: 'add-assets',
      title: 'Add Assets',
      description: 'Add your wealth assets (cash, gold, investments) to begin tracking.',
      icon: <Wallet className="h-6 w-6" />,
      href: '/assets/new',
      variant: hasAssets ? 'default' : 'primary',
      hidden: false,
    },
    {
      id: 'record-zakat-payment',
      title: 'Record Zakat Payment',
      description: hasPayments
        ? 'Record another Zakat payment and keep your history up to date.'
        : 'Record your Zakat payment when it is due.',
      icon: <CreditCard className="h-6 w-6" />,
      href: '/payments',
      variant: isSetupComplete && !hasPayments ? 'primary' : 'default',
      hidden: false,
    },
    {
      id: 'review-nisab-year',
      title: 'Review Nisab Year',
      description: hasActiveRecord
        ? 'Review your active Nisab Year Record and Hawl progress.'
        : 'Create a Nisab Year Record to start your 354-day Hawl period.',
      icon: <CalendarDays className="h-6 w-6" />,
      href: '/nisab-records',
      variant: !hasActiveRecord && hasAssets ? 'primary' : 'default',
      hidden: false,
    },
    {
      id: 'set-currency',
      title: 'Set Currency',
      description: `Your currency is set to ${currency || 'USD'}. Update it in the Settings page.`,
      icon: <Settings className="h-6 w-6" />,
      href: '/settings',
      variant: 'default',
      hidden: false,
    },
  ];

  return cards.filter((c) => !c.hidden);
}

export const DashboardActionCards: React.FC<DashboardActionCardsProps> = (props) => {
  const navigate = useNavigate();
  const actions = useMemo(() => buildActions(props), [props]);

  if (actions.length === 0) return null;

  return (
    <div
      data-testid="dashboard-action-cards"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {actions.map((action) => (
        <QuickActionCard
          key={action.id}
          title={action.title}
          description={action.description}
          icon={action.icon}
          href={action.href}
          variant={action.variant}
        />
      ))}
    </div>
  );
};
