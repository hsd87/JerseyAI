// Define the core types for our order system

// CartItem interface for price calculations
export interface CartItem {
  productId: string;
  productType: string;
  basePrice: number;
  quantity: number;
}

export interface PackageItem {
  id: string;
  name: string;
  type: string;
  sizes: { size: string; quantity: number }[];
  price: number;
  gender: string;
  sku?: string; // Added for product identification
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
  designId?: number;
}

export interface AddOn extends OrderItem {
  customValue?: string;
}

export interface TeamMemberItem {
  itemType: string;  // e.g., 'jersey', 'shorts', etc.
  sku: string;       // Product SKU
  size: string;      // Size of this specific item
  price: number;     // Price of this item
}

export interface TeamMember {
  id: string;
  name: string;
  number: string;
  size: string;      // Default size for the jersey (primary item)
  gender: string;
  items?: TeamMemberItem[]; // Each team member can have multiple items (jersey, shorts, etc.)
}

export interface PriceBreakdown {
  // Removed all discounts, shipping costs, and taxes per user request
  subtotal: number;
  grandTotal: number;
  itemCount: number;
  baseTotal: number;
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
  
  // Cart view
  cart?: OrderItem[]; // Used in checkout page - combined items and add-ons
  getCartItems: () => OrderItem[]; // Helper method to get cart items
  totalAmount?: number; // Total amount of items in cart
  
  // Checkout status
  orderCompleted: boolean;
  orderCreatedAt?: string; // ISO timestamp when order was created
  
  // Cart actions
  addItem: (item: OrderItem) => void;
  updateItem: (id: string, updatedItem: OrderItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  clearCart: () => void; // Clear all items in cart
  
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
  setOrderCompleted: (completed: boolean) => void;
  setOrderCreatedAt?: (timestamp: string) => void;
  
  // Gender and sizing
  gender?: string;
  setGender?: (gender: string) => void;
  size?: string;
  setSize?: (size: string) => void;
  quantity?: number;
  setQuantity?: (quantity: number) => void;
}