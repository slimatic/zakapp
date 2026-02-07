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
                    className="px-3 py-1 text-sm bg-white border rounded shadow-sm hover:bg-gray-50 transition"
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
                            <span className="text-gray-600">Status</span>
                            <Badge variant={status.status === 'ok' ? 'default' : 'destructive'}>
                                {status.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                             <span className="text-gray-600">Version</span>
                             <span className="font-mono">{status.version}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                             <span className="text-gray-600">Uptime</span>
                             <span className="font-mono">{Math.floor(status.uptime)}s</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-gray-600">Server Time</span>
                             <span className="text-xs text-gray-500">{new Date(status.timestamp).toLocaleString()}</span>
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
                            <span className="text-gray-600">Connected</span>
                             <Badge variant={status.database.connected ? 'default' : 'destructive'}>
                                {status.database.connected ? 'YES' : 'NO'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Latency</span>
                            <span className={`font-mono ${status.database.latencyMs > 100 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {status.database.latencyMs}ms
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Schema Sync</span>
                             <Badge variant={status.database.schemaUpToDate ? 'default' : 'secondary'}>
                                {status.database.schemaUpToDate ? 'SYNCED' : 'OUTDATED'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Pending Migrations</span>
                            <span className="font-mono">{status.database.pendingMigrations}</span>
                        </div>
                    </CardContent>
                </Card>

                 {/* Memory */}
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Memory</CardTitle>
                        <CardDescription>Server resource usage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">RSS</span>
                            <span className="font-mono">{status.memory.rss} MB</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Heap Total</span>
                            <span className="font-mono">{status.memory.heapTotal} MB</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Heap Used</span>
                            <span className="font-mono">{status.memory.heapUsed} MB</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-600">External</span>
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
                            <span className="text-gray-600">Node Env</span>
                            <Badge variant="outline">{status.environment.NODE_ENV || 'N/A'}</Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Timezone</span>
                             <span className="font-mono text-sm">{status.environment.TZ || 'UTC'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-600">Port</span>
                             <span className="font-mono">{status.environment.PORT || '3001'}</span>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
