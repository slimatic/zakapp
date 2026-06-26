/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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

1|import '@testing-library/jest-dom';
2|import React from 'react';
3|import { render, screen } from '@testing-library/react';
4|import userEvent from '@testing-library/user-event';
5|import { MemoryRouter, Route, Routes } from 'react-router-dom';
6|import { Navigation, NavigationItemType } from '../../../src/components/layout/Navigation';
7|
8|const navigationItems: NavigationItemType[] = [
9|  { name: 'Dashboard', href: '/dashboard' },
10|  { name: 'Assets', href: '/assets' },
11|  { name: 'Nisab Records', href: '/nisab-records' },
12|  { name: 'Profile', href: '/profile' },
13|];
14|
15|const renderNavigation = (initialRoute = '/dashboard') => {
16|  return render(
17|    <MemoryRouter initialEntries={[initialRoute]}>
18|      <Navigation items={navigationItems} />
19|      <Routes>
20|        {navigationItems.map((item) => (
21|          <Route
22|            key={item.href}
23|            path={item.href}
24|            element={<div data-testid={`${item.name.replace(/\s+/g, '-').toLowerCase()}-page`}>{`${item.name} Page`}</div>}
25|          />
26|        ))}
27|      </Routes>
28|    </MemoryRouter>
29|  );
30|};
31|
32|describe('Navigation component', () => {
33|  it('renders all navigation items', () => {
34|    renderNavigation();
35|
36|    const links = screen.getAllByRole('link');
37|    expect(links).toHaveLength(navigationItems.length);
38|    navigationItems.forEach((item) => {
39|      expect(screen.getByRole('link', { name: item.name })).toBeInTheDocument();
40|    });
41|  });
42|
43|  it('marks the current route as active', () => {
44|    renderNavigation('/assets');
45|
46|    const assetsLink = screen.getByRole('link', { name: 'Assets' });
47|    expect(assetsLink).toHaveAttribute('aria-current', 'page');
48|  });
49|
50|  it('navigates to the selected route on click', async () => {
51|    renderNavigation('/dashboard');
52|
53|    await userEvent.click(screen.getByRole('link', { name: 'Nisab Records' }));
54|
55|    expect(screen.getByTestId('nisab-records-page')).toBeInTheDocument();
56|  });
57|
58|  it('exposes an ARIA landmark for screen readers', () => {
59|    renderNavigation();
60|
61|    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
62|  });
63|});
64|