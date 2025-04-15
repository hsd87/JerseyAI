/**
 * Pricing calculation utilities
 */
import { CartItem, PriceBreakdown } from '../types';

// Tier-based discount thresholds
const TIER_DISCOUNTS = [
  { minQuantity: 50, discount: 0.15, label: '15%' }, // 15% off for 50+ items
  { minQuantity: 20, discount: 0.10, label: '10%' }, // 10% off for 20-49 items
  { minQuantity: 10, discount: 0.05, label: '5%' }   // 5% off for 10-19 items
];

// Subscription discount (10% off for Pro subscribers)
const SUBSCRIPTION_DISCOUNT = 0.10;
const SUBSCRIPTION_DISCOUNT_LABEL = '10%';

// Shipping cost calculation constants
const BASE_SHIPPING_COST = 999; // $9.99 in cents
const FREE_SHIPPING_THRESHOLD = 10000; // Free shipping for orders over $100

/**
 * Calculate the price for a cart of items with applicable discounts
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
    
    // Calculate total quantity of items (for tier discounts)
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Determine tier discount (if applicable)
    let tierDiscountAmount = 0;
    let tierDiscountApplied = '0%';
    
    for (const tier of TIER_DISCOUNTS) {
      if (totalQuantity >= tier.minQuantity) {
        tierDiscountAmount = Math.round(baseTotal * tier.discount);
        tierDiscountApplied = tier.label;
        break;
      }
    }
    
    // Determine subscription discount (if applicable)
    let subscriptionDiscountAmount = 0;
    let subscriptionDiscountApplied = '0%';
    
    if (isSubscriber) {
      subscriptionDiscountAmount = Math.round(baseTotal * SUBSCRIPTION_DISCOUNT);
      subscriptionDiscountApplied = SUBSCRIPTION_DISCOUNT_LABEL;
    }
    
    // Calculate subtotal after all discounts
    const subtotalAfterDiscounts = baseTotal - tierDiscountAmount - subscriptionDiscountAmount;
    
    // Calculate shipping cost
    let shippingCost = BASE_SHIPPING_COST;
    if (subtotalAfterDiscounts >= FREE_SHIPPING_THRESHOLD) {
      shippingCost = 0; // Free shipping for orders over threshold
    }
    
    // Calculate grand total
    const grandTotal = subtotalAfterDiscounts + shippingCost;
    
    // Prepare the full price breakdown
    const breakdown: PriceBreakdown = {
      baseTotal,
      tierDiscountApplied,
      tierDiscountAmount,
      subscriptionDiscountApplied,
      subscriptionDiscountAmount,
      subtotalAfterDiscounts,
      shippingCost,
      grandTotal
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
        tierDiscountApplied: '0%',
        tierDiscountAmount: 0,
        subscriptionDiscountApplied: '0%',
        subscriptionDiscountAmount: 0,
        subtotalAfterDiscounts: 0,
        shippingCost: 0,
        grandTotal: 0
      }
    };
  }
}

/**
 * Get the current pricing rules
 */
export function getPricingRules() {
  return {
    tierDiscounts: TIER_DISCOUNTS,
    subscriptionDiscount: {
      rate: SUBSCRIPTION_DISCOUNT,
      label: SUBSCRIPTION_DISCOUNT_LABEL
    },
    shipping: {
      base: BASE_SHIPPING_COST,
      freeThreshold: FREE_SHIPPING_THRESHOLD
    }
  };
}