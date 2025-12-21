// Avoid importing React at module scope to prevent accidental references inside jest.mock factories
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetFormPage } from './AssetFormPage';

// Mock the API hooks
jest.mock('../../services/apiHooks', () => ({
  useCreateAsset: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null
  }),
  useUpdateAsset: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null
  })
}));

// Mock UI components
jest.mock('../ui', () => ({
  Button: ({ children, isLoading, disabled, ...props }: any) => {
    const React = require('react');
    return React.createElement('button', { disabled: disabled || isLoading, ...props }, children);
  },
  Input: (props: any) => {
    const React = require('react');
    return React.createElement('input', props);
  }
}));

const TestWrapper = ({ children }: { children: any }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  const React = require('react');
  return React.createElement(QueryClientProvider, { client: queryClient }, React.createElement(BrowserRouter, null, children));
};

describe('AssetFormPage', () => {
  test('renders asset form with navigation handlers', () => {
    render(
      <TestWrapper>
        <AssetFormPage />
      </TestWrapper>
    );

    // Check that the form title is rendered
    expect(screen.getByText('Add New Asset')).toBeInTheDocument();
    
    // Check that form fields are present
    expect(screen.getByLabelText(/Asset Name/i)).toBeInTheDocument();
    expect(screen.getByText('Add Asset')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});