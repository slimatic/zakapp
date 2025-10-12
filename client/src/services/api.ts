const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Log API configuration in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    baseUrl: API_BASE_URL,
    source: process.env.REACT_APP_API_BASE_URL ? 'environment' : 'default',
  });
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    preferences?: {
      calendar?: string;
      methodology?: string;
    };
  };
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.error?.message || result.message || `Login failed: ${response.status}`
        };
      }
      
      // Backend returns: { success: true, data: { accessToken, refreshToken, user } }
      // Frontend expects: { success: true, accessToken, refreshToken, user }
      return {
        success: true,
        accessToken: result.data?.accessToken,
        refreshToken: result.data?.refreshToken,
        user: result.data?.user
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.error?.message || result.message || `Registration failed: ${response.status}`
        };
      }
      
      // Backend returns: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
      // Frontend expects: { success: true, accessToken, refreshToken, user }
      return {
        success: true,
        accessToken: result.data?.tokens?.accessToken,
        refreshToken: result.data?.tokens?.refreshToken,
        user: result.data?.user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async logout(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getCurrentUser(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Asset endpoints
  async getAssets(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async createAsset(asset: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(asset)
    });
    return this.handleResponse(response);
  }

  async getAsset(assetId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateAsset(assetId: string, asset: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(asset)
    });
    return this.handleResponse(response);
  }

  async deleteAsset(assetId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateProfile(profileData: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return this.handleResponse(response);
  }

  // Zakat Calculation Methods
  async calculateZakat(data: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/calculate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getNisab(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/nisab`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getMethodologies(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/methodologies`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async recordPayment(data: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/payment`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async createSnapshot(data: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/snapshot`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getSnapshots(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/snapshots`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getZakatHistory(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/history`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getZakatPayments(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/payments`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async saveCalculation(data: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/save-calculation`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // Password Reset Methods
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Password reset request failed'
        };
      }
      
      return {
        success: true,
        data: result,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async confirmPasswordReset(resetToken: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/confirm-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Password reset confirmation failed'
        };
      }
      
      return {
        success: true,
        data: result,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Calendar Methods
  async convertCalendarDate(from: 'hijri' | 'gregorian', to: 'hijri' | 'gregorian', date: Date | { year: number; month: number; day: number }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/calendar/convert`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ from, to, date })
    });
    return this.handleResponse(response);
  }

  async getNextZakatDate(lastDate?: string, calendarType?: 'hijri' | 'gregorian'): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (lastDate) params.append('lastDate', lastDate);
    if (calendarType) params.append('calendarType', calendarType);
    
    const response = await fetch(`${API_BASE_URL}/calendar/next-zakat-date?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getCurrentHijriDate(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/calendar/current-hijri`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getHijriMonthNames(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/calendar/hijri-month-names`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateCalendarPreferences(preferences: {
    preferredCalendar?: 'hijri' | 'gregorian';
    preferredMethodology?: 'standard' | 'hanafi' | 'shafi' | 'custom';
    lastZakatDate?: string;
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/calendar/preferences`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(preferences)
    });
    return this.handleResponse(response);
  }

  async getCalendarPreferences(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/calendar/preferences`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();