import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrderStore } from '@/hooks/use-order-store';
import { PriceBreakdown, OrderDetails } from '@/hooks/use-order-types';
import { Check, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription-store';
import { BASE_PRICES } from '@shared/pricing';

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
  
  // Helper functions for tier discounts and shipping have been removed
  // as part of the pricing simplification
  
  /**
   * Check if a product should use a bundle price instead of individual pricing
   */
  function shouldUseBundlePrice(items: any[]): {useBundle: boolean, bundleType: string} {
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
      sport
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
    
    // According to shared/pricing.ts, pricing has been simplified to remove all discounts,
    // shipping costs, and taxes. Using the simplified model.
    
    // Grand total is the same as subtotal in the simplified model
    const grandTotal = subtotal;
    
    console.log('Price breakdown:', {
      baseTotal,
      subtotal,
      grandTotal,
      itemCount
    });
    
    // Set the price breakdown using the simplified pricing model
    setPriceBreakdown({
      baseTotal,
      subtotal,
      grandTotal,
      itemCount
    });
    
    // Create and set order details
    const orderDetails: OrderDetails = {
      items,
      addOns,
      isTeamOrder,
      packageType: isTeamOrder ? 'team' : 'individual',
      teamMembers: isTeamOrder ? teamMembers : undefined,
      priceBreakdown: {
        baseTotal,
        subtotal,
        grandTotal,
        itemCount
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