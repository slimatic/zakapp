import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EncryptionIssues from '../pages/admin/EncryptionIssues';
import { apiService } from '../services/api';

jest.mock('../services/api');

describe('Encryption Issues admin page', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    apiService.get = jest.fn().mockResolvedValue({ success: true, issues: [ { id: '1', targetType: 'payment', targetId: 'p1', status: 'OPEN', sampleData: 'abc', note: 'failed' } ] });
    apiService.post = jest.fn().mockImplementation((path: string) => {
      if (typeof path === 'string' && path.endsWith('/scan')) return Promise.resolve({ success: true, created: 1 });
      return Promise.resolve({ success: true });
    });
  });

  test('renders and lists issues', async () => {
    render(<EncryptionIssues />);
    expect(screen.getByText(/Encryption Issues/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/payment/i)).toBeInTheDocument());
  });

  test('can open actions modal and retry', async () => {
    render(<EncryptionIssues />);
    await waitFor(() => expect(screen.getByText(/Actions/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText('Actions'));
    await waitFor(() => expect(screen.getByPlaceholderText(/base64 previous key/i)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/base64 previous key/i), { target: { value: 'key' } });
    fireEvent.click(screen.getByText(/Retry with key/i));

    await waitFor(() => expect(apiService.post).toHaveBeenCalled());
  });
});
