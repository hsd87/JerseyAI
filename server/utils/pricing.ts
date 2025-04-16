import { 
  BASE_PRICES, 
  TIER_DISCOUNTS, 
  SHIPPING_RULES,
  TAX_RATE,
  SUBSCRIPTION_DISCOUNT,
  PriceBreakdown
} from '@shared/pricing';

export interface CartItem {
  productId: string;
  productType: string;
  basePrice: number;
  quantity: number;
}

/**
 * Calculate price breakdown for a cart of items
 * 
 * @param items Array of items in cart with product ID and quantity
 * @param isSubscriber Whether the user has a subscription
 * @returns Price breakdown object with all calculated values
 */
export function calculatePrice(items: CartItem[], isSubscriber: boolean = false): PriceBreakdown {
  // Calculate base total
  const baseTotal = items.reduce((total, item) => {
    return total + (item.basePrice * item.quantity);
  }, 0);
  
  // Calculate total quantity for tier discount
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Apply tier discount
  let tierDiscountRate = 0;
  for (const tier of TIER_DISCOUNTS) {
    if (totalQuantity >= tier.threshold) {
      tierDiscountRate = tier.discount;
      break;
    }
  }
  const tierDiscount = Math.round(baseTotal * tierDiscountRate * 100) / 100;
  
  // Apply subscription discount if applicable
  const subscriptionDiscountRate = isSubscriber ? SUBSCRIPTION_DISCOUNT : 0;
  const subscriptionDiscount = Math.round(baseTotal * subscriptionDiscountRate * 100) / 100;
  
  // Calculate subtotal after discounts
  const subtotal = baseTotal - tierDiscount - subscriptionDiscount;
  
  // Calculate shipping
  let shipping = SHIPPING_RULES[SHIPPING_RULES.length - 1].cost; // Default to highest cost
  for (const rule of SHIPPING_RULES) {
    if (subtotal >= rule.threshold) {
      shipping = rule.cost;
      break;
    }
  }
  
  // Calculate tax
  const tax = Math.round((subtotal + shipping) * TAX_RATE * 100) / 100;
  
  // Calculate grand total
  const grandTotal = subtotal + shipping + tax;
  
  return {
    baseTotal,
    tierDiscount,
    tierDiscountRate,
    subscriptionDiscount,
    subscriptionDiscountRate,
    shipping,
    tax,
    subtotal,
    grandTotal
  };
}