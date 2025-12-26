import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { ShieldCheck, Wifi, Smartphone, KeyRound } from 'lucide-react';

export const HelpSupport = () => {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                    <CardDescription>
                        Common questions about Sync, Security, and usage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">

                        {/* SYNC SECTION */}
                        <div className="border rounded-md p-4">
                            <details className="group">
                                <summary className="flex items-center gap-2 font-medium cursor-pointer list-none">
                                    <Wifi className="h-4 w-4 text-blue-500" />
                                    <span>Why is Sync stuck on "Syncing..."?</span>
                                    <span className="ml-auto transition-transform group-open:rotate-180">
                                        ▼
                                    </span>
                                </summary>
                                <div className="mt-3 text-sm text-muted-foreground pb-2">
                                    <p className="mb-2">
                                        The "Blue Loop" usually means your device cannot reach the database server.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Check if the server is running.</li>
                                        <li>If you are on a different WiFi network, check your firewall settings.</li>
                                        <li>Try reloading the page—the app will attempt to find the correct hostname automatically.</li>
                                    </ul>
                                </div>
                            </details>
                        </div>

                        {/* MOBILE SECTION */}
                        <div className="border rounded-md p-4">
                            <details className="group">
                                <summary className="flex items-center gap-2 font-medium cursor-pointer list-none">
                                    <Smartphone className="h-4 w-4 text-orange-500" />
                                    <span>Why doesn't it work on my phone?</span>
                                    <span className="ml-auto transition-transform group-open:rotate-180">
                                        ▼
                                    </span>
                                </summary>
                                <div className="mt-3 text-sm text-muted-foreground pb-2">
                                    <div className="bg-red-50 text-red-700 p-3 rounded mb-3 text-xs font-semibold border border-red-200">
                                        Security Requirement: Mobile browsers block encryption features on insecure (HTTP) connections.
                                    </div>
                                    <p>
                                        To use ZakApp on mobile, you must access it via <strong>HTTPS</strong> or <strong>localhost</strong>.
                                        Accessing via a LAN IP (e.g., 192.168.x.x) will cause a crash.
                                    </p>
                                </div>
                            </details>
                        </div>

                        {/* PASSWORD SECTION */}
                        <div className="border rounded-md p-4">
                            <details className="group">
                                <summary className="flex items-center gap-2 font-medium cursor-pointer list-none">
                                    <KeyRound className="h-4 w-4 text-green-500" />
                                    <span>I forgot my password. Can I reset it?</span>
                                    <span className="ml-auto transition-transform group-open:rotate-180">
                                        ▼
                                    </span>
                                </summary>
                                <div className="mt-3 text-sm text-muted-foreground pb-2">
                                    <p className="font-semibold text-red-500 mb-1">No.</p>
                                    <p>
                                        ZakApp is a <strong>Zero-Knowledge</strong> platform. Your password IS your encryption key.
                                        We do not store it, so we cannot reset it. If you lose your password, your data is permanently locked.
                                    </p>
                                </div>
                            </details>
                        </div>

                        {/* DATA SECTION */}
                        <div className="border rounded-md p-4">
                            <details className="group">
                                <summary className="flex items-center gap-2 font-medium cursor-pointer list-none">
                                    <ShieldCheck className="h-4 w-4 text-purple-500" />
                                    <span>Is my financial data sent to the cloud?</span>
                                    <span className="ml-auto transition-transform group-open:rotate-180">
                                        ▼
                                    </span>
                                </summary>
                                <div className="mt-3 text-sm text-muted-foreground pb-2">
                                    <p>
                                        Only if you use Sync. Even then, the server only stores <strong>encrypted blobs</strong>.
                                        It cannot read your account balances, gold holdings, or net worth.
                                        Everything is decrypted locally on your device.
                                    </p>
                                </div>
                            </details>
                        </div>

                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Need more help?</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Check out our official documentation on GitHub or open an issue if you find a bug.
                    </p>
                    <a
                        href="https://github.com/zakapp/zakapp"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-block text-primary hover:underline"
                    >
                        Visit GitHub Repository &rarr;
                    </a>
                </CardContent>
            </Card>
        </div>
    );
};
