import { Router } from 'express';
import { shippingService } from '../services/shipping-service';
import { ShippingCalculationRequest, ShippingCalculationResponse } from '../types/shipping';

const router = Router();

/**
 * Calculate shipping options based on address, items, and order subtotal
 * 
 * POST /api/shipping/calculate
 */
router.post('/calculate', async (req, res) => {
  try {
    // Log the request for debugging
    console.log('Shipping calculation request:', {
      hasAddress: !!req.body.shippingAddress,
      itemCount: req.body.items?.length || 0,
      subtotal: req.body.subtotal
    });
    
    // Validate request body
    const { shippingAddress, items, subtotal } = req.body as ShippingCalculationRequest;
    
    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    
    if (subtotal === undefined || isNaN(subtotal)) {
      return res.status(400).json({ error: 'Valid subtotal is required' });
    }
    
    // Calculate shipping options
    const result = shippingService.calculateShipping({ shippingAddress, items, subtotal });
    
    // Add a small delay to simulate real API calculation
    setTimeout(() => {
      // Return the shipping options
      res.status(200).json(result);
    }, 500);
  } catch (error: any) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: 'Failed to calculate shipping options', message: error.message });
  }
});

export default router;