/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React, { useState, useEffect } from 'react';
import { DualCalendarDatePicker } from '../common/DualCalendarDatePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string | null;
  onSave: (newDate: string) => void;
}

export const EditDatePopover: React.FC<Props> = ({
  isOpen,
  onClose,
  currentDate,
  onSave,
}) => {
  const [localDate, setLocalDate] = useState(currentDate || '');

  useEffect(() => {
    setLocalDate(currentDate || '');
  }, [currentDate]);

  if (!isOpen) return null;

  return (
    <div className="absolute bg-white border p-4 shadow-xl z-20 rounded-lg w-72" onClick={e => e.stopPropagation()}>
      <DualCalendarDatePicker
        label="New Start Date"
        value={localDate}
        onChange={(d) => setLocalDate(d.toISOString().split('T')[0])}
        className="mb-3"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="text-gray-600 px-3 py-1 text-sm hover:bg-gray-100 rounded">Cancel</button>
        <button onClick={() => onSave(localDate)} className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700">Save</button>
      </div>
    </div>
  );
};
