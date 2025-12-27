import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    username: string | null;
    userType: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
}

interface AdminContextType {
    users: User[];
    loading: boolean;
    error: string | null;
    fetchUsers: (page?: number, limit?: number) => Promise<void>;
    deleteUser: (userId: string) => Promise<boolean>;
    createUser: (userData: any) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async (page = 1, limit = 50) => {
        setLoading(true);
        try {
            // Need to add this endpoint to ApiService? 
            // Or just use generic authenticated request if ApiService doesn't have it yet.
            // For now, let's assume we extend ApiService or call via fetch directly?
            // apiService.get('/api/admin/users') is not exposed.
            // We should extend apiService potentially, but for now we can use a direct call or cast.

            // Let's assume we'll add `getUsers` to apiService or use a custom protected fetch.
            const token = localStorage.getItem('token'); // Or wherever it's stored
            // Wait, apiService manages tokens.

            // FIXME: We need to extend ApiService to support Admin endpoints or expose a generic 'get'.
            // Accessing private `fetchWithAuth` isn't possible.
            // We will hack it by adding a temporary method to apiService in a separate edit, 
            // OR we define it here if we can import the token? 
            // ApiService is a singleton.

            // Let's implement this assuming we will add `getAdminUsers` to ApiService.
            const result = await apiService.getAdminUsers(page, limit);

            if (result.success) {
                setUsers(result.data.users);
            } else {
                setError(result.message || 'Unknown Error');
                toast.error('Failed to fetch users: ' + (result.message || 'Unknown Error'));
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const result = await apiService.deleteAdminUser(userId);
            if (result.success) {
                toast.success('User deleted successfully');
                setUsers(prev => prev.filter(u => u.id !== userId));
                return true;
            } else {
                toast.error(result.message || 'Failed to delete user');
                return false;
            }
        } catch (err) {
            toast.error('Failed to delete user');
            return false;
        }
    };

    const createUser = async (userData: any) => {
        try {
            const result = await apiService.createAdminUser(userData);
            if (result.success) {
                toast.success('User created successfully');
                fetchUsers(); // Refresh list
                return true;
            } else {
                toast.error(result.message || 'Failed to create user');
                return false;
            }
        } catch (err) {
            toast.error('Failed to create user');
            return false;
        }
    };

    return (
        <AdminContext.Provider value={{ users, loading, error, fetchUsers, deleteUser, createUser }}>
            {children}
        </AdminContext.Provider>
    );
};
