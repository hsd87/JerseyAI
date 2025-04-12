import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
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

      // Use OpenAI to generate a detailed prompt for the kit design
      try {
        const { generateKitPrompt, generateKitImageWithReplicate } = await import("./openai");
        
        // Generate the prompts using OpenAI
        const promptsJson = await generateKitPrompt({
          sport: design.sport,
          kitType: design.kitType,
          primaryColor: design.primaryColor,
          secondaryColor: design.secondaryColor,
          sleeveStyle: design.sleeveStyle,
          collarType: design.collarType,
          patternStyle: design.patternStyle,
          designNotes: design.designNotes
        });
        
        // Parse the prompts
        const prompts = JSON.parse(promptsJson);
        
        // Generate the images using Replicate (or mock for now)
        const frontImage = await generateKitImageWithReplicate(prompts.frontPrompt);
        const backImage = await generateKitImageWithReplicate(prompts.backPrompt);

        // Update the design with the generated images
        const updatedDesign = await storage.updateDesign(designId, {
          frontImageUrl: frontImage,
          backImageUrl: backImage
        });

        res.json(updatedDesign);
      } catch (error) {
        console.error("Error generating design:", error);
        res.status(500).json({ message: "Failed to generate design", error: error.message });
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
      let subscriptionData = {
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
          
          subscriptionData = {
            isSubscribed: stripeStatus.status === 'active',
            subscriptionTier: stripeStatus.status === 'active' ? 'pro' : 'free',
            subscriptionExpiry: new Date(stripeStatus.current_period_end * 1000).toISOString(),
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
