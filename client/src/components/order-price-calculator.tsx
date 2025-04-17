import React, { useEffect, useState } from 'react';
import {
  PRODUCTS,
  PACKAGE_ITEMS,
  getProductBySku,
  calculateQuantityDiscount
} from '@shared/product-configs';
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
  
  const { data: subscriptionData } = useQuery({
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
      let itemCount = 0;
      let baseTotal = 0;
      let itemSubtotal = 0;

      // Calculate package items price
      if (packageItems && packageItems.length > 0) {
        packageItems.forEach((item: PackageItem) => {
          const totalQuantity = item.sizes.reduce((sum, size) => sum + size.quantity, 0);
          itemCount += totalQuantity;
          baseTotal += item.price * totalQuantity;
        });
      }

      // Calculate add-ons price
      if (addOns && addOns.length > 0) {
        addOns.forEach((addon) => {
          itemCount += addon.quantity;
          const product = getProductBySku(addon.id);
          if (product) {
            baseTotal += product.basePrice * addon.quantity;
          }
        });
      }

      // If it's a team order, use the team members to calculate jerseys
      if (isTeamOrder && teamMembers && teamMembers.length > 0 && packageItems && packageItems.length > 0) {
        // For team orders, we replace the normal jersey counts with team member counts
        // This is because each team member gets their own customized jersey
        const jerseyItem = packageItems.find((item) => item && item.type === 'jersey');
        if (jerseyItem) {
          // Remove the jersey quantity from the previous count
          const jerseyQuantity = jerseyItem.sizes.reduce((sum, size) => sum + size.quantity, 0);
          itemCount = itemCount - jerseyQuantity + teamMembers.length;
          baseTotal = baseTotal - (jerseyItem.price * jerseyQuantity) + (jerseyItem.price * teamMembers.length);
        }
      }

      // Calculate tier discount based on quantity
      const tierDiscountRate = calculateQuantityDiscount(itemCount);
      const tierDiscountAmount = baseTotal * tierDiscountRate;
      const tierDiscountApplied = tierDiscountRate > 0;
      
      // Apply discount
      itemSubtotal = baseTotal - tierDiscountAmount;
      
      // Apply subscription discount (10% off) if user is subscribed
      let subscriptionDiscountAmount = 0;
      let subscriptionDiscountApplied = false;
      
      if (isSubscribed) {
        subscriptionDiscountAmount = itemSubtotal * 0.1; // 10% off for subscribers
        itemSubtotal -= subscriptionDiscountAmount;
        subscriptionDiscountApplied = true;
      }
      
      // Calculate shipping - free for orders over $200, $20 for orders over $100, otherwise $30
      let shippingCost = 30;
      let shippingFreeThresholdApplied = false;
      
      if (itemSubtotal > 200) {
        shippingCost = 0;
        shippingFreeThresholdApplied = true;
      } else if (itemSubtotal >= 100) {
        shippingCost = 20;
      }

      // Calculate tax (7%)
      const priceBeforeTax = itemSubtotal + shippingCost;
      const taxAmount = itemSubtotal * 0.07;
      const grandTotal = priceBeforeTax + taxAmount;
      
      // Build final price breakdown
      const breakdown: PriceBreakdown = {
        subtotal: itemSubtotal,
        discount: tierDiscountAmount + subscriptionDiscountAmount,
        discountPercentage: (tierDiscountAmount + subscriptionDiscountAmount) / baseTotal,
        shipping: shippingCost,
        tax: taxAmount,
        grandTotal: grandTotal,
        itemCount: itemCount,
        baseTotal: baseTotal,
        tierDiscountApplied: tierDiscountApplied,
        tierDiscountAmount: tierDiscountAmount,
        subscriptionDiscountApplied: subscriptionDiscountApplied,
        subscriptionDiscountAmount: subscriptionDiscountAmount,
        shippingFreeThresholdApplied: shippingFreeThresholdApplied,
        priceBeforeTax: priceBeforeTax
      };
      
      setPriceState(breakdown);
      
      // Update global order state with the price breakdown
      setPriceBreakdown(breakdown);
      
      // Log price details for debugging
      console.log('Price Breakdown:', {
        quantity: itemCount,
        baseTotal,
        tierDiscount: tierDiscountAmount,
        tierDiscountRate,
        subscriptionDiscount: subscriptionDiscountAmount,
        subtotal: itemSubtotal,
        shipping: shippingCost,
        tax: taxAmount,
        finalTotal: grandTotal
      });
      
    } catch (err) {
      console.error("Failed to update price breakdown:", err);
    }
  }, [packageItems, addOns, isTeamOrder, teamMembers, packageType, isSubscribed, setPriceBreakdown]);

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
                Pro Subscription (10%)
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
            <span>Tax (7%)</span>
            <span>${priceBreakdown.tax.toFixed(2)}</span>
          </div>

          <div className="border-t pt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>${priceBreakdown.grandTotal.toFixed(2)}</span>
          </div>

          <div className="pt-2 text-sm text-muted-foreground">
            <p>All prices in USD. Tax calculated at 7%.</p>
            {priceBreakdown.subtotal > 200 && (
              <p className="mt-2 text-green-600">
                You qualify for FREE shipping!
              </p>
            )}
            {isTeamOrder && (
              <p className="mt-2 text-green-600">
                Team orders with 10+ items receive a {(calculateQuantityDiscount(10) * 100).toFixed(0)}% discount!
              </p>
            )}
            {!priceBreakdown.subscriptionDiscountApplied && (
              <p className="mt-2">
                Subscribe to Pro for an additional 10% off all orders.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}