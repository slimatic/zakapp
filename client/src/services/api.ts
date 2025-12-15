import { getApiBaseUrl } from '../config';

export const API_BASE_URL = getApiBaseUrl();

// Log API configuration in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    baseUrl: API_BASE_URL,
    source: window.APP_CONFIG?.API_BASE_URL ? 'runtime-config' : (process.env.REACT_APP_API_BASE_URL ? 'environment' : 'default'),
  });
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  username?: string;
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
    createdAt?: string;
    preferences?: {
      calendar?: string;
      methodology?: string;
    };
    settings?: {
      currency?: string;
      preferredCalendar?: string;
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

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  preferences?: {
    currency?: string;
    language?: string;
    zakatMethod?: string;
    calendarType?: string;
  };
}

export interface CreateAssetRequest {
  name: string;
  category: string;
  value: number;
  currency?: string;
  acquisitionDate: Date;
  metadata?: string;
  notes?: string;
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
}

export interface UpdateAssetRequest extends Partial<CreateAssetRequest> {}

export interface CreatePaymentRequest {
  amount: number;
  date?: string;
  paymentDate?: Date;
  recipient?: string;
  recipientName?: string;
  recipientType?: string;
  recipientCategory?: string;
  paymentMethod?: string;
  currency?: string;
  notes?: string;
  receiptReference?: string;
  calculationId?: string;
  snapshotId?: string;
}

