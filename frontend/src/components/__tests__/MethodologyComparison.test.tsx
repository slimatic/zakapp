import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { MethodologyComparison } from '../MethodologyComparison';

test('renders methodology comparison with all sections', () => {
  const mockOnClose = vi.fn();
  
  render(
    <MethodologyComparison onClose={mockOnClose} />
  );

  // Check that the component renders
  expect(screen.getByText('Methodology Comparison')).toBeInTheDocument();
  expect(screen.getByText(/Compare different zakat calculation methodologies/)).toBeInTheDocument();
  
  // Check that all major sections are displayed
  expect(screen.getByText('Nisab Calculation')).toBeInTheDocument();
  expect(screen.getByText('Business Asset Treatment')).toBeInTheDocument();
  expect(screen.getByText('Debt Deduction')).toBeInTheDocument();
  expect(screen.getByText('Scholarly Foundation')).toBeInTheDocument();
  expect(screen.getByText('Regional Usage')).toBeInTheDocument();
  expect(screen.getByText('Best Suited For')).toBeInTheDocument();
  
  // Check that all four methodology names appear
  expect(screen.getAllByText('Standard Method (AAOIFI)').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Hanafi School Method').length).toBeGreaterThan(0);
  expect(screen.getAllByText("Shafi'i School Method").length).toBeGreaterThan(0);
  expect(screen.getAllByText('Custom Method').length).toBeGreaterThan(0);
  
  // Check that the help section appears
  expect(screen.getByText('Need Help Choosing?')).toBeInTheDocument();
});

test('calls onClose when close button is clicked', () => {
  const mockOnClose = vi.fn();
  
  render(
    <MethodologyComparison onClose={mockOnClose} />
  );

  // Click on Close button
  fireEvent.click(screen.getByText('Close'));
  
  expect(mockOnClose).toHaveBeenCalled();
});

test('displays methodology comparison details', () => {
  const mockOnClose = vi.fn();
  
  render(
    <MethodologyComparison onClose={mockOnClose} />
  );
  
  // Check that specific comparison details appear
  expect(screen.getAllByText('Lower of gold/silver').length).toBeGreaterThan(0);
  expect(screen.getByText('Silver-based')).toBeInTheDocument();
  expect(screen.getAllByText('User configurable').length).toBeGreaterThan(0);
  
  // Check that badges and regions appear
  expect(screen.getByText('Popular')).toBeInTheDocument();
});