import React from 'react';
import { Logo } from '../components/common/Logo';
import { Link } from 'react-router-dom';
import { GlossaryTerm } from '../components/common/GlossaryTerm';

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
            </div>

            <div className="prose prose-emerald mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3><GlossaryTerm term="local-first" /> Architecture</h3>
                <p>
                    ZakApp operates on a "<GlossaryTerm term="local-first" />" principle. This means:
                </p>
                <ul>
                    <li><strong>Your Data Stays With You:</strong> The details of your assets, liabilities, and calculated <GlossaryTerm term="zakat" /> (your provision or <em><GlossaryTerm term="rizq" /></em>) are stored securely on your device. They are never sent to our servers for processing.</li>
                    <li><strong>Offline Calculations:</strong> All complex <GlossaryTerm term="zakat" /> calculations happen right here in your browser. We don't need to see your numbers to help you calculate them.</li>
                    <li><strong>Zero Knowledge:</strong> We have zero knowledge of your specific financial data. We cannot see, sell, or share what we don't have.</li>
                </ul>

                <h3>Data Synchronization</h3>
                <p>
                    If you choose to enable synchronization across devices:
                </p>
                <ul>
                    <li>Your data is encrypted before it leaves your device.</li>
                    <li>It is stored in an encrypted format that only you can decrypt with your credentials.</li>
                </ul>

                <h3>Contact Us</h3>
                <p>
                    If you have any questions about our privacy practices, please contact us.
                </p>

                <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center">
                    <Link to="/dashboard" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};
