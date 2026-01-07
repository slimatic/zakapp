
import { apiService, ApiResponse, API_BASE_URL } from './api';

export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    dormantUsers: number;
    storageUsed: string;
}

export interface User {
    id: string;
    email: string;
    username: string | null;
    userType: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface UserListResponse {
    data: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const adminService = {
    getStats: async (): Promise<ApiResponse<{ stats: AdminStats }>> => {
        return apiService.get('/admin/stats');
    },

    getUsers: async (page = 1, limit = 10, search = ''): Promise<ApiResponse<UserListResponse>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            search
        });
        return apiService.get(`/admin/users?${params.toString()}`);
    },

    deleteUser: async (id: string): Promise<ApiResponse> => {
        const token = localStorage.getItem('accessToken');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers
            });
            const result = await response.json();
            return result;
        } catch (e) {
            return { success: false, message: e instanceof Error ? e.message : 'Network error' };
        }
    },

    updateUserRole: async (id: string, role: 'USER' | 'ADMIN_USER'): Promise<ApiResponse> => {
        const token = localStorage.getItem('accessToken');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ role })
            });
            const result = await response.json();
            return result;
        } catch (e) {
            return { success: false, message: e instanceof Error ? e.message : 'Network error' };
        }
    }
};
