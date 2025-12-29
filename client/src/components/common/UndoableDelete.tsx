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

/**
 * Undoable Delete Component
 * 
 * Provides a delete action with undo capability.
 * Shows toast notification with undo button for 5 seconds.
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useUndo } from '../../utils/undoManager';
import { useToast } from './Toast';

interface UndoableDeleteProps {
  itemName: string;
  itemType: string;
  onDelete: () => Promise<void>;
  onRestore: () => void;
  className?: string;
  buttonText?: string;
  confirmRequired?: boolean;
}

/**
 * Button component that deletes with undo capability
 */
export const UndoableDelete: React.FC<UndoableDeleteProps> = ({
  itemName,
  itemType,
  onDelete,
  onRestore,
  className = '',
  buttonText = 'Delete',
  confirmRequired = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { registerUndo, undo } = useUndo();
  const { showToast } = useToast();

  const handleDelete = async () => {
    // If confirmation required, show dialog first
    if (confirmRequired) {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${itemName}? You'll have 5 seconds to undo.`
      );
      if (!confirmed) return;
    }

    setIsDeleting(true);

    // Generate unique ID for this deletion
    const undoId = `delete-${itemType}-${Date.now()}`;

    // Register undo action
    registerUndo(
      undoId,
      async () => {
        // Execute actual deletion after 5 seconds
        try {
          await onDelete();
          setIsDeleting(false);
        } catch (error) {
          toast.error('Delete failed');
          setIsDeleting(false);
        }
      },
      () => {
        // Restore if undo is triggered
        onRestore();
        setIsDeleting(false);
        
        // Show success toast
        showToast({
          type: 'success',
          title: `${itemType} Restored`,
          message: `${itemName} has been restored.`,
          duration: 3000,
        });
      },
      5000 // 5 second delay
    );

    // Show toast with undo button
    showToast({
      type: 'info',
      title: `${itemType} Deleted`,
      message: `${itemName} will be deleted in 5 seconds.`,
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          undo(undoId);
        },
      },
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      aria-label={`Delete ${itemName}`}
    >
      <TrashIcon className="h-4 w-4" aria-hidden="true" />
      {isDeleting ? 'Deleting...' : buttonText}
    </button>
  );
};

/**
 * Hook for undoable deletion without a button
 * Useful for dropdown menus, context menus, etc.
 */
export function useUndoableDelete() {
  const { registerUndo, undo } = useUndo();
  const { showToast } = useToast();

  const performDelete = async (
    itemName: string,
    itemType: string,
    onDelete: () => Promise<void>,
    onRestore: () => void
  ) => {
    const undoId = `delete-${itemType}-${Date.now()}`;

    // Register undo action
    registerUndo(
      undoId,
      async () => {
        try {
          await onDelete();
        } catch (error) {
          toast.error('Delete failed');
        }
      },
      () => {
        onRestore();
        
        showToast({
          type: 'success',
          title: `${itemType} Restored`,
          message: `${itemName} has been restored.`,
          duration: 3000,
        });
      },
      5000
    );

    // Show toast with undo button
    showToast({
      type: 'info',
      title: `${itemType} Deleted`,
      message: `${itemName} will be deleted in 5 seconds.`,
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          undo(undoId);
        },
      },
    });
  };

  return { performDelete };
}

export default UndoableDelete;
