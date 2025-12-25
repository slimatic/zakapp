import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-200/20 blur-3xl animate-pulse-subtle" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-secondary-200/20 blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 animate-fade-in shadow-2xl border-white/40">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 mb-4 transform rotate-3 hover:rotate-6 transition-transform">
            <span className="text-white text-3xl font-serif font-bold">Z</span>
          </div>
          <CardTitle className="text-2xl font-serif text-slate-900">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your <span className="text-primary-600 font-medium">ZakApp</span> vault
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit} aria-label="Login form">
            <div className="space-y-4">
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="Enter your username or email"
                label="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="email-input"
                error={error && !username ? 'Required' : undefined}
              />

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
                error={error && !password ? 'Required' : undefined}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 flex items-start space-x-3 text-sm text-red-800 animate-slide-up">
                <ShieldCheck className="h-5 w-5 text-red-500 shrink-0" />
                <span>{error || 'Login failed. Please check your credentials.'}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              isLoading={isLoading}
              className="w-full text-base py-6"
              data-testid="login-button"
            >
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 bg-slate-50/50 pt-6 rounded-b-xl">
          <div className="text-sm text-center w-full space-y-3">
            <Link
              to="/forgot-password"
              className="block font-medium text-primary-600 hover:text-primary-500 hover:underline transition-all"
            >
              Forgot your password?
            </Link>

            <div className="text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-slate-800 hover:text-primary-600 transition-colors"
                data-testid="register-link"
              >
                Create one now
              </Link>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};