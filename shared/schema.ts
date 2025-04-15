import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  remainingDesigns: integer("remaining_designs").default(6).notNull(),
  subscriptionTier: text("subscription_tier").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  role: text("role").default("user").notNull(), // Possible values: "user", "admin"
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define user relations
export const usersRelations = relations(users, ({ many }) => ({
  designs: many(designs),
  orders: many(orders)
}));

export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sport: text("sport").notNull(),
  kitType: text("kit_type").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
  sleeveStyle: text("sleeve_style"),
  collarType: text("collar_type"),
  patternStyle: text("pattern_style"),
  designNotes: text("design_notes"),
  frontImageUrl: text("front_image_url"),
  backImageUrl: text("back_image_url"),
  customizations: json("customizations").$type<CustomizationData>(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertDesignSchema = createInsertSchema(designs).omit({
  id: true,
  createdAt: true,
  isFavorite: true,
  customizations: true,
  frontImageUrl: true,
  backImageUrl: true
});

export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type Design = typeof designs.$inferSelect;

// Define design relations
export const designsRelations = relations(designs, ({ one, many }) => ({
  user: one(users, {
    fields: [designs.userId],
    references: [users.id]
  }),
  orders: many(orders)
}));

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  designId: integer("design_id").notNull(),
  // Note: uuid column exists in schema but not in DB - we'll handle this in the code
  // uuid: text("uuid").notNull().unique(),
  prompt: text("prompt"),
  designUrls: json("design_urls").$type<{front: string, back: string}>(),
  sport: text("sport").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").default("pending").notNull(),
  orderDetails: json("order_details").$type<OrderDetails>(),
  shippingAddress: json("shipping_address").$type<ShippingAddress>(),
  metadata: json("metadata").$type<Record<string, any>>(),
  pdfUrl: text("pdf_url"),
  trackingId: text("tracking_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
  trackingId: true,
  pdfUrl: true
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Define order relations
export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  design: one(designs, {
    fields: [orders.designId],
    references: [designs.id]
  })
}));

// Types for the JSON fields
export type CustomizationData = {
  text?: {
    content: string;
    position: { x: number; y: number };
    color: string;
    size: string;
    font: string;
  }[];
  numbers?: {
    value: number;
    position: { x: number; y: number };
    color: string;
    size: string;
  }[];
  logos?: {
    url: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }[];
};

export type OrderDetails = {
  items: {
    type: string; // jersey, shorts, etc.
    size: string;
    quantity: number;
    gender: string; // Male, Female, Youth
    price: number;
  }[];
  addOns?: {
    name: string; // e.g., "socks", "headwear"
    price: number;
    quantity: number;
  }[];
  packageType: string; // "Jersey only", "Jersey + Shorts", etc.
  discount?: number;
  isTeamOrder: boolean;
  teamName?: string;
  deliveryTimeline?: string;
};

export type ShippingAddress = {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

export const sportOptions = [
  "soccer",
  "basketball",
  "cricket",
  "rugby",
  "esports"
] as const;

// Common kit types across sports
export const kitTypeOptions = [
  "jersey",
  "jerseyShorts",
  "tracksuit",
  "trackjacket",
  "trackhoodie",
  "trackjackethzip",
  "jerseyTrousers",
  "esportsjacket",
  "esportshoodie"
] as const;

// Sport-specific kit type mapping
export const sportKitTypeMapping: Record<string, string[]> = {
  soccer: ["jersey", "jerseyShorts", "tracksuit", "trackjacket", "trackhoodie", "trackjackethzip"],
  basketball: ["jersey", "jerseyShorts", "tracksuit", "trackjacket", "trackhoodie", "trackjackethzip"],
  rugby: ["jersey", "jerseyShorts", "tracksuit", "trackjacket", "trackhoodie", "trackjackethzip"],
  cricket: ["jersey", "jerseyTrousers", "tracksuit", "trackjacket", "trackhoodie", "trackjackethzip"],
  esports: ["jersey", "esportsjacket", "esportshoodie"]
};

export const sleeveOptions = [
  "sleeveless",
  "short",
  "long"
] as const;

// Sport-specific collar type mapping
export const sportCollarMapping: Record<string, string[]> = {
  soccer: ["crew", "v", "mandarin", "polo"],
  basketball: ["crew", "v", "roundzip"],
  rugby: ["v", "polo", "roundzip"],
  cricket: ["mandarin", "polo", "roundzip"],
  esports: ["v", "crew", "roundzip"]
};

export const collarOptions = [
  "crew",
  "v",
  "polo",
  "mandarin",
  "roundzip"
] as const;

// Sport-specific pattern type mapping
export const sportPatternMapping: Record<string, string[]> = {
  soccer: ["gradient", "slash", "panel", "striped", "digital", "minimal"],
  basketball: ["gradient", "slash", "panel", "digital"],
  rugby: ["panel", "striped", "digital"],
  cricket: ["gradient", "minimal", "striped"],
  esports: ["digital", "minimal"]
};

export const patternOptions = [
  "gradient",
  "slash",
  "panel", 
  "striped",
  "digital",
  "minimal"
] as const;

// Add-on products by sport
export const addonOptions: Record<string, string[]> = {
  soccer: ["socks", "headwear", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"],
  basketball: ["socks", "headwear", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"],
  rugby: ["socks", "headwear", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"],
  cricket: ["cap", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"],
  esports: ["headwear", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"]
};

export const designFormSchema = z.object({
  sport: z.enum(sportOptions),
  kitType: z.enum(kitTypeOptions),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  sleeveStyle: z.enum(sleeveOptions).optional(),
  collarType: z.enum(collarOptions).optional(),
  patternStyle: z.enum(patternOptions).optional(),
  designNotes: z.string().optional(),
});

export type DesignFormValues = z.infer<typeof designFormSchema>;

// B2B Lead Schema
export const b2bLeads = pgTable("b2b_leads", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  company: text("company").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  country: text("country").notNull(),
  partnershipType: text("partnership_type").notNull(),
  orderSize: text("order_size").notNull(),
  needsCustomBranding: boolean("needs_custom_branding").notNull(),
  logoUrl: text("logo_url"),
  notes: text("notes"),
  preferredContactMethod: text("preferred_contact_method").notNull(),
  bestTimeToReach: text("best_time_to_reach").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").default("new"),
});

export const insertB2BLeadSchema = createInsertSchema(b2bLeads).omit({
  id: true,
  createdAt: true,
  status: true
});

export type InsertB2BLead = z.infer<typeof insertB2BLeadSchema>;
export type B2BLead = typeof b2bLeads.$inferSelect;
