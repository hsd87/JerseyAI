/**
 * Pricing calculation utilities
 * Simplified pricing - removed all discounts, shipping costs, and taxes per user request
 */
import { CartItem, PriceBreakdown } from '../types';
import { BASE_PRICES } from '@shared/pricing';

/**
 * Calculate the price for a cart of items with simplified pricing
 * No discounts, shipping costs, or taxes are applied
 */
export function calculatePrice(
  cartItems: CartItem[], 
  isSubscriber: boolean = false
): { success: boolean, breakdown: PriceBreakdown } {
  try {
    // Calculate base total from all items
    const baseTotal = cartItems.reduce((total, item) => {
      return total + (item.basePrice * item.quantity);
    }, 0);
    
    // Calculate total quantity of items
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Simplified pricing - subtotal equals base total
    const subtotal = baseTotal;
    
    // Grand total equals subtotal (no discounts, shipping, or taxes)
    const grandTotal = subtotal;
    
    // Prepare the simplified price breakdown
    const breakdown: PriceBreakdown = {
      baseTotal,
      subtotal,
      grandTotal,
      itemCount: totalQuantity
    };
    
    return {
      success: true,
      breakdown
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    
    // Return default values in case of error
    return {
      success: false,
      breakdown: {
        baseTotal: 0,
        subtotal: 0,
        grandTotal: 0,
        itemCount: 0
      }
    };
  }
}

/**
 * Get the current pricing rules
 * Simplified - no discounts, shipping costs, or taxes per user request
 */
export function getPricingRules() {
  return {
    // No pricing rules since we removed all discounts, shipping costs, and taxes
  };
}