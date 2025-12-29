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

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Logo } from '../common/Logo';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const { isAuthenticated, register, isLoading, error } = useAuth();

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
    return checks;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Username is optional; if provided, validate constraints
    if (formData.username && formData.username.trim()) {
      if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        errors.username = 'Username can only contain letters, numbers, and underscores';
      }
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2 || formData.firstName.length > 50) {
      errors.firstName = 'First name must be 2-50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
      errors.firstName = 'First name can only contain letters and spaces';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2 || formData.lastName.length > 50) {
      errors.lastName = 'Last name must be 2-50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
      errors.lastName = 'Last name can only contain letters and spaces';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Send registration data with fields backend expects
    await register({
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    });

    // If registration failed, the error will be shown in the error banner
    // The backend validation errors are already handled by the error state
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/40">
        <div>
          <div className="mx-auto flex justify-center">
            <Logo className="h-16 w-16" />
          </div>
          <h1 className="mt-6 text-center text-4xl font-heading font-extrabold text-gray-900 tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-center text-lg text-gray-600">
            Join ZakApp to calculate and track your Zakat
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              id="username"
              name="username"
              type="text"
              required
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              error={formErrors.username}
              label="Username"
              className="bg-white/50 backdrop-blur-sm focus:ring-primary-500 border-gray-300"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                data-testid="first-name-input"
                error={formErrors.firstName}
                label="First Name"
                className="bg-white/50 backdrop-blur-sm focus:ring-primary-500 border-gray-300"
              />

              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                data-testid="last-name-input"
                error={formErrors.lastName}
                label="Last Name"
                className="bg-white/50 backdrop-blur-sm focus:ring-primary-500 border-gray-300"
              />
            </div>

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              data-testid="email-input"
              error={formErrors.email}
              label="Email Address"
              className="bg-white/50 backdrop-blur-sm focus:ring-primary-500 border-gray-300"
            />

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setShowPasswordHints(true)}
              error={formErrors.password}
              label="Password"
              className="bg-white/50 backdrop-blur-sm focus:ring-primary-500 border-gray-300"
            />

            {/* Password requirements with live validation */}
            {showPasswordHints && (
              <div className="text-xs space-y-1 mt-1 -mt-3 px-3 py-3 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-100 shadow-sm animate-fade-in">
                <p className="font-semibold text-blue-900 mb-2">Password must include:</p>
                <div className={`flex items-center gap-2 transition-colors duration-200 ${passwordStrength.length ? 'text-primary-700 font-medium' : 'text-gray-500'}`}>
                  <span>{passwordStrength.length ? '✓' : '○'}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 transition-colors duration-200 ${passwordStrength.uppercase ? 'text-primary-700 font-medium' : 'text-gray-500'}`}>
                  <span>{passwordStrength.uppercase ? '✓' : '○'}</span>
                  <span>One uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-2 transition-colors duration-200 ${passwordStrength.lowercase ? 'text-primary-700 font-medium' : 'text-gray-500'}`}>
                  <span>{passwordStrength.lowercase ? '✓' : '○'}</span>
                  <span>One lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-2 transition-colors duration-200 ${passwordStrength.number ? 'text-primary-700 font-medium' : 'text-gray-500'}`}>
                  <span>{passwordStrength.number ? '✓' : '○'}</span>
                  <span>One number (0-9)</span>
                </div>
                <div className={`flex items-center gap-2 transition-colors duration-200 ${passwordStrength.special ? 'text-primary-700 font-medium' : 'text-gray-500'}`}>
                  <span>{passwordStrength.special ? '✓' : '○'}</span>
                  <span>One special character (!@#$%^&*)</span>
                </div>
              </div>
            )}

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              data-testid="confirm-password-input"
              error={formErrors.confirmPassword}
              label="Confirm Password"
              className="bg-white/50 backdrop-blur-sm focus:ring-primary-500 border-gray-300"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error || 'Registration failed. Please try again.'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
            data-testid="register-button"
            className="w-full bg-primary-700 hover:bg-primary-800 text-white shadow-lg shadow-primary-700/20 transition-all hover:scale-[1.02]"
          >
            Create account
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-700">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-700 hover:text-primary-800 hover:underline transition-colors"
              >
                Sign in instead
              </Link>
            </p>

            <div className="mt-8 pt-6 border-t border-gray-100/50 flex flex-col items-center gap-2">
              <a href="https://rstlabs.io" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1 opacity-70 hover:opacity-100">
                <span>Made with ❤️ by</span>
                <span className="font-semibold">RST Labs</span>
              </a>
              <div className="text-[10px] text-gray-300 font-mono">
                {__APP_VERSION__} ({__COMMIT_HASH__})
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};