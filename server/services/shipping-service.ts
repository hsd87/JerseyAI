import { ShippingAddress } from '@/types/shipping';

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDelivery: string;
}

export interface ShippingCalculationRequest {
  shippingAddress: ShippingAddress;
  items: Array<{
    quantity: number;
    weight?: number;
    size?: string;
  }>;
  subtotal: number;
}

export interface ShippingCalculationResponse {
  shippingOptions: ShippingOption[];
  baseShippingCost: number;
  recommendedOptionId: string;
}

class ShippingService {
  /**
   * Calculate shipping options based on address, items, and order subtotal
   */
  calculateShipping(request: ShippingCalculationRequest): ShippingCalculationResponse {
    const { shippingAddress, items, subtotal } = request;
    
    // Calculate total item count
    const totalItems = items.reduce((total, item) => total + (item.quantity || 1), 0);
    
    // Base shipping cost calculation based on number of items and destination
    let baseShippingCost = 8.99; // Default base shipping cost
    
    // Adjust for international shipping
    if (shippingAddress.country !== 'US') {
      baseShippingCost += 10.00; // International shipping surcharge
    }
    
    // Add per-item fee
    if (totalItems > 1) {
      baseShippingCost += (totalItems - 1) * 2.50; // $2.50 per additional item
    }
    
    // Calculate express shipping option (faster but more expensive)
    const expressShippingCost = baseShippingCost * 2.5;
    
    // Free shipping threshold
    const freeShippingThreshold = 200;
    let standardShippingCost = baseShippingCost;
    
    // Apply free shipping for orders over threshold
    if (subtotal >= freeShippingThreshold) {
      standardShippingCost = 0;
    }
    
    // Create shipping options
    const shippingOptions: ShippingOption[] = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: standardShippingCost === 0 ? 'Free shipping (5-7 business days)' : 'Regular delivery with tracking',
        price: standardShippingCost,
        estimatedDelivery: '5-7 business days',
      },
      {
        id: 'express',
        name: 'Express Shipping',
        description: 'Faster delivery with priority handling',
        price: expressShippingCost,
        estimatedDelivery: '2-3 business days',
      }
    ];
    
    // Determine recommended option (default to standard)
    let recommendedOptionId = 'standard';
    
    // For time-sensitive items, recommend express shipping
    const hasTimeSensitiveItems = items.some(item => item.size === 'custom');
    if (hasTimeSensitiveItems) {
      recommendedOptionId = 'express';
    }
    
    return {
      shippingOptions,
      baseShippingCost,
      recommendedOptionId
    };
  }
}

export const shippingService = new ShippingService();