/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { UserManagement } from '../UserManagement';
import { adminService } from '../../../services/adminService';

vi.mock('../../../services/adminService', () => ({
    adminService: {
        getUsers: vi.fn(),
        getDefaultLimits: vi.fn(),
        setUserActive: vi.fn(),
        raiseAllUserLimits: vi.fn(),
        updateUserRole: vi.fn(),
        verifyUser: vi.fn(),
        deleteUser: vi.fn(),
    }
}));

const makeUser = (over: Partial<any> = {}) => ({
    id: 'u1',
    email: 'a@example.com',
    username: 'Aisha',
    userType: 'USER',
    isActive: true,
    isVerified: true,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    maxAssets: null,
    maxNisabRecords: null,
    maxPayments: null,
    maxLiabilities: null,
    _count: { assets: 1, yearlySnapshots: 0, payments: 2, liabilities: 0 },
    ...over,
});

/**
 * The list response shape. `getUsers` is typed to return `{ success, data }` with
 * the rows and `pagination` as siblings of `data`, which is what the component
 * reads first - the array branch is a fallback for the other envelope, so the
 * test pins the real one.
 */
const listResponse = (users: any[]) => ({
    success: true,
    data: users,
    pagination: { page: 1, limit: 10, total: users.length, totalPages: 1 },
});

const service = adminService as unknown as { [k: string]: Mock };

/**
 * The limits the SERVER reports as the effective defaults. Deliberately not the
 * client's `constants/limits` copy: that copy read 20/3/25 while the server
 * enforced 30/5/50, and asserting against it is what let the bulk-raise ship
 * computing its targets from stale numbers. This value is the fixture, so the
 * test now fails if the component goes back to a hardcoded default.
 */
const SERVER_DEFAULTS = {
    maxAssets: 30,
    maxNisabRecords: 5,
    maxPayments: 50,
    maxLiabilities: 15,
};

beforeEach(() => {
    vi.clearAllMocks();
    service.getUsers.mockResolvedValue(listResponse([makeUser()]));
    service.getDefaultLimits.mockResolvedValue({ success: true, data: SERVER_DEFAULTS });
    service.setUserActive.mockResolvedValue({ success: true });
    service.raiseAllUserLimits.mockResolvedValue({ success: true });
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('UserManagement', () => {
    it('requests the default server-side sort on first load', async () => {
        render(<UserManagement />);
        await waitFor(() => expect(service.getUsers).toHaveBeenCalled());
        expect(service.getUsers).toHaveBeenCalledWith(1, 10, '', 'createdAt', 'desc');
    });

    it('sorts by last login when asked, and restarts at page 1', async () => {
        render(<UserManagement />);
        await waitFor(() => expect(service.getUsers).toHaveBeenCalledTimes(1));

        fireEvent.change(screen.getByLabelText('Sort users'), {
            target: { value: 'lastLoginAt:desc' },
        });

        await waitFor(() =>
            expect(service.getUsers).toHaveBeenCalledWith(1, 10, '', 'lastLoginAt', 'desc')
        );
    });

    it('deactivates a user through the status endpoint and reflects it in the row', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(<UserManagement />);
        await waitFor(() => expect(screen.getAllByText('Aisha').length).toBeGreaterThan(0));

        // The button label is the state's inverse: an active user offers Deactivate.
        fireEvent.click(screen.getAllByText('Deactivate')[0]);

        await waitFor(() => expect(service.setUserActive).toHaveBeenCalledWith('u1', false));
        await waitFor(() => expect(screen.getAllByText('Activate').length).toBeGreaterThan(0));
        confirmSpy.mockRestore();
    });

    it('does not call the API when the confirmation is dismissed', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(<UserManagement />);
        await waitFor(() => expect(screen.getAllByText('Deactivate').length).toBeGreaterThan(0));

        fireEvent.click(screen.getAllByText('Deactivate')[0]);

        expect(service.setUserActive).not.toHaveBeenCalled();
        confirmSpy.mockRestore();
    });

    it('raises the defaults for everyone, above the server-reported values', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(<UserManagement />);
        await waitFor(() => expect(screen.getByText('Raise all defaults')).toBeInTheDocument());
        // The raise is computed from the fetched defaults, so it must not fire
        // before they arrive - otherwise there is nothing to raise from.
        await waitFor(() => expect(service.getDefaultLimits).toHaveBeenCalled());

        fireEvent.click(screen.getByText('Raise all defaults'));

        await waitFor(() => expect(service.raiseAllUserLimits).toHaveBeenCalledTimes(1));
        const sent = service.raiseAllUserLimits.mock.calls[0][0];
        // A raise, not an arbitrary number: every value is above the default it
        // replaces. A "raise" that lowers a limit is the bug this asserts against.
        expect(sent.maxAssets).toBeGreaterThan(SERVER_DEFAULTS.maxAssets);
        expect(sent.maxNisabRecords).toBeGreaterThan(SERVER_DEFAULTS.maxNisabRecords);
        expect(sent.maxPayments).toBeGreaterThan(SERVER_DEFAULTS.maxPayments);
        expect(sent.maxLiabilities).toBeGreaterThan(SERVER_DEFAULTS.maxLiabilities);
        confirmSpy.mockRestore();
    });

    it('shows the server defaults, not a hardcoded copy, in the usage column', async () => {
        render(<UserManagement />);
        // maxAssets is null on this fixture, so the denominator is the effective
        // default. If the component reads a local constant it renders 20 here.
        await waitFor(() =>
            expect(screen.getAllByText(`1 / ${SERVER_DEFAULTS.maxAssets}`).length).toBeGreaterThan(0)
        );
    });
});
