/**
 * Keyboard Navigation Accessibility Tests
 * 
 * Tests that all interactive elements are keyboard accessible
 * and follow proper focus management patterns.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock components for testing
const NavigationMock = () => (
  <nav aria-label="Main navigation">
    <a href="/">Home</a>
    <a href="/assets">Assets</a>
    <a href="/calculator">Calculator</a>
    <button>Settings</button>
  </nav>
);

const FormMock = () => (
  <form>
    <label htmlFor="name">Name</label>
    <input id="name" type="text" />
    <label htmlFor="amount">Amount</label>
    <input id="amount" type="number" />
    <button type="submit">Submit</button>
  </form>
);

const ModalMock = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">Modal Title</h2>
      <button onClick={onClose}>Close</button>
      <button>Action</button>
    </div>
  );
};

describe('Keyboard Navigation Accessibility', () => {
  describe('Navigation Component', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<NavigationMock />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should allow tab navigation through all links', async () => {
      const user = userEvent.setup();
      render(<NavigationMock />);
      
      const homeLink = screen.getByRole('link', { name: /home/i });
      const assetsLink = screen.getByRole('link', { name: /assets/i });
      const calculatorLink = screen.getByRole('link', { name: /calculator/i });
      const settingsButton = screen.getByRole('button', { name: /settings/i });

      // Tab through navigation
      await user.tab();
      expect(homeLink).toHaveFocus();
      
      await user.tab();
      expect(assetsLink).toHaveFocus();
      
      await user.tab();
      expect(calculatorLink).toHaveFocus();
      
      await user.tab();
      expect(settingsButton).toHaveFocus();
    });

    it('should allow shift+tab to navigate backwards', async () => {
      const user = userEvent.setup();
      render(<NavigationMock />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      settingsButton.focus();

      await user.tab({ shift: true });
      expect(screen.getByRole('link', { name: /calculator/i })).toHaveFocus();
    });
  });

  describe('Form Component', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<FormMock />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should tab through form fields in logical order', async () => {
      const user = userEvent.setup();
      render(<FormMock />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const amountInput = screen.getByLabelText(/amount/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await user.tab();
      expect(nameInput).toHaveFocus();
      
      await user.tab();
      expect(amountInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should submit form on Enter key', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn((e) => e.preventDefault());
      
      const { container } = render(
        <form onSubmit={handleSubmit}>
          <input type="text" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = container.querySelector('input');
      if (input) {
        input.focus();
        await user.keyboard('{Enter}');
        expect(handleSubmit).toHaveBeenCalled();
      }
    });
  });

  describe('Modal Component', () => {
    it('should have no axe violations', async () => {
      const onClose = jest.fn();
      const { container } = render(<ModalMock isOpen={true} onClose={onClose} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<ModalMock isOpen={true} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      const actionButton = screen.getByRole('button', { name: /action/i });

      // Focus should cycle between modal elements
      closeButton.focus();
      
      await user.tab();
      expect(actionButton).toHaveFocus();
      
      await user.tab();
      expect(closeButton).toHaveFocus();
    });

    it('should close on Escape key', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<ModalMock isOpen={true} onClose={onClose} />);
      
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Skip Link', () => {
    it('should allow skipping to main content', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <nav>
            <a href="/">Home</a>
          </nav>
          <main id="main-content" tabIndex={-1}>
            <h1>Main Content</h1>
          </main>
        </div>
      );

      const skipLink = screen.getByText(/skip to main content/i);
      const mainContent = container.querySelector('#main-content');

      skipLink.focus();
      await user.keyboard('{Enter}');
      
      expect(mainContent).toHaveFocus();
    });
  });

  describe('Dropdown Menu', () => {
    it('should navigate with arrow keys', async () => {
      const user = userEvent.setup();
      render(
        <div role="menu">
          <button role="menuitem">Option 1</button>
          <button role="menuitem">Option 2</button>
          <button role="menuitem">Option 3</button>
        </div>
      );

      const options = screen.getAllByRole('menuitem');
      
      options[0].focus();
      
      await user.keyboard('{ArrowDown}');
      expect(options[1]).toHaveFocus();
      
      await user.keyboard('{ArrowDown}');
      expect(options[2]).toHaveFocus();
      
      await user.keyboard('{ArrowUp}');
      expect(options[1]).toHaveFocus();
    });

    it('should select option with Enter or Space', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <div role="menu">
          <button role="menuitem" onClick={handleClick}>
            Option 1
          </button>
        </div>
      );

      const option = screen.getByRole('menuitem');
      option.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Tab Panel Navigation', () => {
    it('should navigate tabs with arrow keys', async () => {
      const user = userEvent.setup();
      render(
        <div role="tablist">
          <button role="tab" aria-selected={true} aria-controls="panel1">
            Tab 1
          </button>
          <button role="tab" aria-selected={false} aria-controls="panel2">
            Tab 2
          </button>
          <button role="tab" aria-selected={false} aria-controls="panel3">
            Tab 3
          </button>
        </div>
      );

      const tabs = screen.getAllByRole('tab');
      
      tabs[0].focus();
      
      await user.keyboard('{ArrowRight}');
      expect(tabs[1]).toHaveFocus();
      
      await user.keyboard('{ArrowRight}');
      expect(tabs[2]).toHaveFocus();
      
      await user.keyboard('{ArrowLeft}');
      expect(tabs[1]).toHaveFocus();
    });
  });
});
