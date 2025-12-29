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

import React, { useState } from 'react';
import { Button } from './ui';
import { Modal } from './ui/Modal';

interface Reminder {
  id: string;
  eventType: 'zakat_due' | 'payment_reminder' | 'annual_review' | 'custom';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  triggerDate: Date;
  acknowledgedAt?: Date;
}

interface ReminderNotificationProps {
  reminders: Reminder[];
  onAcknowledge: (reminderId: string) => void;
  onDismiss: (reminderId: string) => void;
}

/**
 * ReminderNotification Component
 * Displays active reminders and handles user interactions
 */
export const ReminderNotification: React.FC<ReminderNotificationProps> = ({
  reminders,
  onAcknowledge,
  onDismiss
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  // Filter active reminders (not acknowledged or dismissed)
  const activeReminders = reminders.filter(r => !r.acknowledgedAt);

  // Show the highest priority reminder
  const currentReminder = activeReminders.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  })[0];

  const handleViewDetails = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setShowModal(true);
  };

  const handleAcknowledge = () => {
    if (selectedReminder) {
      onAcknowledge(selectedReminder.id);
      setShowModal(false);
      setSelectedReminder(null);
    }
  };

  const handleDismiss = () => {
    if (selectedReminder) {
      onDismiss(selectedReminder.id);
      setShowModal(false);
      setSelectedReminder(null);
    }
  };

  if (!currentReminder) {
    return null; // No active reminders
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-500 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'zakat_due': return 'Zakat Due';
      case 'payment_reminder': return 'Payment Reminder';
      case 'annual_review': return 'Annual Review';
      case 'custom': return 'Reminder';
      default: return 'Reminder';
    }
  };

  return (
    <>
      {/* Notification Banner */}
      <div className={`fixed top-4 right-4 z-50 max-w-md ${getPriorityColor(currentReminder.priority)} border-l-4 p-4 shadow-lg`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              {getEventTypeLabel(currentReminder.eventType)}
            </p>
            <p className="text-sm">
              {currentReminder.title}
            </p>
            <div className="mt-2 flex">
              <Button
                onClick={() => handleViewDetails(currentReminder)}
                className="text-xs px-2 py-1 mr-2"
              >
                View Details
              </Button>
              <Button
                onClick={() => onDismiss(currentReminder.id)}
                variant="secondary"
                className="text-xs px-2 py-1"
              >
                Dismiss
              </Button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(currentReminder.id)}
              className="inline-flex text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedReminder?.title || 'Reminder Details'}
      >
        {selectedReminder && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Type</h4>
              <p className="text-sm text-gray-900">{getEventTypeLabel(selectedReminder.eventType)}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Priority</h4>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedReminder.priority)}`}>
                {selectedReminder.priority.toUpperCase()}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
              <p className="text-sm text-gray-900">
                {new Date(selectedReminder.triggerDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Message</h4>
              <p className="text-sm text-gray-900">{selectedReminder.message}</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                onClick={handleDismiss}
                variant="secondary"
              >
                Dismiss
              </Button>
              <Button
                onClick={handleAcknowledge}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Acknowledge
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};