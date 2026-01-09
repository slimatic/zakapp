
import React, { useState, useEffect } from 'react';
import { adminService, User, AdminStats } from '../../services/adminService';
import { PageLoadingFallback } from '../../components/common/LoadingFallback';
import { ErrorDisplay } from '../../components/common/ErrorDisplay';

import { LimitModal } from './LimitModal';
import { DEFAULT_LIMITS } from '../../constants/limits';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingLimitUser, setEditingLimitUser] = useState<User | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                adminService.getStats(),
                adminService.getUsers(page, 10, searchTerm)
            ]);

            if (statsRes.success) {
                // Handle case where stats is at root or in data
                setStats((statsRes as any).stats || statsRes.data?.stats);
            }

            if (usersRes.success && usersRes.data) {
                // Handle case where data is the array, and pagination is sibling
                if (Array.isArray(usersRes.data)) {
                    setUsers(usersRes.data);
                    setTotalPages((usersRes as any).pagination?.totalPages || 1);
                } else {
                    // Fallback for nested strict structure if things change
                    setUsers((usersRes.data as any).data || []);
                    setTotalPages((usersRes.data as any).pagination?.totalPages || 1);
                }
            }
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, searchTerm]);

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const res = await adminService.deleteUser(userId);
            if (res.success) {
                setUsers(users.filter(u => u.id !== userId));
                // Reload stats
                const statsRes = await adminService.getStats();
                if (statsRes.success && statsRes.data) setStats(statsRes.data.stats);
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
                alert(res.message); // Optional: toast would be better but keeping simple
            } else {
                alert(res.message || 'Failed to update user role');
            }
        } catch (err) {
            alert('Error updating user role');
        }
    };

    const handleLimitSave = (userId: string, limits: { maxAssets: number | null, maxNisabRecords: number | null, maxPayments: number | null }) => {
        setUsers(users.map(u => u.id === userId ? { ...u, ...limits } : u));
    };

    if (loading && !stats) return <PageLoadingFallback />;
    if (error) return <ErrorDisplay error={error} onRetry={loadData} />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Admin Dashboard
                </h1>
                <div className="text-sm text-gray-500">
                    System Overview
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" color="bg-blue-50 text-blue-700" />
                <StatCard title="Active Users (30d)" value={stats?.activeUsers || 0} icon="🟢" color="bg-emerald-50 text-emerald-700" />
                <StatCard title="Dormant Users" value={stats?.dormantUsers || 0} icon="💤" color="bg-amber-50 text-amber-700" />
                <StatCard title="Storage Used" value={stats?.storageUsed || 'N/A'} icon="💾" color="bg-purple-50 text-purple-700" />
            </div>

            {/* User Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                    <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
                    <div className="flex gap-2">
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
                        <thead className="bg-gray-50 text-gray-600 text-sm uppercas">
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {user.userType}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="flex flex-col gap-0.5 text-xs">
                                            <span title="Assets Usage / Limit">Assets: {user._count?.assets ?? 0} / {user.maxAssets ?? DEFAULT_LIMITS.MAX_ASSETS}</span>
                                            <span title="Nisab Usage / Limit">Nisab: {user._count?.yearlySnapshots ?? 0} / {user.maxNisabRecords ?? DEFAULT_LIMITS.MAX_NISAB_RECORDS}</span>
                                            <span title="Payments Usage / Limit">Payments: {user._count?.payments ?? 0} / {user.maxPayments ?? DEFAULT_LIMITS.MAX_PAYMENTS}</span>
                                            <span title="Liabilities Usage / Limit">Liabilities: {user._count?.liabilities ?? 0} / {user.maxLiabilities ?? DEFAULT_LIMITS.MAX_LIABILITIES}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
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
            </div>

            {editingLimitUser && (
                <LimitModal
                    user={editingLimitUser}
                    onClose={() => setEditingLimitUser(null)}
                    onSave={handleLimitSave}
                />
            )}
        </div >
    );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} text-xl`}>
            {icon}
        </div>
    </div>
);
