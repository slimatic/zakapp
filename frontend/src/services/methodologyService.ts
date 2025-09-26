// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types for API responses
export interface MethodologyEducationData {
  historicalBackground: string;
  nisabApproach: string;
  businessAssetTreatment: string;
  debtTreatment: string;
  pros: string[];
  considerations: string[];
}

export interface MethodologyEducationResponse {
  success: boolean;
  data?: {
    methodId: string;
    methodInfo: {
      id: string;
      name: string;
      regions: string[];
      [key: string]: unknown;
    };
    education: MethodologyEducationData;
    lastUpdated: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Helper to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('zakapp_token');
};

// Helper to make authenticated API requests
const apiRequest = async <T>(
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...(options.body && { body: options.body }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// Methodology service functions
export const methodologyService = {
  /**
   * Get educational content for a specific methodology
   */
  getMethodologyEducation: async (methodId: string): Promise<MethodologyEducationResponse> => {
    return apiRequest<MethodologyEducationResponse>(`/api/v1/zakat/methodology/${methodId}/education`);
  }
};