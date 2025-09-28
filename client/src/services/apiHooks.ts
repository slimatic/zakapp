import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from './api';

// Authentication hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      apiService.login(email, password),
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
    mutationFn: (profileData: any) => apiService.updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'current'] });
    },
  });
};

// Asset management hooks
export const useAssets = (filters?: any) => {
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
    mutationFn: (assetData: any) => apiService.createAsset(assetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assetId, assetData }: { assetId: string; assetData: any }) => 
      apiService.updateAsset(assetId, assetData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', variables.assetId] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assetId: string) => apiService.deleteAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

// Zakat calculation hooks
export const useZakatCalculation = () => {
  return useMutation({
    mutationFn: (calculationData: any) => apiService.calculateZakat(calculationData),
  });
};

export const useZakatHistory = () => {
  return useQuery({
    queryKey: ['zakat', 'history'],
    queryFn: () => apiService.getZakatHistory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useZakatMethodologies = () => {
  return useQuery({
    queryKey: ['zakat', 'methodologies'],
    queryFn: () => apiService.getZakatMethodologies(),
    staleTime: 60 * 60 * 1000, // 1 hour - methodologies don't change often
  });
};

export const useNisabThresholds = () => {
  return useQuery({
    queryKey: ['zakat', 'nisab'],
    queryFn: () => apiService.getNisabThresholds(),
    staleTime: 30 * 60 * 1000, // 30 minutes
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
    mutationFn: (paymentData: any) => apiService.recordZakatPayment(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zakat', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['zakat', 'history'] });
    },
  });
};