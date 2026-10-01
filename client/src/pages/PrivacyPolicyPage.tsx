import React from 'react';
import { Link } from 'react-router-dom';
import { GlossaryTerm } from '../components/common/GlossaryTerm';
import { ExternalLink, Shield, Database, Lock, Eye } from 'lucide-react';

/**
 * Privacy policy.
 *
 * Rendered inside the app shell (see App.tsx - every other in-app route is, and
 * this one used to be the exception). It previously drew its own centred Logo
 * and no chrome, which made a page you reach from the app footer look like a
 * detached document. No page-level container here either: the shell already
 * provides max-width and padding, so adding them double-padded the page.
 *
 * Also dropped `prose prose-emerald`, which hardcoded `--tw-prose-links:
 * #059669` (Emerald 600) - the one colour on the page that was not a theme
 * token, so it stayed green in Qamar and matched nothing else in the app.
 *
 * Copy note: claims here describe the shipped architecture (local-first, AES-256
 * with your password, no analytics). Change them only alongside a code change
 * that makes them true.
 */

const SUMMARY = [
    { icon: Database, title: 'Local-first', body: 'Financial data stays on your device by default' },
    { icon: Lock, title: 'AES-256 encrypted', body: 'Your data is encrypted with your password' },
    { icon: Eye, title: 'Open source', body: 'Audit our code on GitHub anytime' },
    { icon: Shield, title: 'No tracking', body: 'No ads, no analytics, no data selling' },
];

export const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Page header - same shape as the other in-app pages */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    We believe your spiritual obligations are between you and your Creator. That's why
                    we built ZakApp with a privacy-first architecture.
                </p>
                <p className="mt-3 text-sm text-tertiary">Last updated January 2026</p>
            </div>

            {/* Summary: a list, not four equal cards. The old grid of identical
                tinted boxes is the most generic dashboard pattern there is, and
                it buried a short list of four facts in a lot of chrome. */}
            <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground">At a glance</h2>
                <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
                    {SUMMARY.map(({ icon: Icon, title, body }) => (
                        <div key={title} className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                            <div>
                                <dt className="text-sm font-semibold text-foreground">{title}</dt>
                                <dd className="text-sm text-muted-foreground">{body}</dd>
                            </div>
                        </div>
                    ))}
                </dl>
            </section>

            <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground">
                    <GlossaryTerm term="local-first" /> architecture
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-foreground/80">
                    <li>
                        <strong className="font-semibold text-foreground">Your data stays with you.</strong>{' '}
                        The details of your assets, liabilities, and calculated{' '}
                        <GlossaryTerm term="zakat" /> are stored securely on your device.
                    </li>
                    <li>
                        <strong className="font-semibold text-foreground">Offline calculations.</strong>{' '}
                        All <GlossaryTerm term="zakat" /> calculations happen in your browser. We don't
                        need to see your numbers.
                    </li>
                    <li>
                        <strong className="font-semibold text-foreground">End-to-end encryption.</strong>{' '}
                        Your data is encrypted before syncing to our servers.
                    </li>
                </ul>
            </section>

            <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground">What we store on our servers</h2>
                <p className="mt-4 text-sm text-foreground/80">When you create an account, we store:</p>
                <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                    <li>Your email address, for login and password recovery</li>
                    <li>Your encrypted profile (name, preferences)</li>
                    <li>Session data for security purposes</li>
                </ul>
                <p className="mt-4 text-sm text-foreground/80">
                    Your detailed financial data — assets, payments, calculations — remains{' '}
                    <strong className="font-semibold text-foreground">local only</strong> unless you
                    explicitly enable cloud sync.
                </p>
            </section>

            <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
                <ul className="mt-4 space-y-3 text-sm text-foreground/80">
                    <li>
                        <strong className="font-semibold text-foreground">Export.</strong> Download all
                        your data anytime via Settings.
                    </li>
                    <li>
                        <strong className="font-semibold text-foreground">Delete.</strong> Remove local
                        or synced data via Settings → Danger Zone.
                    </li>
                    <li>
                        <strong className="font-semibold text-foreground">Audit.</strong> Review our{' '}
                        <a
                            href="https://github.com/slimatic/zakapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-secondary underline-offset-2 hover:underline"
                        >
                            open source code
                        </a>
                        .
                    </li>
                </ul>

                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        The full legal policy has the complete detail.
                    </p>
                    <a
                        href="https://zakapp.org/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                    >
                        Read the full policy
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                </div>
            </section>

            <p className="pb-2 text-sm text-muted-foreground">
                Questions about this policy?{' '}
                <Link to="/help" className="font-medium text-secondary hover:underline">
                    Visit help
                </Link>
                .
            </p>
        </div>
    );
};
