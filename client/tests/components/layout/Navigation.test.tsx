import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Navigation, NavigationItemType } from '../../../src/components/layout/Navigation';

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
