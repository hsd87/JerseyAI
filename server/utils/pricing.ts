/**
 * Pricing calculation utilities
 */
import { CartItem, PriceBreakdown } from '../types';
import { 
  BASE_PRICES, 
  TIER_DISCOUNTS, 
  SUBSCRIPTION_DISCOUNT, 
  SHIPPING_RULES,
  TAX_RATE
} from '@shared/pricing';

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
    let tierDiscountRate = 0;
    let tierDiscountAmount = 0;
    
    // Find applicable tier discount
    for (const tier of TIER_DISCOUNTS) {
      if (totalQuantity >= tier.threshold) {
        tierDiscountRate = tier.discount;
        break;
      }
    }
    
    // Calculate tier discount amount
    if (tierDiscountRate > 0) {
      tierDiscountAmount = Math.round(baseTotal * tierDiscountRate);
    }
    
    // Determine subscription discount (if applicable)
    let subscriptionDiscountAmount = 0;
    
    if (isSubscriber) {
      // Apply subscription discount after tier discount
      const amountAfterTierDiscount = baseTotal - tierDiscountAmount;
      subscriptionDiscountAmount = Math.round(amountAfterTierDiscount * SUBSCRIPTION_DISCOUNT);
    }
    
    // Calculate subtotal after all discounts
    const subtotalAfterDiscounts = baseTotal - tierDiscountAmount - subscriptionDiscountAmount;
    
    // Calculate shipping cost based on order amount
    let shippingCost = 0;
    
    // Find the applicable shipping rule based on order subtotal
    for (const rule of SHIPPING_RULES) {
      if (subtotalAfterDiscounts >= rule.threshold) {
        shippingCost = rule.cost;
        break;
      }
    }
    
    // Calculate tax
    const taxAmount = Math.round((subtotalAfterDiscounts + shippingCost) * TAX_RATE);
    
    // Calculate grand total
    const grandTotal = subtotalAfterDiscounts + shippingCost + taxAmount;
    
    // Format discount percentages for display
    const tierDiscountApplied = tierDiscountRate > 0 ? `${tierDiscountRate * 100}%` : '0%';
    const subscriptionDiscountApplied = isSubscriber ? `${SUBSCRIPTION_DISCOUNT * 100}%` : '0%';
    
    // Prepare the full price breakdown
    const breakdown: PriceBreakdown = {
      baseTotal,
      tierDiscountRate,
      tierDiscountApplied,
      tierDiscountAmount,
      subscriptionDiscountRate: isSubscriber ? SUBSCRIPTION_DISCOUNT : 0,
      subscriptionDiscountApplied,
      subscriptionDiscountAmount,
      subtotalAfterDiscounts,
      shippingCost,
      taxAmount,
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
        tierDiscountRate: 0,
        tierDiscountApplied: '0%',
        tierDiscountAmount: 0,
        subscriptionDiscountRate: 0,
        subscriptionDiscountApplied: '0%',
        subscriptionDiscountAmount: 0,
        subtotalAfterDiscounts: 0,
        shippingCost: 0,
        taxAmount: 0,
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
    tierDiscounts: TIER_DISCOUNTS.map(tier => ({
      threshold: tier.threshold,
      discount: `${tier.discount * 100}%`
    })),
    subscriptionDiscount: `${SUBSCRIPTION_DISCOUNT * 100}%`,
    shipping: SHIPPING_RULES,
    tax: TAX_RATE
  };
}