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
 * The pricing has been simplified to remove all discounts, shipping costs, and taxes per user request.
 */

/**
 * Simplified price breakdown interface
 * Removed all discounts, shipping costs, and taxes per user request
 */
export interface PriceBreakdown {
  baseTotal: number;     // Total base price of all items
  subtotal: number;      // Subtotal (same as baseTotal with simplified pricing)
  grandTotal: number;    // Final total (same as subtotal with simplified pricing)
  itemCount: number;     // Number of items in the order
}