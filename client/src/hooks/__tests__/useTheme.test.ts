/**
 * useTheme — dark-mode state hook (class strategy).
 *
 * Persists choice in localStorage ('zakapp-theme'), defaults to system
 * preference, applies/removes the `dark` class on document.documentElement.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

describe('useTheme', () => {
  let matchMediaListeners: Array<(e: { matches: boolean }) => void>;

  beforeEach(() => {
    matchMediaListeners = [];
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => matchMediaListeners.push(cb),
        removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
          matchMediaListeners = matchMediaListeners.filter((l) => l !== cb);
        },
      })),
    });
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light when no stored theme and system prefers light', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('defaults to dark when system prefers dark and nothing stored', () => {
    matchMediaListeners = [];
    // re-mock with matches: true
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => matchMediaListeners.push(cb),
        removeEventListener: vi.fn(),
      })),
    });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggleTheme flips the theme, applies the class, and persists the choice', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem('zakapp-theme')).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem('zakapp-theme')).toBe('light');
  });

  it('setTheme persists explicitly and stops following system changes', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(window.localStorage.getItem('zakapp-theme')).toBe('dark');

    // system flips to dark, but user choice wins
    act(() => {
      matchMediaListeners.forEach((cb) => cb({ matches: true }));
    });
    expect(result.current.theme).toBe('dark');

    // storage failure must not throw
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => result.current.setTheme('light')).not.toThrow();
  });
});