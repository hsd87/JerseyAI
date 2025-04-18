/**
 * Shipping service for calculating shipping options and costs
 */

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ShippingItem {
  quantity: number;
  weight?: number;
  size?: string;
}

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDelivery: string;
}

interface ShippingCalculationRequest {
  shippingAddress: ShippingAddress;
  items: ShippingItem[];
  subtotal: number;
}

interface ShippingCalculationResponse {
  shippingOptions: ShippingOption[];
  baseShippingCost: number;
  recommendedOptionId: string;
}

class ShippingService {
  /**
   * Calculate shipping options based on address, items, and order subtotal
   * @param request Shipping calculation request with address, items and subtotal
   * @returns Promise with shipping options
   */
  async calculateShipping(request: ShippingCalculationRequest): Promise<ShippingCalculationResponse> {
    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to calculate shipping');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error calculating shipping:', error);
      throw error;
    }
  }

  /**
   * Maps customer information to shipping address format
   * @param customerInfo Customer information from form
   * @returns Shipping address for API request
   */
  mapCustomerInfoToShippingAddress(customerInfo: any): ShippingAddress {
    return {
      name: `${customerInfo.firstName} ${customerInfo.lastName}`,
      street: customerInfo.street,
      city: customerInfo.city,
      state: customerInfo.state,
      postalCode: customerInfo.postalCode,
      country: customerInfo.country || 'US', // Default to US if not provided
    };
  }

  /**
   * Format order items for shipping calculation
   * @param orderDetails Order details containing items
   * @returns Shipping items for API request
   */
  formatItemsForShipping(orderDetails: any): ShippingItem[] {
    // Extract items from order details
    // This will need to be adapted to your specific order structure
    const items = [{
      quantity: orderDetails.quantity || 1,
      size: orderDetails.size,
    }];

    return items;
  }
}

export const shippingService = new ShippingService();
export type { 
  ShippingAddress, 
  ShippingItem, 
  ShippingOption, 
  ShippingCalculationRequest, 
  ShippingCalculationResponse 
};