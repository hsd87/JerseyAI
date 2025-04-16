/**
 * Centralized pricing constants and configuration
 */

/**
 * Base prices for all products
 */
export const BASE_PRICES: Record<string, number> = {
  // Soccer products
  'soccer_jersey': 20,
  'soccer_shorts': 15,
  'soccer_jersey_short': 35, // Bundle price
  'soccer_full_kit': 49, // Full kit bundle (jersey, shorts, socks)
  
  // Cricket products
  'cricket_jersey': 22,
  'cricket_trouser': 18,
  'cricket_jersey_trouser': 39, // Bundle price
  
  // Basketball products
  'basketball_jersey': 22,
  'basketball_shorts': 18,
  'basketball_jersey_shorts': 38, // Bundle price
  
  // Rugby products
  'rugby_jersey': 25,
  'rugby_shorts': 20,
  'rugby_jersey_shorts': 42, // Bundle price
  
  // Training/Team wear
  'tracksuit': 45,
  'hoodie': 42,
  'halfzip': 38,
  'fullzip': 40,
  
  // Accessories
  'matching_socks': 8,
  'matching_kitbag': 15,
  'matching_beanie': 12
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