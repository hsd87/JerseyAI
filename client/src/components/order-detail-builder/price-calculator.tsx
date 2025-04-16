import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrderStore } from "@/hooks/use-order-store";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CheckCircle2, ShoppingCart, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

interface PriceBreakdown {
  subtotal: number;
  discount: number;
  discountPercentage: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  itemCount: number;
}

export default function PriceCalculator() {
  const { items, addOns, setOrderDetails, setPriceBreakdown, isTeamOrder } = useOrderStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  
  // Calculate price estimation whenever items or add-ons change
  useEffect(() => {
    const calculatePrice = async () => {
      if (items.length === 0) {
        setBreakdown(null);
        setPriceBreakdown(null);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Request price calculation from API
        const response = await apiRequest("POST", "/api/price/estimate", {
          items,
          addOns,
          isSubscriber: user?.subscriptionTier === 'pro',
          isTeamOrder,
        });
        
        const result = await response.json();
        setBreakdown(result);
        setPriceBreakdown(result);
      } catch (error) {
        console.error("Price calculation error:", error);
        // Fallback to client-side calculation
        const subtotal = [...items, ...addOns].reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
        
        // Simple estimation
        const fallbackBreakdown = {
          subtotal,
          discount: 0,
          discountPercentage: 0,
          shipping: 9.99,
          tax: subtotal * 0.08, // 8% tax estimate
          grandTotal: subtotal + 9.99 + (subtotal * 0.08),
          itemCount: items.length + addOns.length,
        };
        
        setBreakdown(fallbackBreakdown);
        setPriceBreakdown(fallbackBreakdown);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculatePrice();
  }, [items, addOns, user, isTeamOrder, setPriceBreakdown]);
  
  // Proceed to checkout
  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your purchase",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }
    
    // Store detailed order information for checkout
    setOrderDetails({
      items,
      addOns,
      isTeamOrder,
      packageType: items[0]?.type || "jerseyOnly",
    });
    
    setLocation("/checkout");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Order Summary</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          <>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          </>
        ) : breakdown ? (
          // Price breakdown
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal ({breakdown.itemCount} {breakdown.itemCount === 1 ? 'item' : 'items'})</span>
              <span>${breakdown.subtotal.toFixed(2)}</span>
            </div>
            
            {breakdown.discountPercentage > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Discount ({breakdown.discountPercentage}%)
                </span>
                <span>-${breakdown.discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>{breakdown.shipping > 0 ? `$${breakdown.shipping.toFixed(2)}` : 'Free'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>${breakdown.tax.toFixed(2)}</span>
            </div>
            
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span className="text-lg">${breakdown.grandTotal.toFixed(2)}</span>
            </div>
            
            {/* Additional information */}
            {user && user.subscriptionTier === 'pro' && (
              <div className="bg-green-50 p-2 rounded-md text-sm text-green-700 flex items-center mt-2">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Pro subscriber discount applied
              </div>
            )}
            
            {isTeamOrder && items.length >= 10 && (
              <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-700 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Team order discount applied
              </div>
            )}
          </>
        ) : (
          // Empty cart state
          <div className="py-6 text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Your cart is empty</p>
            <p className="text-sm mt-1">Add items to see price details</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleCheckout}
          disabled={isLoading || !breakdown}
        >
          {isLoading ? (
            <>Loading...</>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Checkout
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}