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
import { Modal } from '../ui/Modal';
import { PaymentRecordForm } from '../tracking/PaymentRecordForm';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The active nisab record ID to associate the payment with */
  activeRecordId: string | null;
  /** Callback when a payment is successfully recorded */
  onSuccess: (payment: PaymentRecord) => void;
  /** Callback when the user cancels the form */
  onCancel: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  activeRecordId,
  onSuccess,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Zakat Payment" size="md">
      {activeRecordId && (
        <PaymentRecordForm
          nisabRecordId={activeRecordId}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      )}
    </Modal>
  );
};
