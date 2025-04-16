import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrderStore } from '@/hooks/use-order-store';
import { PriceBreakdown, OrderDetails } from '@/hooks/use-order-types';
import { Check, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription-store';
import { 
  BASE_PRICES, 
  TIER_DISCOUNTS, 
  SUBSCRIPTION_DISCOUNT, 
  SHIPPING_RULES,
  TAX_RATE
} from '@shared/pricing';

export default function PriceCalculator() {
  const { 
    items, 
    addOns, 
    teamMembers, 
    isTeamOrder, 
    sport,
    priceBreakdown, 
    setOrderDetails,
    setPriceBreakdown
  } = useOrderStore();
  
  // Get user subscription status
  const { user } = useAuth();
  const subscription = useSubscription();
  
  // Calculate price breakdown on component mount and when items change
  useEffect(() => {
    calculatePriceBreakdown();
  }, [items, addOns, teamMembers, isTeamOrder, sport, subscription.isSubscribed]);
  
  /**
   * Helper function to get tiered discount rate based on quantity
   */
  function getTieredDiscountRate(quantity: number): number {
    for (const tier of TIER_DISCOUNTS) {
      if (quantity >= tier.threshold) {
        return tier.discount;
      }
    }
    return 0;
  }
  
  /**
   * Helper function to calculate shipping cost based on subtotal
   */
  function calculateShipping(subtotal: number): number {
    for (const rule of SHIPPING_RULES) {
      if (subtotal >= rule.threshold) {
        return rule.cost;
      }
    }
    // Fallback to the last rule's cost (highest shipping cost)
    return SHIPPING_RULES[SHIPPING_RULES.length - 1].cost;
  }
  
  /**
   * Check if a product should use a bundle price instead of individual pricing
   */
  function shouldUseBundlePrice(items: OrderItem[]): {useBundle: boolean, bundleType: string} {
    // Check for soccer full kit (jersey + shorts + socks)
    if (sport === 'soccer') {
      const hasJersey = items.some(item => item.type === 'jersey');
      const hasShorts = items.some(item => item.type === 'shorts');
      const hasSocks = addOns.some(addon => addon.type === 'socks');
      
      if (hasJersey && hasShorts && hasSocks) {
        return {useBundle: true, bundleType: 'soccer_full_kit'};
      }
      
      if (hasJersey && hasShorts) {
        return {useBundle: true, bundleType: 'soccer_jersey_short'};
      }
    }
    
    // Check for cricket kit
    if (sport === 'cricket') {
      const hasJersey = items.some(item => item.type === 'jersey');
      const hasTrouser = items.some(item => item.type === 'trouser');
      
      if (hasJersey && hasTrouser) {
        return {useBundle: true, bundleType: 'cricket_jersey_trouser'};
      }
    }
    
    // Check for basketball kit
    if (sport === 'basketball') {
      const hasJersey = items.some(item => item.type === 'jersey');
      const hasShorts = items.some(item => item.type === 'shorts');
      
      if (hasJersey && hasShorts) {
        return {useBundle: true, bundleType: 'basketball_jersey_shorts'};
      }
    }
    
    return {useBundle: false, bundleType: ''};
  }
  
  // Calculate the price breakdown based on items, add-ons, and team status
  const calculatePriceBreakdown = () => {
    if (items.length === 0) {
      setPriceBreakdown(null);
      return;
    }
    
    console.log('Starting price calculation with:', {
      items, 
      addOns, 
      teamMembers, 
      isTeamOrder,
      sport,
      isSubscribed: subscription.isSubscribed
    });
    
    // Check if we should use bundle pricing
    const {useBundle, bundleType} = shouldUseBundlePrice(items);
    
    // Calculate subtotal from items and add-ons
    let subtotal = 0;
    
    if (useBundle && BASE_PRICES[bundleType]) {
      console.log(`Using bundle pricing: ${bundleType} at $${BASE_PRICES[bundleType]}`);
      subtotal = BASE_PRICES[bundleType];
      
      // Add remaining items that are not part of the bundle
      if (bundleType === 'soccer_full_kit') {
        const nonBundleItems = items.filter(item => 
          item.type !== 'jersey' && item.type !== 'shorts');
        subtotal += nonBundleItems.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0);
          
        // Add non-sock add-ons
        const nonSockAddOns = addOns.filter(addon => addon.type !== 'socks');
        subtotal += nonSockAddOns.reduce((sum, addon) => sum + addon.price, 0);
      } else {
        // For other bundles, just add all add-ons
        subtotal += addOns.reduce((sum, addon) => sum + addon.price, 0);
      }
    } else {
      // Standard item-based pricing
      subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      subtotal += addOns.reduce((sum, addon) => sum + addon.price, 0);
    }
    
    // Determine base total (before any discounts)
    const baseTotal = subtotal;
    
    // Count total items
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0) + addOns.length;
    
    // Calculate tier discount if applicable
    let tierDiscountRate = 0;
    let tierDiscountAmount = 0;
    let tierDiscountApplied = false;
    let discountPercentage = 0;
    
    if (isTeamOrder) {
      // Use team members count for quantity discount
      tierDiscountRate = getTieredDiscountRate(teamMembers.length);
      if (tierDiscountRate > 0) {
        tierDiscountApplied = true;
        // Convert to percentage for display
        discountPercentage = tierDiscountRate * 100;
        tierDiscountAmount = subtotal * tierDiscountRate;
        console.log(`Applied tier discount: ${discountPercentage}% on ${teamMembers.length} members = $${tierDiscountAmount.toFixed(2)}`);
      }
    } else {
      // Use item quantity for discount
      tierDiscountRate = getTieredDiscountRate(itemCount);
      if (tierDiscountRate > 0) {
        tierDiscountApplied = true;
        // Convert to percentage for display
        discountPercentage = tierDiscountRate * 100;
        tierDiscountAmount = subtotal * tierDiscountRate;
        console.log(`Applied tier discount: ${discountPercentage}% on ${itemCount} items = $${tierDiscountAmount.toFixed(2)}`);
      }
    }
    
    // Apply subscription discount if applicable
    const isSubscriber = subscription.isSubscribed || user?.subscriptionTier === 'pro';
    const subscriptionDiscountApplied = isSubscriber;
    let subscriptionDiscountAmount = 0;
    
    if (subscriptionDiscountApplied) {
      // Apply subscription discount on the amount after tier discount
      const amountAfterTierDiscount = subtotal - tierDiscountAmount;
      subscriptionDiscountAmount = amountAfterTierDiscount * SUBSCRIPTION_DISCOUNT;
      console.log(`Applied subscription discount: ${SUBSCRIPTION_DISCOUNT * 100}% on $${amountAfterTierDiscount.toFixed(2)} = $${subscriptionDiscountAmount.toFixed(2)}`);
    }
    
    // Calculate total discount
    const discount = tierDiscountAmount + subscriptionDiscountAmount;
    
    // Calculate shipping based on subtotal after discounts
    const subtotalAfterDiscounts = subtotal - discount;
    const shipping = calculateShipping(subtotalAfterDiscounts);
    const shippingFreeThresholdApplied = shipping === 0;
    
    // Calculate tax
    const priceBeforeTax = subtotalAfterDiscounts + shipping;
    const tax = priceBeforeTax * TAX_RATE;
    
    // Calculate grand total
    const grandTotal = priceBeforeTax + tax;
    
    console.log('Price breakdown:', {
      baseTotal,
      tierDiscount: tierDiscountAmount,
      tierDiscountRate,
      subscriptionDiscount: subscriptionDiscountAmount,
      subtotalAfterDiscounts,
      shipping,
      tax,
      grandTotal
    });
    
    // Set the price breakdown
    setPriceBreakdown({
      subtotal,
      discount,
      discountPercentage,
      shipping,
      tax,
      grandTotal,
      itemCount,
      baseTotal,
      tierDiscountApplied,
      tierDiscountAmount,
      subscriptionDiscountApplied,
      subscriptionDiscountAmount,
      shippingFreeThresholdApplied,
      priceBeforeTax
    });
    
    // Create and set order details
    const orderDetails: OrderDetails = {
      items,
      addOns,
      isTeamOrder,
      packageType: isTeamOrder ? 'team' : 'individual',
      teamMembers: isTeamOrder ? teamMembers : undefined,
      priceBreakdown: {
        subtotal,
        discount,
        discountPercentage,
        shipping,
        tax,
        grandTotal,
        itemCount,
        baseTotal,
        tierDiscountApplied,
        tierDiscountAmount,
        subscriptionDiscountApplied,
        subscriptionDiscountAmount,
        shippingFreeThresholdApplied,
        priceBeforeTax
      }
    };
    
    setOrderDetails(orderDetails);
  };
  
  if (!priceBreakdown) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Add items to see the price breakdown</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Price Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${priceBreakdown.subtotal.toFixed(2)}</span>
        </div>
        
        {priceBreakdown.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-${priceBreakdown.discount.toFixed(2)}</span>
          </div>
        )}
        
        {priceBreakdown.tierDiscountApplied && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Check className="h-3 w-3 mr-1 text-green-600" />
            <span>Team discount ({priceBreakdown.discountPercentage}%)</span>
          </div>
        )}
        
        {priceBreakdown.subscriptionDiscountApplied && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Check className="h-3 w-3 mr-1 text-green-600" />
            <span>Pro member discount (10%)</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Shipping</span>
          {priceBreakdown.shippingFreeThresholdApplied ? (
            <span className="text-green-600">FREE</span>
          ) : (
            <span>${priceBreakdown.shipping.toFixed(2)}</span>
          )}
        </div>
        
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${priceBreakdown.tax.toFixed(2)}</span>
        </div>
        
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>${priceBreakdown.grandTotal.toFixed(2)}</span>
          </div>
          
          <div className="text-sm text-muted-foreground mt-1">
            {priceBreakdown.itemCount} item{priceBreakdown.itemCount !== 1 ? 's' : ''}
          </div>
        </div>
        
        <Button className="w-full mt-4 gap-2">
          <ShoppingCart className="h-4 w-4" />
          Proceed to Checkout
        </Button>
      </CardContent>
    </Card>
  );
}