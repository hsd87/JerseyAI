/**
 * Interface for shipping address
 */
export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Interface for shipping options
 */
export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number; // Price in dollars
  estimatedDelivery: string;
}

/**
 * Interface for shipping calculation request
 */
export interface ShippingCalculationRequest {
  shippingAddress: ShippingAddress;
  items: Array<{
    quantity: number;
    weight?: number;
    size?: string;
  }>;
  subtotal: number;
}

/**
 * Interface for shipping calculation response
 */
export interface ShippingCalculationResponse {
  shippingOptions: ShippingOption[];
  baseShippingCost: number;
  recommendedOptionId: string;
}

/**
 * Service for calculating shipping costs
 */
export class ShippingService {
  /**
   * Calculate shipping options based on address and order details
   */
  calculateShippingOptions(request: ShippingCalculationRequest): ShippingCalculationResponse {
    const { shippingAddress, items, subtotal } = request;
    
    // Calculate total quantity of items
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Base shipping cost calculation - simplified version
    // In a real app, this would use the address for zone-based calculations
    let baseShippingCost = 0;
    
    // Calculate base shipping rate based on quantity and subtotal
    if (totalQuantity <= 2) {
      baseShippingCost = 8.99;
    } else if (totalQuantity <= 5) {
      baseShippingCost = 12.99;
    } else if (totalQuantity <= 10) {
      baseShippingCost = 18.99;
    } else {
      baseShippingCost = 24.99;
    }
    
    // Free shipping threshold
    if (subtotal >= 150) {
      baseShippingCost = 0;
    }
    
    // Generate shipping options
    const shippingOptions: ShippingOption[] = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: 'Standard shipping with tracking',
        price: baseShippingCost,
        estimatedDelivery: '5-7 business days',
      }
    ];
    
    // Add express shipping if available
    if (baseShippingCost > 0) {
      shippingOptions.push({
        id: 'express',
        name: 'Express Shipping',
        description: 'Faster delivery with priority handling',
        price: baseShippingCost + 12.99,
        estimatedDelivery: '2-3 business days',
      });
    }
    
    // Add overnight shipping for smaller orders
    if (totalQuantity <= 5 && subtotal < 500) {
      shippingOptions.push({
        id: 'overnight',
        name: 'Overnight Shipping',
        description: 'Next day delivery (order by 2pm)',
        price: baseShippingCost + 29.99,
        estimatedDelivery: 'Next business day',
      });
    }
    
    return {
      shippingOptions,
      baseShippingCost,
      recommendedOptionId: baseShippingCost === 0 ? 'standard' : 'express',
    };
  }
}

export const shippingService = new ShippingService();