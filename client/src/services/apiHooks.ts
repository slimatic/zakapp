import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, UpdateProfileRequest, CreateAssetRequest, UpdateAssetRequest, AssetFilters } from './api';

// Authentication hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      apiService.login({ email, password }),
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: {
      email: string;
      password: string;
      confirmPassword: string;
      firstName: string;
      lastName: string;
      username: string;
    }) => apiService.register(userData),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });
};

// User profile hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => apiService.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profileData: UpdateProfileRequest) => apiService.updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'current'] });
    },
  });
};

// Asset management hooks
export const useAssets = (filters?: AssetFilters) => {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => apiService.getAssets(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAsset = (assetId: string) => {
  return useQuery({
    queryKey: ['assets', assetId],
    queryFn: () => apiService.getAsset(assetId),
    enabled: !!assetId,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assetData: CreateAssetRequest) => apiService.createAsset(assetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['zakat-summary'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assetId, assetData }: { assetId: string; assetData: UpdateAssetRequest }) => 
      apiService.updateAsset(assetId, assetData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', variables.assetId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['zakat-summary'] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assetId: string) => apiService.deleteAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['zakat-summary'] });
    },
  });
};

// Zakat calculation hooks
export const useZakatCalculation = () => {
  return useMutation({
    mutationFn: (calculationData: {
      method: 'standard' | 'hanafi' | 'shafii' | 'maliki' | 'hanbali' | 'custom';
      calendarType?: 'lunar' | 'solar';
      calculationDate?: string;
      includeAssets?: string[];
      includeLiabilities?: string[];
      customNisab?: number;
    }) => apiService.calculateZakat(calculationData),
  });
};

export const useZakatHistory = () => {
  return useQuery({
    queryKey: ['calculations', 'history'],
    queryFn: () => apiService.getZakatHistory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useZakatMethodologies = () => {
  return useQuery({
    queryKey: ['methodologies'],
    queryFn: () => apiService.getMethodologies(),
    staleTime: 60 * 60 * 1000, // 1 hour - methodologies don't change often
  });
};

export const useNisabThresholds = () => {
  return useQuery({
    queryKey: ['zakat', 'nisab'],
    queryFn: () => apiService.getNisab(),
    staleTime: 60 * 60 * 1000, // 1 hour - nisab thresholds updated daily
  });
};

// Calculation-specific hooks
export const useCalculationHistory = (filters?: {
  page?: number;
  limit?: number;
  methodology?: 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['calculations', 'history', filters],
    queryFn: () => apiService.getCalculationHistory(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCalculationById = (id: string) => {
  return useQuery({
    queryKey: ['calculations', id],
    queryFn: () => apiService.getCalculationById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCompareMethodologies = () => {
  return useMutation({
    mutationFn: (comparisonData: {
      methodologies: ('STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM')[];
      customConfigIds?: string[];
      referenceDate?: string;
    }) => apiService.compareMethodologies(comparisonData),
  });
};

export const useCalendarPreference = () => {
  return useQuery({
    queryKey: ['user', 'calendar-preference'],
    queryFn: () => apiService.getCalendarPreference(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useUpdateCalendarPreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (calendarType: 'GREGORIAN' | 'HIJRI') => 
      apiService.updateCalendarPreference(calendarType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'calendar-preference'] });
    },
  });
};

// Payment tracking hooks
export const useZakatPayments = () => {
  return useQuery({
    queryKey: ['zakat', 'payments'],
    queryFn: () => apiService.getZakatPayments(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (paymentData: any) => apiService.recordPayment(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zakat', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['calculations', 'history'] });
    },
  });
};

// Password Reset hooks
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => apiService.requestPasswordReset(email),
  });
};

export const useConfirmPasswordReset = () => {
  return useMutation({
    mutationFn: ({ resetToken, newPassword }: { resetToken: string; newPassword: string }) => 
      apiService.confirmPasswordReset(resetToken, newPassword),
  });
};

// Save calculation hook
export const useSaveCalculation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (calculationData: any) => apiService.saveCalculation(calculationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', 'history'] });
    },
  });
};