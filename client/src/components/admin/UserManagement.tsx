import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { adminService, User, DefaultLimits } from '../../services/adminService';
import { LimitModal } from '../../pages/admin/LimitModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

/** Server-side sort fields, allow-listed to match the admin route's `sortable`. */
const SORT_OPTIONS = [
    { value: 'createdAt:desc', label: 'Newest first' },
    { value: 'createdAt:asc', label: 'Oldest first' },
    { value: 'lastLoginAt:desc', label: 'Last login (recent)' },
    // SQLite orders NULL before any value in ASC, so ascending puts accounts that
    // have never logged in at the top. Verified against the dev DB:
    // `orderBy { lastLoginAt: 'asc' }` returns the never-logged-in users first.
    // The previous label ("oldest") described an ordering that does not exist - a
    // user who has never logged in has no oldest login, and those were exactly the
    // rows being shown. The new label is what the query does, and it is the more
    // useful admin filter (find the dormant accounts).
    { value: 'lastLoginAt:asc', label: 'Never logged in' },
    { value: 'email:asc', label: 'Email (A-Z)' },
    { value: 'userType:asc', label: 'Type' },
    { value: 'isActive:asc', label: 'Inactive first' },
] as const;

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingLimitUser, setEditingLimitUser] = useState<User | null>(null);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [raisingAll, setRaisingAll] = useState(false);
    /**
     * The effective defaults, fetched from the server. Held in state rather than
     * read from a client constant because the caps a user actually falls back to
     * live on the server (`maxAssets ?? DEFAULT_LIMITS.maxAssets`), and a second
     * local copy drifts: the admin list showed 20/3/25 where the server enforced
     * 30/5/50, so every usage bar was wrong and the bulk raise computed its
     * targets from numbers that were no longer real.
     */
    const [limits, setLimits] = useState<DefaultLimits | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const [sortBy, sortDir] = sort.split(':') as [string, 'asc' | 'desc'];
            const usersRes = await adminService.getUsers(page, 10, searchTerm, sortBy, sortDir);
            if (usersRes.success && usersRes.data) {
                if (Array.isArray(usersRes.data)) {
                    setUsers(usersRes.data);
                    setTotalPages((usersRes as any).pagination?.totalPages || 1);
                } else {
                    setUsers((usersRes.data as any).data || []);
                    setTotalPages((usersRes.data as any).pagination?.totalPages || 1);
                }
            }
        } catch (err) {
            console.error('Failed to load users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();

        // Auto-refresh every 10 seconds to show latest counts
        const interval = setInterval(() => {
            if (!document.hidden) { // Only poll if tab is active
                loadUsers();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [page, searchTerm, sort]);

    // Fetched once: the defaults only change when an admin raises the floor, and
    // the raise handler refetches. A failure here leaves `limits` null, and the
    // render falls back to "not set" rather than inventing a number.
    useEffect(() => {
        adminService.getDefaultLimits().then(res => {
            if (res.success && res.data) setLimits(res.data);
        });
    }, []);

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const res = await adminService.deleteUser(userId);
            if (res.success) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                toast.error(res.message || 'Failed to delete user');
            }
        } catch (err) {
            toast.error('Could not delete the user. Please try again.');
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: 'USER' | 'ADMIN_USER') => {
        const action = newRole === 'ADMIN_USER' ? 'promote this user to Admin' : 'demote this user to Standard User';
        if (!window.confirm(`Are you sure you want to ${action}?`)) return;

        try {
            const res = await adminService.updateUserRole(userId, newRole);
            if (res.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, userType: newRole } : u));
            } else {
                toast.error(res.message || 'Failed to update the user role');
            }
        } catch (err) {
            toast.error('Could not update the user role. Please try again.');
        }
    };

    const handleVerify = async (userId: string) => {
        if (!window.confirm('Manually verify this user?')) return;
        try {
            const res = await adminService.verifyUser(userId);
            if (res.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, isVerified: true } : u));
            } else {
                toast.error(res.message || 'Failed to verify the user');
            }
        } catch (err) {
            toast.error('Could not verify the user. Please try again.');
        }
    };

    const handleLimitSave = (userId: string, limits: { maxAssets: number | null, maxNisabRecords: number | null, maxPayments: number | null }) => {
        setUsers(users.map(u => u.id === userId ? { ...u, ...limits } : u));
    };

    const handleActiveToggle = async (user: User) => {
        const next = !user.isActive;
        const verb = next ? 'activate' : 'deactivate';
        if (!window.confirm(`Are you sure you want to ${verb} ${user.username || user.email}?`)) return;

        try {
            const res = await adminService.setUserActive(user.id, next);
            if (res.success) {
                setUsers(users.map(u => u.id === user.id ? { ...u, isActive: next } : u));
                toast.success(`User ${next ? 'activated' : 'deactivated'}`);
            } else {
                toast.error(res.message || `Failed to ${verb} the user`);
            }
        } catch (err) {
            toast.error(`Could not ${verb} the user. Please try again.`);
        }
    };

    /**
     * Raise the account-wide default for every user who has not been given an
     * individual override. The per-user Limits modal is the precise tool; this is
     * the "everyone needs a bit more headroom" case, so the values are a small
     * step up from the CURRENT defaults rather than from a hardcoded guess.
     *
     * Steps are fixed amounts, not percentages: the counts are small (tens), so a
     * "+10 assets" step is legible to an operator in a way that "+50%" is not.
     */
    const handleRaiseAll = async () => {
        if (!limits) return;
        const target = {
            maxAssets: limits.maxAssets + 10,
            maxNisabRecords: limits.maxNisabRecords + 3,
            maxPayments: limits.maxPayments + 25,
            maxLiabilities: limits.maxLiabilities + 5
        };
        if (!window.confirm(
            'Raise the default limits for ALL users, only where the new value is higher?\n\n' +
            `Assets ${limits.maxAssets} → ${target.maxAssets}   Nisab ${limits.maxNisabRecords} → ${target.maxNisabRecords}\n` +
            `Payments ${limits.maxPayments} → ${target.maxPayments}   Liabilities ${limits.maxLiabilities} → ${target.maxLiabilities}\n\n` +
            'Users who already have more than these values are left unchanged.'
        )) return;

        setRaisingAll(true);
        try {
            const res = await adminService.raiseAllUserLimits(target);
            if (res.success) {
                toast.success('Default limits raised for all eligible users');
                loadUsers();
            } else {
                toast.error(res.message || 'Failed to raise default limits');
            }
        } catch (err) {
            toast.error('Could not raise default limits. Please try again.');
        } finally {
            setRaisingAll(false);
        }
    };

    if (loading && users.length === 0) return <div className="p-8 text-center">Loading users...</div>;

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                <h2 className="text-xl font-semibold text-foreground">User Management</h2>
                {/* The input is full-width on a phone rather than fixed: a 240px
                    input plus a refresh button overflows a 360px card, and it
                    pushed the card wide enough to shift the page. */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="flex gap-2">
                        <Select
                            aria-label="Sort users"
                            className="flex-1 sm:w-52 sm:flex-none"
                            value={sort}
                            onChange={(e) => { setPage(1); setSort(e.target.value); }}
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </Select>
                        <button
                            onClick={loadUsers}
                            className="p-2.5 shrink-0 text-muted-foreground hover:text-secondary hover:bg-accent rounded-lg transition-colors"
                            title="Refresh Data"
                            aria-label="Refresh user list"
                            disabled={loading}
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <Input
                        type="text"
                        placeholder="Search users..."
                        aria-label="Search users"
                        className="flex-1 sm:w-56 sm:flex-none"
                        value={searchTerm}
                        onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-11 sm:h-9 shrink-0"
                        isLoading={raisingAll}
                        onClick={handleRaiseAll}
                        title="Raise the stored default limits for every user below the new values"
                    >
                        Raise all defaults
                    </Button>
                </div>
            </div>

            {/*
                Six columns cannot fit a phone. The old table kept them and let the
                wrapper scroll sideways, so on mobile the user saw a fragment of
                "USER" and "STATUS" and had to drag horizontally to read a single
                row - the data was technically present and practically unusable.

                Cards below `md`. The table is kept for desktop, where six columns
                genuinely fit and the density is an advantage. Same data, same
                handlers; only the layout changes.
            */}
            <ul className="divide-y divide-border md:hidden">
                {users.map(user => (
                    <li key={user.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-medium text-foreground break-words">{user.username || 'No Username'}</p>
                                <p className="text-sm text-muted-foreground break-words">{user.email}</p>
                            </div>
                            <button
                                onClick={() => setEditingLimitUser(user)}
                                className="shrink-0 p-2 -m-2 text-muted-foreground hover:text-secondary rounded-lg"
                                aria-label={`Edit limits for ${user.username || user.email}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isVerified ? 'bg-accent text-secondary' : 'bg-warn-soft text-warn-strong'}`}>
                                {user.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                {user.userType}
                            </span>
                        </div>

                        {/*
                            Label/value rows, not a grid. A grid here would put three
                            money counts side by side in a ~300px card and they would
                            fuse into one unreadable string.
                        */}
                        <dl className="text-xs space-y-1">
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Assets</dt>
                                <dd className="tabular-nums">{user._count?.assets ?? 0} / {user.maxAssets ?? limits?.maxAssets ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Nisab records</dt>
                                <dd className="tabular-nums">{user._count?.yearlySnapshots ?? 0} / {user.maxNisabRecords ?? limits?.maxNisabRecords ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Payments</dt>
                                <dd className="tabular-nums">{user._count?.payments ?? 0} / {user.maxPayments ?? limits?.maxPayments ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Last login</dt>
                                <dd>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</dd>
                            </div>
                        </dl>

                        {/*
                            Wraps rather than scrolls: four actions at ~64px plus gaps
                            exceed a 360px card, and a horizontally scrolling action
                            row hides the destructive one off-screen.
                        */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {!user.isVerified && (
                                <Button variant="outline" size="sm" onClick={() => handleVerify(user.id)}>Verify</Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className={user.isActive ? 'text-danger' : 'text-success'}
                                onClick={() => handleActiveToggle(user)}
                            >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingLimitUser(user)}>Limits</Button>
                            <Button variant="outline" size="sm" onClick={() => handleRoleUpdate(user.id, user.userType === 'ADMIN_USER' ? 'USER' : 'ADMIN_USER')}>
                                {user.userType === 'ADMIN_USER' ? 'Demote' : 'Promote'}
                            </Button>
                            <Button variant="outline" size="sm" className="text-danger" onClick={() => handleDelete(user.id)}>Delete</Button>
                        </div>
                    </li>
                ))}
                {users.length === 0 && (
                    <li className="p-8 text-center text-muted-foreground">No users found matching your search.</li>
                )}
            </ul>

            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-start">
                    <thead className="bg-muted text-muted-foreground text-sm uppercase">
                        <tr>
                            <th className="px-6 py-3 font-medium">User</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium">Limits</th>
                            <th className="px-6 py-3 font-medium">Last Login</th>
                            <th className="px-6 py-3 font-medium text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-muted transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{user.username || 'No Username'}</span>
                                        <span className="text-sm text-muted-foreground">{user.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${user.isActive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        {user.isVerified ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-secondary w-fit">Verified</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warn-soft text-warn-strong w-fit">Unverified</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                    {user.userType}
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                    <div className="flex flex-col gap-0.5 text-xs">
                                        {/* nowrap: the column is narrow enough that
                                            "Assets: 0 / 20" wrapped to two lines
                                            ("0 /" then "20"), which reads as four
                                            stacked fragments instead of three limits. */}
                                        <span className="whitespace-nowrap" title="Assets Usage / Limit">Assets: {user._count?.assets ?? 0} / {user.maxAssets ?? limits?.maxAssets ?? '—'}</span>
                                        <span className="whitespace-nowrap" title="Nisab Usage / Limit">Nisab: {user._count?.yearlySnapshots ?? 0} / {user.maxNisabRecords ?? limits?.maxNisabRecords ?? '—'}</span>
                                        <span className="whitespace-nowrap" title="Payments Usage / Limit">Payments: {user._count?.payments ?? 0} / {user.maxPayments ?? limits?.maxPayments ?? '—'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-4 text-end">
                                    <div className="flex justify-end gap-2 flex-wrap">
                                        {!user.isVerified && (
                                            <button
                                                onClick={() => handleVerify(user.id)}
                                                className="text-secondary hover:text-secondary/80 hover:bg-accent px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Verify
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setEditingLimitUser(user)}
                                            className="text-secondary hover:text-secondary/80 hover:bg-accent px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Limits
                                        </button>
                                        <button
                                            onClick={() => handleActiveToggle(user)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${user.isActive
                                                ? 'text-danger hover:text-danger hover:bg-danger-soft'
                                                : 'text-success hover:text-success hover:bg-success-soft'
                                                }`}
                                        >
                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleRoleUpdate(user.id, user.userType === 'ADMIN_USER' ? 'USER' : 'ADMIN_USER')}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${user.userType === 'ADMIN_USER'
                                                ? 'text-warn-strong hover:text-warn-strong hover:bg-warn-soft'
                                                : 'text-secondary hover:text-secondary hover:bg-accent'
                                                }`}
                                        >
                                            {user.userType === 'ADMIN_USER' ? 'Demote' : 'Promote'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-danger hover:text-danger hover:bg-danger-soft px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                    No users found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border flex justify-between items-center bg-muted">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border bg-card rounded-md disabled:opacity-50 hover:bg-muted"
                >
                    Previous
                </button>
                <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                </span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border bg-card rounded-md disabled:opacity-50 hover:bg-muted"
                >
                    Next
                </button>
            </div>

            {editingLimitUser && (
                <LimitModal
                    user={editingLimitUser}
                    defaults={limits}
                    onClose={() => setEditingLimitUser(null)}
                    onSave={handleLimitSave}
                />
            )}
        </div>
    );
};
