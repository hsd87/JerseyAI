import { Express, Request, Response } from "express";
import { z } from "zod";
import { calculateFinalPrice, formatPriceBreakdown, CartItem } from "./utils/pricing";

// Validation schema for the cart items
const cartItemSchema = z.object({
  productId: z.string(),
  productType: z.enum(["jersey", "jersey_shorts", "kit"]),
  basePrice: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const calculatePriceRequestSchema = z.object({
  cart: z.array(cartItemSchema),
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
      // Validate the request body
      const validation = calculatePriceRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data",
          errors: validation.error.format()
        });
      }
      
      // Get user subscription status
      const isSubscriber = req.isAuthenticated() && 
        req.user?.subscriptionTier === "pro";
      
      // Calculate price with full breakdown
      const priceBreakdown = calculateFinalPrice(
        validation.data.cart,
        isSubscriber
      );
      
      // Format the breakdown for display (optional)
      const formattedBreakdown = formatPriceBreakdown(priceBreakdown);
      
      // Return both raw data and formatted values
      res.json({
        success: true,
        breakdown: priceBreakdown,
        formatted: formattedBreakdown
      });
    } catch (error: any) {
      console.error("Error calculating price estimate:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while calculating the price estimate",
        error: error.message
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
    res.json({
      success: true,
      tierDiscounts: [
        { threshold: 50, discount: "15%" },
        { threshold: 20, discount: "10%" },
        { threshold: 10, discount: "5%" },
      ],
      subscriptionDiscount: "10%",
      shipping: [
        { threshold: 500, cost: 0 }, // Free shipping
        { threshold: 200, cost: 20 },
        { threshold: 0, cost: 30 },
      ]
    });
  });
}