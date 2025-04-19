import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Save, CornerDownLeft } from "lucide-react";
import { useOrderStore } from "../hooks/use-order-store";
import { usePriceCalculator } from "../hooks/use-price-calculator";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { PriceBreakdownCard, SimplePriceSummary } from "./price-breakdown";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
      typeof pb.subtotal === 'number' && 
      typeof pb.shipping === 'number' && 
      typeof pb.grandTotal === 'number';
  };
  
  // Use validated price breakdown or null
  const validatedPriceBreakdown = isValidPriceBreakdown(priceBreakdown) ? priceBreakdown : null;
  
  // Get more values from order store
  const { designId, designUrls, setDesign, sport } = useOrderStore();
  
  // Toast notifications
  const { toast } = useToast();
  
  // State to track if draft is saving
  const [savingDraft, setSavingDraft] = useState(false);
  
  // Type guard for validating the price breakdown
  const hasValidShipping = (pb: any): pb is {shipping: number, subtotal: number, grandTotal: number} => {
    return pb && typeof pb.shipping === 'number' && typeof pb.subtotal === 'number';
  };
  
  // Mutation for creating a draft order
  const createDraftOrderMutation = useMutation({
    mutationFn: async (draftData: any) => {
      // Include draft=true as query parameter
      const response = await apiRequest(
        "POST", 
        "/api/orders?draft=true", 
        draftData
      );
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order saved!",
        description: "Your draft order has been saved. You can find it in your account dashboard.",
        variant: "default",
      });
      setSavingDraft(false);
    },
    onError: (error: Error) => {
      console.error("Error saving draft order:", error);
      toast({
        title: "Save failed",
        description: error.message || "Unable to save your draft order. Please try again.",
        variant: "destructive",
      });
      setSavingDraft(false);
    }
  });
  
  // Function to create a draft order
  const createDraftOrder = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in or create an account to save your order for later.",
        variant: "default",
      });
      setLocation('/auth');
      return;
    }
    
    if (!designId) {
      toast({
        title: "Cannot save order",
        description: "No design selected. Please return to the designer and complete your design.",
        variant: "destructive",
      });
      return;
    }
    
    // Start saving indicator
    setSavingDraft(true);
    
    try {
      // Get cart items correctly typed
      const cartItems = getCartItems();
      
      // Prepare order details
      const orderDetails = {
        items: items,
        addOns: addOns,
        isTeamOrder: false,
        packageType: 'jerseyOnly' // Default package type
      };
      
      // Calculate total amount in cents for the order
      const totalAmount = validatedPriceBreakdown 
        ? Math.round(validatedPriceBreakdown.grandTotal * 100) 
        : Math.round(getSimpleTotal() * 100);
      
      // Create the draft order object
      const draftOrderData = {
        userId: user.id,
        designId: designId,
        sport: sport || 'soccer',
        designUrls: designUrls || { front: '', back: '' },
        orderDetails: orderDetails,
        totalAmount: totalAmount,
        metadata: {
          isDraft: true,
          priceBreakdown: validatedPriceBreakdown || null
        }
      };
      
      // Submit the draft order
      await createDraftOrderMutation.mutateAsync(draftOrderData);
      
    } catch (error) {
      console.error("Error preparing draft order:", error);
      toast({
        title: "Error saving draft",
        description: "We couldn't save your order. Please try again or continue to checkout.",
        variant: "destructive",
      });
      setSavingDraft(false);
    }
  };

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
        {validatedPriceBreakdown && hasValidShipping(validatedPriceBreakdown) && validatedPriceBreakdown.shipping > 0 && (
          <div className="text-sm bg-muted p-2 rounded-md text-center">
            {validatedPriceBreakdown.subtotal < 200 ? (
              <p>Add more items to qualify for reduced shipping ($20)</p>
            ) : validatedPriceBreakdown.subtotal < 500 ? (
              <p>Spend ${(500 - validatedPriceBreakdown.subtotal).toFixed(2)} more for free shipping</p>
            ) : null}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex-col space-y-2">
        {/* Checkout button */}
        <Button 
          className="w-full" 
          disabled={isCalculatingPrice || savingDraft}
          onClick={
            items.length === 0 
              ? () => setLocation("/designer") 
              : (onCheckout ? onCheckout : () => {
                  // Get the cart items before proceeding to checkout
                  const cartItems = getCartItems();
                  if (cartItems.length > 0) {
                    console.log("Proceeding to checkout with", cartItems.length, "items");
                    setLocation("/checkout-elements");
                  } else {
                    console.warn("Empty cart detected despite items being present");
                    setLocation("/designer");
                  }
                })
          }
        >
          {isCalculatingPrice ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calculating Price...</span>
            </div>
          ) : items.length === 0 ? (
            "Add Items to Cart"
          ) : (
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Proceed to Checkout</span>
            </div>
          )}
        </Button>
        
        {/* Save for later button - only show if there are items */}
        {items.length > 0 && user && (
          <Button
            variant="outline"
            className="w-full"
            disabled={savingDraft || isCalculatingPrice}
            onClick={createDraftOrder}
          >
            {savingDraft ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Draft...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Save className="h-4 w-4" />
                <span>Save for Later</span>
              </div>
            )}
          </Button>
        )}
        
        {!user && (
          <p className="text-xs text-muted-foreground text-center">
            You'll need to sign in or create an account during checkout
          </p>
        )}
        
        {items.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {totalItems} {totalItems === 1 ? "item" : "items"} in cart
            {totalAddOns > 0 && ` + ${totalAddOns} add-on${totalAddOns === 1 ? "" : "s"}`}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}