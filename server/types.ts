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
  baseTotal: number;                  // Total before any discounts
  tierDiscountApplied: string;        // Description of applied tier discount
  tierDiscountAmount: number;         // Amount of tier discount in cents
  subscriptionDiscountApplied: string; // Description of applied subscription discount  
  subscriptionDiscountAmount: number; // Amount of subscription discount in cents
  subtotalAfterDiscounts: number;     // Subtotal after all discounts
  shippingCost: number;               // Shipping cost in cents
  grandTotal: number;                 // Final total in cents
}