import React from 'react';
import { Link } from 'react-router-dom';
import { DonationCTA } from '../donation/DonationCTA';

export const Footer: React.FC = () => {
    return (
        <footer className="mt-auto border-t border-gray-100 bg-gray-50">
            {/* Top Section: CTA */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center">
                    <DonationCTA variant="footer" />
                </div>
            </div>

            {/* Middle Section: Links */}
            <div className="border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 text-sm text-gray-500">
                        <Link to="/privacy-policy" className="hover:text-emerald-600 transition-colors">
                            Privacy Policy
                        </Link>
                        {/* Placeholder for future links
                        <Link to="/terms" className="hover:text-emerald-600 transition-colors">
                            Terms of Service
                        </Link>
                        <Link to="/support" className="hover:text-emerald-600 transition-colors">
                            Support
                        </Link> 
                        */}
                        <a
                            href="https://github.com/slimatic/zakapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-emerald-600 transition-colors"
                        >
                            Open Source
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Copyright & Credits */}
            <div className="bg-gray-100 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <span>© {new Date().getFullYear()} ZakApp.</span>
                            <span className="hidden md:inline">All rights reserved.</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <a
                                href="https://rstlabs.io"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 hover:text-gray-600 transition-colors group"
                            >
                                <span>Made with</span>
                                <span
                                    className="text-red-400 group-hover:text-red-500 animate-pulse"
                                    onAnimationEnd={(e) => e.stopPropagation()}
                                >❤️</span>
                                <span>by</span>
                                <span className="font-semibold text-gray-500 group-hover:text-gray-700">RST Labs</span>
                            </a>
                            <div className="w-px h-3 bg-gray-300 hidden md:block"></div>
                            <a
                                href="https://github.com/slimatic/zakapp/releases"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono opacity-70 hover:opacity-100 hover:text-emerald-600 transition-all"
                                title="Build Version"
                            >
                                v{__APP_VERSION__} ({__COMMIT_HASH__})
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
