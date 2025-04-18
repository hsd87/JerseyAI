import { Request, Response } from 'express';
import { Express } from 'express';
import { shippingService } from '../services/shipping-service';

/**
 * Register shipping-related routes
 */
export function registerShippingRoutes(app: Express) {
  /**
   * Calculate shipping options
   * POST /api/shipping/calculate
   */
  app.post('/api/shipping/calculate', async (req: Request, res: Response) => {
    try {
      const { shippingAddress, items, subtotal } = req.body;
      
      // Validate request
      if (!shippingAddress || !items || subtotal === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields (shippingAddress, items, or subtotal)'
        });
      }
      
      // Required address fields
      const requiredFields = ['street', 'city', 'state', 'postalCode', 'country'];
      for (const field of requiredFields) {
        if (!shippingAddress[field]) {
          return res.status(400).json({ 
            error: `Missing required address field: ${field}`
          });
        }
      }
      
      // Calculate shipping options
      const shippingOptions = shippingService.calculateShippingOptions({
        shippingAddress,
        items,
        subtotal
      });
      
      res.status(200).json(shippingOptions);
    } catch (error: any) {
      console.error('Error calculating shipping:', error);
      res.status(500).json({ error: error.message || 'Failed to calculate shipping options' });
    }
  });
  
  /**
   * Validate shipping address
   * POST /api/shipping/validate-address
   */
  app.post('/api/shipping/validate-address', async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      
      // Simple validation for now
      // In a real app, this would use an address validation service like USPS, SmartyStreets, etc.
      if (!address || !address.street || !address.city || !address.state || !address.postalCode) {
        return res.status(400).json({
          valid: false,
          message: 'Missing required address fields'
        });
      }
      
      // For demo purposes, always return valid
      res.status(200).json({
        valid: true,
        standardizedAddress: address,
        message: 'Address is valid'
      });
    } catch (error: any) {
      console.error('Error validating address:', error);
      res.status(500).json({ error: error.message || 'Failed to validate address' });
    }
  });
}