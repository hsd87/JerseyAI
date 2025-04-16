import { create } from 'zustand';
import { OrderState, OrderItem, TeamMember, AddOn, PriceBreakdown, OrderDetails } from './use-order-types';

// Default values for price breakdown
const defaultPriceBreakdown: PriceBreakdown = {
  subtotal: 0,
  discount: 0,
  discountPercentage: 0,
  shipping: 9.99,
  tax: 0,
  grandTotal: 0,
  itemCount: 0,
  baseTotal: 0,
  tierDiscountApplied: false,
  tierDiscountAmount: 0,
  subscriptionDiscountApplied: false,
  subscriptionDiscountAmount: 0,
  shippingFreeThresholdApplied: false,
  priceBeforeTax: 0
};

// Create the store with Zustand
export const useOrderStore = create<OrderState>((set) => ({
  // Order items
  items: [],
  addOns: [],
  teamMembers: [],
  isTeamOrder: false,
  
  // Pricing
  sport: 'soccer',
  priceBreakdown: null,
  
  // Design reference
  designId: null,
  orderDetails: null,
  
  // Methods
  addItem: (item: OrderItem) => set((state) => {
    // Check if item with same type and size already exists
    const existingItemIndex = state.items.findIndex(
      i => i.type === item.type && i.size === item.size && i.gender === item.gender
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...state.items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + item.quantity
      };
      return { items: updatedItems };
    }
    
    // Add new item
    return { items: [...state.items, item] };
  }),
  
  updateItem: (id: string, updatedItem: OrderItem) => set((state) => {
    const isAddon = state.addOns.some(addon => addon.type === id);
    
    if (isAddon) {
      // Update add-on
      const updatedAddOns = state.addOns.map(addon => 
        addon.type === id ? { ...addon, ...updatedItem } : addon
      );
      return { addOns: updatedAddOns };
    } else {
      // Update regular item
      const updatedItems = state.items.map(item => 
        item.id === id ? { ...item, ...updatedItem } : item
      );
      return { items: updatedItems };
    }
  }),
  
  removeItem: (id: string) => set((state) => {
    const isAddon = state.addOns.some(addon => addon.type === id);
    
    if (isAddon) {
      // Remove add-on
      return { addOns: state.addOns.filter(addon => addon.type !== id) };
    } else {
      // Remove regular item
      return { items: state.items.filter(item => item.id !== id) };
    }
  }),
  
  clearItems: () => set({ items: [], addOns: [] }),
  
  setTeamOrder: (isTeam: boolean) => set({ isTeamOrder: isTeam }),
  
  setTeamMembers: (members: TeamMember[] | (() => TeamMember[])) => set((state) => ({
    teamMembers: typeof members === 'function' ? members() : members,
    // Also activate team order mode if there are members
    isTeamOrder: (typeof members === 'function' ? members() : members).length > 0 ? true : state.isTeamOrder
  })),
  
  setDesignId: (id: number | null) => set({ designId: id }),
  
  setOrderDetails: (details: OrderDetails) => set({ orderDetails: details }),
  
  setPriceBreakdown: (breakdown: PriceBreakdown | null) => set({ 
    priceBreakdown: breakdown ?? defaultPriceBreakdown 
  }),
  
  setSport: (sport: string) => set({ sport })
}));