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
import { useNavigate } from 'react-router-dom';
import { AssetForm } from './AssetForm';

/**
 * AssetFormPage - A wrapper component for the AssetForm that handles navigation
 * Used for the /assets/new route to provide proper navigation callbacks
 */
export const AssetFormPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to assets list after successful creation
    navigate('/assets');
  };

  const handleCancel = () => {
    // Navigate back to assets list when user cancels
    navigate('/assets');
  };

  return (
    <AssetForm 
      onSuccess={handleSuccess} 
      onCancel={handleCancel} 
    />
  );
};