/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React from 'react';
import { DualCalendarDatePicker } from '../common/DualCalendarDatePicker';

export interface EditDatePopoverProps {
  value: string;
  onChange: (isoDate: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditDatePopover: React.FC<EditDatePopoverProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
}) => {
  const [date, setDate] = React.useState<Date | null>(value ? new Date(value) : null);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-3 w-64">
      <DualCalendarDatePicker
        value={date || new Date()}
        onChange={(newDate) => {
          setDate(newDate);
          onChange(newDate.toISOString().split('T')[0]);
        }}
        label="New Start Date"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!date}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
};
