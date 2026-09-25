import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Sidebar, type SidebarNavItem } from '../../../src/components/layout/Sidebar';
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
  it('renders all navigation items', () => {
    renderSidebar();

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /assets/i })).toBeInTheDocument();
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
