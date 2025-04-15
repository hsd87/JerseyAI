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
        const jerseyImage = await generateJerseyImageWithReplicate(enhancedPrompt, design.kitType);
        
        // For backward compatibility, set both front and back image URLs to the same combined image
        const updatedDesign = await storage.updateDesign(designId, {
          frontImageUrl: jerseyImage,
          backImageUrl: jerseyImage // Same image contains both views
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { items } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items provided" });
      }

      try {
        const { calculateOrderAmount, createPaymentIntent } = await import('./stripe');
        
        // Calculate amount based on items
        const amount = await calculateOrderAmount(items);
        
        // Get or create customer ID
        const user = req.user;
        if (!user.stripeCustomerId) {
          const { createCustomer } = await import('./stripe');
          await createCustomer(user);
        }
        
        // Create payment intent
        const clientSecret = await createPaymentIntent(amount, user.stripeCustomerId!);
        
        res.json({ clientSecret });
      } catch (err: any) {
        console.error('Stripe payment error:', err);
        res.status(500).json({ message: err.message });
      }
    } catch (error) {
      next(error);
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
          sleeveStyle,
          collarType,
          patternStyle,
          designNotes
        });
        
        console.log("Enhanced prompt for direct image generation:", enhancedPrompt.substring(0, 200) + "...");
        
        // Step 2: Generate image with Replicate
        const imageUrl = await generateJerseyImageWithReplicate(enhancedPrompt, kitType);
        
        // Return the image URL directly
        res.json({ imageUrl });
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
