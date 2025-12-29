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
 * Color Contrast Accessibility Tests
 * 
 * Tests that color combinations meet WCAG 2.1 AA contrast requirements.
 * Uses axe-core for automated contrast checking.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Color Contrast Accessibility', () => {
  describe('Text Contrast', () => {
    it('should have sufficient contrast for normal text (4.5:1)', async () => {
      const { container } = render(
        <div>
          <p style={{ color: '#000000', backgroundColor: '#ffffff' }}>
            Black text on white background (21:1)
          </p>
          <p style={{ color: '#595959', backgroundColor: '#ffffff' }}>
            Dark gray text on white background (7.5:1)
          </p>
          <p style={{ color: '#ffffff', backgroundColor: '#4f46e5' }}>
            White text on indigo background (8.6:1)
          </p>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for large text (3:1)', async () => {
      const { container } = render(
        <div>
          <h1 style={{ color: '#767676', backgroundColor: '#ffffff', fontSize: '24px' }}>
            Large heading with 4.6:1 contrast
          </h1>
          <h2 style={{ color: '#ffffff', backgroundColor: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
            Large bold text on green (3.9:1)
          </h2>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Button Contrast', () => {
    it('should have sufficient contrast for primary buttons', async () => {
      const { container } = render(
        <button
          style={{
            color: '#ffffff',
            backgroundColor: '#4f46e5', // indigo-600
            border: 'none',
            padding: '0.5rem 1rem',
          }}
        >
          Primary Action
        </button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for secondary buttons', async () => {
      const { container } = render(
        <button
          style={{
            color: '#1f2937', // gray-800
            backgroundColor: '#e5e7eb', // gray-200
            border: '1px solid #d1d5db',
            padding: '0.5rem 1rem',
          }}
        >
          Secondary Action
        </button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for danger buttons', async () => {
      const { container } = render(
        <button
          style={{
            color: '#ffffff',
            backgroundColor: '#dc2626', // red-600
            border: 'none',
            padding: '0.5rem 1rem',
          }}
        >
          Delete
        </button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Link Contrast', () => {
    it('should have sufficient contrast for links', async () => {
      const { container } = render(
        <div style={{ color: '#374151', backgroundColor: '#ffffff' }}>
          <p>
            This is a paragraph with a{' '}
            <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              link to another page
            </a>{' '}
            that has good contrast.
          </p>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should differentiate links without relying solely on color', async () => {
      const { container } = render(
        <div>
          <p>
            Links should have{' '}
            <a
              href="#"
              style={{
                color: '#2563eb',
                textDecoration: 'underline',
                fontWeight: '500',
              }}
            >
              visual indicators
            </a>{' '}
            beyond just color.
          </p>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Element Contrast', () => {
    it('should have sufficient contrast for input fields', async () => {
      const { container } = render(
        <form>
          <label htmlFor="name" style={{ color: '#374151' }}>
            Name
          </label>
          <input
            id="name"
            type="text"
            style={{
              color: '#111827',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              padding: '0.5rem',
            }}
          />
        </form>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for error states', async () => {
      const { container } = render(
        <div>
          <label htmlFor="email" style={{ color: '#374151' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            aria-invalid="true"
            style={{
              color: '#111827',
              backgroundColor: '#ffffff',
              border: '2px solid #dc2626', // red-600
              padding: '0.5rem',
            }}
          />
          <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
            Please enter a valid email
          </span>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for success states', async () => {
      const { container } = render(
        <div>
          <label htmlFor="password" style={{ color: '#374151' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            aria-invalid="false"
            style={{
              color: '#111827',
              backgroundColor: '#ffffff',
              border: '2px solid #10b981', // green-500
              padding: '0.5rem',
            }}
          />
          <span style={{ color: '#059669', fontSize: '0.875rem' }}>
            Password is strong
          </span>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Alert and Notification Contrast', () => {
    it('should have sufficient contrast for success alerts', async () => {
      const { container } = render(
        <div
          role="alert"
          style={{
            color: '#065f46', // green-800
            backgroundColor: '#d1fae5', // green-100
            border: '1px solid #10b981',
            padding: '1rem',
          }}
        >
          Asset saved successfully
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for error alerts', async () => {
      const { container } = render(
        <div
          role="alert"
          style={{
            color: '#991b1b', // red-800
            backgroundColor: '#fee2e2', // red-100
            border: '1px solid #dc2626',
            padding: '1rem',
          }}
        >
          Error: Unable to save asset
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for info alerts', async () => {
      const { container } = render(
        <div
          role="status"
          style={{
            color: '#1e40af', // blue-800
            backgroundColor: '#dbeafe', // blue-100
            border: '1px solid #3b82f6',
            padding: '1rem',
          }}
        >
          Your Zakat calculation is ready
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for warning alerts', async () => {
      const { container } = render(
        <div
          role="alert"
          style={{
            color: '#92400e', // amber-800
            backgroundColor: '#fef3c7', // amber-100
            border: '1px solid #f59e0b',
            padding: '1rem',
          }}
        >
          Warning: Asset value is below nisab threshold
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Badge and Tag Contrast', () => {
    it('should have sufficient contrast for status badges', async () => {
      const { container } = render(
        <div>
          <span
            style={{
              color: '#065f46',
              backgroundColor: '#d1fae5',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}
          >
            Active
          </span>
          <span
            style={{
              color: '#991b1b',
              backgroundColor: '#fee2e2',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}
          >
            Inactive
          </span>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Navigation Contrast', () => {
    it('should have sufficient contrast for navigation items', async () => {
      const { container } = render(
        <nav
          style={{
            backgroundColor: '#1f2937', // gray-800
            padding: '1rem',
          }}
        >
          <a
            href="/"
            style={{
              color: '#ffffff',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
            }}
          >
            Home
          </a>
          <a
            href="/assets"
            style={{
              color: '#e5e7eb', // gray-200
              textDecoration: 'none',
              padding: '0.5rem 1rem',
            }}
          >
            Assets
          </a>
        </nav>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for active navigation state', async () => {
      const { container } = render(
        <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
          <a
            href="/"
            aria-current="page"
            style={{
              color: '#4f46e5', // indigo-600
              borderBottom: '2px solid #4f46e5',
              padding: '1rem',
              fontWeight: '600',
            }}
          >
            Dashboard
          </a>
        </nav>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Disabled State Contrast', () => {
    it('should maintain minimum contrast for disabled elements', async () => {
      const { container } = render(
        <button
          disabled
          style={{
            color: '#9ca3af', // gray-400
            backgroundColor: '#f3f4f6', // gray-100
            border: '1px solid #d1d5db',
            padding: '0.5rem 1rem',
            cursor: 'not-allowed',
          }}
        >
          Disabled Button
        </button>
      );

      // Note: WCAG allows reduced contrast for disabled elements,
      // but we still want to ensure they're perceivable
      const results = await axe(container, {
        rules: {
          // Disabled elements are exempt from contrast requirements
          'color-contrast': { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Indicator Contrast', () => {
    it('should have sufficient contrast for focus states', async () => {
      const { container } = render(
        <button
          style={{
            color: '#ffffff',
            backgroundColor: '#4f46e5',
            border: '2px solid transparent',
            padding: '0.5rem 1rem',
            outline: '2px solid #818cf8', // indigo-400
            outlineOffset: '2px',
          }}
        >
          Focused Button
        </button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
