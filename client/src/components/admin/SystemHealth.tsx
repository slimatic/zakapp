import React, { useState, useEffect } from 'react';
import { adminService, SystemStatus } from '../../services/adminService';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { Badge } from '../ui/Badge';

export const SystemHealth: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminService.getSystemStatus();
            if (res.success && res.data) {
                setStatus(res.data);
            } else {
                setError(new Error(res.error || 'Failed to load system status'));
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred while fetching system status'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    if (loading && !status) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    if (error) return <ErrorDisplay error={error} onRetry={loadStatus} />;
    if (!status) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">System Health</h2>
                <button 
                    onClick={loadStatus}
                    className="px-3 py-1 text-sm bg-card border rounded shadow-sm hover:bg-muted transition"
                >
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* General Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">General</CardTitle>
                        <CardDescription>Overall system status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={status.status === 'ok' ? 'default' : 'destructive'}>
                                {status.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                             <span className="text-muted-foreground">Version</span>
                             <span className="font-mono">{status.version}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                             <span className="text-muted-foreground">Uptime</span>
                             <span className="font-mono">{Math.floor(status.uptime)}s</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-muted-foreground">Server Time</span>
                             <span className="text-xs text-muted-foreground">{new Date(status.timestamp).toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Database */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Database</CardTitle>
                         <CardDescription>Connection and schema</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Connected</span>
                             <Badge variant={status.database.connected ? 'default' : 'destructive'}>
                                {status.database.connected ? 'YES' : 'NO'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Latency</span>
                            <span className={`font-mono ${status.database.latencyMs > 100 ? 'text-warn-strong' : 'text-secondary'}`}>
                                {status.database.latencyMs}ms
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Schema Sync</span>
                             <Badge variant={status.database.schemaUpToDate ? 'default' : 'secondary'}>
                                {status.database.schemaUpToDate ? 'SYNCED' : 'OUTDATED'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Pending Migrations</span>
                            <span className="font-mono">{status.database.pendingMigrations}</span>
                        </div>
                    </CardContent>
                </Card>

                 {/* Email delivery */}
                 {status.email && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Email Delivery</CardTitle>
                            <CardDescription>Verification and notification sending</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Configured</span>
                                <Badge variant={status.email.configured && !status.email.issue ? 'default' : 'destructive'}>
                                    {status.email.configured && !status.email.issue ? 'READY' : 'NOT READY'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Provider</span>
                                <span className="font-mono">{status.email.provider ?? 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">From</span>
                                <span className="font-mono text-xs">{status.email.from ?? 'not set'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Host</span>
                                <span className="font-mono text-xs">
                                    {status.email.host ? `${status.email.host}:${status.email.port}` : 'N/A'}
                                </span>
                            </div>
                            {status.email.issue && (
                                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                                    {status.email.issue}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                 {/* Accounts */}
                 {status.users && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Accounts</CardTitle>
                            <CardDescription>Verification state of registered users</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Total Users</span>
                                <span className="font-mono">{status.users.total}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Verified</span>
                                <span className="font-mono text-secondary">{status.users.verified}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Unverified</span>
                                <span className={`font-mono ${status.users.unverified > 0 ? 'text-warn-strong' : 'text-secondary'}`}>
                                    {status.users.unverified}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Awaiting Verification</span>
                                <span className="font-mono">{status.users.pendingVerificationTokens}</span>
                            </div>
                            {status.users.unverified > 0 && (
                                <p className="rounded-md border border-warn/30 bg-warn-soft p-2 text-sm text-warn-strong">
                                    {status.users.unverified} account{status.users.unverified === 1 ? '' : 's'} cannot
                                    sign in while email verification is required.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                 {/* Memory */}
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Memory</CardTitle>
                        <CardDescription>Server resource usage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">RSS</span>
                            <span className="font-mono">{status.memory.rss} MB</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Heap Total</span>
                            <span className="font-mono">{status.memory.heapTotal} MB</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Heap Used</span>
                            <span className="font-mono">{status.memory.heapUsed} MB</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">External</span>
                            <span className="font-mono">{status.memory.external} MB</span>
                        </div>
                    </CardContent>
                </Card>
                
                 {/* Environment */}
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Environment</CardTitle>
                        <CardDescription>Configuration</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Node Env</span>
                            <Badge variant="outline">{status.environment.NODE_ENV || 'N/A'}</Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Timezone</span>
                             <span className="font-mono text-sm">{status.environment.TZ || 'UTC'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Port</span>
                             <span className="font-mono">{status.environment.PORT || '3001'}</span>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
