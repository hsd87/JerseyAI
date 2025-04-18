import { 
  users, designs, orders, b2bLeads,
  type User, type InsertUser, 
  type Design, type InsertDesign, 
  type Order, type InsertOrder,
  type B2BLead, type InsertB2BLead
} from "@shared/schema";
import session from "express-session";
import { eq, and, desc, or, isNotNull } from 'drizzle-orm';
import connectPg from "connect-pg-simple";
import { db, pool } from './db';

// Storage interface
export interface IStorage {
  // Auth Methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Design Methods
  createDesign(design: InsertDesign): Promise<Design>;
  getDesignById(id: number): Promise<Design | undefined>;
  getUserDesigns(userId: number): Promise<Design[]>;
  getAllDesigns(): Promise<Design[]>;
  getPublicDesigns(): Promise<Design[]>;
  updateDesign(id: number, data: Partial<Design>): Promise<Design>;
  deleteDesign(id: number): Promise<void>;
  
  // Order Methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order>;
  updateOrderStatus(id: number, status: string, trackingId?: string): Promise<Order>;
  updateOrderPdfUrl(id: number, pdfUrl: string): Promise<Order>;
  updateOrderInvoice(id: number, invoiceData: { 
    invoiceNumber: string;
    invoiceUrl: string;
    invoiceDate: string;
  }): Promise<Order>;
  
