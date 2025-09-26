import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { MethodologySelector } from '../MethodologySelector';

test('renders methodology selector with all methods', () => {
  const mockOnMethodSelect = vi.fn();
  
  render(
    <MethodologySelector 
      selectedMethod="standard"
      onMethodSelect={mockOnMethodSelect} 
    />
  );

  // Check that the component renders
  expect(screen.getByText('Select Calculation Method')).toBeInTheDocument();
  
  // Check that all major methods are displayed
  expect(screen.getAllByText('Standard Method (AAOIFI)')).toHaveLength(2); // One in card, one in selected text
  expect(screen.getByText('Hanafi School Method')).toBeInTheDocument();
  expect(screen.getByText("Shafi'i School Method")).toBeInTheDocument();
  expect(screen.getByText('Maliki School Method')).toBeInTheDocument();
  expect(screen.getByText('Hanbali School Method')).toBeInTheDocument();
  expect(screen.getByText('Custom Method')).toBeInTheDocument();

  // Check that the selected method shows as selected
  expect(screen.getByText('Selected')).toBeInTheDocument();
});

test('calls onMethodSelect when a method is clicked', () => {
  const mockOnMethodSelect = vi.fn();
  
  render(
    <MethodologySelector 
      selectedMethod="standard"
      onMethodSelect={mockOnMethodSelect} 
    />
  );

  // Click on Hanafi method card
  fireEvent.click(screen.getByText('Hanafi School Method'));
  
  expect(mockOnMethodSelect).toHaveBeenCalledWith('hanafi');
});

test('shows comparison when compare methods button is clicked', () => {
  const mockOnMethodSelect = vi.fn();
  
  render(
    <MethodologySelector 
      selectedMethod="standard"
      onMethodSelect={mockOnMethodSelect} 
    />
  );

  // Click on Compare Methods button
  fireEvent.click(screen.getByText('Compare Methods'));
  
  // Check that comparison section appears
  expect(screen.getByText('Method Comparison')).toBeInTheDocument();
  expect(screen.getByText(/Compare different zakat calculation methodologies to understand/)).toBeInTheDocument();
});

test('hides comparison when close button is clicked', () => {
  const mockOnMethodSelect = vi.fn();
  
  render(
    <MethodologySelector 
      selectedMethod="standard"
      onMethodSelect={mockOnMethodSelect} 
    />
  );

  // Open comparison
  fireEvent.click(screen.getByText('Compare Methods'));
  expect(screen.getByText('Method Comparison')).toBeInTheDocument();
  
  // Close comparison
  fireEvent.click(screen.getByText('Close'));
  expect(screen.queryByText('Method Comparison')).not.toBeInTheDocument();
});

test('displays method details in expandable sections', () => {
  const mockOnMethodSelect = vi.fn();
  
  render(
    <MethodologySelector 
      selectedMethod="standard"
      onMethodSelect={mockOnMethodSelect} 
    />
  );

  // Find and click the first "Learn more" summary
  const learnMoreButtons = screen.getAllByText('Learn more');
  fireEvent.click(learnMoreButtons[0]);
  
  // Check that detailed information appears (use getAllByText since multiple cards have the same text)
  expect(screen.getAllByText('Suitable for:')[0]).toBeInTheDocument();
  expect(screen.getAllByText('Key advantages:')[0]).toBeInTheDocument();
});