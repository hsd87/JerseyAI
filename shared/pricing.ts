/**
 * Centralized pricing constants and configuration
 */

/**
 * Base prices for all products - using SKU system
 */
export const BASE_PRICES: Record<string, number> = {
  // Main products
  'PFJS01': 40, // Jersey
  'PFSS02': 15, // Shorts
  'PFJKT03': 50, // Training Jacket
  'PFTR04': 20, // Training Trouser
  
  // Accessories
  'PFKB05': 35, // Kitbag
  'PFBP06': 30, // Bagpack
  'PFSK07': 10, // Socks
  'PFBN08': 10, // Beanie
  'PFSC09': 10, // Sports Cap
};

/**
 * Tiered discount thresholds and rates
 */
export const TIER_DISCOUNTS = [
  { threshold: 50, discount: 0.15 }, // 15% off for 50+ items
  { threshold: 20, discount: 0.10 }, // 10% off for 20-49 items
  { threshold: 10, discount: 0.05 }, // 5% off for 10-19 items
];

/**
 * Subscription discount rate (10% off for Pro subscribers)
 */
export const SUBSCRIPTION_DISCOUNT = 0.10;

/**
 * Shipping cost calculator based on order subtotal
 */
export interface ShippingRule {
  threshold: number;  // Order value threshold
  cost: number;       // Shipping cost when below this threshold
}

export const SHIPPING_RULES: ShippingRule[] = [
  { threshold: 500, cost: 0 },   // Free shipping for orders over $500
  { threshold: 200, cost: 20 },  // $20 shipping for orders $200-$499.99
  { threshold: 0, cost: 30 }     // $30 shipping for orders under $200
];

/**
 * Tax rate applied to subtotal + shipping (e.g., 0.08 = 8%)
 */
export const TAX_RATE = 0.08;

/**
 * Price breakdown interface for consistent return format
 */
export interface PriceBreakdown {
  baseTotal: number;             // Total before any discounts
  tierDiscount: number;          // Amount saved from tier discount
  tierDiscountRate: number;      // Rate applied (0.05, 0.10, 0.15)
  subscriptionDiscount: number;  // Amount saved from subscription 
  subscriptionDiscountRate: number; // Rate applied (0.10)
  shipping: number;              // Shipping cost
  tax: number;                   // Tax amount
  subtotal: number;              // After discounts, before shipping/tax
  grandTotal: number;            // Final price including all discounts, shipping, and tax
}