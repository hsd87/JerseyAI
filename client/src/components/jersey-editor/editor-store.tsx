import { create } from "zustand";
import { ReactNode, createContext, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import { ItemConfig, JerseyZone } from "./index";

// Define our editor state
type EditorState = {
  // Canvas state
  frontImage: string | null;
  backImage: string | null;
  currentView: 'front' | 'back';
  
  // Items state
  items: ItemConfig[];
  selectedItemId: string | null;
  
  // Predefined zones for the jersey
  jerseyZones: JerseyZone[];
  
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

// Create the store with Zustand
export const useEditorStoreBase = create<EditorState>((set) => ({
  // Default state
  frontImage: null,
  backImage: null,
  currentView: 'front',
  items: [],
  selectedItemId: null,
  
  // Predefined zones for jersey placement
  jerseyZones: [
    // Front zones
    { id: 'front-center', name: 'Front Center', x: 240, y: 200, side: 'front' },
    { id: 'front-upper', name: 'Front Upper', x: 240, y: 120, side: 'front' },
    { id: 'front-lower', name: 'Front Lower', x: 240, y: 320, side: 'front' },
    
    // Back zones
    { id: 'back-name', name: 'Player Name', x: 240, y: 120, side: 'back' },
    { id: 'back-number', name: 'Player Number', x: 240, y: 200, side: 'back' },
    { id: 'back-lower', name: 'Back Lower', x: 240, y: 320, side: 'back' },
  ],

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setImages: (front, back) => set({ frontImage: front, backImage: back }),
  
  // Item management
  addTextItem: (text, x, y, options = {}) => {
    const id = uuidv4();
    const newItem: ItemConfig = {
      id,
      type: 'text',
      x,
      y,
      rotation: 0,
      text,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      stroke: options.stroke || undefined,
      strokeWidth: options.strokeWidth || 0,
      ...options
    };
    
    set((state) => ({
      items: [...state.items, newItem],
      selectedItemId: id
    }));
    
    return id;
  },
  
  addImageItem: (src, x, y, options = {}) => {
    const id = uuidv4();
    const newItem: ItemConfig = {
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
      ...options
    };
    
    set((state) => ({
      items: [...state.items, newItem],
      selectedItemId: id
    }));
    
    return id;
  },
  
  selectItem: (id) => set({ selectedItemId: id }),
  
  updateItem: (id, changes) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, ...changes } : item
    )
  })),
  
  deleteItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    selectedItemId: state.selectedItemId === id ? null : state.selectedItemId
  }))
}));

// Create a React context for the editor store
const EditorContext = createContext<EditorState | null>(null);

// Provider component
export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const store = useEditorStoreBase();
  
  return (
    <EditorContext.Provider value={store}>
      {children}
    </EditorContext.Provider>
  );
};

// Custom hook to use the editor store
export const useEditorStore = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorStore must be used within an EditorProvider');
  }
  return context;
};