import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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
              data-testid="email-input"
              error={formErrors.email}
              label="Email Address"
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
            />
            
            {/* Password requirements with live validation */}
            {showPasswordHints && (
              <div className="text-xs space-y-1 mt-1 -mt-3 px-1 py-2 bg-blue-50 rounded-md border border-blue-200">
                <p className="font-semibold text-blue-900 mb-1">Password must include:</p>
                <div className={`flex items-center gap-1 ${passwordStrength.length ? 'text-green-600' : 'text-gray-600'}`}>
                  <span>{passwordStrength.length ? '✓' : '○'}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-600'}`}>
                  <span>{passwordStrength.uppercase ? '✓' : '○'}</span>
                  <span>One uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-600'}`}>
                  <span>{passwordStrength.lowercase ? '✓' : '○'}</span>
                  <span>One lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordStrength.number ? 'text-green-600' : 'text-gray-600'}`}>
                  <span>{passwordStrength.number ? '✓' : '○'}</span>
                  <span>One number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordStrength.special ? 'text-green-600' : 'text-gray-600'}`}>
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
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
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