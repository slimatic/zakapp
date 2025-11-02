/**
 * ReminderBanner Component - T066
 * Displays reminder notifications with dismiss actions
 */

import React from 'react';
import { useReminders, useAcknowledgeReminder } from '../../hooks/useReminders';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatGregorianDate } from '../../utils/calendarConverter';

interface ReminderBannerProps {
  compact?: boolean;
  maxReminders?: number;
  position?: 'top' | 'bottom';
}

const REMINDER_ICONS = {
  zakat_anniversary_approaching: '📊',
  calculation_overdue: '💰',
  payment_incomplete: '🧮',
  yearly_comparison_available: '⚖️',
  data_backup_reminder: '📅',
  methodology_review: '🔔'
};

const REMINDER_COLORS = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    button: 'text-red-600 hover:text-red-700'
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    button: 'text-yellow-600 hover:text-yellow-700'
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    button: 'text-blue-600 hover:text-blue-700'
  }
};

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  compact = false,
  maxReminders = 3,
  position = 'top'
}) => {
  const { data, isLoading } = useReminders();
  const acknowledgeReminderMutation = useAcknowledgeReminder();

  const reminders = data?.reminders || [];

  const handleDismiss = async (reminderId: string) => {
    try {
      await acknowledgeReminderMutation.mutateAsync(reminderId);
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
    }
  };

  const handleDismissAll = async () => {
    if (!reminders?.length) return;
    
    try {
      await Promise.all(
        reminders.map(reminder => 
          acknowledgeReminderMutation.mutateAsync(reminder.id)
        )
      );
    } catch (error) {
      console.error('Failed to dismiss all reminders:', error);
    }
  };

  const handleSnooze = async (reminderId: string, snoozeHours: number = 24) => {
    // This would typically call a snooze mutation
    // For now, we'll just acknowledge the reminder
    try {
      await acknowledgeReminderMutation.mutateAsync(reminderId);
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
    }
  };

  if (isLoading) {
    return compact ? null : (
      <div className="flex justify-center py-2">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!reminders || reminders.length === 0) {
    return null;
  }

  // Sort by priority and limit
  const sortedReminders = reminders
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, maxReminders);

  const positionClasses = position === 'top' 
    ? 'top-0' 
    : 'bottom-0';

  return (
    <div className={`${compact ? 'relative' : `fixed left-0 right-0 ${positionClasses} z-50`}`}>
      <div className={`${compact ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        <div className="space-y-2">
          {sortedReminders.map((reminder) => {
            const colors = REMINDER_COLORS[reminder.priority];
            const icon = REMINDER_ICONS[reminder.eventType] || '🔔';
            
            return (
              <div
                key={reminder.id}
                className={`${colors.bg} ${colors.border} border rounded-lg ${compact ? 'p-3' : 'p-4'} shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-xl">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${colors.text}`}>
                        {reminder.title}
                      </div>
                      {reminder.message && (
                        <div className={`text-sm ${colors.text} mt-1 opacity-90`}>
                          {reminder.message}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>
                          📅 Due: {formatGregorianDate(reminder.triggerDate)}
                        </span>
                        {reminder.priority === 'high' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                            🚨 High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {!compact && (
                      <button
                        onClick={() => handleSnooze(reminder.id)}
                        disabled={acknowledgeReminderMutation.isPending}
                        className={`text-xs ${colors.button} hover:underline`}
                      >
                        Snooze
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(reminder.id)}
                      disabled={acknowledgeReminderMutation.isPending}
                      className={`text-xs ${colors.button} hover:underline font-medium`}
                    >
                      {acknowledgeReminderMutation.isPending ? 'Dismissing...' : 'Dismiss'}
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                {!compact && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      {reminder.eventType === 'calculation_overdue' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              // Navigate to Nisab Year Records create flow
                              window.location.href = '/nisab-year-records?create=true';
                            }}
                          >
                            Create Snapshot
                          </Button>
                      )}
                      {reminder.eventType === 'payment_incomplete' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            // Navigate to payments
                            window.location.href = '/tracking/payments';
                          }}
                        >
                          Record Payment
                        </Button>
                      )}
                      {reminder.eventType === 'zakat_anniversary_approaching' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            // Navigate to calculator
                            window.location.href = '/calculator';
                          }}
                        >
                          Calculate Zakat
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Dismiss All Button */}
          {sortedReminders.length > 1 && !compact && (
            <div className="text-center">
              <button
                onClick={handleDismissAll}
                disabled={acknowledgeReminderMutation.isPending}
                className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
              >
                Dismiss All ({sortedReminders.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Utility component for embedding in other components
export const CompactReminderBanner: React.FC = () => (
  <ReminderBanner compact={true} maxReminders={2} />
);

// Full-width banner for app-level notifications
export const FullReminderBanner: React.FC = () => (
  <ReminderBanner compact={false} maxReminders={5} position="top" />
);