import React from 'react';
import { Link } from 'react-router-dom';
import { DonationCTA } from '../donation/DonationCTA';

export const Footer: React.FC = () => {
    return (
        <footer className="mt-auto border-t border-border bg-surface-2">
            {/* Top Section: CTA */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center">
                    <DonationCTA variant="footer" />
                </div>
            </div>

            {/* Middle Section: Links */}
            <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 text-sm text-muted-foreground">
                        <Link to="/privacy-policy" className="hover:text-secondary transition-colors">
                            Privacy Policy
                        </Link>
                        {/* Placeholder for future links
                        <Link to="/terms" className="hover:text-secondary transition-colors">
                            Terms of Service
                        </Link>
                        <Link to="/support" className="hover:text-secondary transition-colors">
                            Support
                        </Link> 
                        */}
                        <a
                            href="https://github.com/slimatic/zakapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-secondary transition-colors"
                        >
                            Open Source
                        </a>
                        <a
                            href="https://github.com/slimatic/zakapp/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-secondary transition-colors"
                        >
                            Report an Issue
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Copyright & Credits */}
            <div className="bg-surface-2 border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-tertiary">
                        <div className="flex items-center gap-1">
                            <span>© {new Date().getFullYear()} ZakApp.</span>
                            <span className="hidden md:inline">All rights reserved.</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <a
                                href="https://rstlabs.io"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                            >
                                <span>Made with</span>
                                <span
                                    className="text-danger/70 group-hover:text-danger animate-pulse"
                                    onAnimationEnd={(e) => e.stopPropagation()}
                                >❤️</span>
                                <span>by</span>
                                <span className="font-semibold text-muted-foreground group-hover:text-foreground">RST Labs</span>
                            </a>
                            <div className="w-px h-3 bg-border-strong hidden md:block"></div>
                            <a
                                href="https://github.com/slimatic/zakapp/releases"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono opacity-70 hover:opacity-100 hover:text-secondary transition-all"
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
