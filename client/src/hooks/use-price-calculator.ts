import { useMutation, useQuery } from '@tanstack/react-query';
import { CartItem, PriceBreakdown } from './use-order-types';
import { apiRequest, getQueryFn } from '../lib/queryClient';

// Types for the API responses
interface PriceEstimateResponse {
  success: boolean;
  breakdown: PriceBreakdown;
  formatted: Record<string, string>;
}

interface PricingRules {
  // Removed all discounts, shipping costs, and taxes per user request
}

/**
 * Custom hook for fetching pricing rules from the server
 */
export function usePricingRules() {
  return useQuery<PricingRules>({
    queryKey: ['/api/price/rules'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
}

/**
 * Custom hook for calculating price estimates based on cart data
 */
export function usePriceCalculator() {
  // Mutation for calculating price estimates
  const calculatePriceMutation = useMutation<PriceEstimateResponse, Error, { cart: CartItem[] }>({
    mutationFn: async ({ cart }) => {
      try {
        console.log("Starting price calculation for cart:", cart);
        
        // Ensure cart is valid and not empty
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
          console.error("Invalid cart data:", cart);
          throw new Error("Invalid cart data - cannot calculate price for empty cart");
        }

        // Validate cart items have required properties to prevent API errors
        for (const item of cart) {
          if (!item.productId || !item.productType || typeof item.basePrice !== 'number' || typeof item.quantity !== 'number') {
            console.error("Invalid cart item detected:", item);
            
            // Instead of failing, fix the item if possible
            if (!item.productId) item.productId = 'unknown';
            if (!item.productType) item.productType = 'jersey';
            if (typeof item.basePrice !== 'number') item.basePrice = 6999; // Default price
            if (typeof item.quantity !== 'number') item.quantity = 1;
            
            console.log("Fixed cart item:", item);
          }
        }

        // The API expects cart items in a specific format
        console.log("Making API request to /api/price/estimate with payload:", {
          cart: cart.map(item => ({
            productId: item.productId,
            productType: item.productType,
            basePrice: item.basePrice,
            quantity: item.quantity
          }))
        });
        
        try {
          const response = await apiRequest('POST', '/api/price/estimate', { 
            cart: cart.map(item => ({
              productId: item.productId,
              productType: item.productType,
              basePrice: item.basePrice,
              quantity: item.quantity
            }))
          });
          
          console.log("Price estimate API response status:", response.status);
          const data = await response.json();
          console.log("Price estimate API response data:", data);
          return data;
        } catch (error) {
          // Type-safe error handling
          const fetchError = error as Error;
          console.error("Network error during price calculation:", fetchError);
          
          // Calculate total in cents from cart items
          const cartTotal = cart.reduce((total, item) => total + (item.basePrice * item.quantity), 0);
          
          // Return fallback data instead of throwing to avoid UI crashes
          return {
            success: false,
            breakdown: {
              baseTotal: cartTotal,
              subtotal: cartTotal,
              grandTotal: cartTotal,
              itemCount: cart.length
            },
            formatted: {},
            error: fetchError.message || 'Network error during price calculation'
          };
        }
      } catch (error) {
        console.error("Fatal error in calculate price mutation:", error);
        
        // Create a meaningful error message
        const errorMessage = error instanceof Error 
          ? `Price calculation failed: ${error.message}`
          : 'Unknown error during price calculation';
          
        throw new Error(errorMessage);
      }
    },
    
    // Add retry logic
    retry: 2,
    retryDelay: 1000
  });

  /**
   * Calculate price estimate for a cart
   * @param cart Array of cart items
   * @returns Promise resolving to price breakdown or undefined if error
   */
  const calculatePrice = async (cart: CartItem[]): Promise<PriceBreakdown | undefined> => {
    console.log("calculatePrice called with cart:", cart);
    
    // Don't try to calculate if cart is empty
    if (!cart || cart.length === 0) {
      console.log("Returning default price breakdown for empty cart");
      return createDefaultPriceBreakdown();
    }
    
    try {
      // Calculate client-side total for verification
      const clientSideTotal = cart.reduce((total, item) => {
        return total + (item.basePrice * item.quantity);
      }, 0);
      
      console.log("Client-side calculated total before API call:", clientSideTotal);
      
      // Execute the pricing calculation mutation
      console.log("Executing calculatePriceMutation with cart data");
      const result = await calculatePriceMutation.mutateAsync({ cart });
      
      if (result.success) {
        console.log("Price calculation successful. Breakdown:", result.breakdown);
        return result.breakdown;
      } else {
        console.error('Error calculating price:', result);
        
        // If there's a fallback breakdown in the result, use that
        if (result.breakdown) {
          console.log("Using fallback breakdown from result:", result.breakdown);
          return result.breakdown;
        }
        
        // Otherwise create a simple client-side calculation
        console.log("Creating default price breakdown as fallback");
        const fallback = createDefaultPriceBreakdown();
        fallback.baseTotal = clientSideTotal;
        fallback.subtotal = clientSideTotal;
        fallback.grandTotal = clientSideTotal;
        fallback.itemCount = cart.length;
        return fallback;
      }
    } catch (error) {
      console.error('Error in calculatePrice:', error);
      
      // Calculate a basic price just based on the cart items to avoid UI errors
      const simpleTotal = cart.reduce((total, item) => {
        return total + (item.basePrice * item.quantity);
      }, 0);
      
      console.log("Using client-side calculated total as fallback:", simpleTotal);
      
      const fallback = createDefaultPriceBreakdown();
      fallback.baseTotal = simpleTotal;
      fallback.subtotal = simpleTotal;
      fallback.grandTotal = simpleTotal;
      fallback.itemCount = cart.length;
      
      return fallback;
    }
  };
  
  // Create a default price breakdown for fallback
  const createDefaultPriceBreakdown = (): PriceBreakdown => {
    return {
      baseTotal: 0,
      subtotal: 0,
      grandTotal: 0,
      itemCount: 0
    };
  };

  return {
    calculatePrice,
    isPending: calculatePriceMutation.isPending,
    error: calculatePriceMutation.error,
  };
}