import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { isAuthenticated, login, isLoading, error } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      return;
    }

    await login(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-600">
            <span className="text-white text-2xl font-bold">Z</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your ZakApp account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} aria-label="Login form">
          <div className="space-y-4" role="group" aria-labelledby="credentials-group">
            <h3 id="credentials-group" className="sr-only">Login Credentials</h3>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="Username or email"
              label="Username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              dataTestId="email-input"
              error={error && !username ? 'Username or email is required' : undefined}
              aria-required="true"
              aria-invalid={!!(error && !username)}
              aria-describedby={error && !username ? 'username-error' : undefined}
            />

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dataTestId="password-input"
              error={error && !password ? 'Password is required' : undefined}
              aria-required="true"
              aria-invalid={!!(error && !password)}
              aria-describedby={error && !password ? 'password-error' : undefined}
            />
          </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="polite">
            <div className="flex">
              <div className="flex-shrink-0" aria-hidden="true">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error || 'Login failed. Please check your credentials.'}
                </h3>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !username || !password}
          isLoading={isLoading}
          className="w-full"
          dataTestId="login-button"
        >
          Sign in
        </Button>

        <div className="text-center space-y-3">
            <p className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Forgot your password?
              </Link>
            </p>
            
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-green-600 hover:text-green-500"
                data-testid="register-link"
              >
                Create one now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};