/**
 * Centralized pricing constants and configuration
 */

/**
 * IMPORTANT: All prices are stored in CENTS, not dollars
 * Example: $20.00 is stored as 2000 cents
 * This eliminates conversion errors when processing payments
 */
export const BASE_PRICES: Record<string, number> = {
  // Soccer products
  'soccer_jersey': 2000,       // $20.00
  'soccer_shorts': 1500,       // $15.00
  'soccer_jersey_short': 3500, // $35.00 (Bundle price)
  'soccer_full_kit': 4900,     // $49.00 (Full kit bundle - jersey, shorts, socks)
  
  // Cricket products
  'cricket_jersey': 2200,      // $22.00
  'cricket_trouser': 1800,     // $18.00
  'cricket_jersey_trouser': 3900, // $39.00 (Bundle price)
  
  // Basketball products
  'basketball_jersey': 2200,   // $22.00
  'basketball_shorts': 1800,   // $18.00
  'basketball_jersey_shorts': 3800, // $38.00 (Bundle price)
  
  // Rugby products
  'rugby_jersey': 2500,        // $25.00
  'rugby_shorts': 2000,        // $20.00
  'rugby_jersey_shorts': 4200, // $42.00 (Bundle price)
  
  // Training/Team wear
  'tracksuit': 4500,           // $45.00
  'hoodie': 4200,              // $42.00
  'halfzip': 3800,             // $38.00
  'fullzip': 4000,             // $40.00
  
  // Accessories
  'matching_socks': 800,       // $8.00
  'matching_kitbag': 1500,     // $15.00
  'matching_beanie': 1200      // $12.00
};

/**
 * The pricing has been simplified to remove all discounts, shipping costs, and taxes per user request.
 */

/**
 * Utility functions for working with prices in cents
 */

/**
 * Convert a dollar amount to cents
 * @param dollars Amount in dollars (e.g., 29.99)
 * @returns Amount in cents (e.g., 2999)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert an amount in cents to dollars
 * @param cents Amount in cents (e.g., 2999)
 * @returns Amount in dollars (e.g., 29.99)
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format an amount in cents as a dollar string
 * @param cents Amount in cents (e.g., 2999)
 * @returns Formatted dollar string (e.g., "$29.99")
 */
export function formatCentsAsDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(centsToDollars(cents));
}

/**
 * Create a price breakdown object with all values in cents
 * @param amountInCents Amount in cents
 * @returns PriceBreakdown object with totalInDollars helper method
 */
export function createPriceBreakdown(amountInCents: number, itemCount: number = 1): PriceBreakdown {
  return {
    baseTotal: amountInCents,
    subtotal: amountInCents,
    grandTotal: amountInCents,
    itemCount,
    totalInDollars: () => centsToDollars(amountInCents)
  };
}

/**
 * Simplified price breakdown interface
 * Removed all discounts, shipping costs, and taxes per user request
 * ALL AMOUNTS ARE IN CENTS, not dollars
 */
export interface PriceBreakdown {
  baseTotal: number;     // Total base price of all items in CENTS (e.g., 2000 = $20.00)
  subtotal: number;      // Subtotal in CENTS (same as baseTotal with simplified pricing)
  grandTotal: number;    // Final total in CENTS (same as subtotal with simplified pricing)
  itemCount: number;     // Number of items in the order
  
  // Helper method to get the total in dollars (for display purposes only)
  // This is not stored or sent to the server, just for UI formatting
  // Do not use this value for payment processing!
  totalInDollars?: () => number;
}