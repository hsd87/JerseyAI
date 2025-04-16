import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrderStore } from "@/hooks/use-order-store";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, AlertCircle, InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PriceBreakdown, CartItem } from "@/hooks/use-order-types";

export default function PriceCalculator() {
  const { user } = useAuth();
  const isSubscriber = user?.subscriptionTier === 'pro';
  
  const { 
    items, 
    addOns, 
    teamMembers, 
    isTeamOrder,
    packageType, 
    sport,
    designId
  } = useOrderStore();
  
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return `$${(amount / 100).toFixed(2)}`;
  };
  
  // Convert order store state to cart items for price calculation
  const getCartItems = () => {
    const cartItems = [];
    
    // If team order, add each team member as an item
    if (isTeamOrder) {
      // Base price for selected package type
      const basePrice = getBasePrice(packageType);
      
      // Add each team member
      teamMembers.forEach(member => {
        cartItems.push({
          productId: `team-${member.id}`,
          productType: packageType,
          basePrice: basePrice,
          quantity: member.quantity
        });
      });
    } else {
      // Individual order - use items from store
      if (items.length > 0) {
        items.forEach(item => {
          cartItems.push({
            productId: `item-${item.type}`,
            productType: item.type,
            basePrice: item.price,
            quantity: item.quantity
          });
        });
      } else {
        // If no items yet, add a default based on package type
        cartItems.push({
          productId: 'default',
          productType: packageType,
          basePrice: getBasePrice(packageType),
          quantity: 1
        });
      }
    }
    
    // Add any addons
    addOns.forEach(addon => {
      cartItems.push({
        productId: addon.id,
        productType: 'addon',
        basePrice: addon.price,
        quantity: addon.quantity
      });
    });
    
    return cartItems;
  };
  
  // Get base price for a product type
  const getBasePrice = (type: string): number => {
    const prices: Record<string, number> = {
      jersey: 6999,
      jerseyShorts: 8999,
      jerseyTrousers: 9499,
      tracksuit: 14999,
      trackjacket: 8999,
      trackhoodie: 9499,
      trackjackethzip: 8499,
      default: 6999
    };
    
    return prices[type] || prices.default;
  };
  
  // Calculate price when relevant order details change
  useEffect(() => {
    // Only attempt calculation if design is selected
    if (!designId) return;
    
    const calculatePrice = async () => {
      setIsCalculating(true);
      setError(null);
      
      try {
        const cartItems = getCartItems();
        
        // Skip calculation if no items
        if (cartItems.length === 0) {
          setIsCalculating(false);
          return;
        }
        
        // Log for debugging
        console.log("Calculate price for cart items:", cartItems);
        
        try {
          // Call pricing API
          const response = await apiRequest('POST', '/api/price/estimate', {
            cart: cartItems,
            isSubscriber: !!isSubscriber
          });
          
          const result = await response.json();
          
          if (result.success && result.breakdown) {
            setPriceBreakdown(result.breakdown);
          } else {
            console.error("Error in calculate price result:", result);
            setError('Failed to calculate price: ' + (result.message || 'Unknown error'));
          }
        } catch (apiError: any) {
          console.error("Error in calculate price mutation:", apiError);
          setError(`API error: ${apiError.message || 'Failed to connect to pricing service'}`);
        }
      } catch (err: any) {
        console.error('Error calculating price:', err);
        setError(`Error calculating price: ${err.message || 'Please try again.'}`);
      } finally {
        setIsCalculating(false);
      }
    };
    
    // Debounce the calculation to avoid too many API calls
    const timer = setTimeout(() => {
      calculatePrice();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [items, addOns, teamMembers, isTeamOrder, packageType, sport, isSubscriber, designId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Price Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {isCalculating ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Calculating...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        ) : priceBreakdown ? (
          <div className="space-y-4">
            {/* Base Total */}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Base Total</span>
              <span>{formatCurrency(priceBreakdown.baseTotal)}</span>
            </div>
            
            {/* Tier Discount */}
            {priceBreakdown.tierDiscountAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center">
                  Volume Discount ({priceBreakdown.tierDiscountApplied})
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 ml-1 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">
                          Discounts are applied based on order quantity.
                          <br />10+ items: 5% off
                          <br />20+ items: 10% off
                          <br />50+ items: 15% off
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className="text-green-600">-{formatCurrency(priceBreakdown.tierDiscountAmount)}</span>
              </div>
            )}
            
            {/* Subscription Discount */}
            {priceBreakdown.subscriptionDiscountAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center">
                  Pro Subscriber Discount ({priceBreakdown.subscriptionDiscountApplied})
                  <CheckCircle2 className="h-4 w-4 ml-1 text-green-500" />
                </span>
                <span className="text-green-600">-{formatCurrency(priceBreakdown.subscriptionDiscountAmount)}</span>
              </div>
            )}
            
            {/* Subtotal After Discounts */}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span>{formatCurrency(priceBreakdown.subtotalAfterDiscounts)}</span>
            </div>
            
            {/* Shipping */}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Shipping</span>
              <span>
                {priceBreakdown.shippingCost > 0 
                  ? formatCurrency(priceBreakdown.shippingCost) 
                  : 'Free'}
              </span>
            </div>
            
            <Separator className="my-2" />
            
            {/* Grand Total */}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-lg">{formatCurrency(priceBreakdown.grandTotal)}</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>Complete your order details to see pricing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}