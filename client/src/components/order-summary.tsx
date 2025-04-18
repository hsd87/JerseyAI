import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import { useOrderStore } from "../hooks/use-order-store";
import { usePriceCalculator } from "../hooks/use-price-calculator";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { PriceBreakdownCard, SimplePriceSummary } from "./price-breakdown";

interface OrderSummaryProps {
  showDetailed?: boolean;
  onCheckout?: () => void;
  className?: string;
}

export default function OrderSummary({ 
  showDetailed = false, 
  onCheckout, 
  className 
}: OrderSummaryProps) {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Get order data from store
  const { 
    items, 
    addOns, 
    getCartItems,
    priceBreakdown,
    setPriceBreakdown
  } = useOrderStore();
  
  // Pricing calculation hook
  const { 
    calculatePrice, 
    isPending: isCalculatingPrice
  } = usePriceCalculator();
  
  // Calculate total items
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalAddOns = addOns.reduce((total, addon) => total + addon.quantity, 0);
  
  // Calculate whether user qualifies for free shipping
  const getSimpleTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0) +
           addOns.reduce((total, addon) => total + (addon.price * addon.quantity), 0);
  };
  
  // Calculate and update price breakdown when items change
  useEffect(() => {
    const updatePriceBreakdown = async () => {
      try {
        // Only calculate if we have items
        if (items.length > 0) {
          const cartItems = getCartItems();
          
          // Log cart items to debug
          console.log('Calculate price for cart items:', cartItems);
          
          const breakdown = await calculatePrice(cartItems);
          
          if (breakdown) {
            setPriceBreakdown(breakdown);
          }
        }
      } catch (error) {
        // Log the error but don't crash the component
        console.error('Failed to update price breakdown:', error);
      }
    };
    
    updatePriceBreakdown();
  }, [items, addOns, getCartItems, calculatePrice, setPriceBreakdown]);
  
  // Show empty cart state
  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
          <CardDescription>No items in your cart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Start by designing a custom jersey and adding it to your cart.
            </p>
            <Button
              onClick={() => setLocation("/designer")}
              className="mt-2"
            >
              Design Your Jersey
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Verify that the price breakdown has all required properties to avoid errors
  const isValidPriceBreakdown = (pb: any): boolean => {
    return pb && 
      typeof pb.baseTotal === 'number' && 
      typeof pb.shippingCost === 'number' && 
      typeof pb.subtotalAfterDiscounts === 'number' && 
      typeof pb.grandTotal === 'number';
  };
  
  // Use validated price breakdown or null
  const validatedPriceBreakdown = isValidPriceBreakdown(priceBreakdown) ? priceBreakdown : null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>
          {totalItems} {totalItems === 1 ? "item" : "items"}
          {totalAddOns > 0 && ` + ${totalAddOns} add-on${totalAddOns === 1 ? "" : "s"}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Item list */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>
                {item.quantity}× {item.type} ({item.size || 'M'}, {item.gender || 'Male'})
              </span>
              <span>${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
            </div>
          ))}
          
          {addOns.map((addon, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>
                {addon.quantity || 1}× {addon.name || 'Add-on'}
              </span>
              <span>${((addon.price || 0) * (addon.quantity || 1)).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        {/* Divider */}
        <div className="border-t pt-2">
          {isCalculatingPrice ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span>Calculating price...</span>
            </div>
          ) : validatedPriceBreakdown ? (
            showDetailed ? (
              <PriceBreakdownCard breakdown={validatedPriceBreakdown} />
            ) : (
              <SimplePriceSummary breakdown={validatedPriceBreakdown} />
            )
          ) : (
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${getSimpleTotal().toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {/* Shipping threshold notifications */}
        {validatedPriceBreakdown && validatedPriceBreakdown.shippingCost > 0 && (
          <div className="text-sm bg-muted p-2 rounded-md text-center">
            {validatedPriceBreakdown.subtotalAfterDiscounts < 20000 ? (
              <p>Add more items to qualify for reduced shipping ($20)</p>
            ) : validatedPriceBreakdown.subtotalAfterDiscounts < 50000 ? (
              <p>Spend ${((50000 - validatedPriceBreakdown.subtotalAfterDiscounts) / 100).toFixed(2)} more for free shipping</p>
            ) : null}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex-col space-y-2">
        <Button 
          className="w-full" 
          onClick={
            items.length === 0 
              ? () => setLocation("/designer") 
              : (onCheckout ? onCheckout : () => setLocation("/checkout"))
          }
        >
          {items.length === 0 ? (
            "Add Items to Cart"
          ) : (
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Proceed to Checkout</span>
            </div>
          )}
        </Button>
        
        {!user && (
          <p className="text-xs text-muted-foreground text-center">
            You'll need to sign in or create an account during checkout
          </p>
        )}
      </CardFooter>
    </Card>
  );
}