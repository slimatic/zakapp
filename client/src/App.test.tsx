import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page', () => {
  render(<App />);
  const welcomeText = screen.getByText(/Welcome back/i);
  expect(welcomeText).toBeInTheDocument();
});

test('renders ZakApp branding', () => {
  render(<App />);
  const brandElement = screen.getByText('Z');
  expect(brandElement).toBeInTheDocument();
});

test('renders sign in form', () => {
  render(<App />);
  const signInButton = screen.getByRole('button', { name: /sign in/i });
  expect(signInButton).toBeInTheDocument();
});
