import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Asset, AssetCategoryType } from '@zakapp/shared';
import { AssetFormData } from '@zakapp/shared';

export interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface AssetQuestionnaireData extends Omit<AssetFormData, 'category' | 'subCategory'> {
  category?: AssetCategoryType;
  subCategory?: string;
}

export interface QuestionnaireState {
  // Navigation state
  currentStepIndex: number;
  steps: QuestionnaireStep[];
  isCompleted: boolean;
  
  // Asset data being collected
  assetData: AssetQuestionnaireData;
  
  // UI state
  showHelp: boolean;
  errors: Record<string, string>;
  isLoading: boolean;
  
  // Actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  updateAssetData: (data: Partial<AssetQuestionnaireData>) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  toggleHelp: () => void;
  resetQuestionnaire: () => void;
  completeQuestionnaire: () => Asset | null;
  validateCurrentStep: () => boolean;
}

const initialSteps: QuestionnaireStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Let\'s help you add your assets for Zakat calculation',
    isCompleted: false,
    isActive: true,
  },
  {
    id: 'category',
    title: 'Asset Category',
    description: 'What type of asset would you like to add?',
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'details',
    title: 'Asset Details',
    description: 'Provide specific information about your asset',
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review your asset information before saving',
    isCompleted: false,
    isActive: false,
  },
];

const initialAssetData: AssetQuestionnaireData = {
  name: '',
  value: 0,
  currency: 'USD',
  description: '',
  zakatEligible: true,
};

export const useQuestionnaireStore = create<QuestionnaireState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentStepIndex: 0,
      steps: initialSteps,
      isCompleted: false,
      assetData: initialAssetData,
      showHelp: false,
      errors: {},
      isLoading: false,

      // Navigation actions
      nextStep: () => {
        const { currentStepIndex, steps, validateCurrentStep } = get();
        
        // Validate current step before proceeding
        if (!validateCurrentStep()) {
          return;
        }
        
        if (currentStepIndex < steps.length - 1) {
          const newIndex = currentStepIndex + 1;
          set((state) => ({
            currentStepIndex: newIndex,
            steps: state.steps.map((step, index) => ({
              ...step,
              isCompleted: index < newIndex,
              isActive: index === newIndex,
            })),
          }));
        }
      },

      previousStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          const newIndex = currentStepIndex - 1;
          set((state) => ({
            currentStepIndex: newIndex,
            steps: state.steps.map((step, index) => ({
              ...step,
              isCompleted: index < newIndex,
              isActive: index === newIndex,
            })),
          }));
        }
      },

      goToStep: (stepIndex: number) => {
        const { steps } = get();
        if (stepIndex >= 0 && stepIndex < steps.length) {
          set((state) => ({
            currentStepIndex: stepIndex,
            steps: state.steps.map((step, index) => ({
              ...step,
              isCompleted: index < stepIndex,
              isActive: index === stepIndex,
            })),
          }));
        }
      },

      // Data management actions
      updateAssetData: (data: Partial<AssetQuestionnaireData>) => {
        set((state) => ({
          assetData: { ...state.assetData, ...data },
        }));
      },

      // Error management
      setError: (field: string, error: string) => {
        set((state) => ({
          errors: { ...state.errors, [field]: error },
        }));
      },

      clearError: (field: string) => {
        set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[field];
          return { errors: newErrors };
        });
      },

      clearAllErrors: () => {
        set({ errors: {} });
      },

      // UI actions
      toggleHelp: () => {
        set((state) => ({ showHelp: !state.showHelp }));
      },

      // Reset and completion
      resetQuestionnaire: () => {
        set({
          currentStepIndex: 0,
          steps: initialSteps,
          isCompleted: false,
          assetData: initialAssetData,
          showHelp: false,
          errors: {},
          isLoading: false,
        });
      },

      completeQuestionnaire: (): Asset | null => {
        const { assetData, validateCurrentStep } = get();
        
        if (!validateCurrentStep()) {
          return null;
        }

        // Generate a temporary ID (in real app, this would come from the backend)
        const asset: Asset = {
          assetId: `temp-${Date.now()}`,
          name: assetData.name,
          category: assetData.category!,
          subCategory: assetData.subCategory!,
          value: assetData.value,
          currency: assetData.currency,
          description: assetData.description,
          zakatEligible: assetData.zakatEligible,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ isCompleted: true });
        return asset;
      },

      // Validation
      validateCurrentStep: (): boolean => {
        const { currentStepIndex, assetData, clearAllErrors, setError } = get();
        clearAllErrors();

        switch (currentStepIndex) {
          case 0: // Welcome step
            return true;

          case 1: // Category step
            if (!assetData.category) {
              setError('category', 'Please select an asset category');
              return false;
            }
            return true;

          case 2: {// Details step
            let isValid = true;
            
            if (!assetData.name?.trim()) {
              setError('name', 'Asset name is required');
              isValid = false;
            }
            
            if (assetData.value <= 0) {
              setError('value', 'Asset value must be greater than 0');
              isValid = false;
            }
            
            if (!assetData.subCategory) {
              setError('subCategory', 'Please select a subcategory');
              isValid = false;
            }
            
            return isValid;
          }

          case 3: // Review step
            return true;

          default:
            return true;
        }
      },
    }),
    {
      name: 'questionnaire-store',
    }
  )
);