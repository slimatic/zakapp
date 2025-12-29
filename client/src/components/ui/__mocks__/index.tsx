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

export const Button = ({ children, ...props }: any) => {
  // debug: ensure mock is actually used in tests
  // console.log('Mock Button render:', children);
  return React.createElement('button', { ...props }, children);
};

export const Input = (props: any) => {
  return React.createElement('input', { ...props });
};

export const Select = (props: any) => {
  return React.createElement('select', { ...props }, props.children);
};

export const Textarea = (props: any) => {
  return React.createElement('textarea', { ...props });
};

export const LoadingSpinner = () => React.createElement('div', { 'data-testid': 'loading-spinner' });
