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
 * Undo Manager
 * 
 * Handles undo functionality for destructive actions like delete.
 * Delays actual deletion to allow user to cancel within a time window.
 */

interface UndoAction {
  id: string;
  action: () => void;
  onUndo: () => void;
  timeout: NodeJS.Timeout;
}

class UndoManager {
  private actions: Map<string, UndoAction> = new Map();
  private defaultDelay = 5000; // 5 seconds

  /**
   * Register an action that can be undone
   * @param id - Unique identifier for the action
   * @param action - Function to execute after delay
   * @param onUndo - Function to call if undo is triggered
   * @param delay - Delay in milliseconds before executing action
   */
  registerAction(
    id: string,
    action: () => void,
    onUndo: () => void,
    delay: number = this.defaultDelay
  ): void {
    // Cancel existing action with same ID
    this.cancel(id);

    // Set timeout to execute action
    const timeout = setTimeout(() => {
      action();
      this.actions.delete(id);
    }, delay);

    // Store action
    this.actions.set(id, {
      id,
      action,
      onUndo,
      timeout,
    });
  }

  /**
   * Undo a pending action
   * @param id - ID of action to undo
   * @returns true if action was undone, false if not found
   */
  undo(id: string): boolean {
    const action = this.actions.get(id);
    
    if (!action) {
      return false;
    }

    // Clear timeout
    clearTimeout(action.timeout);

    // Call undo handler
    action.onUndo();

    // Remove from pending actions
    this.actions.delete(id);

    return true;
  }

  /**
   * Cancel a pending action without calling onUndo
   * @param id - ID of action to cancel
   */
  cancel(id: string): void {
    const action = this.actions.get(id);
    
    if (action) {
      clearTimeout(action.timeout);
      this.actions.delete(id);
    }
  }

  /**
   * Cancel all pending actions
   */
  cancelAll(): void {
    this.actions.forEach((action) => {
      clearTimeout(action.timeout);
    });
    this.actions.clear();
  }

  /**
   * Check if an action is pending
   * @param id - ID of action to check
   */
  isPending(id: string): boolean {
    return this.actions.has(id);
  }
}

// Singleton instance
export const undoManager = new UndoManager();

/**
 * React hook for undo functionality
 */
export function useUndo() {
  const registerUndo = (
    id: string,
    action: () => void,
    onUndo: () => void,
    delay?: number
  ) => {
    undoManager.registerAction(id, action, onUndo, delay);
  };

  const undo = (id: string) => {
    return undoManager.undo(id);
  };

  const cancel = (id: string) => {
    undoManager.cancel(id);
  };

  return {
    registerUndo,
    undo,
    cancel,
  };
}

export default undoManager;
