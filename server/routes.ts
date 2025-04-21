import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerAdminRoutes } from "./admin";
import { designFormSchema, insertOrderSchema } from "@shared/schema";
import path from "path";
import fs from "fs";
import { z } from "zod";

// Import order controller functions
import { 
  createOrder, 
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders
} from './controllers/order-controller';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Authentication Routes
  setupAuth(app);

  // Design Routes
  app.post("/api/designs", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate design data
      const result = designFormSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid design data", errors: result.error.format() });
      }

      // Decrement user's design credits
      try {
        await storage.decrementDesignCredits(req.user.id);
      } catch (error) {
        return res.status(403).json({ message: "No design credits remaining" });
      }

      // Create design with user ID
      const design = await storage.createDesign({
        ...req.body,
        userId: req.user.id
      });

      res.status(201).json(design);
    } catch (error) {
      next(error);
    }
  });

  // Generate images route
  app.post("/api/designs/:id/generate", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const designId = parseInt(req.params.id);
      const design = await storage.getDesignById(designId);

      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      if (design.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Use OpenAI to generate a detailed prompt for the kit design using the template
      try {
        const { generateKitPrompt, generateJerseyImageWithReplicate } = await import("./openai");
        
        // Check if there's form data in the request that should override DB values
        const formData = req.body.formData || {};
        console.log("Received form data:", formData);
        
        // Ensure we handle types correctly to prevent 422 errors with Replicate API
        // Validate and clean formData to ensure proper types
        if (formData.extra_lora && typeof formData.extra_lora !== 'string') {
          console.log(`Type correction: Converting extra_lora from ${typeof formData.extra_lora} to string`);
          formData.extra_lora = String(formData.extra_lora);
        }
        
        if (formData.extra_lora_scale && typeof formData.extra_lora_scale !== 'number') {
          console.log(`Type correction: Converting extra_lora_scale from ${typeof formData.extra_lora_scale} to number`);
          formData.extra_lora_scale = Number(formData.extra_lora_scale) || 0.69;
        }
        
        // Use form data if available, otherwise fallback to database values
        const options = {
          sport: formData.sport || design.sport,
          kitType: formData.kitType || design.kitType,
          primaryColor: formData.primaryColor || design.primaryColor,
          secondaryColor: formData.secondaryColor || design.secondaryColor,
          accentColor1: formData.accentColor1 || design.accentColor1 || undefined,
          accentColor2: formData.accentColor2 || design.accentColor2 || undefined,
          sleeveStyle: formData.sleeveStyle || design.sleeveStyle || undefined,
          collarType: formData.collarType || design.collarType || undefined,
          patternStyle: formData.patternStyle || design.patternStyle || undefined,
          designNotes: formData.designNotes || design.designNotes || undefined
        };
        
        console.log("Using kit options for prompt generation:", options);
        
        // Generate a combined prompt using the template through OpenAI
        const enhancedPrompt = await generateKitPrompt(options);

        console.log("Enhanced template prompt generated:", enhancedPrompt);
        
        // For debug purposes - Print the full prompt to ensure it's properly formatted
        console.log("FULL PROMPT DETAILS:");
        console.log(JSON.stringify(enhancedPrompt, null, 2));
        
        // Generate a single combined image showing both front and back views
        const imageResult = await generateJerseyImageWithReplicate(enhancedPrompt, design.kitType);
        
        console.log("Image generation result received with URL:", imageResult.imageUrl);
        console.log("Image data size:", imageResult.imageData ? `${Math.round(imageResult.imageData.length / 1024)} KB` : "None");
        
        // Save both the image URL and the binary data to the database
        const updatedDesign = await storage.updateDesign(designId, {
          frontImageUrl: imageResult.imageUrl,
          backImageUrl: imageResult.imageUrl, // Same image contains both views
          frontImageData: imageResult.imageData,
          backImageData: imageResult.imageData // Same image data for both views
        });

        res.json(updatedDesign);
      } catch (error: any) {
        console.error("Error generating design:", error);
        res.status(500).json({ 
          message: "Failed to generate design", 
          error: error.message || "Unknown error" 
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // Update design with customizations
  app.patch("/api/designs/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const designId = parseInt(req.params.id);
      const design = await storage.getDesignById(designId);

      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      if (design.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedDesign = await storage.updateDesign(designId, req.body);
      res.json(updatedDesign);
    } catch (error) {
      next(error);
    }
  });

  // Get user designs
  app.get("/api/designs", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const designs = await storage.getUserDesigns(req.user.id);
      res.json(designs);
    } catch (error) {
      next(error);
    }
  });
  
  // Get recent designs (most recent first, limited to 10)
  app.get("/api/designs/recent", async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (req.isAuthenticated() && req.user?.id) {
        console.log("Fetching recent designs for authenticated user:", req.user.id);
        
        // Get recent designs for the current user, ensure we only return valid designs
        const allDesigns = await storage.getUserDesigns(req.user.id);
        
        // Sort by creation date (most recent first)
        const sortedDesigns = allDesigns
          .filter(design => design && design.id)  // Filter out any invalid designs
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 10);  // Limit to 10 designs
        
        // Convert database design format to the format expected by the client
        const formattedDesigns = sortedDesigns.map(design => {
          // For designs with base64 image data, use that directly as the URL
          // This ensures images are always available even if the file system path is missing
          return {
            id: design.id.toString(),
            urls: {
              front: design.frontImageUrl || (design.frontImageData ? `data:image/png;base64,${design.frontImageData}` : null),
              back: design.backImageUrl || (design.backImageData ? `data:image/png;base64,${design.backImageData}` : null)
            },
            createdAt: design.createdAt ? new Date(design.createdAt).toISOString() : undefined
          };
        });
        
        return res.json(formattedDesigns);
      } else {
        console.log("User not authenticated, serving public designs");
        
        // Get most recent public designs or featured designs if available
        // As a fallback, we'll return an empty array and let the client handle the display
        const publicDesigns = await storage.getPublicDesigns();
        
        if (publicDesigns && publicDesigns.length > 0) {
          // Format designs for the client
          const formattedDesigns = publicDesigns.map(design => ({
            id: design.id.toString(),
            urls: {
              front: design.frontImageUrl || (design.frontImageData ? `data:image/png;base64,${design.frontImageData}` : null),
              back: design.backImageUrl || (design.backImageData ? `data:image/png;base64,${design.backImageData}` : null)
            },
            createdAt: design.createdAt ? new Date(design.createdAt).toISOString() : undefined
          }));
          
          return res.json(formattedDesigns);
        }
        
        // Return empty array if no designs are available
        return res.json([]);
      }
    } catch (error) {
      console.error("Error fetching recent designs:", error);
      // Send a more graceful error response
      res.status(500).json({ 
        message: "Failed to fetch recent designs", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get design by id
  app.get("/api/designs/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate design ID and handle non-numeric values
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ 
          message: "Invalid design ID format", 
          error: "invalid_id_format"
        });
      }

      const design = await storage.getDesignById(designId);

      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      if (design.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(design);
    } catch (error) {
      console.error('Error fetching design:', error);
      next(error);
    }
  });

  // Delete design
  app.delete("/api/designs/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate design ID and handle non-numeric values
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ 
          message: "Invalid design ID format", 
          error: "invalid_id_format"
        });
      }
      
      const design = await storage.getDesignById(designId);

      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      if (design.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteDesign(designId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting design:', error);
      next(error);
    }
  });

  // Order routes - importing from orders.ts for advanced functionality
  try {
    const { registerOrderRoutes } = await import('./orders');
    registerOrderRoutes(app);
  } catch (error) {
    console.error('Error registering order routes:', error);
  }
  
  // Partner routes - importing from partner.ts for B2B lead functionality
  try {
    const { registerPartnerRoutes } = await import('./partner');
    registerPartnerRoutes(app);
  } catch (error) {
    console.error('Error registering partner routes:', error);
  }
  
  // Pricing routes - importing from pricing.ts for dynamic pricing functionality
  try {
    const { registerPricingRoutes } = await import('./pricing');
    registerPricingRoutes(app);
  } catch (error) {
    console.error('Error registering pricing routes:', error);
  }
  
  // Shipping routes - importing from routes/shipping.ts for shipping calculations
  try {
    const { registerShippingRoutes } = await import('./routes/shipping');
    registerShippingRoutes(app);
    console.log('Shipping routes registered successfully');
  } catch (error) {
    console.error('Error registering shipping routes:', error);
  }
  
  // Admin routes - importing from admin.ts for admin dashboard functionality
  try {
    registerAdminRoutes(app);
    console.log('Admin routes registered successfully');
  } catch (error) {
    console.error('Error registering admin routes:', error);
  }
  
  // Image recovery utilities for admin users
  app.post("/api/admin/recover-images", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Ensure user is an admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }
      
      const result = await import('./utils/image-recovery').then(module => module.reconcileImageFiles());
      
      res.json(result);
    } catch (error) {
      console.error('Error during image recovery:', error);
      res.status(500).json({ 
        success: false,
        message: "Error during image recovery", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.get("/api/admin/verify-images", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Ensure user is an admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }
      
      const result = await import('./utils/image-recovery').then(module => module.verifyImagePaths());
      
      res.json(result);
    } catch (error) {
      console.error('Error during image verification:', error);
      res.status(500).json({ 
        success: false,
        message: "Error during image verification", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Subscription endpoints
  app.post("/api/subscribe", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (process.env.STRIPE_SECRET_KEY) {
        try {
          const { createSubscription } = await import('./stripe');
          const subscription = await createSubscription(req.user.id);
          res.json({
            clientSecret: subscription.clientSecret,
            subscriptionId: subscription.subscriptionId
          });
        } catch (err: any) {
          console.error('Stripe subscription error:', err);
          res.status(500).json({ message: err.message });
        }
      } else {
        // For testing without Stripe
        const user = await storage.updateUserSubscription(req.user.id, "pro");
        res.json(user);
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/subscription/status", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user;
      
      // Default response for users without Stripe subscription
      let subscriptionData: {
        isSubscribed: boolean;
        subscriptionTier: string;
        subscriptionExpiry: string | null;
        subscriptionStatus: string;
        remainingDesigns: number;
      } = {
        isSubscribed: user.subscriptionTier === 'pro',
        subscriptionTier: user.subscriptionTier,
        subscriptionExpiry: null,
        subscriptionStatus: user.subscriptionTier === 'pro' ? 'active' : 'inactive',
        remainingDesigns: user.remainingDesigns
      };
      
      // If Stripe is configured and user has a subscription, get details from Stripe
      if (process.env.STRIPE_SECRET_KEY && user.stripeSubscriptionId) {
        try {
          const { checkSubscriptionStatus } = await import('./stripe');
          const stripeStatus = await checkSubscriptionStatus(user.stripeSubscriptionId);
          
          const expiryDate = stripeStatus.current_period_end 
            ? new Date(stripeStatus.current_period_end * 1000).toISOString()
            : null;
            
          subscriptionData = {
            isSubscribed: stripeStatus.status === 'active',
            subscriptionTier: stripeStatus.status === 'active' ? 'pro' : 'free',
            subscriptionExpiry: expiryDate, // Now correctly typed as string | null
            subscriptionStatus: stripeStatus.status,
            remainingDesigns: user.remainingDesigns
          };
          
          // Update user record if there's a mismatch
          if ((subscriptionData.isSubscribed && user.subscriptionTier !== 'pro') ||
              (!subscriptionData.isSubscribed && user.subscriptionTier === 'pro')) {
            await storage.updateUserSubscription(
              user.id, 
              subscriptionData.isSubscribed ? 'pro' : 'free'
            );
          }
        } catch (err: any) {
          console.error('Error checking Stripe subscription:', err);
          // If there's an error with Stripe, fall back to the database record
        }
      }
      
      res.json(subscriptionData);
    } catch (error) {
      next(error);
    }
  });
  
  // Checkout endpoint for orders
  app.post("/api/create-payment-intent", async (req, res, next) => {
    try {
      // Check if authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          message: "Unauthorized. Please log in to continue with checkout.",
          error: "authentication_required"
        });
      }

      // Get request data
      const { items, amount } = req.body;
      
      console.log("Payment Intent Request:", {
        hasItems: !!items && items.length > 0,
        itemsCount: items?.length || 0,
        amount: amount,
        userId: req.user?.id
      });

      // Verify Stripe is properly configured
      try {
        const { checkStripeApiKey } = await import('./services/stripe-service');
        const stripeStatus = await checkStripeApiKey();
        
        if (!stripeStatus.valid) {
          console.error("Stripe API key validation failed:", stripeStatus.message);
          return res.status(503).json({ 
            message: "Payment system is not available at this time. Please try again later.",
            error: "stripe_unavailable",
            details: stripeStatus.message
          });
        }
        
        // Now import the stripe functions we need
        const { calculateOrderAmount, createPaymentIntent, createCustomer } = await import('./stripe');
        
        // Get or create customer ID for the user
        const user = req.user;
        
        // Check if we need to create a new customer ID
        let createNewCustomer = !user.stripeCustomerId;
        
        // Also check if we're using a live key with a test customer ID or vice versa
        if (user.stripeCustomerId) {
          const stripeKey = process.env.STRIPE_SECRET_KEY || '';
          const isLiveKey = stripeKey.startsWith('sk_live_') || stripeKey.startsWith('rk_live_');
          const isLiveCustomer = user.stripeCustomerId.startsWith('cus_') && !user.stripeCustomerId.includes('_test_');
          
          if ((isLiveKey && !isLiveCustomer) || (!isLiveKey && isLiveCustomer)) {
            console.log(`Key/customer mode mismatch. Key: ${isLiveKey ? 'live' : 'test'}, Customer: ${isLiveCustomer ? 'live' : 'test'}`);
            console.log(`Creating new ${isLiveKey ? 'live' : 'test'} mode customer for user ${user.id}`);
            createNewCustomer = true;
          }
        }
        
        // Create customer if needed
        if (createNewCustomer) {
          console.log(`Creating Stripe customer for user ${user.id}`);
          await createCustomer(user);
          
          // Reload user to get the updated stripeCustomerId
          const updatedUser = await storage.getUser(user.id);
          if (!updatedUser || !updatedUser.stripeCustomerId) {
            throw new Error("Failed to create or retrieve Stripe customer ID");
          }
          user.stripeCustomerId = updatedUser.stripeCustomerId;
          console.log(`Successfully created Stripe customer: ${user.stripeCustomerId}`);
        }
        
        // Calculate final amount in cents
        let finalAmount: number;
        
        // Determine how to calculate the amount
        if (amount) {
          // Direct amount provided
          finalAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
          
          // Convert to cents if it appears to be in dollars (less than 50)
          if (finalAmount < 50) {
            console.log(`Amount appears to be in dollars (${finalAmount}), converting to cents`);
            finalAmount = Math.round(finalAmount * 100);
          }
        } else if (items && Array.isArray(items) && items.length > 0) {
          // Calculate from items using the pricing module
          console.log(`Calculating amount from ${items.length} items`);
          finalAmount = await calculateOrderAmount(items, user.subscriptionTier === 'pro');
        } else {
          // Fallback - use minimum amount for testing only
          console.warn('No valid amount or items provided, using minimum amount');
          finalAmount = 50; // Minimum 50 cents
        }
        
        // Validate final amount
        if (isNaN(finalAmount) || finalAmount < 50) {
          console.warn(`Invalid amount calculated: ${finalAmount}, using minimum 50 cents`);
          finalAmount = 50; // Minimum amount for Stripe
        }
        
        // Round to ensure it's an integer (Stripe requires integer for cents)
        finalAmount = Math.round(finalAmount);
        
        // Create payment intent without customer ID to avoid test/live mode mismatch
        console.log(`Creating payment intent for amount: ${finalAmount} cents without customer ID to avoid mode mismatch`);
        // Skip customer ID entirely - this allows the payment to work regardless of test/live mode
        const clientSecret = await createPaymentIntent(finalAmount);
        
        // Successful response
        console.log(`Payment intent created successfully for amount: ${finalAmount} cents`);
        res.json({ 
          clientSecret,
          amount: finalAmount,
          success: true
        });
      } catch (err: any) {
        console.error('Stripe payment error:', err);
        
        // Enhanced error handling with client-friendly messages
        let statusCode = 500;
        let clientMessage = "Failed to process payment request";
        let errorCode = "stripe_error";
        
        if (err.type === 'StripeAuthenticationError') {
          clientMessage = "Payment system configuration error";
          errorCode = "stripe_auth_error";
        } else if (err.type === 'StripeConnectionError') {
          statusCode = 503; // Service Unavailable
          clientMessage = "Could not connect to payment system. Please try again later";
          errorCode = "stripe_connection_error";
        } else if (err.type === 'StripeInvalidRequestError') {
          statusCode = 400; // Bad Request
          clientMessage = "Invalid payment request";
          errorCode = "stripe_invalid_request";
        } else if (err.message.includes('customer')) {
          clientMessage = "Error with customer profile. Please try again later.";
          errorCode = "customer_error";
        }
        
        res.status(statusCode).json({ 
          message: clientMessage, 
          error: errorCode,
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    } catch (error: any) {
      console.error("Unexpected error in payment intent endpoint:", error);
      res.status(500).json({ 
        message: "An unexpected error occurred", 
        error: "server_error" 
      });
      next(error);
    }
  });
  
  // Get or create subscription endpoint
  app.post("/api/get-or-create-subscription", async (req, res, next) => {
    // Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        message: "Please log in to manage your subscription",
        error: "authentication_required"
      });
    }
    
    try {
      // Verify Stripe is properly configured
      const { checkStripeApiKey } = await import('./services/stripe-service');
      const stripeStatus = await checkStripeApiKey();
      
      if (!stripeStatus.valid) {
        console.error("Stripe API key validation failed:", stripeStatus.message);
        return res.status(503).json({ 
          message: "Subscription service is not available at this time. Please try again later.",
          error: "stripe_unavailable",
          details: stripeStatus.message
        });
      }
      
      const { createSubscription, checkSubscriptionStatus } = await import('./stripe');
      
      // Check if user already has a subscription
      if (req.user.stripeSubscriptionId) {
        try {
          console.log(`Checking existing subscription status for user ${req.user.id}: ${req.user.stripeSubscriptionId}`);
          const status = await checkSubscriptionStatus(req.user.stripeSubscriptionId);
          
          if (status.status === 'active') {
            console.log(`User ${req.user.id} already has an active subscription`);
            return res.status(400).json({ 
              message: 'You already have an active subscription',
              error: 'subscription_exists'
            });
          } else {
            console.log(`User ${req.user.id} has an inactive subscription with status: ${status.status}`);
          }
        } catch (err) {
          console.error('Error checking subscription status:', err);
          // Continue if the subscription doesn't exist anymore
        }
      }
      
      // Check if we need to create a new customer due to test/live mode mismatch
      const user = req.user;
      let newCustomerId: string | undefined = undefined;
      
      if (user.stripeCustomerId) {
        const stripeKey = process.env.STRIPE_SECRET_KEY || '';
        const isLiveKey = stripeKey.startsWith('sk_live_') || stripeKey.startsWith('rk_live_');
        const isLiveCustomer = user.stripeCustomerId.startsWith('cus_') && !user.stripeCustomerId.includes('_test_');
        
        if ((isLiveKey && !isLiveCustomer) || (!isLiveKey && isLiveCustomer)) {
          console.log(`Key/customer mode mismatch in subscription flow. Key: ${isLiveKey ? 'live' : 'test'}, Customer: ${isLiveCustomer ? 'live' : 'test'}`);
          console.log(`Creating new ${isLiveKey ? 'live' : 'test'} mode customer for user ${user.id}`);
          
          const { createCustomer } = await import('./stripe');
          newCustomerId = await createCustomer(user);
          
          // Update user record with the new customer ID
          await storage.updateUserStripeCustomerId(user.id, newCustomerId);
          console.log(`Updated user with new customer ID: ${newCustomerId}`);
        }
      }
      
      // Create new subscription with the appropriate customer ID
      console.log(`Creating new subscription for user ${req.user.id}`);
      const result = await createSubscription(req.user.id, newCustomerId);
      
      // Log success and return result
      console.log(`Successfully created subscription for user ${req.user.id}: ${result.subscriptionId}`);
      res.json(result);
    } catch (err: any) {
      console.error('Error creating subscription:', err);
      
      // Provide more helpful error messages
      let statusCode = 500;
      let errorCode = 'subscription_error';
      let message = err.message || 'An error occurred while creating your subscription';
      
      if (err.type === 'StripeAuthenticationError') {
        errorCode = 'stripe_auth_error';
        message = 'Payment system configuration error';
      } else if (err.type === 'StripeConnectionError') {
        statusCode = 503;
        errorCode = 'stripe_connection_error';
        message = 'Could not connect to payment system. Please try again later';
      } else if (err.type === 'StripeInvalidRequestError') {
        statusCode = 400;
        errorCode = 'stripe_invalid_request';
        message = 'Invalid subscription request';
      } else if (err.message.includes('customer')) {
        errorCode = 'customer_error';
        message = 'Error with customer profile. Please try again later';
      }
      
      res.status(statusCode).json({ 
        message, 
        error: errorCode,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });
  
  // Cancel subscription endpoint
  app.post("/api/cancel-subscription", async (req, res, next) => {
    // Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        message: "Please log in to manage your subscription",
        error: "authentication_required" 
      });
    }
    
    try {
      // Verify Stripe is properly configured
      const { checkStripeApiKey } = await import('./services/stripe-service');
      const stripeStatus = await checkStripeApiKey();
      
      if (!stripeStatus.valid) {
        console.error("Stripe API key validation failed:", stripeStatus.message);
        return res.status(503).json({ 
          message: "Subscription service is not available at this time. Please try again later.",
          error: "stripe_unavailable",
          details: stripeStatus.message
        });
      }
      
      // Verify user has an active subscription
      if (!req.user.stripeSubscriptionId) {
        console.log(`User ${req.user.id} attempted to cancel non-existent subscription`);
        return res.status(400).json({ 
          message: 'No active subscription found',
          error: 'no_subscription' 
        });
      }
      
      try {
        console.log(`Attempting to cancel subscription for user ${req.user.id}: ${req.user.stripeSubscriptionId}`);
        const { cancelSubscription } = await import('./stripe');
        await cancelSubscription(req.user.stripeSubscriptionId);
        
        // Update user record to free tier
        console.log(`Updating user ${req.user.id} to free tier after subscription cancellation`);
        await storage.updateUserSubscription(req.user.id, 'free');
        
        console.log(`Successfully canceled subscription for user ${req.user.id}`);
        res.json({ 
          success: true,
          message: "Your subscription has been successfully canceled" 
        });
      } catch (err: any) {
        console.error('Error during subscription cancellation:', err);
        
        // Attempt recovery by updating the user anyway
        if (err.message.includes('No such subscription') || 
            err.message.includes('resource_missing') ||
            err.message.includes('invalid subscription')) {
          console.log(`Subscription doesn't exist in Stripe but exists in DB. Updating user record anyway.`);
          await storage.updateUserSubscription(req.user.id, 'free');
          
          return res.json({ 
            success: true, 
            message: "Your subscription has been successfully canceled",
            warning: "Subscription was already canceled or expired" 
          });
        }
        
        // Handle error if recovery wasn't possible
        throw err;
      }
    } catch (err: any) {
      console.error('Subscription cancellation error:', err);
      
      // Enhanced error handling
      let statusCode = 500;
      let errorCode = 'cancellation_error';
      let message = err.message || 'An error occurred while canceling your subscription';
      
      if (err.type === 'StripeAuthenticationError') {
        errorCode = 'stripe_auth_error';
        message = 'Payment system configuration error';
      } else if (err.type === 'StripeConnectionError') {
        statusCode = 503;
        errorCode = 'stripe_connection_error';
        message = 'Could not connect to payment system. Please try again later';
      } else if (err.type === 'StripeInvalidRequestError') {
        statusCode = 400;
        errorCode = 'stripe_invalid_request';
        message = 'Invalid cancellation request';
      }
      
      res.status(statusCode).json({ 
        message,
        error: errorCode,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });
  
  // Stripe webhook handler
  app.post("/api/webhook", async (req, res, next) => {
    try {
      // Verify Stripe is properly configured
      const { checkStripeApiKey, getStripe } = await import('./services/stripe-service');
      const stripeStatus = await checkStripeApiKey();
      
      if (!stripeStatus.valid) {
        console.error("Stripe API key validation failed:", stripeStatus.message);
        return res.status(503).json({ 
          message: "Payment service is not available at this time",
          error: "stripe_unavailable"
        });
      }
      
      // Import the webhook handler
      const { handleSubscriptionEvent } = await import('./stripe');
      
      // Get the signature from headers
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        console.error("Missing Stripe signature in webhook request");
        return res.status(400).json({ 
          message: "Missing stripe-signature header",
          error: "missing_signature" 
        });
      }
      
      try {
        // Convert request body to buffer (Stripe requires raw body)
        const buffer = Buffer.from(JSON.stringify(req.body));
        
        // Get stripe instance from our service
        const stripe = getStripe();
        if (!stripe) {
          throw new Error("Could not initialize Stripe");
        }
        
        // Validate webhook signature
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
        console.log(`Validating webhook signature with secret: ${webhookSecret.substring(0, 8)}...`);
        
        const event = stripe.webhooks.constructEvent(
          buffer,
          signature,
          webhookSecret
        );
        
        // Log the event for debugging
        console.log(`Received valid webhook event of type: ${event.type}`);
        
        // Handle supported event types
        if (
          event.type === 'customer.subscription.created' ||
          event.type === 'customer.subscription.updated' ||
          event.type === 'customer.subscription.deleted'
        ) {
          console.log(`Processing ${event.type} event`);
          await handleSubscriptionEvent(event);
          console.log(`Successfully processed ${event.type} event`);
        } else {
          console.log(`Ignoring unhandled event type: ${event.type}`);
        }
        
        // Successful response
        res.json({ 
          received: true,
          type: event.type
        });
      } catch (err: any) {
        console.error('Webhook validation error:', err.message);
        
        // Provide better error messages based on common webhook issues
        let errorMessage = `Webhook Error: ${err.message}`;
        let errorCode = 'webhook_error';
        
        if (err.message.includes('No signatures found')) {
          errorMessage = 'Invalid webhook signature. Check that your webhook secret is configured correctly.';
          errorCode = 'invalid_signature';
        } else if (err.message.includes('timestamp')) {
          errorMessage = 'Webhook timestamp is outside of tolerance window. Check your server clock.';
          errorCode = 'timestamp_error';
        }
        
        return res.status(400).json({ 
          message: errorMessage,
          error: errorCode
        });
      }
    } catch (error: any) {
      console.error('Unexpected webhook error:', error);
      res.status(500).json({ 
        message: "An unexpected error occurred processing the webhook",
        error: "server_error" 
      });
      next(error);
    }
  });
  
  // Direct image generation endpoint without saving to design (for form previews)
  app.post("/api/generate-image", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { 
        sport, 
        kitType, 
        primaryColor, 
        secondaryColor,
        accentColor1,
        accentColor2,
        sleeveStyle, 
        collarType, 
        patternStyle, 
        designNotes 
      } = req.body;
      
      // Validate required fields
      if (!sport || !kitType || !primaryColor || !secondaryColor) {
        return res.status(400).json({ 
          message: "Missing required fields: sport, kitType, primaryColor, and secondaryColor are required."
        });
      }
      
      try {
        console.log("Generating direct image with parameters:", req.body);
        
        // Step 1: Generate enhanced prompt using OpenAI
        const { generateKitPrompt, generateJerseyImageWithReplicate } = await import('./openai');
        const enhancedPrompt = await generateKitPrompt({
          sport,
          kitType,
          primaryColor,
          secondaryColor,
          accentColor1,
          accentColor2,
          sleeveStyle,
          collarType,
          patternStyle,
          designNotes
        });
        
        console.log("Enhanced prompt for direct image generation:", enhancedPrompt.substring(0, 200) + "...");
        
        // Step 2: Generate image with Replicate
        const imageResult = await generateJerseyImageWithReplicate(enhancedPrompt, kitType);
        
        // Return the image URL directly (for compatibility)
        res.json({ 
          imageUrl: imageResult.imageUrl,
          imageData: imageResult.imageData
        });
      } catch (error: any) {
        console.error("Error generating image:", error);
        res.status(500).json({ 
          message: "Failed to generate image", 
          error: error.message || "Unknown error" 
        });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Serve uploads directory for partner logos
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Payment routes - importing from payment.ts for Stripe checkout flow
  try {
    // We're excluding the payment routes registration to avoid conflicts
    // with the implementation in this file (specifically the /api/create-payment-intent endpoint)
    // const { registerPaymentRoutes } = await import('./payment');
    // registerPaymentRoutes(app);
    console.log('Payment routes managed directly in routes.ts');
  } catch (error) {
    console.error('Error managing payment routes:', error);
  }
  
  // Stripe health check endpoint
  app.get('/api/payment/health', async (req, res) => {
    try {
      const { checkStripeApiKey } = await import('./services/stripe-service');
      const result = await checkStripeApiKey();
      
      console.log('Stripe health check result:', result);
      
      if (result.valid) {
        res.json({
          status: 'ok',
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'error',
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('Error checking Stripe health:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Unknown error checking Stripe health',
        timestamp: new Date().toISOString()
      });
    }
  });

  // User preferences routes
  app.post("/api/user/preferences", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("Saving user preferences:", req.body);

      // Validate preferences data
      const preferencesSchema = z.object({
        dashboardTab: z.string().optional(),
      });

      const result = preferencesSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid preferences data", 
          errors: result.error.format() 
        });
      }

      // Save user preferences
      const updatedUser = await storage.updateUserPreferences(req.user.id, req.body);
      
      res.status(200).json({ 
        message: "Preferences updated successfully", 
        preferences: updatedUser.preferences || {}
      });
    } catch (error: any) {
      console.error("Error updating user preferences:", error);
      next(error);
    }
  });

  // API to get user preferences
  app.get("/api/user/preferences", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get user with preferences
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ preferences: user.preferences || {} });
    } catch (error: any) {
      console.error("Error fetching user preferences:", error);
      next(error);
    }
  });

  // Serve images from the output directory
  app.get('/output/:filename', (req, res, next) => {
    try {
      const filename = req.params.filename;
      if (!filename || filename.includes('..')) {
        return res.status(400).send('Invalid filename');
      }
      
      const imagePath = path.join(process.cwd(), 'output', filename);
      
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        console.error(`File not found: ${imagePath}`);
        return res.status(404).send('Image not found');
      }
      
      // Determine content type based on extension
      let contentType = 'image/png';
      if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      }
      
      res.setHeader('Content-Type', contentType);
      return res.sendFile(imagePath);
    } catch (error) {
      console.error('Error serving image:', error);
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
