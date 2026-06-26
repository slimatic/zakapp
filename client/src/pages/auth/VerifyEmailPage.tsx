/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService as api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. Token is missing.');
            return;
        }

        const verify = async () => {
            try {
                await api.verifyEmail(token);
                setStatus('success');
                setMessage('Your email has been successfully verified!');
                toast.success('Email Verified: You can now log in to your account.');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Failed to verify email. The link may be expired or invalid.');
                toast.error(error.message || 'Verification Failed');
            }
        };

        verify();
    }, [token]);

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Email Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-6 transition-all duration-300">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                            <p className="text-muted-foreground">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500 scale-110 animate-in zoom-in duration-300" />
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-foreground">Verified!</h3>
                                <p className="text-muted-foreground">{message}</p>
                            </div>
                            <Button onClick={handleLogin} className="w-full mt-4">
                                Go to Login
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="h-16 w-16 text-destructive scale-110 animate-in zoom-in duration-300" />
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-foreground">Verification Failed</h3>
                                <p className="text-muted-foreground">{message}</p>
                            </div>
                            <Button onClick={handleLogin} variant="outline" className="w-full mt-4">
                                Back to Login
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
