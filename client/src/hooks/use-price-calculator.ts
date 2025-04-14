import { useMutation, useQuery } from '@tanstack/react-query';
import { CartItem, PriceBreakdown, PriceEstimateResponse, PricingRules } from '../types';
import { apiRequest, getQueryFn } from '../lib/queryClient';

/**
 * Custom hook for fetching pricing rules from the server
 */
export function usePricingRules() {
  return useQuery<PricingRules>({
    queryKey: ['/api/price/rules'],
    queryFn: getQueryFn(),
  });
}

/**
 * Custom hook for calculating price estimates based on cart data
 */
export function usePriceCalculator() {
  // Mutation for calculating price estimates
  const calculatePriceMutation = useMutation<PriceEstimateResponse, Error, { cart: CartItem[] }>({
    mutationFn: async ({ cart }) => {
      const response = await apiRequest('POST', '/api/price/estimate', { cart });
      return response.json();
    },
  });

  /**
   * Calculate price estimate for a cart
   * @param cart Array of cart items
   * @returns Promise resolving to price breakdown or undefined if error
   */
  const calculatePrice = async (cart: CartItem[]): Promise<PriceBreakdown | undefined> => {
    try {
      const result = await calculatePriceMutation.mutateAsync({ cart });
      
      if (result.success) {
        return result.breakdown;
      } else {
        console.error('Error calculating price:', result);
        return undefined;
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      return undefined;
    }
  };

  return {
    calculatePrice,
    isPending: calculatePriceMutation.isPending,
    error: calculatePriceMutation.error,
  };
}