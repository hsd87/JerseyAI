import { formatPrice } from '@/lib/format-utils';

/**
 * Custom hook for consistent price formatting across components
 * Using the formatPrice utility function from format-utils
 */
export function useFormatPrice() {
  return {
    formatPrice: (price: number | string | undefined | null, currency?: string, locale?: string) => 
      formatPrice(price, currency, locale),
  };
}