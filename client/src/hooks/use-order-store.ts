import { create } from 'zustand';
import { OrderState, OrderItem, TeamMember, AddOn, PriceBreakdown, OrderDetails, PackageItem } from './use-order-types';

// Default values for price breakdown
const defaultPriceBreakdown: PriceBreakdown = {
  subtotal: 0,
  discount: 0,
  shipping: 0,
  shippingCost: 0,
  tax: 0,
  grandTotal: 0,
  itemCount: 0,
  baseTotal: 0
};

// Create the store with Zustand
export const useOrderStore = create<OrderState>((set, get) => ({
  // Order items
  items: [],
  addOns: [],
  teamMembers: [],
  isTeamOrder: false,
  packageItems: [], // Initialize as empty array for packageItems
  packageType: 'jerseyOnly', // Default package type
  
  // Helper method to get cart items for checkout
  getCartItems: () => {
    const state = get();
    return [...state.items];
  },
  
  // Get total amount of all items in the cart
  get totalAmount() {
    const state = get();
    const items = state.items;
    const addOns = state.addOns;
    
    // Calculate total from items
    const itemsTotal = items.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
    
    // Calculate total from add-ons
    const addOnsTotal = addOns.reduce((total, addon) => {
      return total + (addon.price * (addon.quantity || 1));
    }, 0);
    
    return Number((itemsTotal + addOnsTotal).toFixed(2));
  },
  
  // Pricing
  sport: 'soccer',
  priceBreakdown: null,
  
  // Cart access - combined items from cart (derived getter for checkout)
  get cart() {
    const items = get().items;
    const addOns = get().addOns;
    return [...items, ...addOns];
  },
  
  // Checkout status
  orderCompleted: false,
  
  // Design reference
  designId: null,
  orderDetails: null,
  designUrls: null,
  
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
  
  clearCart: () => set({ 
    items: [], 
    addOns: [], 
    teamMembers: [],
    orderDetails: null,
    priceBreakdown: null
  }),
  
  setOrderCompleted: (completed: boolean) => set({ orderCompleted: completed }),
  
  setTeamOrder: (isTeam: boolean) => set({ isTeamOrder: isTeam }),
  
  setTeamMembers: (members: TeamMember[] | (() => TeamMember[])) => set((state) => ({
    teamMembers: typeof members === 'function' ? members() : members,
    // Also activate team order mode if there are members
    isTeamOrder: (typeof members === 'function' ? members() : members).length > 0 ? true : state.isTeamOrder
  })),
  
  setDesignId: (id: number | null) => set({ designId: id }),
  
  setOrderDetails: (details: OrderDetails) => set({ orderDetails: details }),
  
  // Update partial order details
  updateOrderDetails: (details: Partial<OrderDetails>) => set((state) => ({
    orderDetails: state.orderDetails 
      ? { ...state.orderDetails, ...details } 
      : details as OrderDetails
  })),
  
  // Update order with customer info, shipping details, etc.
  updateOrder: (data) => set((state) => {
    const { customerInfo, shippingAddress, shippingOption, priceBreakdown } = data;
    
    // Create a new state object
    const newState: Partial<OrderState> = {};
    
    // Update customer info if provided
    if (customerInfo) {
      newState.customerInfo = customerInfo;
    }
    
    // Update order details if we have them already
    if (state.orderDetails) {
      newState.orderDetails = { ...state.orderDetails };
      
      // Update shipping address if provided
      if (shippingAddress) {
        newState.orderDetails.shippingAddress = shippingAddress;
      }
    } else if (shippingAddress) {
      // Create order details if we don't have them yet
      newState.orderDetails = {
        items: state.items,
        addOns: state.addOns,
        isTeamOrder: state.isTeamOrder,
        packageType: state.packageType || 'jerseyOnly',
        shippingAddress
      };
    }
    
    // Update shipping option if provided
    if (shippingOption) {
      newState.shippingOption = shippingOption;
    }
    
    // Update price breakdown if provided
    if (priceBreakdown) {
      newState.priceBreakdown = priceBreakdown;
    }
    
    return newState;
  }),
  
  setPriceBreakdown: (breakdown: PriceBreakdown | null) => set({ 
    priceBreakdown: breakdown ?? defaultPriceBreakdown 
  }),
  
  setSport: (sport: string) => set({ sport }),
  
  setPackageType: (packageType: string) => set({ packageType }),
  
  setDesign: (designId: number, designUrls: { front: string; back: string }) => set({ 
    designId, 
    designUrls 
  }),
  
  // Add method to set package items
  setPackageItems: (items: PackageItem[]) => set({ packageItems: items }),
  
  // Add method to set order creation timestamp
  setOrderCreatedAt: (timestamp: string) => set({ orderCreatedAt: timestamp })
}));