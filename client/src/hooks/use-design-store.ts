import { create } from 'zustand';
import { 
  DesignFormValues, 
  CustomizationData, 
  sportKitTypeMapping, 
  sportCollarMapping, 
  sportPatternMapping,
  SportType,
  KitType,
  CollarType,
  PatternType
} from '@shared/schema';

interface DesignStore {
  // Design form state
  formData: DesignFormValues;
  updateFormData: (data: Partial<DesignFormValues>) => void;
  resetFormData: () => void;
  resetFormDataForSport: (sport: SportType | string) => void;
  
  // Design generation state
  isGenerating: boolean;
  setGenerating: (isGenerating: boolean) => void;
  hasGenerated: boolean;
  setHasGenerated: (hasGenerated: boolean) => void;
  
  // Design images
  frontImage: string | null;
  backImage: string | null;
  setImages: (frontImage: string, backImage: string) => void;
  
  // Editor state
  customizations: CustomizationData;
  updateCustomizations: (customizations: CustomizationData) => void;
  isEditorOpen: boolean;
  toggleEditor: (open?: boolean) => void;
  currentView: 'front' | 'back';
  setCurrentView: (view: 'front' | 'back') => void;
  
  // Design ID (from saved design)
  designId: number | null;
  setDesignId: (id: number | null) => void;
}

// Using types imported from shared/schema.ts

// Color palettes for each sport for a consistent look
const sportColorPalettes: Record<SportType, { primary: string, secondary: string }> = {
  soccer: { primary: '#0071e3', secondary: '#ffffff' },
  basketball: { primary: '#FF4500', secondary: '#000000' },
  cricket: { primary: '#006B54', secondary: '#F0E68C' },
  rugby: { primary: '#006400', secondary: '#FFD700' },
  esports: { primary: '#6f42c1', secondary: '#20c997' }
};

// Function to get default values for a sport
const getDefaultValuesForSport = (sportInput: SportType | string): DesignFormValues => {
  // Validate sport type with proper error handling
  const validSports = ['soccer', 'basketball', 'cricket', 'rugby', 'esports'] as const;
  
  if (!validSports.includes(sportInput as any)) {
    console.warn(`Invalid sport type: "${sportInput}". Defaulting to "soccer".`);
  }
  
  const sport = validSports.includes(sportInput as any) ? sportInput as SportType : 'soccer';
  
  // Get sport-specific options with proper fallbacks
  const kitTypeOptions = sportKitTypeMapping[sport] || ['jersey'];
  const collarTypeOptions = sportCollarMapping[sport] || ['crew'];
  const patternStyleOptions = sportPatternMapping[sport] || ['solid'];
  
  // Cast options to the appropriate types with proper validation
  const kitType = (kitTypeOptions[0] || 'jersey') as KitType;
  const collarType = (collarTypeOptions[0] || 'crew') as CollarType;
  const patternStyle = (patternStyleOptions[0] || 'solid') as PatternType;
  
  return {
    sport,
    kitType,
    primaryColor: sportColorPalettes[sport].primary,
    secondaryColor: sportColorPalettes[sport].secondary,
    sleeveStyle: 'short',
    collarType,
    patternStyle,
    designNotes: ''
  };
};

const initialFormValues = getDefaultValuesForSport('soccer');

export const useDesignStore = create<DesignStore>((set) => ({
  // Design form state
  formData: initialFormValues,
  updateFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data } 
  })),
  resetFormData: () => set({ formData: initialFormValues }),
  resetFormDataForSport: (sport) => set({ 
    formData: getDefaultValuesForSport(sport) 
  }),
  
  // Design generation state
  isGenerating: false,
  setGenerating: (isGenerating) => set({ isGenerating }),
  hasGenerated: false,
  setHasGenerated: (hasGenerated) => set({ hasGenerated }),
  
  // Design images
  frontImage: null,
  backImage: null,
  setImages: (frontImage, backImage) => set({ frontImage, backImage }),
  
  // Editor state
  customizations: {},
  updateCustomizations: (customizations) => set({ customizations }),
  isEditorOpen: false,
  toggleEditor: (open) => set((state) => ({ 
    isEditorOpen: open !== undefined ? open : !state.isEditorOpen 
  })),
  currentView: 'front',
  setCurrentView: (view) => set({ currentView: view }),
  
  // Design ID (from saved design)
  designId: null,
  setDesignId: (designId) => set({ designId })
}));