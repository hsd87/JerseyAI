/**
 * Interface for shipping address
 */
export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Interface for customer information
 */
export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
}

/**
 * Interface for shipping option
 */
export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDelivery: string;
}

/**
 * Interface for shipping calculation request
 */
export interface ShippingCalculationRequest {
  shippingAddress: ShippingAddress;
  items: Array<{
    quantity: number;
    weight?: number;
    size?: string;
  }>;
  subtotal: number;
}

/**
 * Interface for shipping calculation response
 */
export interface ShippingCalculationResponse {
  shippingOptions: ShippingOption[];
  baseShippingCost: number;
  recommendedOptionId: string;
}