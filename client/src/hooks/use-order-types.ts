// Define the core types for our order system

export interface PackageItem {
  id: string;
  name: string;
  type: string;
  sizes: { size: string; quantity: number }[];
  price: number;
  gender: string;
}

export interface OrderAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
  size: string;
  gender: string;
}

export interface OrderItem {
  id: string;
  type: string;
  size: string;
  quantity: number;
  gender: string;
  price: number;
  name?: string;
  customValue?: string;
}

export interface AddOn extends OrderItem {
  customValue?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  number: string;
  size: string;
  gender: string;
}

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  discountPercentage: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  itemCount: number;
  baseTotal: number;
  tierDiscountApplied: boolean;
  tierDiscountAmount: number;
  subscriptionDiscountApplied: boolean;
  subscriptionDiscountAmount: number;
  shippingFreeThresholdApplied: boolean;
  priceBeforeTax: number;
}

export interface OrderDetails {
  items: OrderItem[];
  addOns: AddOn[];
  isTeamOrder: boolean;
  packageType: string;
  teamMembers?: TeamMember[];
  paymentMethod?: string;
  shippingAddress?: ShippingAddress;
  priceBreakdown?: PriceBreakdown;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
}

export interface OrderState {
  // Order items
  items: OrderItem[];
  addOns: AddOn[];
  teamMembers: TeamMember[];
  isTeamOrder: boolean;
  packageItems: PackageItem[];
  packageType?: string;
  
  // Pricing
  sport: string;
  priceBreakdown: PriceBreakdown | null;
  
  // Cart actions
  addItem: (item: OrderItem) => void;
  updateItem: (id: string, updatedItem: OrderItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  
  // Add-on actions
  addAddOn?: (addon: AddOn) => void;
  removeAddOn?: (index: number) => void;
  
  // Team order actions
  setTeamOrder: (isTeam: boolean) => void;
  setTeamMembers: (members: TeamMember[] | (() => TeamMember[])) => void;
  
  // Design reference
  designId: number | null;
  setDesignId: (id: number | null) => void;
  designUrls?: { front: string; back: string } | null;
  
  // Order processing
  orderDetails: OrderDetails | null;
  setOrderDetails: (details: OrderDetails) => void;
  setPriceBreakdown: (breakdown: PriceBreakdown | null) => void;
  setSport: (sport: string) => void;
  setPackageType: (packageType: string) => void;
  setDesign: (designId: number, designUrls: { front: string; back: string }) => void;
  setPackageItems: (items: PackageItem[]) => void;
  
  // Gender and sizing
  gender?: string;
  setGender?: (gender: string) => void;
  size?: string;
  setSize?: (size: string) => void;
  quantity?: number;
  setQuantity?: (quantity: number) => void;
}