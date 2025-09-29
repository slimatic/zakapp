import React from 'react';
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
  Button: ({ children, isLoading, disabled, ...props }: any) => (
    <button disabled={disabled || isLoading} {...props}>
      {children}
    </button>
  ),
  Input: (props: any) => <input {...props} />
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
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