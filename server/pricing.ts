/**
 * API Routes for price calculations and pricing information
 */

import { Request, Response, Express } from "express";
import { z } from "zod";
import { calculatePrice, getPricingRules } from "./utils/pricing";
import { CartItem } from "./types";

// Schema for validating cart items in price calculation requests
const cartItemSchema = z.object({
  productId: z.string(),
  productType: z.string(),
  basePrice: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

// Schema for price estimation request body
const priceEstimateSchema = z.object({
  cart: z.array(cartItemSchema),
  isSubscriber: z.boolean().optional(),
});

/**
 * Register pricing-related API routes
 */
export function registerPricingRoutes(app: Express) {
  /**
   * Calculate price estimate endpoint
   * POST /api/price/estimate
   * 
   * Used by the frontend to get price estimates during the checkout flow
   * Returns a detailed breakdown of the pricing calculation
   */
  app.post("/api/price/estimate", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = priceEstimateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request body",
          errors: validationResult.error.format(),
        });
      }
      
      const { cart, isSubscriber = false } = validationResult.data;
      
      // Calculate price breakdown
      const result = calculatePrice(cart as CartItem[], isSubscriber);
      
      return res.json(result);
    } catch (error) {
      console.error("Error calculating price estimate:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to calculate price estimate",
      });
    }
  });
  
  /**
   * Get current pricing rules
   * GET /api/price/rules
   * 
   * Returns the current pricing rules for transparency
   */
  app.get("/api/price/rules", (req: Request, res: Response) => {
    try {
      const rules = getPricingRules();
      return res.json(rules);
    } catch (error) {
      console.error("Error fetching pricing rules:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pricing rules",
      });
    }
  });
}