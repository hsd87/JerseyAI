import { users, designs, orders, type User, type InsertUser, type Design, type InsertDesign, type Order, type InsertOrder } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Auth Methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  
  // Design Methods
  createDesign(design: InsertDesign): Promise<Design>;
  getDesignById(id: number): Promise<Design | undefined>;
  getUserDesigns(userId: number): Promise<Design[]>;
  updateDesign(id: number, data: Partial<Design>): Promise<Design>;
  deleteDesign(id: number): Promise<void>;
  
  // Order Methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: string, trackingId?: string): Promise<Order>;
  
  // Subscription Methods
  updateUserSubscription(userId: number, tier: string): Promise<User>;
  updateUserStripeInfo(userId: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  
  // Generation Credits
  decrementDesignCredits(userId: number): Promise<User>;
  resetMonthlyDesignCredits(): Promise<void>;
  
  // Session Store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private designs: Map<number, Design>;
  private orders: Map<number, Order>;
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentDesignId: number;
  currentOrderId: number;

  constructor() {
    this.users = new Map();
    this.designs = new Map();
    this.orders = new Map();
    this.currentUserId = 1;
    this.currentDesignId = 1;
    this.currentOrderId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      remainingDesigns: 6,
      subscriptionTier: "free",
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Design Methods
  async createDesign(design: InsertDesign): Promise<Design> {
    const id = this.currentDesignId++;
    const newDesign: Design = {
      ...design,
      id,
      customizations: {},
      isFavorite: false,
      createdAt: new Date(),
      frontImageUrl: undefined,
      backImageUrl: undefined
    };
    this.designs.set(id, newDesign);
    return newDesign;
  }

  async getDesignById(id: number): Promise<Design | undefined> {
    return this.designs.get(id);
  }

  async getUserDesigns(userId: number): Promise<Design[]> {
    return Array.from(this.designs.values()).filter(
      (design) => design.userId === userId
    );
  }

  async updateDesign(id: number, data: Partial<Design>): Promise<Design> {
    const design = await this.getDesignById(id);
    if (!design) {
      throw new Error(`Design with id ${id} not found`);
    }
    
    const updatedDesign = { ...design, ...data };
    this.designs.set(id, updatedDesign);
    return updatedDesign;
  }

  async deleteDesign(id: number): Promise<void> {
    this.designs.delete(id);
  }

  // Order Methods
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const newOrder: Order = {
      ...order,
      id,
      status: "pending",
      createdAt: new Date(),
      trackingId: undefined
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  async updateOrderStatus(id: number, status: string, trackingId?: string): Promise<Order> {
    const order = await this.getOrderById(id);
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }
    
    const updatedOrder = { 
      ...order, 
      status, 
      ...(trackingId ? { trackingId } : {}) 
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Subscription Methods
  async updateUserSubscription(userId: number, tier: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const updatedUser = { 
      ...user, 
      subscriptionTier: tier,
      // Reset remaining designs if upgrading to pro
      ...(tier === "pro" ? { remainingDesigns: Infinity } : {})
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, info: { stripeCustomerId: string; stripeSubscriptionId: string; }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const updatedUser = { 
      ...user,
      stripeCustomerId: info.stripeCustomerId,
      stripeSubscriptionId: info.stripeSubscriptionId
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Generation Credits
  async decrementDesignCredits(userId: number): Promise<User> {
    const user = await this.getUser(userId);
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
    
    const updatedUser = { 
      ...user, 
      remainingDesigns: user.remainingDesigns - 1 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async resetMonthlyDesignCredits(): Promise<void> {
    // This would normally run on a schedule
    // Reset credits for all free tier users
    for (const [id, user] of this.users.entries()) {
      if (user.subscriptionTier === "free") {
        const updatedUser = { ...user, remainingDesigns: 6 };
        this.users.set(id, updatedUser);
      }
    }
  }
}

export const storage = new MemStorage();
