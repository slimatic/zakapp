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

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Logo } from '../components/common/Logo';
import { ShieldCheck, Clock, RefreshCw } from 'lucide-react';

/**
 * Maintenance Mode Page
 * 
 * Displays a beautiful, theme-consistent page when the application is in maintenance mode.
 * Follows ZakApp's Islamic fintech design aesthetic with trust signals and calming messaging.
 * 
 * Design Principles:
 * - Privacy-First: Reassures users that data remains encrypted and secure
 * - Islamic Aesthetic: Arabic greeting, Quranic verse, culturally appropriate messaging
 * - Trust Engineering: Security indicators, transparent communication
 * - Accessibility: WCAG 2.2 AA compliant with semantic HTML
 * - Glassmorphism: Consistent with existing Login/Register page design
 * 
 * @component
 */
export const MaintenancePage: React.FC = () => {
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 px-4 py-12">
            <Card className="w-full max-w-2xl glass-panel shadow-2xl">
                <CardHeader className="space-y-6 text-center">
                    {/* Logo with subtle pulse animation */}
                    <div className="flex justify-center">
                        <div className="animate-pulse">
                            <Logo className="h-20 w-20" />
                        </div>
                    </div>

                    {/* Islamic Greeting */}
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold text-emerald-700">
                            السلام عليكم
                        </h1>
                        <p className="text-sm text-slate-600">Assalamu Alaykum (Peace be upon you)</p>
                    </div>

                    <CardTitle className="text-4xl font-heading font-bold text-slate-900">
                        Scheduled Maintenance
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-8">
                    {/* Main Message */}
                    <div className="text-center space-y-4">
                        <p className="text-lg text-slate-700 leading-relaxed">
                            We're currently performing scheduled maintenance to enhance your ZakApp experience.
                        </p>
                        <p className="text-md text-slate-600">
                            Your vault remains secure and encrypted. We appreciate your patience as we work to serve you better.
                        </p>
                    </div>

                    {/* Status Indicators - Trust Signals */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-card p-4 text-center space-y-2">
                            <ShieldCheck className="h-8 w-8 mx-auto text-emerald-600" aria-hidden="true" />
                            <h3 className="font-semibold text-slate-900">Your Data is Safe</h3>
                            <p className="text-sm text-slate-600">Zero-knowledge encryption remains active</p>
                        </div>

                        <div className="glass-card p-4 text-center space-y-2">
                            <Clock className="h-8 w-8 mx-auto text-amber-600" aria-hidden="true" />
                            <h3 className="font-semibold text-slate-900">Brief Downtime</h3>
                            <p className="text-sm text-slate-600">We'll be back shortly, insha'Allah</p>
                        </div>

                        <div className="glass-card p-4 text-center space-y-2">
                            <RefreshCw className="h-8 w-8 mx-auto text-blue-600" aria-hidden="true" />
                            <h3 className="font-semibold text-slate-900">Improvements Coming</h3>
                            <p className="text-sm text-slate-600">Enhanced features and performance</p>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center space-y-4 pt-4">
                        <button
                            onClick={handleRefresh}
                            className="btn-primary inline-flex items-center gap-2"
                            aria-label="Refresh page to check if maintenance is complete"
                        >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            Check Status
                        </button>

                        <p className="text-sm text-slate-500">
                            Expected return: Check back in a few moments
                        </p>
                    </div>

                    {/* Footer Message - Quranic Verse for Patience */}
                    <div className="pt-6 border-t border-slate-200 text-center">
                        <p className="text-sm text-slate-600 italic leading-relaxed">
                            "And be patient, for indeed, Allah does not allow to be lost the reward of those who do good."
                            <br />
                            <span className="text-xs text-slate-500">— Quran 11:115</span>
                        </p>
                    </div>

                    {/* Accessibility: Screen reader announcement */}
                    <div className="sr-only" role="status" aria-live="polite">
                        ZakApp is currently undergoing scheduled maintenance. Your data remains secure.
                        Please refresh the page in a few moments to check if the service has resumed.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
