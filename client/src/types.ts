/**
 * Types for pricing and cart functionality
 */

// Cart item definition (mirrors server-side type)
export interface CartItem {
  productId: string;
  productType: "jersey" | "jersey_shorts" | "kit";
  basePrice: number;
  quantity: number;
}

// Price breakdown response (mirrors server-side type)
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

// Formatted price breakdown with currency symbols
export interface FormattedPriceBreakdown {
  baseTotal: string;
  tierDiscountApplied: string;
  tierDiscountAmount: string;
  subscriptionDiscountApplied: string;
  subscriptionDiscountAmount: string;
  subtotalAfterDiscounts: string;
  shippingCost: string;
  grandTotal: string;
}

// Pricing rules response from API
export interface PricingRules {
  tierDiscounts: { threshold: number; discount: string }[];
  subscriptionDiscount: string;
  shipping: { threshold: number; cost: number }[];
}

// Price estimate response from API
export interface PriceEstimateResponse {
  success: boolean;
  breakdown: PriceBreakdown;
  formatted: FormattedPriceBreakdown;
}