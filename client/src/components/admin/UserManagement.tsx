import React, { useState, useEffect } from 'react';
import { adminService, User } from '../../services/adminService';
import { LimitModal } from '../../pages/admin/LimitModal';
import { DEFAULT_LIMITS } from '../../constants/limits';

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingLimitUser, setEditingLimitUser] = useState<User | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersRes = await adminService.getUsers(page, 10, searchTerm);
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
    }, [page, searchTerm]);

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const res = await adminService.deleteUser(userId);
            if (res.success) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                alert(res.message || 'Failed to delete user');
            }
        } catch (err) {
            alert('Error deleting user');
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
                alert(res.message || 'Failed to update user role');
            }
        } catch (err) {
            alert('Error updating user role');
        }
    };

    const handleVerify = async (userId: string) => {
        if (!window.confirm('Manually verify this user?')) return;
        try {
            const res = await adminService.verifyUser(userId);
            if (res.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, isVerified: true } : u));
            } else {
                alert(res.message || 'Failed to verify user');
            }
        } catch (err) {
            alert('Error verifying user');
        }
    };

    const handleLimitSave = (userId: string, limits: { maxAssets: number | null, maxNisabRecords: number | null, maxPayments: number | null }) => {
        setUsers(users.map(u => u.id === userId ? { ...u, ...limits } : u));
    };

    if (loading && users.length === 0) return <div className="p-8 text-center">Loading users...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
                <div className="flex gap-2">
                    <button
                        onClick={loadUsers}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Refresh Data"
                        disabled={loading}
                    >
                        <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                        <tr>
                            <th className="px-6 py-3 font-medium">User</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium">Limits</th>
                            <th className="px-6 py-3 font-medium">Last Login</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{user.username || 'No Username'}</span>
                                        <span className="text-sm text-gray-500">{user.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        {user.isVerified ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">Verified</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-fit">Unverified</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {user.userType}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="flex flex-col gap-0.5 text-xs">
                                        <span title="Assets Usage / Limit">Assets: {user._count?.assets ?? 0} / {user.maxAssets ?? DEFAULT_LIMITS.MAX_ASSETS}</span>
                                        <span title="Nisab Usage / Limit">Nisab: {user._count?.yearlySnapshots ?? 0} / {user.maxNisabRecords ?? DEFAULT_LIMITS.MAX_NISAB_RECORDS}</span>
                                        <span title="Payments Usage / Limit">Payments: {user._count?.payments ?? 0} / {user.maxPayments ?? DEFAULT_LIMITS.MAX_PAYMENTS}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 flex-wrap">
                                        {!user.isVerified && (
                                            <button
                                                onClick={() => handleVerify(user.id)}
                                                className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Verify
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setEditingLimitUser(user)}
                                            className="text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Limits
                                        </button>
                                        <button
                                            onClick={() => handleRoleUpdate(user.id, user.userType === 'ADMIN_USER' ? 'USER' : 'ADMIN_USER')}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${user.userType === 'ADMIN_USER'
                                                ? 'text-amber-600 hover:text-amber-900 hover:bg-amber-50'
                                                : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50'
                                                }`}
                                        >
                                            {user.userType === 'ADMIN_USER' ? 'Demote' : 'Promote'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No users found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border bg-white rounded-md disabled:opacity-50 hover:bg-gray-100"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                </span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border bg-white rounded-md disabled:opacity-50 hover:bg-gray-100"
                >
                    Next
                </button>
            </div>

            {editingLimitUser && (
                <LimitModal
                    user={editingLimitUser}
                    onClose={() => setEditingLimitUser(null)}
                    onSave={handleLimitSave}
                />
            )}
        </div>
    );
};
