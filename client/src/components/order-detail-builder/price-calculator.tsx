import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrderStore } from '@/hooks/use-order-store';
import { PriceBreakdown, OrderDetails } from '@/hooks/use-order-types';
import { Check, ShoppingCart } from 'lucide-react';

export default function PriceCalculator() {
  const { 
    items, 
    addOns, 
    teamMembers, 
    isTeamOrder, 
    priceBreakdown, 
    setOrderDetails,
    setPriceBreakdown
  } = useOrderStore();
  
  // Calculate price breakdown on component mount and when items change
  useEffect(() => {
    calculatePriceBreakdown();
  }, [items, addOns, teamMembers, isTeamOrder]);
  
  // Calculate the price breakdown based on items, add-ons, and team status
  const calculatePriceBreakdown = () => {
    if (items.length === 0) {
      setPriceBreakdown(null);
      return;
    }
    
    // Calculate subtotal from items and add-ons
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    subtotal += addOns.reduce((sum, addon) => sum + addon.price, 0);
    
    // Determine base total (before any discounts)
    const baseTotal = subtotal;
    
    // Count total items
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0) + addOns.length;
    
    // Calculate team discount if applicable
    let discount = 0;
    let discountPercentage = 0;
    let tierDiscountApplied = false;
    let tierDiscountAmount = 0;
    
    if (isTeamOrder && teamMembers.length >= 10) {
      tierDiscountApplied = true;
      if (teamMembers.length >= 50) {
        discountPercentage = 15;
      } else if (teamMembers.length >= 20) {
        discountPercentage = 10;
      } else {
        discountPercentage = 5;
      }
      tierDiscountAmount = (subtotal * discountPercentage) / 100;
      discount += tierDiscountAmount;
    }
    
    // Apply subscription discount if applicable (mock for demo)
    // In real app, would check user subscription status
    const isSubscriber = true; // Mock subscription status
    const subscriptionDiscountApplied = isSubscriber;
    const subscriptionDiscountAmount = isSubscriber ? (subtotal * 0.1) : 0; // 10% discount
    
    if (subscriptionDiscountApplied) {
      discount += subscriptionDiscountAmount;
    }
    
    // Calculate shipping (free for orders over $100 after discounts)
    const subtotalAfterDiscounts = subtotal - discount;
    const shippingFreeThresholdApplied = subtotalAfterDiscounts > 100;
    const shipping = shippingFreeThresholdApplied ? 0 : 9.99;
    
    // Calculate tax
    const priceBeforeTax = subtotalAfterDiscounts + shipping;
    const tax = priceBeforeTax * 0.08; // 8% tax
    
    // Calculate grand total
    const grandTotal = priceBeforeTax + tax;
    
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