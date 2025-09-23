import React, { useState } from 'react';
import { LoginRequest, RegisterRequest } from '@zakapp/shared';
import { useAuth } from './AuthContext';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

interface AuthFormsProps {
  mode?: 'login' | 'register';
  onModeChange?: (mode: 'login' | 'register') => void;
}

export const AuthForms: React.FC<AuthFormsProps> = ({
  mode: initialMode = 'login',
  onModeChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, isLoading } = useAuth();

  const [loginData, setLoginData] = useState<LoginRequest>({
    username: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrors({});
    onModeChange?.(newMode);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'login') {
      if (!loginData.username.trim()) {
        newErrors.username = 'Username is required';
      }
      if (!loginData.password) {
        newErrors.password = 'Password is required';
      }
    } else {
      if (!registerData.username.trim()) {
        newErrors.username = 'Username is required';
      }
      if (!registerData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!registerData.password) {
        newErrors.password = 'Password is required';
      } else if (registerData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (registerData.password !== registerData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (mode === 'login') {
        await login(loginData);
      } else {
        await register(registerData);
      }
    } catch (error) {
      setErrors({ general: (error as Error).message });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (mode === 'login') {
      setLoginData(prev => ({ ...prev, [field]: value }));
    } else {
      setRegisterData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary-600 rounded-xl p-3">
              <span className="text-white text-2xl font-bold">Z</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-neutral-600">
            {mode === 'login'
              ? 'Sign in to access your Zakat calculations'
              : 'Join thousands managing their Zakat with confidence'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-neutral-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            <LogIn className="w-4 h-4 inline-block mr-2" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'register'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            <UserPlus className="w-4 h-4 inline-block mr-2" />
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={
                  mode === 'login' ? loginData.username : registerData.username
                }
                onChange={e => handleInputChange('username', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.username ? 'border-red-300' : 'border-neutral-300'
                }`}
                placeholder="Enter your username"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Email (Register only) */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={registerData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.email ? 'border-red-300' : 'border-neutral-300'
                  }`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={
                    mode === 'login'
                      ? loginData.password
                      : registerData.password
                  }
                  onChange={e => handleInputChange('password', e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.password ? 'border-red-300' : 'border-neutral-300'
                  }`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={e =>
                      handleInputChange('confirmPassword', e.target.value)
                    }
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.confirmPassword
                        ? 'border-red-300'
                        : 'border-neutral-300'
                    }`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-600">
          <p>
            By {mode === 'login' ? 'signing in' : 'creating an account'}, you
            agree to our{' '}
            <a
              href="#"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
