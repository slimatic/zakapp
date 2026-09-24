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

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  onValueChange,
  onChange,
  className = '',
  children,
  ...props
}, ref) => {
  const baseClasses = 'w-full px-3 py-2 border border-border-strong rounded-md shadow-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring';
  const errorClasses = error ? 'border-danger focus:ring-danger' : '';
  const classes = `${baseClasses} ${errorClasses} ${className}`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <select ref={ref} className={classes} onChange={handleChange} {...props}>
        {children}
      </select>
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';