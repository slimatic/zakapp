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

1|import React from 'react';
2|import '@testing-library/jest-dom';
3|import { render, screen, waitFor } from '@testing-library/react';
4|import { fireEvent } from '@testing-library/react';
5|import userEvent from '@testing-library/user-event';
6|import { MemoryRouter, Route, Routes } from 'react-router-dom';
7|import { MobileNav } from '../../../src/components/layout/MobileNav';
8|import { NavigationItemType } from '../../../src/components/layout/Navigation';
9|
10|const navigationItems: NavigationItemType[] = [
11|  { name: 'Dashboard', href: '/dashboard' },
12|  { name: 'Assets', href: '/assets' },
13|  { name: 'Nisab Records', href: '/nisab-records' },
14|  { name: 'Profile', href: '/profile' },
15|];
16|
17|const renderMobileNav = (initialRoute = '/dashboard') => {
18|  return render(
19|    <MemoryRouter initialEntries={[initialRoute]}>
20|      <MobileNav items={navigationItems} />
21|      <Routes>
22|        {navigationItems.map((item) => (
23|          <Route
24|            key={item.href}
25|            path={item.href}
26|            element={<div data-testid={`${item.name.replace(/\s+/g, '-').toLowerCase()}-page`}>{`${item.name} Page`}</div>}
27|          />
28|        ))}
29|      </Routes>
30|    </MemoryRouter>
31|  );
32|};
33|
34|describe('MobileNav component', () => {
35|  it('toggles the menu when hamburger button is clicked', async () => {
36|    renderMobileNav();
37|
38|    const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
39|    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
40|
41|    await userEvent.click(toggleButton);
42|
43|    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
44|    expect(screen.getByRole('dialog', { name: /mobile navigation/i })).toBeInTheDocument();
45|  });
46|
47|  it('closes the menu when Escape key is pressed', async () => {
48|    renderMobileNav();
49|
50|    await userEvent.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
51|    expect(screen.getByRole('dialog', { name: /mobile navigation/i })).toBeInTheDocument();
52|
53|    await userEvent.keyboard('{Escape}');
54|
55|    await waitFor(() => {
56|      expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument();
57|    });
58|  });
59|
60|  it('closes the menu when backdrop is clicked', async () => {
61|    renderMobileNav();
62|
63|    await userEvent.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
64|    const backdrop = screen.getByTestId('mobile-nav-backdrop');
65|
66|    fireEvent.click(backdrop);
67|
68|    await waitFor(() => {
69|      expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument();
70|    });
71|  });
72|
73|  it('navigates to the selected route and closes menu', async () => {
74|    renderMobileNav();
75|
76|    await userEvent.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
77|    const assetsLink = screen.getByRole('link', { name: 'Assets' });
78|
79|    await userEvent.click(assetsLink);
80|
81|    expect(screen.getByTestId('assets-page')).toBeInTheDocument();
82|    await waitFor(() => {
83|      expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument();
84|    });
85|  });
86|
87|  it('resets body scroll locking when menu closes', async () => {
88|    renderMobileNav();
89|
90|    const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
91|    await userEvent.click(toggleButton);
92|    expect(document.body.style.overflow).toBe('hidden');
93|
94|    await userEvent.click(toggleButton); // closes menu
95|    await waitFor(() => {
96|      expect(document.body.style.overflow).toBe('unset');
97|    });
98|  });
99|});
100|