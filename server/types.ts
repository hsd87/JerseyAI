/**
 * Common types used throughout the server
 */

/**
 * CartItem interface for price calculations
 * Represents a single item in a cart or order for pricing purposes
 */
export interface CartItem {
  productId: string;      // Unique identifier of the product
  productType: string;    // Type of product (jersey, jersey_shorts, etc)
  basePrice: number;      // Base price in cents
  quantity: number;       // Quantity
}

/**
 * PriceBreakdown interface for order cost calculations
 * Provides a detailed breakdown of costs for transparency
 */
export interface PriceBreakdown {
  baseTotal: number;                      // Total before any discounts
  tierDiscountRate: number;               // Rate of tier discount (e.g., 0.05, 0.10, 0.15)
  tierDiscountApplied: string;            // Description of applied tier discount (e.g., "5%")
  tierDiscountAmount: number;             // Amount of tier discount in cents/dollars
  subscriptionDiscountRate: number;       // Rate of subscription discount (e.g., 0.10)
  subscriptionDiscountApplied: string;    // Description of applied subscription discount (e.g., "10%")
  subscriptionDiscountAmount: number;     // Amount of subscription discount in cents/dollars
  subtotalAfterDiscounts: number;         // Subtotal after all discounts
  shippingCost: number;                   // Shipping cost in cents/dollars
  taxAmount: number;                      // Tax amount in cents/dollars
  grandTotal: number;                     // Final total in cents/dollars
}