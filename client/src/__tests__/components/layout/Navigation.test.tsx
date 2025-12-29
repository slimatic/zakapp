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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Navigation, NavigationItemType } from '../../../components/layout/Navigation';

const navigationItems: NavigationItemType[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Assets', href: '/assets' },
  { name: 'Nisab Records', href: '/nisab-records' },
  { name: 'Profile', href: '/profile' },
];

const renderNavigation = (initialRoute = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Navigation items={navigationItems} />
      <Routes>
        {navigationItems.map((item) => (
          <Route
            key={item.href}
            path={item.href}
            element={<div data-testid={`${item.name.replace(/\s+/g, '-').toLowerCase()}-page`}>{`${item.name} Page`}</div>}
          />
        ))}
      </Routes>
    </MemoryRouter>
  );
};

describe('Navigation component', () => {
  it('renders all navigation items', () => {
    renderNavigation();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(navigationItems.length);
    navigationItems.forEach((item) => {
      expect(screen.getByRole('link', { name: item.name })).toBeInTheDocument();
    });
  });

  it('marks the current route as active', () => {
    renderNavigation('/assets');

    const assetsLink = screen.getByRole('link', { name: 'Assets' });
    expect(assetsLink).toHaveAttribute('aria-current', 'page');
  });

  it('navigates to the selected route on click', async () => {
    renderNavigation('/dashboard');

    await userEvent.click(screen.getByRole('link', { name: 'Nisab Records' }));

    expect(screen.getByTestId('nisab-records-page')).toBeInTheDocument();
  });

  it('exposes an ARIA landmark for screen readers', () => {
    renderNavigation();

    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
  });
});
