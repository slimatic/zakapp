/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * The update banner tells people to refresh. If it does not also offer a
 * backup, the one moment a user most needs a copy of their records is the one
 * moment we never mention it (#737).
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../serviceWorkerRegistration', () => ({ skipWaiting: vi.fn() }));

import { UpdateNotification } from '../UpdateNotification';

describe('UpdateNotification backup prompt', () => {
  let fireUpdateFound: () => void;
  let fireStateChange: () => void;
  let worker: { state: ServiceWorkerState };

  beforeEach(() => {
    const waitingWorker = {
      state: 'installing' as ServiceWorkerState,
      addEventListener: (_ev: string, cb: () => void) => {
        fireStateChange = cb;
      },
    };
    worker = waitingWorker;

    const registration = {
      update: vi.fn(),
      installing: waitingWorker,
      addEventListener: (ev: string, cb: () => void) => {
        if (ev === 'updatefound') fireUpdateFound = cb;
      },
    } as unknown as ServiceWorkerRegistration;

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve(registration),
        controller: {}, // a previous worker is in charge: this is a real update
        addEventListener: vi.fn(),
      },
    });
  });

  it('offers a link to the export screen before the refresh', async () => {
    render(
      <MemoryRouter>
        <UpdateNotification />
      </MemoryRouter>
    );

    // Let the ready promise resolve and the updatefound listener attach.
    await waitFor(() => expect(fireUpdateFound).toBeTypeOf('function'));
    act(() => fireUpdateFound());

    await waitFor(() => expect(fireStateChange).toBeTypeOf('function'));
    act(() => {
      worker.state = 'installed';
      fireStateChange();
    });

    const link = await screen.findByRole('link', { name: /download a backup first/i });
    expect(link.getAttribute('href')).toBe('/settings?tab=data');
    expect(screen.getByRole('button', { name: /update now/i })).toBeTruthy();
  });
});
