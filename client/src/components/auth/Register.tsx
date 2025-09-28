import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { isAuthenticated, register, isRegistering, registerError } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
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

    // Send registration data (excluding confirmPassword)
    register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
      password: formData.password
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-600">
            <span className="text-white text-2xl font-bold">Z</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join ZakApp to calculate and track your Zakat
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={formErrors.firstName}
                  label="First Name"
                />
              </div>
              <div className="flex-1">
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={formErrors.lastName}
                  label="Last Name"
                />
              </div>
            </div>

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
            />

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              label="Email Address"
            />

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              label="Password"
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              label="Confirm Password"
            />
          </div>

          {registerError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {registerError?.message || 'Registration failed. Please try again.'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isRegistering}
            loading={isRegistering}
            className="w-full"
          >
            Create account
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};