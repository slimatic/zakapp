import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DonationCTA } from '../donation/DonationCTA';

/**
 * Two groups, not three stacked sections.
 *
 * Previously: CTA / links / credits as three full-width sections separated by
 * rules, each with its own py-8, and the links centred one-per-line. On a phone
 * that was ~350px of mostly empty space under every page and the links read as
 * a menu.
 *
 * Now: one row on desktop, two on mobile (links, then a single meta line),
 * separated by middle dots instead of borders. The mockup has no footer at all
 * - it ends with one muted caption - so the aim is to stay close to that:
 * present, useful, never competing with the page.
 */
export const Footer: React.FC = () => {
    const { t } = useTranslation('common');
    const linkClass = 'transition-colors hover:text-secondary';
    const dot = <span className="text-foreground/70" aria-hidden="true">·</span>;

    return (
        <footer className="mt-auto border-t border-border bg-muted">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center gap-2.5 text-xs text-foreground/80 sm:flex-row sm:justify-between sm:gap-6">

                    {/* Links. Wraps and stays on one or two lines rather than
                        stacking one link per row. */}
                    <nav aria-label={t('a11y.footer')} className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
                        <DonationCTA variant="footer" />
                        <span className="text-foreground/70" aria-hidden="true">·</span>
                        <Link to="/privacy-policy" className={linkClass}>{t('footer.privacy')}</Link>
                        <span className="text-foreground/70" aria-hidden="true">·</span>
                        <a href="https://github.com/slimatic/zakapp" target="_blank" rel="noopener noreferrer" className={linkClass}>
                            {t('footer.source')}
                        </a>
                        <span className="text-foreground/70" aria-hidden="true">·</span>
                        <a
                            href="https://github.com/slimatic/zakapp/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkClass}
                            title={t('footer.reportIssue')}
                        >
                            {t('footer.issues')}
                        </a>
                    </nav>

                    {/* One meta line: brand, year, credit, build. "Made with" and
                        the commit hash are desktop-only so this stays a single
                        line on a phone. */}
                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-foreground/80">ZakApp</span>
                        {dot}
                        <span>© {new Date().getFullYear()}</span>
                        {dot}
                        <a href="https://rstlabs.io" target="_blank" rel="noopener noreferrer" className={`${linkClass} group flex items-center gap-1`}>
                            <span className="hidden sm:inline">{t('footer.madeWith')}</span>
                            <span aria-hidden="true">❤️</span>
                            <span className="hidden sm:inline">{t('footer.by')}</span>
                            <span className="font-semibold text-foreground/80 group-hover:text-foreground">RST Labs</span>
                        </a>
                        {dot}
                        <a
                            href="https://github.com/slimatic/zakapp/releases"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-foreground/70 transition-colors hover:text-secondary"
                            title={t('footer.build', { hash: __COMMIT_HASH__ })}
                        >
                            v{__APP_VERSION__}
                            <span className="hidden sm:inline"> ({__COMMIT_HASH__})</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
