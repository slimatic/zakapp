import React from 'react';
import { Logo } from '../components/common/Logo';
import { Link } from 'react-router-dom';
import { GlossaryTerm } from '../components/common/GlossaryTerm';
import { ExternalLink, Shield, Database, Lock, Eye } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <Link to="/" className="inline-block mb-8">
                    <Logo className="h-12 w-12 text-emerald-600" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    We believe your spiritual obligations are between you and your Creator.
                    That's why we built ZakApp with a privacy-first architecture.
                </p>
                <p className="text-sm text-gray-400 mt-2">Last Updated: January 2026</p>
            </div>

            <div className="prose prose-emerald mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                {/* Quick Summary Cards */}
                <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                        <Database className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Local-First</h4>
                            <p className="text-xs text-gray-600">Financial data stays on your device by default</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                        <Lock className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-gray-900 text-sm">AES-256 Encrypted</h4>
                            <p className="text-xs text-gray-600">Your data is encrypted with your password</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                        <Eye className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Open Source</h4>
                            <p className="text-xs text-gray-600">Audit our code on GitHub anytime</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                        <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-gray-900 text-sm">No Tracking</h4>
                            <p className="text-xs text-gray-600">No ads, no analytics, no data selling</p>
                        </div>
                    </div>
                </div>

                <h3><GlossaryTerm term="local-first" /> Architecture</h3>
                <p>
                    ZakApp operates on a "<GlossaryTerm term="local-first" />" principle. This means:
                </p>
                <ul>
                    <li><strong>Your Data Stays With You:</strong> The details of your assets, liabilities, and calculated <GlossaryTerm term="zakat" /> are stored securely on your device.</li>
                    <li><strong>Offline Calculations:</strong> All <GlossaryTerm term="zakat" /> calculations happen in your browser. We don't need to see your numbers.</li>
                    <li><strong>End-to-End Encryption:</strong> Your data is encrypted before syncing to our servers.</li>
                </ul>

                <h3>What We Store on Our Servers</h3>
                <p>When you create an account, we store:</p>
                <ul>
                    <li>Your email address (for login and password recovery)</li>
                    <li>Your encrypted profile (name, preferences)</li>
                    <li>Session data for security purposes</li>
                </ul>
                <p>
                    Your detailed financial data (assets, payments, calculations) remains <strong>local only</strong> unless you explicitly enable cloud sync.
                </p>

                <h3>Your Rights</h3>
                <ul>
                    <li><strong>Export:</strong> Download all your data anytime via Settings</li>
                    <li><strong>Delete:</strong> Remove local or synced data via Settings → Danger Zone</li>
                    <li><strong>Audit:</strong> Review our <a href="https://github.com/slimatic/zakapp" target="_blank" rel="noopener noreferrer">open source code</a></li>
                </ul>

                {/* Full Policy Link */}
                <div className="not-prose mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-gray-900">Complete Privacy Policy</h4>
                            <p className="text-sm text-gray-600">Read the full legal privacy policy with all details</p>
                        </div>
                        <a
                            href="https://zakapp.org/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            View Full Policy
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center">
                    <Link to="/dashboard" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};
