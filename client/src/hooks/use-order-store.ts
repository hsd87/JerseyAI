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

interface OrderStore {
  // Package configuration
  packageType: 'jerseyOnly' | 'jerseyShorts' | 'fullKit';
  setPackageType: (type: 'jerseyOnly' | 'jerseyShorts' | 'fullKit') => void;
  
  // Sizing configuration
  gender: 'Male' | 'Female' | 'Youth';
  setGender: (gender: 'Male' | 'Female' | 'Youth') => void;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  setSize: (size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL') => void;
  
  // Individual order quantity
  quantity: number;
  setQuantity: (quantity: number) => void;
  
  // Team order configuration
  isTeamOrder: boolean;
  setIsTeamOrder: (isTeam: boolean) => void;
  teamName: string;
  setTeamName: (name: string) => void;
  teamMembers: TeamMember[];
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  
  // Add-ons
  addons: AddonItem[];
  updateAddon: (id: string, quantity: number) => void;
  
  // Shipping information
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  updateShippingAddress: (address: Partial<OrderStore['shippingAddress']>) => void;
  
  // Pricing calculation helpers
  basePrice: number;
  addonsTotal: number;
  subtotal: number;
  discount: number;
  total: number;
  calculatePrices: () => void;
  
  // Reset the entire order state
  resetOrder: () => void;
}

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

export const useOrderStore = create<OrderStore>((set, get) => ({
  // Package configuration
  packageType: 'jerseyShorts',
  setPackageType: (packageType) => set({ packageType }, false),
  
  // Sizing configuration
  gender: 'Male',
  setGender: (gender) => set({ gender }, false),
  size: 'M',
  setSize: (size) => set({ size }, false),
  
  // Individual order quantity
  quantity: 1,
  setQuantity: (quantity) => set({ quantity }, false),
  
  // Team order configuration
  isTeamOrder: false,
  setIsTeamOrder: (isTeamOrder) => set({ isTeamOrder }, false),
  teamName: '',
  setTeamName: (teamName) => set({ teamName }, false),
  teamMembers: [],
  addTeamMember: (member) => set((state) => ({ 
    teamMembers: [...state.teamMembers, member] 
  }), false),
  updateTeamMember: (id, member) => set((state) => ({
    teamMembers: state.teamMembers.map((m) => 
      m.id === id ? { ...m, ...member } : m
    )
  }), false),
  removeTeamMember: (id) => set((state) => ({
    teamMembers: state.teamMembers.filter((m) => m.id !== id)
  }), false),
  
  // Add-ons
  addons: DEFAULT_ADDONS,
  updateAddon: (id, quantity) => {
    set((state) => ({
      addons: state.addons.map((addon) => 
        addon.id === id ? { ...addon, quantity } : addon
      )
    }));
    set(state => state.calculatePrices());
  },
  
  // Shipping information
  shippingAddress: {
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
  },
  updateShippingAddress: (address) => set((state) => ({
    shippingAddress: { ...state.shippingAddress, ...address }
  }), false),
  
  // Pricing calculation
  basePrice: PACKAGE_PRICES.jerseyShorts,
  addonsTotal: 0,
  subtotal: PACKAGE_PRICES.jerseyShorts,
  discount: 0,
  total: PACKAGE_PRICES.jerseyShorts,
  
  calculatePrices: () => set((state) => {
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
    
    // Calculate total
    const total = subtotal - discount;
    
    return {
      basePrice,
      addonsTotal,
      subtotal,
      discount,
      total,
    };
  }, false),
  
  // Reset the entire order state
  resetOrder: () => {
    set({
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
    });
    // Calculate prices after reset
    set(state => state.calculatePrices());
  }
}));