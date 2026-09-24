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
 * PaymentCard - one payment as a dense list row (memoized).
 *
 * Was a stacked card: recipient block, a tinted nisab-year box, a chip row, a
 * full-width grey box for the notes (which is literally "Seeded payment" in
 * demo data - a whole banner for three words), and a bordered action row. Fifty
 * of those is a 10,000px page. This is the mockup's row: recipient and category
 * on the left, amount and date on the right, and the record's own details behind
 * Details/Edit rather than always expanded.
 */

import React from 'react';
import { MoreVertical } from 'lucide-react';
import { formatGregorianDate } from '../../utils/calendarConverter';
import { looksEncrypted } from '../../utils/encryption';
import { Money } from '../ui/Money';
import type { PaymentRecord, YearlySnapshot } from '@zakapp/shared/types/tracking';
import { formatNisabYearLabel } from '../../utils/calendarConverter';

interface PaymentCardProps {
  payment: PaymentRecord;
  nisabYear?: YearlySnapshot;
  onEdit?: (payment: PaymentRecord) => void;
  onDelete?: (paymentId: string) => void;
  onViewDetails?: (payment: PaymentRecord) => void;
  compact?: boolean;
}

// Islamic recipient categories
const ZAKAT_RECIPIENTS: Record<string, string> = {
  fakir: 'Al-Fuqara (The Poor)',
  miskin: 'Al-Masakin (The Needy)',
  amil: 'Al-Amilin (Administrators)',
  muallaf: 'Al-Muallafah (New Muslims)',
  riqab: 'Ar-Riqab (Freeing Slaves)',
  gharimin: 'Al-Gharimin (Debt-ridden)',
  fisabilillah: 'Fi Sabilillah (In Allah\'s way)',
  ibnus_sabil: 'Ibn as-Sabil (Traveler)'
};

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  check: 'Check',
  online: 'Online',
  cryptocurrency: 'Crypto',
  other: 'Other'
};

/** Coerce a possibly-missing or non-numeric amount into a safe number. */
const safeAmount = (p: PaymentRecord | any): number => {
  const raw = p?.amount;
  if (raw === null || raw === undefined) return 0;
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
  return Number.isFinite(num) ? num : 0;
};

export const PaymentCard: React.FC<PaymentCardProps> = React.memo(({
  payment,
  nisabYear,
  onEdit,
  onDelete,
  onViewDetails,
  compact = false
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const categoryLabel = ZAKAT_RECIPIENTS[payment.recipientCategory] || payment.recipientCategory;
  const methodLabel = payment.paymentMethod
    ? PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod
    : null;

  const recipient = looksEncrypted(payment.recipientName)
    ? 'Encrypted recipient'
    : payment.recipientName;

  // Sub-line carries the context that used to occupy three separate blocks.
  const subline = [
    categoryLabel,
    methodLabel,
    formatNisabYearLabel(nisabYear) || null,
    !compact ? payment.receiptReference : null
  ]
    .filter(Boolean)
    .join(' · ');

  const hasMenu = Boolean(onViewDetails || onEdit || onDelete);

  return (
    <div
      className="group flex items-center gap-3 border-b border-border py-3 last:border-b-0"
      role="article"
      aria-label={`Payment to ${recipient}`}
    >
      <button
        type="button"
        onClick={() => onViewDetails?.(payment)}
        disabled={!onViewDetails}
        className="flex min-w-0 flex-1 items-center gap-3 text-start disabled:cursor-default"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {recipient}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{subline}</span>
        </span>

        <span className="shrink-0 text-end">
          <Money value={safeAmount(payment)} currency={payment.currency} size="sm" tone="success" />
          <span className="block text-xs text-muted-foreground tabular-nums">
            {formatGregorianDate(new Date(payment.paymentDate))}
          </span>
        </span>
      </button>

      {hasMenu && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Actions for payment to ${recipient}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div
                className="absolute end-0 z-20 mt-1 w-40 rounded-lg border border-border bg-popover py-1 shadow-elev-3"
                role="menu"
              >
                {onViewDetails && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onViewDetails(payment);
                    }}
                    className="block w-full px-3 py-2 text-start text-sm text-foreground hover:bg-accent"
                  >
                    Details
                  </button>
                )}
                {onEdit && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(payment);
                    }}
                    className="block w-full px-3 py-2 text-start text-sm text-foreground hover:bg-accent"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(payment.id);
                    }}
                    className="block w-full px-3 py-2 text-start text-sm text-danger hover:bg-danger-soft"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

PaymentCard.displayName = 'PaymentCard';

export default PaymentCard;