import { 
  users, designs, orders, b2bLeads,
  type User, type InsertUser, 
  type Design, type InsertDesign, 
  type Order, type InsertOrder,
  type B2BLead, type InsertB2BLead
} from "@shared/schema";
import session from "express-session";
import { eq, and, desc } from 'drizzle-orm';
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
  
  // Subscription Methods
  updateUserSubscription(userId: number, tier: string): Promise<User>;
  updateUserStripeInfo(userId: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
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
    const [newOrder] = await db
      .insert(orders)
      .values({
        ...order,
        status: "pending",
        createdAt: new Date()
      })
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
  async updateUserSubscription(userId: number, tier: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        subscriptionTier: tier,
        // Reset remaining designs if upgrading to pro
        ...(tier === "pro" ? { remainingDesigns: -1 } : {}) // -1 for unlimited
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
}

// Export database storage instead of memory storage
export const storage = new DatabaseStorage();