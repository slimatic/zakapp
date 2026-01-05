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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '../common/Logo';

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
    if (!username || !password) return;
    await login(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl border-white/20">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <div className="animate-fade-in">
              <Logo className="h-16 w-16" />
            </div>
          </div>
          <CardTitle className="text-3xl font-heading font-bold text-center text-gray-900">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-gray-500 text-lg">
            Securely access your ZakApp vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                {error}
                {(error.includes('DB1') || error.includes('password') || error.includes('salt')) && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="w-full text-xs"
                      onClick={async () => {
                        if (window.confirm('This will delete the LOCAL database (sync mismatch). Are you sure?')) {
                          try {
                            const { forceResetDatabase } = await import('../../db');
                            await forceResetDatabase();
                            // Also clear auth tokens
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                            localStorage.removeItem('zakapp_session');
                            window.location.reload();
                          } catch (e) {
                            console.error(e);
                            alert('Failed to reset DB');
                          }
                        }
                      }}
                    >
                      Reset Local Data & Retry
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium leading-none text-gray-700">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                aria-required="true"
                className="focus:ring-primary-500 border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                aria-required="true"
                className="focus:ring-primary-500 border-gray-300"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-700 hover:bg-primary-800 text-white shadow-lg shadow-primary-700/20 transition-all hover:scale-[1.02]"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? 'Decrypting Vault...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-gray-500">
          <div className="flex gap-1 justify-center">
            <span>Don't have a vault?</span>
            <Link to="/register" className="text-primary-700 hover:text-primary-800 hover:underline font-bold">
              Create New Vault
            </Link>
          </div>

          <div className="text-xs text-primary-600/60 mt-4 flex items-center justify-center gap-1 font-medium bg-primary-50 px-3 py-1 rounded-full w-fit mx-auto">
            <ShieldCheck className="w-3 h-3" />
            <span>End-to-End Encrypted on your device</span>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 w-full flex flex-col items-center gap-2">
            <a href="https://rstlabs.io" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-300 hover:text-gray-400 transition-colors flex items-center justify-center gap-1">
              <span>Made with ❤️ by</span>
              <span className="font-semibold">RST Labs</span>
            </a>
            <div className="text-[10px] text-gray-300 font-mono">
              {__APP_VERSION__} ({__COMMIT_HASH__})
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};