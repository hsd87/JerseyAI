import { create } from 'zustand';

export type AddonItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type TeamMember = {
  id: string;
  name: string;
  number: string;
  size: string;
  quantity: number;
};

type ShippingAddressInfo = {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

interface OrderState {
  // Package configuration
  packageType: 'jerseyOnly' | 'jerseyShorts' | 'fullKit';
  
  // Sizing configuration
  gender: 'Male' | 'Female' | 'Youth';
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  
  // Individual order quantity
  quantity: number;
  
  // Team order configuration
  isTeamOrder: boolean;
  teamName: string;
  teamMembers: TeamMember[];
  
  // Add-ons
  addons: AddonItem[];
  
  // Shipping information
  shippingAddress: ShippingAddressInfo;
  
  // Pricing calculation helpers
  basePrice: number;
  addonsTotal: number;
  subtotal: number;
  discount: number;
  total: number;
}

interface OrderActions {
  // Package configuration actions
  setPackageType: (type: 'jerseyOnly' | 'jerseyShorts' | 'fullKit') => void;
  
  // Sizing configuration actions
  setGender: (gender: 'Male' | 'Female' | 'Youth') => void;
  setSize: (size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL') => void;
  
  // Individual order quantity actions
  setQuantity: (quantity: number) => void;
  
  // Team order configuration actions
  setIsTeamOrder: (isTeam: boolean) => void;
  setTeamName: (name: string) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  
  // Add-ons actions
  updateAddon: (id: string, quantity: number) => void;
  
  // Shipping information actions
  updateShippingAddress: (address: Partial<ShippingAddressInfo>) => void;
  
  // Calculation actions
  calculatePrices: () => void;
  
  // Reset action
  resetOrder: () => void;
}

type OrderStore = OrderState & OrderActions;

// Package type prices
const PACKAGE_PRICES = {
  jerseyOnly: 59.99,
  jerseyShorts: 89.99,
  fullKit: 119.99,
};

// Default add-ons
const DEFAULT_ADDONS: AddonItem[] = [
  { id: 'socks', name: 'Matching Socks', price: 12.99, quantity: 0 },
  { id: 'headwear', name: 'Beanie/Headband', price: 14.99, quantity: 0 },
  { id: 'tracksuit', name: 'Matching Tracksuit', price: 79.99, quantity: 0 },
  { id: 'kitbag', name: 'Kit Bag / Backpack', price: 24.99, quantity: 0 },
];

// Initial state
const initialState: OrderState = {
  packageType: 'jerseyShorts',
  gender: 'Male',
  size: 'M',
  quantity: 1,
  isTeamOrder: false,
  teamName: '',
  teamMembers: [],
  addons: DEFAULT_ADDONS,
  shippingAddress: {
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
  },
  basePrice: PACKAGE_PRICES.jerseyShorts,
  addonsTotal: 0,
  subtotal: PACKAGE_PRICES.jerseyShorts,
  discount: 0,
  total: PACKAGE_PRICES.jerseyShorts,
};

export const useOrderStore = create<OrderStore>((set) => ({
  ...initialState,
  
  // Package configuration
  setPackageType: (packageType) => {
    set({ packageType });
    set((state) => {
      const { subtotal, discount } = calculatePricesHelper(state);
      return { 
        basePrice: PACKAGE_PRICES[packageType],
        subtotal,
        discount,
        total: subtotal - discount
      };
    });
  },
  
  // Sizing configuration
  setGender: (gender) => set({ gender }),
  setSize: (size) => set({ size }),
  
  // Individual order quantity
  setQuantity: (quantity) => {
    set({ quantity });
    set((state) => {
      const { subtotal, discount } = calculatePricesHelper(state);
      return { subtotal, discount, total: subtotal - discount };
    });
  },
  
  // Team order configuration
  setIsTeamOrder: (isTeamOrder) => set({ isTeamOrder }),
  setTeamName: (teamName) => set({ teamName }),
  
  addTeamMember: (member) => set((state) => ({ 
    teamMembers: [...state.teamMembers, member]
  })),
  
  updateTeamMember: (id, member) => set((state) => ({
    teamMembers: state.teamMembers.map((m) => 
      m.id === id ? { ...m, ...member } : m
    )
  })),
  
  removeTeamMember: (id) => set((state) => ({
    teamMembers: state.teamMembers.filter((m) => m.id !== id)
  })),
  
  // Add-ons
  updateAddon: (id, quantity) => {
    set((state) => ({
      addons: state.addons.map((addon) => 
        addon.id === id ? { ...addon, quantity } : addon
      )
    }));
    
    set((state) => {
      const { addonsTotal, subtotal, discount } = calculatePricesHelper(state);
      return { 
        addonsTotal,
        subtotal, 
        discount, 
        total: subtotal - discount 
      };
    });
  },
  
  // Shipping information
  updateShippingAddress: (address) => set((state) => ({
    shippingAddress: { ...state.shippingAddress, ...address }
  })),
  
  // Calculate all prices
  calculatePrices: () => {
    set((state) => {
      const { basePrice, addonsTotal, subtotal, discount } = calculatePricesHelper(state);
      return {
        basePrice,
        addonsTotal,
        subtotal,
        discount,
        total: subtotal - discount
      };
    });
  },
  
  // Reset the entire order state
  resetOrder: () => {
    set(initialState);
  }
}));

// Helper function to calculate prices without modifying state
function calculatePricesHelper(state: OrderState) {
  // Get package price
  const basePrice = PACKAGE_PRICES[state.packageType];
  
  // Calculate total quantity
  const totalQuantity = state.isTeamOrder 
    ? state.teamMembers.reduce((sum, member) => sum + member.quantity, 0) || 1
    : state.quantity;
  
  // Calculate addons total
  const addonsTotal = state.addons.reduce((sum, addon) => {
    return sum + (addon.price * addon.quantity);
  }, 0);
  
  // Calculate subtotal
  const subtotal = (basePrice * totalQuantity) + addonsTotal;
  
  // Calculate discount (hardcoded 15% for pro members for now)
  // In a real app, you'd check the user's subscription status
  const discount = 0; // We'll implement this later
  
  return {
    basePrice,
    addonsTotal,
    subtotal,
    discount
  };
}