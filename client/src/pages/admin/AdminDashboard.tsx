import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserMinus, HardDrive } from 'lucide-react';
import { adminService, AdminStats } from '../../services/adminService';
import { PageLoadingFallback } from '../../components/common/LoadingFallback';
import { ErrorDisplay } from '../../components/common/ErrorDisplay';
import { UserManagement } from '../../components/admin/UserManagement';
import { SystemSettings } from '../../components/admin/SystemSettings';
import { SystemHealth } from '../../components/admin/SystemHealth';
import { logger } from '../../utils/logger';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings' | 'health'>('overview');

    const loadStats = async () => {
        setLoadingStats(true);
        setError(null);
        try {
            const statsRes = await adminService.getStats();
            if (statsRes.success) {
                // The declared contract is ApiResponse<{ stats: AdminStats }>, so the
                // payload lives at data.stats. The previous code assigned
                // `(statsRes as any).stats || statsRes.data?.stats` and, when that
                // resolved to undefined, left `stats` null — the cards below then
                // render `|| 0`, showing a confident "Total Users: 0". A missing
                // payload now surfaces the retry UI instead of a false empty system.
                const resolved = statsRes.data?.stats;
                if (!resolved) {
                    setError('Dashboard stats response did not contain a stats payload');
                } else {
                    setStats(resolved);
                }
            } else {
                setError(statsRes.error || 'Failed to load dashboard stats');
            }
        } catch (err) {
            setError('Failed to load dashboard stats');
            logger.error('Failed to load admin dashboard stats', err);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (loadingStats && !stats) return <PageLoadingFallback />;
    if (error) return <ErrorDisplay error={error} onRetry={loadStats} />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary">
                        Admin Dashboard
                    </h1>
                    <div className="text-sm text-muted-foreground mt-1">
                        System Overview & Configuration
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-border overflow-x-auto">
                {/*
                    overflow-x-auto is load-bearing, not decoration: four tabs with
                    `whitespace-nowrap` and `space-x-8` measure ~511px, which is wider
                    than a 390px phone. Without it the strip pushed the whole document
                    to 527px, so every admin page scrolled sideways on a phone. The
                    strip scrolls within itself instead.
                */}
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'overview'
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'}
                        `}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'users'
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'}
                        `}
                    >
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'settings'
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'}
                        `}
                    >
                        System Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('health')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'health'
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'}
                        `}
                    >
                        System Health
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="py-4">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="bg-accent text-secondary" />
                            <StatCard title="Active Users (30d)" value={stats?.activeUsers || 0} icon={UserCheck} color="bg-accent text-secondary" />
                            <StatCard title="Dormant Users" value={stats?.dormantUsers || 0} icon={UserMinus} color="bg-warn-soft text-warn-strong" />
                            <StatCard title="Storage Used" value={stats?.storageUsed || 'N/A'} icon={HardDrive} color="bg-accent text-secondary" />
                        </div>

                        {/* Quick Actions or Recent Activity could go here */}
                        <div className="bg-accent border border-border rounded-xl p-6">
                            <h3 className="text-secondary font-medium mb-2">Welcome, Administrator</h3>
                            <p className="text-secondary text-sm">
                                Select "User Management" to verify users or adjust limits. Use "System Settings" to configure SMTP/Resend for email delivery.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <UserManagement />
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <SystemSettings />
                    </div>
                )}

                {activeTab === 'health' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <SystemHealth />
                    </div>
                )}
            </div>
        </div >
    );
};

/**
 * `icon` is a component, not a string: these were emoji, which render
 * inconsistently across platforms and read aloud as words to a screen reader. SVG icons are decorative here - the label carries the meaning - so they
 * are marked aria-hidden.
 *
 * The title wraps rather than truncating, and min-w-0 lets it: at 390px a
 * two-column grid gives each card ~170px, and "Active Users (30d)" does not fit
 * on one line.
 */
const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>, color: string }) => (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-border flex items-start justify-between gap-3 hover:shadow-md transition-shadow min-w-0">
        <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-foreground">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg shrink-0 ${color}`}>
            <Icon className="h-5 w-5" aria-hidden={true} />
        </div>
    </div>
);
