import { create } from 'zustand';
import { createContext, useContext, ReactNode } from 'react';
import { ItemConfig } from './index';
import { v4 as uuidv4 } from 'uuid';

type EditorState = {
  // Canvas state
  frontImage: string | null;
  backImage: string | null;
  currentView: 'front' | 'back';
  
  // Items state
  items: ItemConfig[];
  selectedItemId: string | null;
  
  // Actions
  setCurrentView: (view: 'front' | 'back') => void;
  setImages: (front: string, back: string) => void;
  
  // Item management
  addTextItem: (text: string, x: number, y: number, options?: Partial<ItemConfig>) => string;
  addImageItem: (src: string, x: number, y: number, options?: Partial<ItemConfig>) => string;
  selectItem: (id: string | null) => void;
  updateItem: (id: string, changes: Partial<ItemConfig>) => void;
  deleteItem: (id: string) => void;
};

// Create Zustand store
export const useEditorStoreBase = create<EditorState>((set) => ({
  // Initial state
  frontImage: null,
  backImage: null,
  currentView: 'front',
  items: [],
  selectedItemId: null,
  
  // View actions
  setCurrentView: (view) => set({ currentView: view }),
  setImages: (front, back) => set({ frontImage: front, backImage: back }),
  
  // Item management
  addTextItem: (text, x, y, options = {}) => {
    const id = uuidv4();
    set((state) => ({
      items: [
        ...state.items,
        {
          id,
          type: 'text',
          x,
          y,
          rotation: 0,
          text,
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#000000',
          ...options,
        },
      ],
      selectedItemId: id,
    }));
    return id;
  },
  
  addImageItem: (src, x, y, options = {}) => {
    const id = uuidv4();
    set((state) => ({
      items: [
        ...state.items,
        {
          id,
          type: 'image',
          x,
          y,
          rotation: 0,
          src,
          width: 100,
          height: 100,
          scaleX: 1,
          scaleY: 1,
          ...options,
        },
      ],
      selectedItemId: id,
    }));
    return id;
  },
  
  selectItem: (id) => set({ selectedItemId: id }),
  
  updateItem: (id, changes) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...changes } : item
    ),
  })),
  
  deleteItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
  })),
}));

// Create React Context for the store
const EditorStoreContext = createContext<ReturnType<typeof useEditorStoreBase> | null>(null);

// Provider component
export const EditorProvider = ({ children }: { children: ReactNode }) => {
  // Use the store directly
  // The value returned by the hook is the store itself
  return (
    <EditorStoreContext.Provider value={useEditorStoreBase}>
      {children}
    </EditorStoreContext.Provider>
  );
};

// Custom hook to use the store
export const useEditorStore = () => {
  const store = useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useEditorStore must be used within an EditorProvider');
  }
  return store;
};