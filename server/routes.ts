import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { designFormSchema, insertOrderSchema } from "@shared/schema";
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

  // Create order
  app.post("/api/orders", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = insertOrderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid order data", errors: result.error.format() });
      }

      // Ensure the design exists and belongs to the user
      const design = await storage.getDesignById(req.body.designId);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      if (design.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const order = await storage.createOrder({
        ...req.body,
        userId: req.user.id
      });

      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  });

  // Get user orders
  app.get("/api/orders", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orders = await storage.getUserOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });

  // Get order by id
  app.get("/api/orders/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orderId = parseInt(req.params.id);
      const order = await storage.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(order);
    } catch (error) {
      next(error);
    }
  });

  // Subscription endpoints
  app.post("/api/subscribe", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Update user's subscription tier
      const user = await storage.updateUserSubscription(req.user.id, "pro");
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
