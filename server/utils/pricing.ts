/**
 * Pricing utility for calculating cart totals with various discount rules
 * 
 * Features:
 * - Applies quantity-based tier discounts
 * - Applies subscription discounts
 * - Calculates shipping costs based on order total
 * - Returns detailed breakdown of pricing calculations
 */

// Cart item definition
export interface CartItem {
  productId: string;
  productType: "jersey" | "jersey_shorts" | "kit";
  basePrice: number;
  quantity: number;
}

// Price breakdown response
export interface PriceBreakdown {
  baseTotal: number;
  tierDiscountApplied: string;
  tierDiscountAmount: number;
  subscriptionDiscountApplied: string;
  subscriptionDiscountAmount: number;
  subtotalAfterDiscounts: number;
  shippingCost: number;
  grandTotal: number;
}

/**
 * Get the tier discount percentage based on quantity
 * - 50+ items: 15% discount
 * - 20-49 items: 10% discount
 * - 10-19 items: 5% discount
 * - Less than 10 items: No discount
 */
function getTierDiscountPercentage(totalQuantity: number): number {
  if (totalQuantity >= 50) return 0.15;
  if (totalQuantity >= 20) return 0.10;
  if (totalQuantity >= 10) return 0.05;
  return 0;
}

/**
 * Get the shipping cost based on the order subtotal
 * - Orders under $200: $30 shipping
 * - Orders between $200-$499: $20 shipping
 * - Orders $500+: Free shipping
 */
function getShippingCost(subtotal: number): number {
  if (subtotal >= 500) return 0;
  if (subtotal >= 200) return 20;
  return 30;
}

/**
 * Calculate the final price with full breakdown for a cart
 * 
 * @param cart Array of cart items
 * @param isSubscriber Whether the user has an active subscription
 * @returns Complete price breakdown including all discounts and shipping
 */
export function calculateFinalPrice(cart: CartItem[], isSubscriber: boolean): PriceBreakdown {
  // Calculate base total and total quantity
  const baseTotal = cart.reduce((total, item) => total + (item.basePrice * item.quantity), 0);
  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  
  // Apply tier discount based on total quantity
  const tierDiscountPercentage = getTierDiscountPercentage(totalQuantity);
  const tierDiscountAmount = Math.round(baseTotal * tierDiscountPercentage);
  const afterTierDiscount = baseTotal - tierDiscountAmount;
  
  // Apply subscription discount if applicable (10% off the already discounted price)
  const subscriptionDiscountPercentage = isSubscriber ? 0.10 : 0;
  const subscriptionDiscountAmount = Math.round(afterTierDiscount * subscriptionDiscountPercentage);
  const subtotalAfterDiscounts = afterTierDiscount - subscriptionDiscountAmount;
  
  // Calculate shipping cost
  const shippingCost = getShippingCost(subtotalAfterDiscounts);
  
  // Calculate grand total
  const grandTotal = subtotalAfterDiscounts + shippingCost;
  
  // Format percentages for display
  const tierDiscountApplied = tierDiscountPercentage > 0 ? `${tierDiscountPercentage * 100}%` : "0%";
  const subscriptionDiscountApplied = subscriptionDiscountPercentage > 0 ? "10%" : "0%";
  
  // Return complete breakdown
  return {
    baseTotal,
    tierDiscountApplied,
    tierDiscountAmount,
    subscriptionDiscountApplied,
    subscriptionDiscountAmount,
    subtotalAfterDiscounts,
    shippingCost,
    grandTotal
  };
}

/**
 * Format price breakdown for display
 * 
 * @param breakdown Price breakdown object
 * @returns Formatted price breakdown with currency symbols
 */
export function formatPriceBreakdown(breakdown: PriceBreakdown): Record<string, string> {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  
  return {
    baseTotal: formatter.format(breakdown.baseTotal / 100),
    tierDiscountApplied: breakdown.tierDiscountApplied,
    tierDiscountAmount: formatter.format(breakdown.tierDiscountAmount / 100),
    subscriptionDiscountApplied: breakdown.subscriptionDiscountApplied,
    subscriptionDiscountAmount: formatter.format(breakdown.subscriptionDiscountAmount / 100),
    subtotalAfterDiscounts: formatter.format(breakdown.subtotalAfterDiscounts / 100),
    shippingCost: formatter.format(breakdown.shippingCost / 100),
    grandTotal: formatter.format(breakdown.grandTotal / 100)
  };
}