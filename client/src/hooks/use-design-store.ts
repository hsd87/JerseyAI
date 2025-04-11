import { create } from 'zustand';
import { DesignFormValues, CustomizationData } from '@shared/schema';

interface DesignStore {
  // Design form state
  formData: DesignFormValues;
  updateFormData: (data: Partial<DesignFormValues>) => void;
  resetFormData: () => void;
  
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

const initialFormValues: DesignFormValues = {
  sport: 'soccer',
  kitType: 'jerseyShorts',
  primaryColor: '#3B82F6',
  secondaryColor: '#FFFFFF',
  sleeveStyle: 'short',
  collarType: 'crew',
  patternStyle: 'solid'
};

export const useDesignStore = create<DesignStore>((set) => ({
  // Design form state
  formData: initialFormValues,
  updateFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data } 
  })),
  resetFormData: () => set({ formData: initialFormValues }),
  
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
  setCurrentView: (view) => set({ currentView }),
  
  // Design ID (from saved design)
  designId: null,
  setDesignId: (designId) => set({ designId })
}));
