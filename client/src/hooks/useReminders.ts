/**
 * useReminders Hook - T057
 * Fetches and manages reminder events
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { ReminderEvent } from '../../../shared/types/tracking';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

interface UseRemindersOptions {
  status?: 'pending' | 'shown' | 'acknowledged' | 'dismissed';
  eventType?: string;
  enabled?: boolean;
}

interface RemindersResponse {
  reminders: ReminderEvent[];
  total: number;
}

/**
 * Fetches reminder events for the user
 * @param options - Query options including status and type filters
 * @returns React Query result with reminders data
 */
export function useReminders(
  options: UseRemindersOptions = {}
): UseQueryResult<RemindersResponse, Error> {
  const { status, eventType, enabled = true } = options;

  return useQuery({
    queryKey: ['reminders', { status, eventType }],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (eventType) params.append('eventType', eventType);

      const response = await fetch(
        `${API_BASE_URL}/tracking/reminders?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch reminders' }));
        throw new Error(error.error?.message || error.message || 'Failed to fetch reminders');
      }

      const result = await response.json();
      return result.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes (reminders should be fresh)
    gcTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Triggers automatic reminder generation for the user
 * @returns Mutation hook for triggering reminders
 */
export function useTriggerReminders(): UseMutationResult<
  RemindersResponse,
  Error,
  void
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/tracking/reminders/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to trigger reminders' }));
        throw new Error(error.error?.message || error.message || 'Failed to trigger reminders');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      // Invalidate reminders to show newly created ones
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });
}

/**
 * Acknowledges a reminder
 * @returns Mutation hook for acknowledging reminders
 */
export function useAcknowledgeReminder(): UseMutationResult<
  { reminder: ReminderEvent },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminderId: string) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/tracking/reminders/${reminderId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to acknowledge reminder' }));
        throw new Error(error.error?.message || error.message || 'Failed to acknowledge reminder');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      // Invalidate reminders to update UI
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });
}
