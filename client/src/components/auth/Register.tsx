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
import { AuthLayout } from './AuthLayout';

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

  const strengthRows: Array<[keyof typeof passwordStrength, string]> = [
    ['length', 'At least 8 characters'],
    ['uppercase', 'One uppercase letter (A-Z)'],
    ['lowercase', 'One lowercase letter (a-z)'],
    ['number', 'One number (0-9)'],
    ['special', 'One special character (!@#$%^&*)']
  ];

  return (
    <AuthLayout
      title="Create your vault"
      subtitle="Everything is encrypted on your device before it syncs."
      footer={
        <>
          Already have a vault?{' '}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          error={formErrors.username}
          label="Username"
        />

        <div className="grid grid-cols-2 gap-3">
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
            label="First name"
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
            label="Last name"
          />
        </div>

        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          data-testid="email-input"
          error={formErrors.email}
          label="Email address"
        />

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Choose a password"
          value={formData.password}
          onChange={handleChange}
          onFocus={() => setShowPasswordHints(true)}
          error={formErrors.password}
          label="Password"
        />

        {/* Live requirements — quiet list, not a shouting checklist */}
        {showPasswordHints && (
          <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-xs">
            <p className="mb-1.5 font-medium text-foreground">Password must include:</p>
            <ul className="space-y-1">
              {strengthRows.map(([key, text]) => {
                const met = passwordStrength[key];
                return (
                  <li
                    key={key}
                    className={`flex items-center gap-2 ${met ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    <span aria-hidden="true">{met ? '✓' : '○'}</span>
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>
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
          label="Confirm password"
        />

        {error && (
          <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm" role="alert">
            <p className="font-medium text-danger">
              {error || 'Registration failed. Please try again.'}
            </p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          isLoading={isLoading}
          data-testid="register-button"
          className="w-full"
        >
          Create vault
        </Button>
      </form>
    </AuthLayout>
  );
};
