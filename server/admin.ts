import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";

/**
 * Middleware to check if user is admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }

  next();
};

/**
 * Register admin-specific routes
 */
export function registerAdminRoutes(app: Express) {
  // Admin order management routes
  
  // Get all orders (for admin dashboard)
  app.get("/api/admin/orders", isAdmin, async (req: Request, res: Response) => {
    try {
      // Get orders from storage with optional filters
      const { status, startDate, endDate } = req.query;
      
      // Get all orders from database
      const orders = await storage.getAllOrders();
      
      // Apply filters if provided
      let filteredOrders = orders;
      
      if (status) {
        filteredOrders = filteredOrders.filter(order => 
          order.status === status
        );
      }
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= start && orderDate <= end;
        });
      }
      
      res.json(filteredOrders);
    } catch (error: any) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update order status
  app.patch("/api/admin/orders/:id/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status, trackingId } = req.body;
      
      // Validate input
      const updateSchema = z.object({
        status: z.string().min(1),
        trackingId: z.string().optional()
      });
      
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: result.error.format() 
        });
      }
      
      // Update order status
      const updatedOrder = await storage.updateOrderStatus(orderId, status, trackingId);
      
      res.json(updatedOrder);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get analytics data
  app.get("/api/admin/analytics", isAdmin, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllOrders();
      const users = await storage.getAllUsers();
      const designs = await storage.getAllDesigns();
      const b2bLeads = await storage.getB2BLeads();
      
      // Calculate analytics metrics
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => order.status === "pending").length;
      const completedOrders = orders.filter(order => order.status === "completed").length;
      const totalUsers = users.length;
      const proUsers = users.filter(user => user.subscriptionTier === "pro").length;
      const totalDesigns = designs.length;
      const totalB2BLeads = b2bLeads.length;
      
      // Calculate revenue by date (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      // Group orders by date
      const dailyRevenue: Record<string, number> = {};
      
      // Initialize all dates in the last 30 days with 0
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
        dailyRevenue[dateString] = 0;
      }
      
      // Aggregate revenue by date
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= thirtyDaysAgo) {
          const dateString = orderDate.toISOString().split('T')[0];
          dailyRevenue[dateString] = (dailyRevenue[dateString] || 0) + order.totalAmount;
        }
      });
      
      // Most popular sports
      const sportCounts: Record<string, number> = {};
      orders.forEach(order => {
        sportCounts[order.sport] = (sportCounts[order.sport] || 0) + 1;
      });
      
      res.json({
        summary: {
          totalRevenue: totalRevenue / 100, // Convert cents to dollars
          totalOrders,
          pendingOrders,
          completedOrders,
          totalUsers,
          proUsers,
          totalDesigns,
          totalB2BLeads
        },
        dailyRevenue,
        sportCounts
      });
    } catch (error: any) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get B2B leads for admin
  app.get("/api/admin/leads", isAdmin, async (req: Request, res: Response) => {
    try {
      const leads = await storage.getB2BLeads();
      res.json(leads);
    } catch (error: any) {
      console.error("Error fetching B2B leads:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update lead status
  app.patch("/api/admin/leads/:id/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate input
      const updateSchema = z.object({
        status: z.string().min(1)
      });
      
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: result.error.format() 
        });
      }
      
      // Update lead status
      const updatedLead = await storage.updateB2BLeadStatus(leadId, status);
      
      res.json(updatedLead);
    } catch (error: any) {
      console.error("Error updating lead status:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // User management routes
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove sensitive data like passwords
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update user role
  app.patch("/api/admin/users/:id/role", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      // Validate input
      const updateSchema = z.object({
        role: z.enum(["user", "admin"])
      });
      
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: result.error.format() 
        });
      }
      
      // Update user role
      const updatedUser = await storage.updateUserRole(userId, role);
      
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: error.message });
    }
  });
}