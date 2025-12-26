import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
                    <Accordion type="single" collapsible className="w-full">

                        {/* SYNC SECTION */}
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="flex gap-2">
                                <Wifi className="h-4 w-4 text-blue-500" />
                                Why is Sync stuck on "Syncing..."?
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                <p className="mb-2">
                                    The "Blue Loop" usually means your device cannot reach the database server.
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Check if the server is running.</li>
                                    <li>If you are on a different WiFi network, check your firewall settings.</li>
                                    <li>Try reloading the page—the app will attempt to find the correct hostname automatically.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger className="flex gap-2">
                                <Smartphone className="h-4 w-4 text-orange-500" />
                                Why doesn't it work on my phone?
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                <Alert variant="destructive" className="my-2">
                                    <AlertTitle>Security Requirement</AlertTitle>
                                    <AlertDescription>
                                        Mobile browsers block encryption features on insecure (HTTP) connections.
                                    </AlertDescription>
                                </Alert>
                                <p>
                                    To use ZakApp on mobile, you must access it via <strong>HTTPS</strong> or <strong>localhost</strong>.
                                    Accessing via a LAN IP (e.g., 192.168.x.x) will cause a crash.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger className="flex gap-2">
                                <KeyRound className="h-4 w-4 text-green-500" />
                                I forgot my password. Can I reset it?
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                <p className="font-semibold text-red-500">No.</p>
                                <p>
                                    ZakApp is a <strong>Zero-Knowledge</strong> platform. Your password IS your encryption key.
                                    We do not store it, so we cannot reset it. If you lose your password, your data is permanently locked.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4">
                            <AccordionTrigger className="flex gap-2">
                                <ShieldCheck className="h-4 w-4 text-purple-500" />
                                Is my financial data sent to the cloud?
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                <p>
                                    Only if you use Sync. Even then, the server only stores <strong>encrypted blobs</strong>.
                                    It cannot read your account balances, gold holdings, or net worth.
                                    Everything is decrypted locally on your device.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
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
