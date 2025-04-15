import { useMutation, useQuery } from '@tanstack/react-query';
import { CartItem, PriceBreakdown } from './use-order-store';
import { apiRequest, getQueryFn } from '../lib/queryClient';

// Types for the API responses
interface PriceEstimateResponse {
  success: boolean;
  breakdown: PriceBreakdown;
  formatted: Record<string, string>;
}

interface PricingRules {
  tierDiscounts: { threshold: number; discount: string }[];
  subscriptionDiscount: string;
  shipping: { threshold: number; cost: number }[];
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
        // Ensure cart is valid and not empty
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
          throw new Error("Invalid cart data");
        }

        // Validate cart items have required properties to prevent API errors
        for (const item of cart) {
          if (!item.productId || !item.productType || typeof item.basePrice !== 'number' || typeof item.quantity !== 'number') {
            console.warn("Invalid cart item:", item);
            throw new Error("Invalid cart item detected");
          }
        }

        const response = await apiRequest('POST', '/api/price/estimate', { cart });
        return await response.json();
      } catch (error) {
        console.error("Error in calculate price mutation:", error);
        throw error;
      }
    },
  });

  /**
   * Calculate price estimate for a cart
   * @param cart Array of cart items
   * @returns Promise resolving to price breakdown or undefined if error
   */
  const calculatePrice = async (cart: CartItem[]): Promise<PriceBreakdown | undefined> => {
    // Don't try to calculate if cart is empty
    if (!cart || cart.length === 0) {
      return createDefaultPriceBreakdown();
    }
    
    try {
      const result = await calculatePriceMutation.mutateAsync({ cart });
      
      if (result.success) {
        return result.breakdown;
      } else {
        console.error('Error calculating price:', result);
        return createDefaultPriceBreakdown();
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      return createDefaultPriceBreakdown();
    }
  };
  
  // Create a default price breakdown for fallback
  const createDefaultPriceBreakdown = (): PriceBreakdown => {
    return {
      baseTotal: 0,
      tierDiscountApplied: "None",
      tierDiscountAmount: 0,
      subscriptionDiscountApplied: "None",
      subscriptionDiscountAmount: 0,
      subtotalAfterDiscounts: 0,
      shippingCost: 0,
      grandTotal: 0
    };
  };

  return {
    calculatePrice,
    isPending: calculatePriceMutation.isPending,
    error: calculatePriceMutation.error,
  };
}