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
            {/*
                overflow-x-auto alone was not enough. The strip is wider than a
                phone (four long labels, ~511px), and scrolling it to the active
                tab left the FIRST label cut in half - "verview" - because a
                scroll container's content starts flush at its edge. Scroll-padding
                gives the leading tab its own breathing room so a partially
                scrolled strip never renders a word trimmed mid-glyph.

                -mx-4 px-4 lets the strip bleed to the screen edges while the text
                stays inset, which is what reads as intentional rather than as a
                clipped box.
            */}
            <div className="-mx-4 overflow-x-auto scroll-px-4 border-b border-border px-4 sm:mx-0 sm:px-0">
                <nav className="-mb-px flex gap-2 sm:gap-8" aria-label="Tabs" role="tablist">
                    {([
                        ['overview', 'Overview'],
                        ['users', 'User Management'],
                        ['settings', 'System Settings'],
                        ['health', 'System Health'],
                    ] as const).map(([id, label]) => {
                        const selected = activeTab === id;
                        return (
                            <button
                                key={id}
                                role="tab"
                                aria-selected={selected}
                                onClick={() => setActiveTab(id)}
                                className={`
                                    whitespace-nowrap py-3.5 px-1 border-b-2 font-medium text-sm
                                    transition-colors
                                    ${selected
                                        ? 'border-secondary text-secondary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'}
                                `}
                            >
                                {label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="py-4">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="bg-accent text-secondary" />
                            <StatCard title="Active" value={stats?.activeUsers || 0} icon={UserCheck} color="bg-accent text-secondary" />
                            <StatCard title="Deactivated" value={stats?.dormantUsers || 0} icon={UserMinus} color="bg-warn-soft text-warn-strong" />
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
