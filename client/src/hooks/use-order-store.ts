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

export interface TeamMember {
  id: string;
  name: string;
  number: string;
  size: string;
  quantity: number;
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
  teamMembers: TeamMember[];
  
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
  
  // Team Roster Management
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  
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
  teamMembers: [] as TeamMember[],
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
  
  // Item Configuration
  setGender: (gender) => set({ gender }),
  setSize: (size) => set({ size }),
  setQuantity: (quantity) => set({ quantity }),
  
  // Team Order
  setIsTeamOrder: (isTeamOrder) => set({ isTeamOrder }),
  setTeamName: (teamName) => set({ teamName }),
  
  // Team Roster Management
  addTeamMember: (member) => set((state) => ({
    teamMembers: [...state.teamMembers, member]
  })),
  
  updateTeamMember: (id, updates) => set((state) => ({
    teamMembers: state.teamMembers.map(member => 
      member.id === id ? { ...member, ...updates } : member
    )
  })),
  
  removeTeamMember: (id) => set((state) => ({
    teamMembers: state.teamMembers.filter(member => member.id !== id)
  })),
  
  // Shipping
  setShippingAddress: (address) => set({ shippingAddress: address }),
  
  // Pricing
  setPriceBreakdown: (breakdown) => set({ priceBreakdown: breakdown }),
  
  // Convert order items to cart items for price calculation
  getCartItems: () => {
    const { items, addOns, teamMembers, isTeamOrder } = get();
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
    
    // Convert team members to cart items if it's a team order
    if (isTeamOrder && teamMembers.length > 0) {
      teamMembers.forEach(member => {
        cartItems.push({
          productId: `jersey-${member.number}`,
          productType: 'jersey',
          basePrice: 8999, // $89.99 per jersey
          quantity: member.quantity
        });
      });
    }
    
    return cartItems;
  },
  
  // Reset the store to initial state
  resetOrder: () => set(initialState)
}));