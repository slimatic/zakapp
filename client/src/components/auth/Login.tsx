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

import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from './AuthLayout';

/** Error substrings that mean local encrypted storage is unusable. */
const LOCAL_STORAGE_ERRORS = [
  'vault',
  'local data',
  'encryption',
  'site data',
  'DB1',
  'DB8',
  'password',
  'salt'
];

export const Login: React.FC = () => {
  const { t } = useTranslation('common');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isAuthenticated, login, isLoading, error, errorCode } = useAuth();
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [resendMessage, setResendMessage] = useState<string>('');

  // Reset the resend affordance whenever a new login attempt is made.
  useEffect(() => {
    setResendState('idle');
    setResendMessage('');
  }, [error]);

  const handleResend = async () => {
    setResendState('sending');
    setResendMessage('');
    const result = await apiService.resendVerificationEmail(username);
    if (result.success) {
      setResendState('sent');
      setResendMessage(result.message || 'Verification email sent.');
    } else {
      setResendState('failed');
      setResendMessage(result.message || 'Could not send the verification email.');
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    await login(username, password);
  };

  // Recovery steps show for the same error set as before the redesign; the
  // list is unchanged so no auth-path behaviour shifts with the styling.
  const showRecoverySteps =
    !!error && LOCAL_STORAGE_ERRORS.some((frag) => error.includes(frag));

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.newToApp')}{' '}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline underline-offset-2"
          >
            {t('auth.createVault')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorCode === 'EMAIL_NOT_VERIFIED' && (
          <div className="rounded-md border border-warn/30 bg-warn-soft p-3 text-sm">
            <p className="text-warn-strong">
              Your email isn&apos;t verified yet, so sign-in is blocked.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === 'sending' || resendState === 'sent'}
              className="mt-1.5 font-medium text-warn-strong underline underline-offset-2 disabled:opacity-60"
            >
              {resendState === 'sending'
                ? 'Sending...'
                : resendState === 'sent'
                  ? 'Verification email sent'
                  : 'Resend verification email'}
            </button>
            {resendMessage && (
              <p className="mt-1 text-warn-strong" role="status">{resendMessage}</p>
            )}
          </div>
        )}

        {error && (
          <div
            className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
            role="alert"
          >
            {error === 'Failed to fetch'
              ? 'Unable to reach the server. Check your connection and try again.'
              : error}

            {showRecoverySteps && (
              <div className="mt-3 rounded border border-danger/20 bg-card/50 p-3 text-xs">
                <p className="mb-1 font-medium">{t('auth.toFixThis')}</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>{t('auth.fixOpenSettings')}</li>
                  <li>{t('auth.fixFind')} <strong>{t('auth.fixClearBrowsingData')}</strong></li>
                  <li>{t('auth.fixClear')} <strong>{t('auth.fixCookies')}</strong></li>
                  <li>{t('auth.fixReload')}</li>
                </ol>
                <p className="mt-2 italic opacity-80">
                  {t('auth.cloudDataSafe')}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-medium text-foreground">
            {t('auth.username')}
          </label>
          <Input
            id="username"
            type="text"
            placeholder={t('auth.usernamePlaceholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => setUsername((prev) => prev.trim())}
            disabled={isLoading}
            autoComplete="username"
            aria-required="true"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            {t('auth.password')}
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              aria-required="true"
              className="pe-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || !username || !password}
        >
          {isLoading ? 'Decrypting vault...' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
};
