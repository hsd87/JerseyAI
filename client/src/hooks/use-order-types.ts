/**
 * Types for the order module
 */

// Item in a customer's cart/order
export interface OrderItem {
  type: string; // jersey, shorts, etc.
  size: string;
  quantity: number;
  gender: string; // Male, Female, Youth
  price: number;
}

// Add-on product added to an order
export interface AddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Team member for team orders
export interface TeamMember {
  id: string;
  name: string;
  number: string;
  size: string;
  quantity: number;
}

// Shipping address information
export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

// Cart item for price calculation
export interface CartItem {
  productId: string;
  productType: string;
  basePrice: number;
  quantity: number;
}

// Price breakdown information
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