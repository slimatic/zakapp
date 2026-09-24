/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * AuthLayout - the shared frame for pre-auth screens (Login, Register).
 *
 * The mockup never designed these pages, so this is new work built in the
 * mockup's language: centered focus column, the brand mark as the only
 * ornament, amber rationed to exactly one element (the primary action), and
 * the version/credit line reduced to a quiet footer.
 *
 * Composition notes (why it looks like this):
 * - The old screens were a card floating on bg-muted with a 2xl shadow, which
 *   read as a generic auth template. The mockup builds pages on the page
 *   background with a single surface card, so we do the same.
 * - The brand line uses the Arabic wordmark the mockup uses (&#1586;&#1603;&#1575;&#1577;),
 *   set in Amiri, as a small flourish - not a second heading.
 * - One trust line replaces the old pill + paragraph pair.
 */

import React from 'react';
import { Logo } from '../common/Logo';

export interface AuthLayoutProps {
  /** Page heading. Sentence case, calm tone, no exclamation. */
  title: string;
  /** One line under the heading. Optional - omit rather than pad. */
  subtitle?: string;
  children: React.ReactNode;
  /** Footer content: the cross-link to the other auth page. */
  footer?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  footer
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Slim brand bar - matches the mockup's topbar, minus app navigation */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="font-heading font-semibold text-lg text-secondary">
            ZakApp
          </span>
          <span
            className="font-arabic text-xl leading-none text-primary translate-y-[1px]"
            aria-hidden="true"
          >
            زكاة
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-7 text-center">
            <h1 className="font-heading font-semibold text-3xl tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg shadow-elev-1 p-6 sm:p-7">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>

      <footer className="px-5 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          <span aria-hidden="true">🔒</span> End-to-end encrypted on your device
        </p>
        <p className="mt-1.5 text-[11px] text-muted-foreground/70">
          Made by{' '}
          <a
            href="https://rstlabs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            RST Labs
          </a>
          <span className="mx-1.5">·</span>
          <span className="font-mono">
            {__APP_VERSION__} ({__COMMIT_HASH__})
          </span>
        </p>
      </footer>
    </div>
  );
};
