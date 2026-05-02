/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React from 'react';
import { Modal } from '../ui/Modal';
import { PaymentRecordForm } from '../tracking/PaymentRecordForm';

export interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  snapshotId: string;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  open,
  onClose,
  snapshotId,
  onSuccess,
}) => {
  return (
    <Modal isOpen={open} onClose={onClose} title="Record Zakat Payment" size="md">
      <PaymentRecordForm
        snapshotId={snapshotId}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
};
