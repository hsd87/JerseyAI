import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';
import { Product, Size, Gender, OrderItem } from '@shared/products';

interface ProductState {
  // Products
  products: Product[];
  addonProducts: Product[];
  kitProducts: Product[];
  isLoading: boolean;
  error: string | null;
  
  // Selected configuration
  selectedItems: OrderItem[];
  isTeamOrder: boolean;
  
  // Actions
  fetchProducts: () => Promise<void>;
  fetchAddonProducts: () => Promise<void>;
  fetchKitProductsForDesign: (kitType: string) => Promise<void>;
  addItemToOrder: (product: Product, size: Size, gender: Gender, quantity: number) => void;
  updateOrderItem: (index: number, updates: Partial<OrderItem>) => void;
  removeOrderItem: (index: number) => void;
  setTeamOrder: (isTeam: boolean) => void;
  calculateTotalPrice: () => number;
  resetOrderItems: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  // Products data
  products: [],
  addonProducts: [],
  kitProducts: [],
  isLoading: false,
  error: null,
  
  // Order configuration
  selectedItems: [],
  isTeamOrder: false,
  
  // Fetch all products
  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiRequest('GET', '/api/products');
      const products = await response.json();
      set({ products, isLoading: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ error: 'Failed to load products', isLoading: false });
    }
  },
  
  // Fetch addon products (accessories, etc.)
  fetchAddonProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiRequest('GET', '/api/addon-products');
      const addonProducts = await response.json();
      set({ addonProducts, isLoading: false });
    } catch (error) {
      console.error('Error fetching addon products:', error);
      set({ error: 'Failed to load addon products', isLoading: false });
    }
  },
  
  // Fetch products specific to a kit type (e.g. jersey + shorts for jerseyShorts)
  fetchKitProductsForDesign: async (kitType: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiRequest('GET', `/api/kit-products/${kitType}`);
      const kitProducts = await response.json();
      set({ kitProducts, isLoading: false });
    } catch (error) {
      console.error('Error fetching kit products:', error);
      set({ error: 'Failed to load kit products', isLoading: false });
    }
  },
  
  // Add a product to the order
  addItemToOrder: (product: Product, size: Size, gender: Gender, quantity: number) => {
    const newItem: OrderItem = {
      skuId: product.skuId,
      name: product.name,
      size,
      gender,
      quantity,
      price: product.basePrice,
    };
    
    set(state => ({
      selectedItems: [...state.selectedItems, newItem]
    }));
  },
  
  // Update an existing order item
  updateOrderItem: (index: number, updates: Partial<OrderItem>) => {
    set(state => {
      const newItems = [...state.selectedItems];
      newItems[index] = { ...newItems[index], ...updates };
      return { selectedItems: newItems };
    });
  },
  
  // Remove an item from the order
  removeOrderItem: (index: number) => {
    set(state => ({
      selectedItems: state.selectedItems.filter((_, i) => i !== index)
    }));
  },
  
  // Toggle team order flag
  setTeamOrder: (isTeam: boolean) => {
    set({ isTeamOrder: isTeam });
  },
  
  // Calculate the total price of all items in the order
  calculateTotalPrice: () => {
    return get().selectedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  },
  
  // Reset the order items
  resetOrderItems: () => {
    set({ selectedItems: [] });
  }
}));