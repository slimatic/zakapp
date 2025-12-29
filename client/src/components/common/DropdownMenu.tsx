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
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
    destructive?: boolean;
  }>;
  align?: 'start' | 'center' | 'end';
}

/**
 * Accessible Dropdown Menu Component using Radix UI
 * 
 * Features:
 * - Keyboard navigation (Arrow keys, Enter, Space, Escape)
 * - ARIA attributes (aria-haspopup, aria-expanded)
 * - Focus management
 * - Screen reader compatible
 * - Customizable alignment
 */
export const DropdownMenuComponent: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'end'
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-white rounded-md shadow-lg p-1 z-50 border border-gray-200"
          sideOffset={5}
          align={align}
        >
          {items.map((item, index) => (
            <DropdownMenu.Item
              key={index}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer outline-none
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 focus:bg-gray-100'}
                ${item.destructive ? 'text-red-600' : 'text-gray-700'}
              `}
              onSelect={item.disabled ? undefined : item.onClick}
              disabled={item.disabled}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default DropdownMenuComponent;
