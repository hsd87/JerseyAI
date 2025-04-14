/**
 * Dynamic Pricing System for ProJersey
 * Handles quantity-based discounts, subscription discounts, and shipping cost calculations
 */

import { CartItem } from "../types";

// Tier discount thresholds and amounts (in percentages)
const TIER_DISCOUNTS = [
  { threshold: 50, discount: 15 }, // 15% off for 50+ items
  { threshold: 20, discount: 10 }, // 10% off for 20+ items
  { threshold: 10, discount: 5 },  // 5% off for 10+ items
];

// Subscription discount (percentage)
const SUBSCRIPTION_DISCOUNT = 10; // 10% off for subscribers

// Shipping cost tiers based on order subtotal
const SHIPPING_COSTS = [
  { threshold: 50000, cost: 0 },    // Free shipping for orders $500+
  { threshold: 20000, cost: 2000 }, // $20 shipping for orders $200-$499.99
  { threshold: 0, cost: 3000 },     // $30 shipping for orders under $200
];

/**
 * Calculate the base total price in cents (before any discounts)
 */
export function calculateBaseTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    return total + (item.basePrice * item.quantity);
  }, 0);
}

/**
 * Calculate the quantity-based tier discount
 * Returns the discount percentage and amount in cents
 */
export function calculateTierDiscount(items: CartItem[]): { 
  discountPercentage: number; 
  discountAmount: number;
  tierApplied: string;
} {
  // Calculate total quantity across all items
  const totalQuantity = items.reduce((count, item) => count + item.quantity, 0);
  
  // Find applicable tier discount
  const tierDiscount = TIER_DISCOUNTS.find(tier => totalQuantity >= tier.threshold);
  
  if (!tierDiscount) {
    return { 
      discountPercentage: 0, 
      discountAmount: 0,
      tierApplied: 'None'
    };
  }
  
  // Calculate base total
  const baseTotal = calculateBaseTotal(items);
  
  // Calculate discount amount
  const discountAmount = Math.round(baseTotal * (tierDiscount.discount / 100));
  
  return {
    discountPercentage: tierDiscount.discount,
    discountAmount,
    tierApplied: `${tierDiscount.discount}% off ${tierDiscount.threshold}+ items`
  };
}

/**
 * Calculate the subscription discount
 * Returns the discount percentage and amount in cents
 */
export function calculateSubscriptionDiscount(
  baseTotal: number, 
  isSubscriber: boolean
): { 
  discountPercentage: number; 
  discountAmount: number;
  discountApplied: string;
} {
  if (!isSubscriber) {
    return { 
      discountPercentage: 0, 
      discountAmount: 0,
      discountApplied: 'None'
    };
  }
  
  const discountAmount = Math.round(baseTotal * (SUBSCRIPTION_DISCOUNT / 100));
  
  return {
    discountPercentage: SUBSCRIPTION_DISCOUNT,
    discountAmount,
    discountApplied: `${SUBSCRIPTION_DISCOUNT}% Pro subscriber discount`
  };
}

/**
 * Calculate shipping cost based on subtotal after discounts
 */
export function calculateShippingCost(subtotalAfterDiscounts: number): number {
  const shippingTier = SHIPPING_COSTS.find(tier => subtotalAfterDiscounts >= tier.threshold);
  return shippingTier ? shippingTier.cost : SHIPPING_COSTS[SHIPPING_COSTS.length - 1].cost;
}

/**
 * Format a price from cents to dollars with currency symbol
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Main pricing calculation function that returns a detailed breakdown
 */
export function calculatePrice(
  items: CartItem[], 
  isSubscriber: boolean = false
): {
  success: boolean;
  breakdown: {
    baseTotal: number;
    tierDiscountApplied: string;
    tierDiscountAmount: number;
    subscriptionDiscountApplied: string;
    subscriptionDiscountAmount: number;
    subtotalAfterDiscounts: number;
    shippingCost: number;
    grandTotal: number;
  };
  formatted: {
    baseTotal: string;
    tierDiscount: string;
    subscriptionDiscount: string;
    subtotal: string;
    shipping: string;
    grandTotal: string;
  };
} {
  try {
    // Calculate base total
    const baseTotal = calculateBaseTotal(items);
    
    // Calculate tier discount
    const { discountAmount: tierDiscountAmount, tierApplied } = calculateTierDiscount(items);
    
    // Calculate subtotal after tier discount
    const subtotalAfterTierDiscount = baseTotal - tierDiscountAmount;
    
    // Calculate subscription discount (applied after tier discount)
    const { discountAmount: subscriptionDiscountAmount, discountApplied: subscriptionApplied } = 
      calculateSubscriptionDiscount(subtotalAfterTierDiscount, isSubscriber);
    
    // Calculate subtotal after all discounts
    const subtotalAfterDiscounts = subtotalAfterTierDiscount - subscriptionDiscountAmount;
    
    // Calculate shipping cost
    const shippingCost = calculateShippingCost(subtotalAfterDiscounts);
    
    // Calculate grand total
    const grandTotal = subtotalAfterDiscounts + shippingCost;
    
    // Create breakdown object
    const breakdown = {
      baseTotal,
      tierDiscountApplied: tierApplied,
      tierDiscountAmount,
      subscriptionDiscountApplied: subscriptionApplied,
      subscriptionDiscountAmount,
      subtotalAfterDiscounts,
      shippingCost,
      grandTotal
    };
    
    // Format prices for display
    const formatted = {
      baseTotal: formatPrice(baseTotal),
      tierDiscount: formatPrice(tierDiscountAmount),
      subscriptionDiscount: formatPrice(subscriptionDiscountAmount),
      subtotal: formatPrice(subtotalAfterDiscounts),
      shipping: shippingCost === 0 ? 'FREE' : formatPrice(shippingCost),
      grandTotal: formatPrice(grandTotal)
    };
    
    return {
      success: true,
      breakdown,
      formatted
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    return {
      success: false,
      breakdown: {
        baseTotal: 0,
        tierDiscountApplied: 'None',
        tierDiscountAmount: 0,
        subscriptionDiscountApplied: 'None',
        subscriptionDiscountAmount: 0,
        subtotalAfterDiscounts: 0,
        shippingCost: 0,
        grandTotal: 0
      },
      formatted: {
        baseTotal: '$0.00',
        tierDiscount: '$0.00',
        subscriptionDiscount: '$0.00',
        subtotal: '$0.00',
        shipping: '$0.00',
        grandTotal: '$0.00'
      }
    };
  }
}

/**
 * Get current pricing rules for transparency
 */
export function getPricingRules() {
  return {
    tierDiscounts: TIER_DISCOUNTS.map(tier => ({
      threshold: tier.threshold,
      discount: `${tier.discount}%`
    })),
    subscriptionDiscount: `${SUBSCRIPTION_DISCOUNT}%`,
    shipping: SHIPPING_COSTS.map(tier => ({
      threshold: tier.threshold,
      cost: tier.cost
    }))
  };
}