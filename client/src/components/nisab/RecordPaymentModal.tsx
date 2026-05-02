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
import { NisabYearRecord } from '../../types/nisabYearRecord';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeRecord: NisabYearRecord | null;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeRecord,
  onSuccess,
}) => {
  if (!activeRecord) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Zakat Payment" size="md">
      <PaymentRecordForm
        nisabRecordId={activeRecord.id}
        onSuccess={onSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
};
