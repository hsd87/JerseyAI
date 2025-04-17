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
        const formData = req.body.formData;
        console.log("Received form data:", formData);
        
        // Use form data if available, otherwise fallback to database values
        const options = {
          sport: formData?.sport || design.sport,
          kitType: formData?.kitType || design.kitType,
          primaryColor: formData?.primaryColor || design.primaryColor,
          secondaryColor: formData?.secondaryColor || design.secondaryColor,
          accentColor1: formData?.accentColor1 || design.accentColor1 || undefined,
          accentColor2: formData?.accentColor2 || design.accentColor2 || undefined,
          sleeveStyle: formData?.sleeveStyle || design.sleeveStyle || undefined,
          collarType: formData?.collarType || design.collarType || undefined,
          patternStyle: formData?.patternStyle || design.patternStyle || undefined,
          designNotes: formData?.designNotes || design.designNotes || undefined
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

  // Get design by id
  app.get("/api/designs/:id", async (req, res, next) => {
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

      res.json(design);
    } catch (error) {
      next(error);
    }
  });

  // Delete design
  app.delete("/api/designs/:id", async (req, res, next) => {
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

      await storage.deleteDesign(designId);
      res.status(204).send();
    } catch (error) {
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
  
  // Admin routes - importing from admin.ts for admin dashboard functionality
  try {
    registerAdminRoutes(app);
    console.log('Admin routes registered successfully');
  } catch (error) {
    console.error('Error registering admin routes:', error);
  }

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

      // Check Stripe configuration
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error("STRIPE_SECRET_KEY environment variable is not set");
        return res.status(500).json({ 
          message: "Payment system is not configured properly. Please contact support.",
          error: "stripe_not_configured"
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
      
      // Use a dummy item for testing if neither is provided
      const shouldUseDummyItem = (!items || !Array.isArray(items) || items.length === 0) && !amount;
      
      if (shouldUseDummyItem) {
        console.log("No items or amount provided, using dummy item for testing");
      }

      try {
        const { calculateOrderAmount, createPaymentIntent } = await import('./stripe');
        
        // Get or create customer ID
        const user = req.user;
        if (!user.stripeCustomerId) {
          console.log(`Creating Stripe customer for user ${user.id}`);
          const { createCustomer } = await import('./stripe');
          await createCustomer(user);
          
          // Reload user to get the updated stripeCustomerId
          const updatedUser = await storage.getUser(user.id);
          if (!updatedUser || !updatedUser.stripeCustomerId) {
            throw new Error("Failed to create or retrieve Stripe customer ID");
          }
          user.stripeCustomerId = updatedUser.stripeCustomerId;
        }
        
        // Calculate final amount in cents
        let finalAmount: number;
        
        if (shouldUseDummyItem) {
          // For testing - minimum charge amount (50 cents)
          finalAmount = 50;
        } else if (amount) {
          // Direct amount provided
          finalAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
          // Convert to cents if it appears to be in dollars
          if (finalAmount < 50) {
            finalAmount = Math.round(finalAmount * 100);
          }
        } else {
          // Calculate from items
          finalAmount = await calculateOrderAmount(items);
        }
        
        // Validate final amount
        if (isNaN(finalAmount) || finalAmount < 50) {
          console.warn(`Invalid amount calculated: ${finalAmount}, using minimum 50 cents`);
          finalAmount = 50; // Minimum amount for Stripe
        }
        
        // Round to ensure it's an integer (Stripe requires integer for cents)
        finalAmount = Math.round(finalAmount);
        
        // Create payment intent
        console.log(`Creating payment intent for amount: ${finalAmount} cents with customer ID: ${user.stripeCustomerId}`);
        const clientSecret = await createPaymentIntent(finalAmount, user.stripeCustomerId);
        
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
        let clientMessage = "Failed to process payment request";
        let errorCode = "stripe_error";
        
        if (err.type === 'StripeAuthenticationError') {
          clientMessage = "Payment system configuration error";
          errorCode = "stripe_auth_error";
        } else if (err.type === 'StripeConnectionError') {
          clientMessage = "Could not connect to payment system. Please try again later";
          errorCode = "stripe_connection_error";
        } else if (err.type === 'StripeInvalidRequestError') {
          clientMessage = "Invalid payment request";
          errorCode = "stripe_invalid_request";
        }
        
        res.status(500).json({ 
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Please log in to manage your subscription" });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }
    
    try {
      const { createSubscription, checkSubscriptionStatus } = await import('./stripe');
      
      // Check if user already has a subscription
      if (req.user.stripeSubscriptionId) {
        try {
          const status = await checkSubscriptionStatus(req.user.stripeSubscriptionId);
          
          if (status.status === 'active') {
            return res.status(400).json({ message: 'You already have an active subscription' });
          }
        } catch (err) {
          console.error('Error checking subscription status:', err);
          // Continue if the subscription doesn't exist anymore
        }
      }
      
      // Create new subscription
      const result = await createSubscription(req.user.id);
      res.json(result);
    } catch (err: any) {
      console.error('Error creating subscription:', err);
      res.status(500).json({ message: err.message });
    }
  });
  
  // Cancel subscription endpoint
  app.post("/api/cancel-subscription", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Please log in to manage your subscription" });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }
    
    try {
      if (!req.user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active subscription found' });
      }
      
      const { cancelSubscription } = await import('./stripe');
      await cancelSubscription(req.user.stripeSubscriptionId);
      
      // Update user record
      await storage.updateUserSubscription(req.user.id, 'free');
      
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      res.status(500).json({ message: err.message });
    }
  });
  
  // Stripe webhook handler
  app.post("/api/webhook", async (req, res, next) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({ message: "Stripe is not configured" });
    }
    
    try {
      // Import Buffer from node:buffer to avoid compatibility issues
      const buffer = Buffer.from(JSON.stringify(req.body));
      const stripe = await import('stripe').then(pkg => new pkg.default(process.env.STRIPE_SECRET_KEY!));
      const { handleSubscriptionEvent } = await import('./stripe');
      
      // Get the signature from headers
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        return res.status(400).json({ message: "Missing stripe-signature header" });
      }
      
      try {
        const event = stripe.webhooks.constructEvent(
          buffer,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'
        );
        
        // Handle subscription-related events
        if (
          event.type === 'customer.subscription.created' ||
          event.type === 'customer.subscription.updated' ||
          event.type === 'customer.subscription.deleted'
        ) {
          await handleSubscriptionEvent(event);
        }
        
        res.json({ received: true });
      } catch (err: any) {
        console.error('Webhook error:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }
    } catch (error) {
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
    const { registerPaymentRoutes } = await import('./payment');
    registerPaymentRoutes(app);
    console.log('Payment routes registered successfully');
  } catch (error) {
    console.error('Error registering payment routes:', error);
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
