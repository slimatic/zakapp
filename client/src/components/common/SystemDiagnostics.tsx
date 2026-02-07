import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle2, XCircle, RefreshCw, Server, AlertTriangle } from 'lucide-react';
import { checkBrowserCapabilities, BrowserCheckResult } from '../../utils/browserCheck';
import { apiService } from '../../services/api';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';

export const SystemDiagnostics: React.FC = () => {
    const [browserChecks, setBrowserChecks] = useState<BrowserCheckResult[]>([]);
    const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [loading, setLoading] = useState(true);

    const runDiagnostics = async () => {
        setLoading(true);
        setServerStatus('checking');
        
        // Run browser checks
        const checks = await checkBrowserCapabilities();
        setBrowserChecks(checks);

        // Check Server Status
        try {
            // Simple ping to check connectivity. 
            // Using a lightweight endpoint or just checking if we can reach the API.
            // Since we don't have a specific ping endpoint, we'll assume if we can't reach a known endpoint (like methodologies), server might be down.
            // However, a simpler way is to check the health of the connection.
            const result = await apiService.get('health').catch(() => null) || await apiService.get('methodologies').catch(() => null);
            
            if (result) {
                setServerStatus('online');
            } else {
                setServerStatus('offline');
            }
        } catch (error) {
            setServerStatus('offline');
        }

        setLoading(false);
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    const hasCriticalFailures = browserChecks.some(check => check.required && !check.supported);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">System Diagnostics</h2>
                <Button onClick={runDiagnostics} disabled={loading} variant="outline" size="sm">
                    {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Run Diagnostics
                </Button>
            </div>

            {hasCriticalFailures && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Critical Issues Detected</AlertTitle>
                    <AlertDescription>
                        Your browser does not support some required features. The application may not function correctly.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Browser Capabilities</CardTitle>
                        <CardDescription>Checking if your device supports ZakApp features.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {browserChecks.map((check, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg bg-card">
                                    {check.supported ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-medium flex items-center gap-2">
                                            {check.feature}
                                            {check.required && <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Required</span>}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{check.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Server Connectivity</CardTitle>
                        <CardDescription>Checking connection to the ZakApp Cloud.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 p-4 border rounded-lg bg-card">
                                <div className={`p-2 rounded-full ${serverStatus === 'online' ? 'bg-green-100 text-green-600' : serverStatus === 'checking' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                    <Server className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-medium">API Server Status</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {serverStatus === 'checking' && 'Checking connection...'}
                                        {serverStatus === 'online' && 'Connected successfully.'}
                                        {serverStatus === 'offline' && 'Cannot connect to server.'}
                                    </p>
                                </div>
                            </div>

                            {serverStatus === 'offline' && (
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-sm font-semibold">Troubleshooting Steps:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                                        <li>Check your internet connection.</li>
                                        <li>If you are self-hosting, ensure the Docker container is running.</li>
                                        <li>Reload the page to try reconnecting.</li>
                                        <li>Check if your firewall is blocking connections to the API.</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
