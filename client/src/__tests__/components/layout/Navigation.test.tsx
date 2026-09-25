/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../../i18n';
import { Sidebar, type SidebarNavItem } from '../../../components/layout/Sidebar';
import { LayoutDashboard, Wallet, BookOpen, Settings } from 'lucide-react';

const mainNav: SidebarNavItem[] = [
  { name: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'nav.assets', href: '/assets', icon: Wallet },
];

const learnNav: SidebarNavItem[] = [
  { name: 'nav.knowledgeHub', href: '/learn', icon: BookOpen },
];

const youNav: SidebarNavItem[] = [
  { name: 'nav.settings', href: '/settings', icon: Settings },
];

const renderSidebar = (initialRoute = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <div className="flex">
        <Sidebar mainNav={mainNav} learnNav={learnNav} youNav={youNav} />
        <Routes>
          {mainNav.map((item) => (
            <Route
              key={item.href}
              path={item.href}
              element={<div data-testid={`${item.name.replace(/\./g, '-')}-page`}>{`${item.name} Page`}</div>}
            />
          ))}
          <Route path="/learn" element={<div data-testid="learn-page">Learn Page</div>} />
          <Route path="/settings" element={<div data-testid="settings-page">Settings Page</div>} />
        </Routes>
      </div>
    </MemoryRouter>
  );
};

describe('Sidebar component', () => {
  it('renders every navigation item, exactly', () => {
    renderSidebar();

    // Count the sidebar's own links, not every link in the render tree. The
    // previous version used a bare getAllByRole('link') with a `>= 4` bound,
    // which passes even if items silently vanish - the exact regression this
    // file exists to catch.
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    const links = within(nav).getAllByRole('link');

    // HARDCODED, deliberately. Deriving this from mainNav/learnNav/youNav would
    // make the test self-referential: deleting an item would delete it from the
    // expectation too, and the test would still pass. It must state the truth
    // independently of the input.
    expect(links).toHaveLength(4);

    // And each one must be present by its *rendered* label, so a missing or
    // unresolvable i18n key fails here rather than shipping a raw key.
    for (const key of ['nav.dashboard', 'nav.assets', 'nav.knowledgeHub', 'nav.settings']) {
      const label = i18n.t(key, { ns: 'common' });
      if (label === key) throw new Error(`${key} does not resolve in en; the nav would render a raw key`);
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('marks the current route as active', () => {
    renderSidebar('/assets');

    const assetsLink = screen.getByRole('link', { name: /assets/i });
    expect(assetsLink).toHaveAttribute('aria-current', 'page');
  });

  it('navigates to the selected route on click', async () => {
    renderSidebar('/dashboard');

    await userEvent.click(screen.getByRole('link', { name: /assets/i }));

    expect(screen.getByTestId('nav-assets-page')).toBeInTheDocument();
  });

  it('exposes an ARIA landmark for screen readers', () => {
    renderSidebar();

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});
