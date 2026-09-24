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
import { Toaster } from 'react-hot-toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          // Tokenised: was hardcoded #363636 on #fff, which ignored the theme
          // entirely and was the last colour outside the design system here.
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            boxShadow: 'var(--shadow-elev-2, 0 4px 12px rgb(0 0 0 / 0.12))',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'hsl(var(--success))',
              secondary: 'hsl(var(--card))',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: 'hsl(var(--danger))',
              secondary: 'hsl(var(--card))',
            },
          },
        }}
      />
    </>
  );
};