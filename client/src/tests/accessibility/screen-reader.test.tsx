/**
 * Screen Reader Accessibility Tests
 * 
 * Tests that components provide proper semantic structure
 * and ARIA attributes for screen reader users.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Screen Reader Accessibility', () => {
  describe('Semantic HTML Structure', () => {
    it('should use semantic landmarks', async () => {
      const { container } = render(
        <div>
          <header>
            <h1>ZakApp</h1>
          </header>
          <nav aria-label="Main navigation">
            <a href="/">Home</a>
          </nav>
          <main>
            <h2>Dashboard</h2>
            <section aria-labelledby="assets-heading">
              <h3 id="assets-heading">Assets</h3>
            </section>
          </main>
          <aside aria-label="Help">
            <p>Need assistance?</p>
          </aside>
          <footer>
            <p>&copy; 2025 ZakApp</p>
          </footer>
        </div>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument(); // aside
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <main>
          <h1>Main Title</h1>
          <section>
            <h2>Section Title</h2>
            <article>
              <h3>Subsection</h3>
              <h4>Detail</h4>
            </article>
          </section>
        </main>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });
      const h4 = screen.getByRole('heading', { level: 4 });

      expect(h1).toHaveTextContent('Main Title');
      expect(h2).toHaveTextContent('Section Title');
      expect(h3).toHaveTextContent('Subsection');
      expect(h4).toHaveTextContent('Detail');
    });
  });

  describe('ARIA Labels and Descriptions', () => {
    it('should label interactive elements', async () => {
      const { container } = render(
        <div>
          <button aria-label="Delete asset">
            <span aria-hidden="true">×</span>
          </button>
          <button aria-label="Edit asset">
            <svg aria-hidden="true">
              <path d="M..." />
            </svg>
          </button>
        </div>
      );

      expect(screen.getByLabelText('Delete asset')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit asset')).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should describe complex interactions', async () => {
      const { container } = render(
        <button
          aria-label="Calculate Zakat"
          aria-describedby="calc-help"
        >
          Calculate
        </button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'calc-help');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should announce dynamic content changes', () => {
      render(
        <div>
          <div role="status" aria-live="polite" aria-atomic="true">
            Calculation complete
          </div>
          <div role="alert" aria-live="assertive">
            Error: Invalid amount
          </div>
        </div>
      );

      expect(screen.getByRole('status')).toHaveTextContent('Calculation complete');
      expect(screen.getByRole('alert')).toHaveTextContent('Error: Invalid amount');
    });
  });

  describe('Form Accessibility', () => {
    it('should associate labels with inputs', async () => {
      const { container } = render(
        <form>
          <label htmlFor="asset-name">Asset Name</label>
          <input id="asset-name" type="text" required />
          
          <label htmlFor="asset-value">Asset Value</label>
          <input id="asset-value" type="number" required />
        </form>
      );

      const nameInput = screen.getByLabelText('Asset Name');
      const valueInput = screen.getByLabelText('Asset Value');

      expect(nameInput).toBeRequired();
      expect(valueInput).toBeRequired();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should describe validation errors', async () => {
      const { container } = render(
        <form>
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            aria-invalid="true"
            aria-describedby="amount-error"
          />
          <span id="amount-error" role="alert">
            Amount must be positive
          </span>
        </form>
      );

      const input = screen.getByLabelText('Amount');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'amount-error');
      expect(screen.getByRole('alert')).toHaveTextContent('Amount must be positive');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should indicate required fields', async () => {
      const { container } = render(
        <form>
          <label htmlFor="required-field">
            Name <span aria-label="required">*</span>
          </label>
          <input id="required-field" required />
        </form>
      );

      const input = screen.getByLabelText(/name/i);
      expect(input).toBeRequired();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Image Accessibility', () => {
    it('should provide alt text for informative images', async () => {
      const { container } = render(
        <img
          src="/chart.png"
          alt="Bar chart showing Zakat calculation over 5 years"
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute(
        'alt',
        'Bar chart showing Zakat calculation over 5 years'
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should hide decorative images from screen readers', async () => {
      const { container } = render(
        <img src="/decoration.png" alt="" aria-hidden="true" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Table Accessibility', () => {
    it('should have proper table structure', async () => {
      const { container } = render(
        <table>
          <caption>Asset Summary</caption>
          <thead>
            <tr>
              <th scope="col">Asset</th>
              <th scope="col">Value</th>
              <th scope="col">Category</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Savings Account</th>
              <td>$10,000</td>
              <td>Cash</td>
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('caption')).toHaveTextContent('Asset Summary');
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(3);
      
      const rowHeader = screen.getByRole('rowheader');
      expect(rowHeader).toHaveTextContent('Savings Account');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Loading States', () => {
    it('should announce loading state', () => {
      render(
        <div role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading assets...</span>
          <div className="spinner" aria-hidden="true"></div>
        </div>
      );

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText('Loading assets...')).toBeInTheDocument();
    });

    it('should announce completion', () => {
      render(
        <div role="status" aria-live="polite" aria-busy="false">
          <span className="sr-only">Assets loaded successfully</span>
        </div>
      );

      expect(screen.getByText('Assets loaded successfully')).toBeInTheDocument();
    });
  });

  describe('Dialog/Modal Accessibility', () => {
    it('should have proper dialog markup', async () => {
      const { container } = render(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          <h2 id="dialog-title">Confirm Deletion</h2>
          <p id="dialog-description">
            Are you sure you want to delete this asset?
          </p>
          <button>Cancel</button>
          <button>Delete</button>
        </div>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('List Accessibility', () => {
    it('should use semantic list elements', async () => {
      const { container } = render(
        <nav aria-label="Asset categories">
          <ul>
            <li><a href="/cash">Cash</a></li>
            <li><a href="/gold">Gold</a></li>
            <li><a href="/investments">Investments</a></li>
          </ul>
        </nav>
      );

      expect(screen.getByRole('list')).toBeInTheDocument();
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Tooltip Accessibility', () => {
    it('should describe with tooltip content', () => {
      render(
        <button aria-describedby="tooltip-1">
          Help
          <span id="tooltip-1" role="tooltip">
            Click for more information
          </span>
        </button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'tooltip-1');
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Click for more information'
      );
    });
  });
});
