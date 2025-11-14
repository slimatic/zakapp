import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MobileNav } from '../../../src/components/layout/MobileNav';
import { NavigationItemType } from '../../../src/components/layout/Navigation';

const navigationItems: NavigationItemType[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Assets', href: '/assets' },
  { name: 'Nisab Records', href: '/nisab-records' },
  { name: 'Profile', href: '/profile' },
];

const renderMobileNav = (initialRoute = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <MobileNav items={navigationItems} />
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

describe('MobileNav component', () => {
  it('toggles the menu when hamburger button is clicked', async () => {
    renderMobileNav();

    const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: /mobile navigation/i })).toBeInTheDocument();
  });

  it('closes the menu when Escape key is pressed', async () => {
    renderMobileNav();

    await userEvent.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
    expect(screen.getByRole('dialog', { name: /mobile navigation/i })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument();
    });
  });

  it('closes the menu when backdrop is clicked', async () => {
    renderMobileNav();

    await userEvent.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
    const backdrop = screen.getByTestId('mobile-nav-backdrop');

    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument();
    });
  });

  it('navigates to the selected route and closes menu', async () => {
    renderMobileNav();

    await userEvent.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
    const assetsLink = screen.getByRole('link', { name: 'Assets' });

    await userEvent.click(assetsLink);

    expect(screen.getByTestId('assets-page')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument();
    });
  });

  it('resets body scroll locking when menu closes', async () => {
    renderMobileNav();

    const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
    await userEvent.click(toggleButton);
    expect(document.body.style.overflow).toBe('hidden');

    await userEvent.click(toggleButton); // closes menu
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset');
    });
  });
});
