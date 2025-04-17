import React, { useEffect, useState } from 'react';
import {
  PRODUCTS,
  PACKAGE_ITEMS,
  getProductBySku,
  calculateQuantityDiscount
} from '@shared/product-configs';
import { 
  BASE_PRICES, 
  TIER_DISCOUNTS, 
  SUBSCRIPTION_DISCOUNT,
  SHIPPING_RULES,
  TAX_RATE
} from '@shared/pricing';
import { useOrderStore } from '@/hooks/use-order-store';
import { PackageItem, OrderAddon, PriceBreakdown } from '@/hooks/use-order-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface OrderPriceCalculatorProps {
  className?: string;
}

export function OrderPriceCalculator({ className }: OrderPriceCalculatorProps) {
  const {
    packageType,
    packageItems,
    addOns,
    isTeamOrder,
    teamMembers,
    setPriceBreakdown
  } = useOrderStore();

  // Get user's subscription status
  const { data: user } = useQuery({ 
    queryKey: ['/api/user'],
    staleTime: Infinity 
  });
  
  const { data: subscriptionData } = useQuery<{ isSubscribed: boolean }>({
    queryKey: ['/api/subscription/status'],
    staleTime: Infinity
  });

  const isSubscribed = subscriptionData?.isSubscribed || false;

  const [priceBreakdown, setPriceState] = useState<PriceBreakdown>({
    subtotal: 0,
    discount: 0,
    discountPercentage: 0,
    shipping: 15,
    tax: 0,
    grandTotal: 0,
    itemCount: 0,
    baseTotal: 0,
    tierDiscountApplied: false,
    tierDiscountAmount: 0,
    subscriptionDiscountApplied: false,
    subscriptionDiscountAmount: 0,
    shippingFreeThresholdApplied: false,
    priceBeforeTax: 0
  });

  // Calculate the total number of items and prices
  useEffect(() => {
    try {
      // Validate required data is available
      if (!packageItems) {
        console.log('Price calculation skipped - no package items available');
        return;
      }
      
      let itemCount = 0;
      let baseTotal = 0;
      let itemSubtotal = 0;
      let bundleSavings = 0;
      let bundleApplied = false;

      // Calculate package items price
      if (packageItems.length > 0) {
        // First check if this is a complete bundle that qualifies for bundle pricing
        const jerseyItem = packageItems.find(item => item && item.type === 'jersey');
        const shortsItem = packageItems.find(item => item && item.type === 'shorts');
        const socksItem = packageItems.find(item => item && item.type === 'socks');
        
        // Determine if a bundle price should be applied
        const isFullKit = jerseyItem && shortsItem && socksItem;
        const isJerseyShorts = jerseyItem && shortsItem;
        
        // Handle regular pricing first
        packageItems.forEach((item: PackageItem) => {
          // Skip invalid items to prevent errors
          if (!item || !item.sizes) return;
          
          try {
            const totalQuantity = item.sizes.reduce((sum, size) => sum + (size.quantity || 0), 0);
            itemCount += totalQuantity;
            
            // We'll add prices later after checking for bundles
            const itemTotal = (item.price || 0) * totalQuantity;
            baseTotal += itemTotal;
          } catch (err) {
            console.warn(`Error processing package item: ${item?.id || 'unknown'}`, err);
          }
        });
        
        // Apply bundle pricing if applicable
        // This is done for efficiency by first calculating all individual prices,
        // then applying bundle discounts as needed
        if (isFullKit && sport) {
          const individualPrice = baseTotal;
          const bundleKey = `${sport}_full_kit`;
          
          if (BASE_PRICES[bundleKey]) {
            const bundleUnitPrice = BASE_PRICES[bundleKey];
            // Determine how many full kits we have (based on jersey quantity)
            const jerseyQuantity = jerseyItem.sizes.reduce((sum, size) => sum + (size.quantity || 0), 0);
            
            // Calculate bundle total (jerseyQuantity is our multiplier for number of kits)
            const bundleTotal = bundleUnitPrice * jerseyQuantity;
            
            if (bundleTotal < individualPrice) {
              bundleSavings = individualPrice - bundleTotal;
              baseTotal = bundleTotal;
              bundleApplied = true;
              console.log(`Bundle pricing applied: ${bundleSavings.toFixed(2)} saved with ${sport}_full_kit bundle`);
            }
          }
        } else if (isJerseyShorts && sport) {
          // Similar logic for jersey+shorts bundle
          const bundleKey = `${sport}_jersey_shorts`;
          if (BASE_PRICES[bundleKey]) {
            const jerseyQuantity = jerseyItem.sizes.reduce((sum, size) => sum + (size.quantity || 0), 0);
            const shortsQuantity = shortsItem.sizes.reduce((sum, size) => sum + (size.quantity || 0), 0);
            const bundleCount = Math.min(jerseyQuantity, shortsQuantity);
            
            // Calculate price for bundle items
            const bundleTotal = BASE_PRICES[bundleKey] * bundleCount;
            
            // Calculate price for individual items without bundle
            const jerseyPrice = (jerseyItem.price || 0) * bundleCount;
            const shortsPrice = (shortsItem.price || 0) * bundleCount;
            const individualBundledItems = jerseyPrice + shortsPrice;
            
            // Apply bundle if it's cheaper
            if (bundleTotal < individualBundledItems) {
              const savingsAmount = individualBundledItems - bundleTotal;
              baseTotal -= savingsAmount;
              bundleSavings = savingsAmount;
              bundleApplied = true;
              console.log(`Bundle pricing applied: ${bundleSavings.toFixed(2)} saved with ${sport}_jersey_shorts bundle`);
            }
          }
        }
      }

      // Calculate add-ons price
      if (addOns && addOns.length > 0) {
        addOns.forEach((addon) => {
          if (!addon) return;
          
          try {
            itemCount += addon.quantity || 0;
            const product = getProductBySku(addon.id);
            if (product) {
              baseTotal += (product.basePrice || 0) * (addon.quantity || 0);
            } else {
              // If product not found, use the addon's direct price
              baseTotal += (addon.price || 0) * (addon.quantity || 0);
            }
          } catch (err) {
            console.warn(`Error processing addon: ${addon?.id || 'unknown'}`, err);
          }
        });
      }

      // If it's a team order, use the team members to calculate jerseys
      if (isTeamOrder && teamMembers && teamMembers.length > 0 && packageItems.length > 0) {
        try {
          // For team orders, we replace the normal jersey counts with team member counts
          // This is because each team member gets their own customized jersey
          const jerseyItem = packageItems.find((item) => item && item.type === 'jersey');
          if (jerseyItem) {
            // Remove the jersey quantity from the previous count
            const jerseyQuantity = jerseyItem.sizes.reduce((sum, size) => sum + (size.quantity || 0), 0);
            itemCount = itemCount - jerseyQuantity + teamMembers.length;
            baseTotal = baseTotal - ((jerseyItem.price || 0) * jerseyQuantity) + ((jerseyItem.price || 0) * teamMembers.length);
          }
        } catch (err) {
          console.warn('Error calculating team order pricing', err);
        }
      }

      // Calculate tier discount based on quantity
      let tierDiscountRate = 0;
      
      // Sort TIER_DISCOUNTS in descending order to apply highest discount first
      for (const tier of [...TIER_DISCOUNTS].sort((a, b) => b.threshold - a.threshold)) {
        if (itemCount >= tier.threshold) {
          tierDiscountRate = tier.discount;
          break;
        }
      }
      
      // Ensure we have positive values to prevent NaN errors
      itemCount = Math.max(0, itemCount);
      baseTotal = Math.max(0, baseTotal);
      
      // Apply tiered quantity discount
      const tierDiscountAmount = baseTotal * tierDiscountRate;
      const tierDiscountApplied = tierDiscountRate > 0;
      console.log(`Tier discount: ${(tierDiscountRate * 100).toFixed(0)}% (${tierDiscountAmount.toFixed(2)}) for ${itemCount} items`);
      
      // Apply quantity discount
      itemSubtotal = baseTotal - tierDiscountAmount;
      
      // Apply subscription discount if user is subscribed
      let subscriptionDiscountAmount = 0;
      let subscriptionDiscountApplied = false;
      
      if (isSubscribed) {
        subscriptionDiscountAmount = itemSubtotal * SUBSCRIPTION_DISCOUNT;
        itemSubtotal -= subscriptionDiscountAmount;
        subscriptionDiscountApplied = true;
        console.log(`Subscription discount: ${(SUBSCRIPTION_DISCOUNT * 100).toFixed(0)}% (${subscriptionDiscountAmount.toFixed(2)})`);
      }
      
      // Calculate shipping using the rules from the shared pricing module
      let shippingCost = SHIPPING_RULES[SHIPPING_RULES.length - 1].cost; // Default to highest cost
      let shippingFreeThresholdApplied = false;
      
      // Find the applicable shipping rule (rules are pre-sorted by threshold)
      for (const rule of SHIPPING_RULES) {
        if (itemSubtotal >= rule.threshold) {
          shippingCost = rule.cost;
          shippingFreeThresholdApplied = rule.cost === 0;
          break;
        }
      }
      
      console.log(`Shipping cost: $${shippingCost.toFixed(2)} (Free shipping threshold applied: ${shippingFreeThresholdApplied})`);

      // Calculate tax using the centralized tax rate
      const priceBeforeTax = itemSubtotal + shippingCost;
      const taxAmount = itemSubtotal * TAX_RATE;
      const grandTotal = priceBeforeTax + taxAmount;
      
      console.log(`Tax (${(TAX_RATE * 100).toFixed(0)}%): $${taxAmount.toFixed(2)}`);
      console.log(`Total: $${grandTotal.toFixed(2)}`);
      
      // Check for potential division by zero or NaN
      const discountPercentage = baseTotal > 0 
        ? (tierDiscountAmount + subscriptionDiscountAmount + bundleSavings) / baseTotal
        : 0;
        
      // Build final price breakdown with guaranteed safe values
      const breakdown: PriceBreakdown = {
        subtotal: Number(itemSubtotal.toFixed(2)) || 0,
        discount: Number((tierDiscountAmount + subscriptionDiscountAmount + bundleSavings).toFixed(2)) || 0,
        discountPercentage: Number(discountPercentage.toFixed(4)) || 0,
        shipping: Number(shippingCost.toFixed(2)) || 0,
        tax: Number(taxAmount.toFixed(2)) || 0,
        grandTotal: Number(grandTotal.toFixed(2)) || 0,
        itemCount: itemCount || 0,
        baseTotal: Number(baseTotal.toFixed(2)) || 0,
        tierDiscountApplied: tierDiscountApplied || false,
        tierDiscountAmount: Number(tierDiscountAmount.toFixed(2)) || 0,
        subscriptionDiscountApplied: subscriptionDiscountApplied || false,
        subscriptionDiscountAmount: Number(subscriptionDiscountAmount.toFixed(2)) || 0,
        shippingFreeThresholdApplied: shippingFreeThresholdApplied || false,
        priceBeforeTax: Number(priceBeforeTax.toFixed(2)) || 0,
        bundleSavings: Number(bundleSavings.toFixed(2)) || 0,
        bundleApplied: bundleApplied || false
      };
      
      // Update local state
      setPriceState(breakdown);
      
      // Update global order state with the price breakdown if available
      if (typeof setPriceBreakdown === 'function') {
        setPriceBreakdown(breakdown);
      }
      
    } catch (err) {
      console.error("Failed to update price breakdown:", err);
      
      // Set a safe fallback price breakdown on error
      const basePrice = Array.isArray(packageItems) 
        ? packageItems.reduce((sum, item) => sum + (item?.price || 0), 0) 
        : 0;
        
      const safeBreakdown: PriceBreakdown = {
        subtotal: basePrice,
        discount: 0,
        discountPercentage: 0,
        shipping: 15,
        tax: basePrice * TAX_RATE,
        grandTotal: basePrice + 15 + (basePrice * TAX_RATE),
        itemCount: Array.isArray(packageItems) ? packageItems.length : 0,
        baseTotal: basePrice,
        tierDiscountApplied: false,
        tierDiscountAmount: 0,
        subscriptionDiscountApplied: false,
        subscriptionDiscountAmount: 0,
        shippingFreeThresholdApplied: false,
        priceBeforeTax: basePrice + 15,
        bundleSavings: 0,
        bundleApplied: false
      };
      
      // Update local state with fallback
      setPriceState(safeBreakdown);
      
      // Update global state if function is available
      if (typeof setPriceBreakdown === 'function') {
        try {
          setPriceBreakdown(safeBreakdown);
        } catch (setPriceErr) {
          console.error("Failed to set price breakdown in store:", setPriceErr);
        }
      }
      
      // Log detailed debugging information
      console.log('Debug pricing info:', {
        packageType: packageType || 'unknown',
        packageItems: packageItems || [],
        packageItemsCount: packageItems?.length || 0,
        addOns: addOns || [],
        addOnsCount: addOns?.length || 0,
        isTeamOrder: isTeamOrder || false,
        teamMembers: teamMembers || [],
        teamMembersCount: teamMembers?.length || 0
      });
    }
  }, [packageItems, addOns, isTeamOrder, teamMembers, packageType, isSubscribed, setPriceBreakdown, sport]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal ({priceBreakdown.itemCount} items)</span>
            <span>${priceBreakdown.baseTotal.toFixed(2)}</span>
          </div>

          {priceBreakdown.tierDiscountApplied && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Quantity Discount ({(calculateQuantityDiscount(priceBreakdown.itemCount) * 100).toFixed(0)}%)
              </span>
              <span>-${priceBreakdown.tierDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          
          {priceBreakdown.subscriptionDiscountApplied && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Pro Subscription ({(SUBSCRIPTION_DISCOUNT * 100).toFixed(0)}%)
              </span>
              <span>-${priceBreakdown.subscriptionDiscountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="flex items-center">
              <Truck className="mr-2 h-4 w-4" /> Shipping
              {priceBreakdown.shippingFreeThresholdApplied && (
                <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                  FREE
                </Badge>
              )}
            </span>
            <span>{priceBreakdown.shipping > 0 ? `$${priceBreakdown.shipping.toFixed(2)}` : 'FREE'}</span>
          </div>
          
          <div className="flex justify-between text-muted-foreground">
            <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
            <span>${priceBreakdown.tax.toFixed(2)}</span>
          </div>

          <div className="border-t pt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>${priceBreakdown.grandTotal.toFixed(2)}</span>
          </div>

          <div className="pt-2 text-sm text-muted-foreground">
            <p>All prices in USD. Tax calculated at {(TAX_RATE * 100).toFixed(0)}%.</p>
            {priceBreakdown.shippingFreeThresholdApplied && (
              <p className="mt-2 text-green-600">
                You qualify for FREE shipping on orders over ${SHIPPING_RULES[0].threshold}!
              </p>
            )}
            {isTeamOrder && (
              <p className="mt-2 text-green-600">
                Team orders with {TIER_DISCOUNTS[2].threshold}+ items receive a {(TIER_DISCOUNTS[2].discount * 100).toFixed(0)}% discount!
              </p>
            )}
            {!priceBreakdown.subscriptionDiscountApplied && (
              <p className="mt-2">
                Subscribe to Pro for an additional {(SUBSCRIPTION_DISCOUNT * 100).toFixed(0)}% off all orders.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}