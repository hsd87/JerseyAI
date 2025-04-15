import { create } from 'zustand';
import { 
  DesignFormValues, 
  CustomizationData, 
  sportKitTypeMapping, 
  sportCollarMapping, 
  sportPatternMapping 
} from '@shared/schema';

interface DesignStore {
  // Design form state
  formData: DesignFormValues;
  updateFormData: (data: Partial<DesignFormValues>) => void;
  resetFormData: () => void;
  resetFormDataForSport: (sport: string) => void;
  
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
  
  // Away kit state
  isAwayKit: boolean;
  toggleAwayKit: () => void;
}

type SportType = 'soccer' | 'basketball' | 'cricket' | 'rugby' | 'esports';

// Color palettes for each sport for a consistent look
const sportColorPalettes: Record<SportType, { primary: string, secondary: string }> = {
  soccer: { primary: '#0071e3', secondary: '#ffffff' },
  basketball: { primary: '#FF4500', secondary: '#000000' },
  cricket: { primary: '#006B54', secondary: '#F0E68C' },
  rugby: { primary: '#006400', secondary: '#FFD700' },
  esports: { primary: '#6f42c1', secondary: '#20c997' }
};

// Function to get default values for a sport
const getDefaultValuesForSport = (sportInput: string): DesignFormValues => {
  // Convert to SportType and use default if invalid
  const sport = (['soccer', 'basketball', 'cricket', 'rugby', 'esports'].includes(sportInput) 
    ? sportInput as SportType 
    : 'soccer');
  
  // Get sport-specific kit type, collar, and pattern with fallbacks
  const kitTypeOptions = sportKitTypeMapping[sport] || ['jersey'];
  const collarTypeOptions = sportCollarMapping[sport] || ['crew'];
  const patternStyleOptions = sportPatternMapping[sport] || ['solid'];
  
  return {
    sport,
    kitType: kitTypeOptions[0],
    primaryColor: sportColorPalettes[sport].primary,
    secondaryColor: sportColorPalettes[sport].secondary,
    sleeveStyle: 'short',
    collarType: collarTypeOptions[0],
    patternStyle: patternStyleOptions[0],
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
  setDesignId: (designId) => set({ designId }),
  
  // Away kit state
  isAwayKit: false,
  toggleAwayKit: () => set((state) => {
    const { primaryColor, secondaryColor } = state.formData;
    return { 
      isAwayKit: !state.isAwayKit,
      formData: { 
        ...state.formData, 
        primaryColor: secondaryColor,
        secondaryColor: primaryColor 
      }
    };
  })
}));
