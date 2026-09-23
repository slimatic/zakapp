import React from 'react';
import { useDonations } from '../../hooks/useDonations';

export const DonationCTA: React.FC<{ className?: string, variant?: 'sidebar' | 'footer' | 'minimal' }> = ({ className = '', variant = 'minimal' }) => {
    const { isEnabled, donationUrl } = useDonations();

    if (!isEnabled) return null;

    if (variant === 'footer') {
        return (
            <a
                href={donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 text-xs text-warn-strong hover:text-warn-strong/80 transition-colors ${className}`}
            >
                <span>☕</span>
                <span>Sustain ZakApp</span>
            </a>
        );
    }

    return (
        <a
            href={donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-warn-soft hover:text-warn-strong transition-colors ${className}`}
        >
            <span>☕</span>
            <span>Sustain this Project</span>
        </a>
    );
};
