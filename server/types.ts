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
 * Simplified pricing - removed all discounts, shipping costs, and taxes per user request
 */
export interface PriceBreakdown {
  baseTotal: number;     // Total base price of all items
  subtotal: number;      // Subtotal (same as baseTotal with simplified pricing)
  grandTotal: number;    // Final total (same as subtotal with simplified pricing)
  itemCount: number;     // Number of items in the order
}