export interface AssetFilters {
  type?: string;
  minValue?: number;
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
      // Handle 401 Unauthorized - clear tokens and reload to trigger redirect to login
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Support both email and username logins - convert email to username if needed
      const loginData = {
        username: credentials.username || credentials.email || '',
        password: credentials.password
      };

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Extract detailed error message
        const errorMessage = result.error?.message || result.message || `Login failed: ${response.status}`;
        console.error('Login error response:', result);
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Backend returns: { success, data: { user, tokens: { accessToken, refreshToken } } }
      return {
        success: true,
        accessToken: result.data.tokens.accessToken,
        refreshToken: result.data.tokens.refreshToken,
        user: result.data.user
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
        // Extract detailed error message
        const errorMessage = result.error?.message || result.message || result.details?.[0]?.msg || `Registration failed: ${response.status}`;
        console.error('Registration error response:', result);
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Backend returns: { success, data: { tokens: { accessToken, refreshToken }, user } }
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
  async getAssets(filters?: AssetFilters): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async createAsset(asset: CreateAssetRequest): Promise<ApiResponse> {
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

  async updateAsset(assetId: string, asset: UpdateAssetRequest): Promise<ApiResponse> {
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

  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return this.handleResponse(response);
  }

  // Zakat Calculation Methods
  async calculateZakat(data: {
    method: 'standard' | 'hanafi' | 'shafii' | 'maliki' | 'hanbali' | 'custom';
    calendarType?: 'lunar' | 'solar';
    calculationDate?: string;
    includeAssets?: string[];
    includeLiabilities?: string[];
    customNisab?: number;
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/calculate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getCalculationHistory(filters?: {
    page?: number;
    limit?: number;
    methodology?: 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM';
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.methodology) params.append('methodology', filters.methodology);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const url = params.toString()
      ? `${API_BASE_URL}/calculations?${params.toString()}`
      : `${API_BASE_URL}/calculations`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getCalculationById(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/calculations/${id}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async compareMethodologies(data: {
    methodologies: ('STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM')[];
    customConfigIds?: string[];
    referenceDate?: string;
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/calculations/compare`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getCalendarPreference(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/calendar-preference`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateCalendarPreference(calendarType: 'GREGORIAN' | 'HIJRI'): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/calendar-preference`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ calendarType })
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
    const response = await fetch(`${API_BASE_URL}/methodologies`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getMethodology(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/methodologies/${id}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateMethodology(id: string, updates: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/methodologies/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return this.handleResponse(response);
  }

  async createMethodology(methodologyData: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/methodologies/custom`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(methodologyData)
    });
    return this.handleResponse(response);
  }

  async deleteMethodology(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/methodologies/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async recordPayment(data: CreatePaymentRequest): Promise<ApiResponse> {
    // Prefer snapshot-specific endpoint. If `snapshotId` is provided, use
    // POST /api/tracking/snapshots/:id/payments. Otherwise return a clear error.
    if (data.snapshotId) {
      const response = await fetch(`${API_BASE_URL}/tracking/snapshots/${data.snapshotId}/payments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return this.handleResponse(response);
    }

    return {
      success: false,
      message: 'snapshotId is required to record a payment'
    };
  }

  async getPayments(filters?: { snapshotId?: string; limit?: number; offset?: number }): Promise<ApiResponse> {
    // Use the payments endpoint with snapshotId filter
    // This queries PaymentRecord table via PaymentService
    const params = new URLSearchParams();
    if (filters?.snapshotId) params.append('snapshotId', filters.snapshotId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const queryString = params.toString();
    // GET payments across all snapshots (supports optional category filter on server)
    const response = await fetch(`${API_BASE_URL}/tracking/payments${queryString ? `?${queryString}` : ''}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Update a payment that is stored against a snapshot (used by Nisab Year Records UI)
  async updateSnapshotPayment(paymentId: string, updates: Partial<{amount: number; date: string; recipient?: string; notes?: string; snapshotId?: string}>): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return this.handleResponse(response);
  }

  // Delete a payment that is stored against a snapshot
  async deleteSnapshotPayment(paymentId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Legacy snapshot methods (deprecated - use nisabYearRecord methods)
  /** @deprecated Use createNisabYearRecord instead */
  async createSnapshot(data: any): Promise<ApiResponse> {
    return this.createNisabYearRecord(data);
  }

  /** @deprecated Use getNisabYearRecords instead */
  async getSnapshots(filters?: { year?: number; page?: number; limit?: number; status?: string[] }): Promise<ApiResponse> {
    const result = await this.getNisabYearRecords({
      ...filters,
      status: filters?.status
    });
    // Map 'records' to 'snapshots' for backward compatibility
    if (result.data && result.data.records) {
      return {
        ...result,
        data: {
          ...result.data,
          snapshots: result.data.records
        }
      };
    }
    return result;
  }

  /** @deprecated Use getNisabYearRecord instead */
  async getSnapshot(snapshotId: string): Promise<ApiResponse> {
    return this.getNisabYearRecord(snapshotId);
  }

  /** @deprecated Use deleteNisabYearRecord instead */
  async deleteSnapshot(snapshotId: string): Promise<ApiResponse> {
    return this.deleteNisabYearRecord(snapshotId);
  }

  async compareSnapshots(fromId: string, toId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/snapshots/compare?from=${fromId}&to=${toId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getSnapshotStats(year?: number): Promise<ApiResponse> {
    const params = year ? `?year=${year}` : '';
    const response = await fetch(`${API_BASE_URL}/snapshots/stats${params}`, {
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

  async getZakatPayments(filters?: { year?: number; page?: number; limit?: number }): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = params.toString()
      ? `${API_BASE_URL}/zakat/payments?${params.toString()}`
      : `${API_BASE_URL}/zakat/payments`;

    const response = await fetch(url, {
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

  async updatePayment(paymentId: string, updates: Partial<{amount: number; date: string; recipient?: string; notes?: string; snapshotId?: string}>): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/payments/${paymentId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return this.handleResponse(response);
  }

  async deletePayment(paymentId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/payments/${paymentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getPayment(paymentId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/zakat/payments/${paymentId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getPaymentSummary(year?: number): Promise<ApiResponse> {
    const params = year ? `?year=${year}` : '';
    const response = await fetch(`${API_BASE_URL}/zakat/payments/summary${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Nisab Year Records Methods (Feature 008)
  async getNisabYearRecords(filters?: {
    status?: string[];
    hijriYear?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status.join(','));
    if (filters?.hijriYear) params.append('hijriYear', filters.hijriYear);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const url = params.toString()
      ? `/nisab-year-records?${params.toString()}`
      : '/nisab-year-records';

    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async createNisabYearRecord(data: {
    hawlStartDate?: string;
    hawlStartDateHijri?: string;
    hawlCompletionDate?: string;
    hawlCompletionDateHijri?: string;
    nisabBasis: 'GOLD' | 'SILVER';
    totalWealth?: number;
    totalLiabilities?: number;
    zakatableWealth?: number;
    zakatAmount?: number;
    nisabThresholdAtStart?: number;
    methodologyUsed?: string;
    assetBreakdown?: Record<string, any>;
    calculationDetails?: Record<string, any>;
    userNotes?: string;
    selectedAssetIds?: string[];
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/nisab-year-records`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getNisabYearRecord(recordId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/nisab-year-records/${recordId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateNisabYearRecord(recordId: string, data: {
    notes?: string;
    nisabBasis?: 'GOLD' | 'SILVER';
    assetBreakdown?: any;
    totalWealth?: string;
    zakatableWealth?: string;
    zakatAmount?: string;
    hawlStartDate?: string;
    hawlCompletionDate?: string;
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/nisab-year-records/${recordId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async deleteNisabYearRecord(recordId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/nisab-year-records/${recordId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async finalizeNisabYearRecord(recordId: string, data?: {
    finalizationNotes?: string;
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/nisab-year-records/${recordId}/finalize`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return this.handleResponse(response);
  }

  async unlockNisabYearRecord(recordId: string, data: {
    unlockReason: string;
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/nisab-year-records/${recordId}/unlock`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getNisabYearRecordAuditTrail(recordId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/nisab-year-records/${recordId}/audit`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async refreshNisabYearRecordAssets(recordId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/nisab-year-records/${recordId}/assets/refresh`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Settings Methods
  async getSettings(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/settings`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateSettings(settings: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/settings`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    return this.handleResponse(response);
  }

  // Password Management Methods
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // Account Management Methods
  async deleteAccount(password: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/account`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ password })
    });
    return this.handleResponse(response);
  }

  async exportUserData(format: string = 'json'): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/export-request`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ format })
    });
    return this.handleResponse(response);
  }

  // Privacy Settings Methods (FR-018, FR-019, FR-020)
  async getPrivacySettings(): Promise<{ success: boolean; privacySettings: { analytics: boolean; dataSharing: boolean; marketing: boolean } }> {
    const response = await fetch(`${API_BASE_URL}/user/privacy-settings`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updatePrivacySettings(settings: { analytics?: boolean; dataSharing?: boolean; marketing?: boolean }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/privacy-settings`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();