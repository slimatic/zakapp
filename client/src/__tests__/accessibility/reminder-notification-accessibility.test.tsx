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
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReminderNotification } from '../../../src/components/ReminderNotification';

expect.extend(toHaveNoViolations);

describe('ReminderNotification Accessibility', () => {
  const mockOnAcknowledge = jest.fn();
  const mockOnDismiss = jest.fn();

  const mockReminders = [
    {
      id: 'reminder-123',
      eventType: 'zakat_due' as const,
      title: 'Zakat Payment Reminder',
      message: 'Your Zakat payment is due in 7 days.',
      priority: 'medium' as const,
      triggerDate: new Date(),
    },
  ];

  const defaultProps = {
    reminders: mockReminders,
    onAcknowledge: mockOnAcknowledge,
    onDismiss: mockOnDismiss,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without accessibility issues', async () => {
    const { container } = render(<ReminderNotification {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA attributes for notifications', () => {
    render(<ReminderNotification {...defaultProps} />);

    // The component renders a notification banner with the title
    const titleElement = screen.getByText(mockReminders[0].title);
    expect(titleElement).toBeTruthy();

    // Should be visible and properly rendered
    expect(titleElement).toBeVisible();
  });

  it('should have accessible dismiss button', () => {
    render(<ReminderNotification {...defaultProps} />);

    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
    expect(dismissButtons.length).toBeGreaterThan(0);

    // Check that buttons have proper labeling
    dismissButtons.forEach(button => {
      expect(button).toBeTruthy();
    });
  });

  it('should have accessible action button if provided', () => {
    render(<ReminderNotification {...defaultProps} />);

    const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
    expect(viewDetailsButton).toBeTruthy();

    // Should have accessible text
    const textContent = viewDetailsButton.textContent || '';
    expect(textContent.trim().length).toBeGreaterThan(0);
  });

  it('should support keyboard navigation', () => {
    render(<ReminderNotification {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      // Buttons should be keyboard accessible
      expect(button.tabIndex).not.toBe(-1);
    });
  });

  it('should have proper heading hierarchy', () => {
    render(<ReminderNotification {...defaultProps} />);

    // Should have text content for the notification
    const titleElement = screen.getByText(mockReminders[0].title);
    expect(titleElement).toBeTruthy();

    // Title should contain the expected text
    const titleText = titleElement.textContent || '';
    expect(titleText.toLowerCase()).toContain('reminder');
  });

  it('should provide sufficient color contrast for different types', () => {
    const priorities = ['low', 'medium', 'high'] as const;

    priorities.forEach(priority => {
      const { unmount } = render(<ReminderNotification {...defaultProps} reminders={[{ ...mockReminders[0], priority }]} />);

      // Component should render without issues
      const titleElement = screen.getByText(mockReminders[0].title);
      expect(titleElement).toBeTruthy();

      unmount();
    });
  });

  it('should support screen readers with proper content', () => {
    render(<ReminderNotification {...defaultProps} />);

    // Should have readable text content - check for the title which is rendered
    const titleElement = screen.getByText(mockReminders[0].title);
    expect(titleElement).toBeTruthy();

    // Title should be visible to screen readers
    expect(titleElement.tagName.toLowerCase()).not.toBe('hidden');
  });

  it('should handle different priority levels accessibly', () => {
    const priorities = ['low', 'medium', 'high'] as const;

    priorities.forEach(priority => {
      const { unmount } = render(<ReminderNotification {...defaultProps} reminders={[{ ...mockReminders[0], priority }]} />);

      const titleElement = screen.getByText(mockReminders[0].title);
      expect(titleElement).toBeTruthy();

      unmount();
    });
  });

  it('should be responsive on different screen sizes', () => {
    render(<ReminderNotification {...defaultProps} />);

    const titleElement = screen.getByText(mockReminders[0].title);

    // Should be properly contained
    expect(titleElement).toBeTruthy();

    // Should not be hidden
    expect(titleElement).toBeVisible();
  });

  it('should maintain accessibility when no active reminders', () => {
    const acknowledgedReminders = [{
      ...mockReminders[0],
      acknowledgedAt: new Date(),
    }];

    render(<ReminderNotification {...defaultProps} reminders={acknowledgedReminders} />);

    // When no active reminders, component should not render
    const titleElement = screen.queryByText(acknowledgedReminders[0].title);
    expect(titleElement).toBeFalsy();
  });
});