  // Subscription Methods
  updateUserSubscription(userId: number, tier: string, subscriptionId?: string): Promise<User>;
  updateUserStripeInfo(userId: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  updateUserStripeCustomerId(userId: number, customerId: string): Promise<User>;
  findUsersByStripeCustomerId(stripeCustomerId: string): Promise<User[]>;
  
  // Generation Credits
  decrementDesignCredits(userId: number): Promise<User>;
  resetMonthlyDesignCredits(): Promise<void>;
  
  // B2B Leads Methods
  createB2BLead(lead: InsertB2BLead): Promise<B2BLead>;
  getB2BLeads(): Promise<B2BLead[]>;
  updateB2BLeadStatus(id: number, status: string): Promise<B2BLead>;
  
  // Payment Methods
  
  // Session Store
  sessionStore: any;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Use PostgreSQL for session storage
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        remainingDesigns: 6,
        subscriptionTier: "free",
        createdAt: new Date()
      })
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.username);
  }

  // Design Methods
  async createDesign(design: InsertDesign): Promise<Design> {
    const [newDesign] = await db
      .insert(designs)
      .values({
        ...design,
        customizations: {},
        isFavorite: false,
        createdAt: new Date()
      })
      .returning();
    return newDesign;
  }

  async getDesignById(id: number): Promise<Design | undefined> {
    const [design] = await db.select().from(designs).where(eq(designs.id, id));
    return design;
  }

  async getUserDesigns(userId: number): Promise<Design[]> {
    return db.select().from(designs).where(eq(designs.userId, userId));
  }
  
  async getAllDesigns(): Promise<Design[]> {
    return db.select().from(designs).orderBy(desc(designs.createdAt));
  }
  
  async getPublicDesigns(): Promise<Design[]> {
    try {
      // Get designs with image data - prioritize those with both image URLs and data
      const designsWithImages = await db
        .select()
        .from(designs)
        .where(
          and(
            or(
              and(
                isNotNull(designs.frontImageUrl),
                isNotNull(designs.frontImageData)
              ),
              and(
                isNotNull(designs.backImageUrl),
                isNotNull(designs.backImageData)
              )
            )
          )
        )
        .orderBy(desc(designs.createdAt))
        .limit(5);
      
      if (designsWithImages.length > 0) {
        return designsWithImages;
      }
      
      // Fall back to any designs with at least an image URL
      const designsWithUrls = await db
        .select()
        .from(designs)
        .where(
          or(
            isNotNull(designs.frontImageUrl),
            isNotNull(designs.backImageUrl)
          )
        )
        .orderBy(desc(designs.createdAt))
        .limit(5);
        
      if (designsWithUrls.length > 0) {
        return designsWithUrls;
      }
      
      // Last resort - any designs with image data
      return await db
        .select()
        .from(designs)
        .where(
          or(
            isNotNull(designs.frontImageData),
            isNotNull(designs.backImageData)
          )
        )
        .orderBy(desc(designs.createdAt))
        .limit(5);
    } catch (error) {
      console.error("Error fetching public designs:", error);
      return [];
    }
  }

  async updateDesign(id: number, data: Partial<Design>): Promise<Design> {
    const [updatedDesign] = await db
      .update(designs)
      .set(data)
      .where(eq(designs.id, id))
      .returning();
    
    if (!updatedDesign) {
      throw new Error(`Design with id ${id} not found`);
    }
    
    return updatedDesign;
  }

  async deleteDesign(id: number): Promise<void> {
    await db.delete(designs).where(eq(designs.id, id));
  }

  // Order Methods
  async createOrder(order: InsertOrder): Promise<Order> {
    // Insert order with simplified approach
    // Let database defaults handle missing values
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
      
    return newOrder;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId));
  }
  
  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: number, status: string, trackingId?: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        ...(trackingId ? { trackingId } : {})
      })
      .where(eq(orders.id, id))
      .returning();
    
    if (!updatedOrder) {
      throw new Error(`Order with id ${id} not found`);
    }
    
    return updatedOrder;
  }
  
  async updateOrderPdfUrl(id: number, pdfUrl: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ pdfUrl })
      .where(eq(orders.id, id))
      .returning();
    
    if (!updatedOrder) {
      throw new Error(`Order with id ${id} not found`);
    }
    
    return updatedOrder;
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    
    if (!updatedOrder) {
      throw new Error(`Order with id ${id} not found`);
    }
    
    return updatedOrder;
  }

  // Subscription Methods
  async updateUserSubscription(userId: number, tier: string, subscriptionId?: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        subscriptionTier: tier,
        // Reset remaining designs if upgrading to pro
        ...(tier === "pro" ? { remainingDesigns: -1 } : {}), // -1 for unlimited
        // Update subscription ID if provided
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {})
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, info: { stripeCustomerId: string; stripeSubscriptionId: string; }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: info.stripeCustomerId,
        stripeSubscriptionId: info.stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    return updatedUser;
  }
  
  async updateUserStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    return updatedUser;
  }
  
  async findUsersByStripeCustomerId(stripeCustomerId: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId));
  }

  // Generation Credits
  async decrementDesignCredits(userId: number): Promise<User> {
    // First get the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Don't decrement if user is on pro tier
    if (user.subscriptionTier === "pro") {
      return user;
    }
    
    if (user.remainingDesigns <= 0) {
      throw new Error("No design credits remaining");
    }
    
    // Decrement the credits
    const [updatedUser] = await db
      .update(users)
      .set({
        remainingDesigns: user.remainingDesigns - 1
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async resetMonthlyDesignCredits(): Promise<void> {
    // Reset credits for all free tier users
    await db
      .update(users)
      .set({ remainingDesigns: 6 })
      .where(eq(users.subscriptionTier, "free"));
  }
  
  // B2B Leads Methods
  async createB2BLead(lead: InsertB2BLead): Promise<B2BLead> {
    const [newLead] = await db
      .insert(b2bLeads)
      .values({
        ...lead,
        createdAt: new Date(),
        status: "new"
      })
      .returning();
    return newLead;
  }
  
  async getB2BLeads(): Promise<B2BLead[]> {
    return db
      .select()
      .from(b2bLeads)
      .orderBy(desc(b2bLeads.createdAt));
  }
  
  async updateB2BLeadStatus(id: number, status: string): Promise<B2BLead> {
    const [updatedLead] = await db
      .update(b2bLeads)
      .set({ status })
      .where(eq(b2bLeads.id, id))
      .returning();
      
    if (!updatedLead) {
      throw new Error(`B2B Lead with id ${id} not found`);
    }
    
    return updatedLead;
  }
  
  // Order Methods
  async createOrder(data: {
    userId: number;
    designId: number;
    sport: string;
    totalAmount: number;
    orderDetails: {
      items: {
        type: string;
        size: string;
        quantity: number;
        gender: string;
        price: number;
      }[];
      packageType: string;
      isTeamOrder: boolean;
      teamName?: string;
      addOns?: {
        name: string;
        price: number;
        quantity: number;
      }[];
      discount?: number;
      deliveryTimeline?: string;
    };
    shippingAddress: {
      name: string;
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      phone?: string;
    };
    prompt?: string;
    designUrls?: { front: string; back: string };
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      // Convert order data to JSON for storage
      const orderData = {
        userId: data.userId,
        designId: data.designId,
        sport: data.sport,
        totalAmount: data.totalAmount,
        orderDetails: JSON.stringify(data.orderDetails),
        shippingAddress: JSON.stringify(data.shippingAddress),
        prompt: data.prompt,
        designUrls: data.designUrls ? JSON.stringify(data.designUrls) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        status: 'pending',
        createdAt: new Date()
      };

      // Create the order in the database
      const [order] = await db
        .insert(orders)
        .values(orderData)
        .returning();

      if (!order) {
        throw new Error('Failed to create order');
      }

      // Parse JSON fields for return value
      return {
        ...order,
        orderDetails: JSON.parse(order.orderDetails),
        shippingAddress: JSON.parse(order.shippingAddress),
        designUrls: order.designUrls ? JSON.parse(order.designUrls) : null,
        metadata: order.metadata ? JSON.parse(order.metadata) : null
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getUserOrders(userId: number): Promise<any[]> {
    try {
      const orderResults = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));

      // Parse JSON fields for all orders
      return orderResults.map(order => ({
        ...order,
        orderDetails: JSON.parse(order.orderDetails),
        shippingAddress: JSON.parse(order.shippingAddress),
        designUrls: order.designUrls ? JSON.parse(order.designUrls) : null,
        metadata: order.metadata ? JSON.parse(order.metadata) : null
      }));
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId: number): Promise<any | null> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) {
        return null;
      }

      // Parse JSON fields
      return {
        ...order,
        orderDetails: JSON.parse(order.orderDetails),
        shippingAddress: JSON.parse(order.shippingAddress),
        designUrls: order.designUrls ? JSON.parse(order.designUrls) : null,
        metadata: order.metadata ? JSON.parse(order.metadata) : null
      };
    } catch (error) {
      console.error('Error fetching order by id:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: number, status: string, trackingId?: string): Promise<any> {
    try {
      const updateData: any = { status };
      
      if (trackingId) {
        updateData.trackingId = trackingId;
      }

      const [updatedOrder] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error(`Order with id ${orderId} not found`);
      }

      // Parse JSON fields
      return {
        ...updatedOrder,
        orderDetails: JSON.parse(updatedOrder.orderDetails),
        shippingAddress: JSON.parse(updatedOrder.shippingAddress),
        designUrls: updatedOrder.designUrls ? JSON.parse(updatedOrder.designUrls) : null,
        metadata: updatedOrder.metadata ? JSON.parse(updatedOrder.metadata) : null
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async getAllOrders(): Promise<any[]> {
    try {
      const orderResults = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt));

      // Parse JSON fields for all orders
      return orderResults.map(order => ({
        ...order,
        orderDetails: JSON.parse(order.orderDetails),
        shippingAddress: JSON.parse(order.shippingAddress),
        designUrls: order.designUrls ? JSON.parse(order.designUrls) : null,
        metadata: order.metadata ? JSON.parse(order.metadata) : null
      }));
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  }
}

// Export database storage instead of memory storage
export const storage = new DatabaseStorage();