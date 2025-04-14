import { create } from 'zustand';
// Define types locally for now
export interface CartItem {
  productId: string;
  productType: "jersey" | "jersey_shorts" | "kit";
  basePrice: number;
  quantity: number;
}

export interface PriceBreakdown {
  baseTotal: number;
  tierDiscountApplied: string;
  tierDiscountAmount: number;
  subscriptionDiscountApplied: string;
  subscriptionDiscountAmount: number;
  subtotalAfterDiscounts: number;
  shippingCost: number;
  grandTotal: number;
}

interface OrderItem {
  type: string; // jersey, shorts, etc.
  size: string;
  quantity: number;
  gender: string; // Male, Female, Youth
  price: number;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

interface OrderState {
  // Order Items Management
  items: OrderItem[];
  addOns: AddOn[];
  packageType: string;
  sport: string;
  designId: number | null;
  designUrls: { front: string; back: string } | null;
  
  // Item Configuration
  gender?: string; // Male, Female, Youth
  size?: string;
  quantity?: number;
  
  // Team Order Fields
  isTeamOrder: boolean;
  teamName: string;
  
  // Shipping Info
  shippingAddress: ShippingAddress | null;
  
  // Payment and Price Calculation
  priceBreakdown: PriceBreakdown | null;
  
  // Actions
  setItems: (items: OrderItem[]) => void;
  addItem: (item: OrderItem) => void;
  removeItem: (index: number) => void;
  updateItemQuantity: (index: number, quantity: number) => void;
  
  setAddOns: (addOns: AddOn[]) => void;
  addAddOn: (addOn: AddOn) => void;
  removeAddOn: (index: number) => void;
  
  setPackageType: (packageType: string) => void;
  setSport: (sport: string) => void;
  setDesign: (designId: number, urls: { front: string; back: string }) => void;
  
  // Configuration setters
  setGender?: (gender: string) => void;
  setSize?: (size: string) => void;
  setQuantity?: (quantity: number) => void;
  
  setIsTeamOrder: (isTeamOrder: boolean) => void;
  setTeamName: (teamName: string) => void;
  
  setShippingAddress: (address: ShippingAddress) => void;
  
  setPriceBreakdown: (breakdown: PriceBreakdown) => void;
  
  // Helper to convert order items to cart items for price calculation
  getCartItems: () => CartItem[];
  
  // Clear the store
  resetOrder: () => void;
}

// Initial state
const initialState = {
  items: [],
  addOns: [],
  packageType: 'jerseyOnly',
  sport: '',
  designId: null,
  designUrls: null,
  gender: 'Male',
  size: 'M',
  quantity: 1,
  isTeamOrder: false,
  teamName: '',
  shippingAddress: null,
  priceBreakdown: null
};

export const useOrderStore = create<OrderState>((set, get) => ({
  ...initialState,
  
  // Items Management
  setItems: (items) => set({ items }),
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  
  removeItem: (index) => set((state) => ({
    items: state.items.filter((_, i) => i !== index)
  })),
  
  updateItemQuantity: (index, quantity) => set((state) => ({
    items: state.items.map((item, i) => 
      i === index ? { ...item, quantity } : item)
  })),
  
  // Add-ons Management
  setAddOns: (addOns) => set({ addOns }),
  
  addAddOn: (addOn) => set((state) => ({
    addOns: [...state.addOns, addOn]
  })),
  
  removeAddOn: (index) => set((state) => ({
    addOns: state.addOns.filter((_, i) => i !== index)
  })),
  
  // Order Settings
  setPackageType: (packageType) => set({ packageType }),
  setSport: (sport) => set({ sport }),
  setDesign: (designId, urls) => set({ designId, designUrls: urls }),
  
  // Team Order
  setIsTeamOrder: (isTeamOrder) => set({ isTeamOrder }),
  setTeamName: (teamName) => set({ teamName }),
  
  // Shipping
  setShippingAddress: (address) => set({ shippingAddress: address }),
  
  // Pricing
  setPriceBreakdown: (breakdown) => set({ priceBreakdown: breakdown }),
  
  // Convert order items to cart items for price calculation
  getCartItems: () => {
    const { items, addOns } = get();
    const cartItems: CartItem[] = [];
    
    // Convert regular items to cart items
    items.forEach(item => {
      cartItems.push({
        productId: item.type,
        productType: item.type === 'shorts' ? 'jersey_shorts' : item.type as any,
        basePrice: item.price * 100, // Convert to cents
        quantity: item.quantity
      });
    });
    
    // Convert add-ons to cart items
    addOns.forEach(addOn => {
      cartItems.push({
        productId: addOn.name,
        productType: 'jersey', // Default to jersey for add-ons
        basePrice: addOn.price * 100, // Convert to cents
        quantity: addOn.quantity
      });
    });
    
    return cartItems;
  },
  
  // Reset the store to initial state
  resetOrder: () => set(initialState)
}));