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
  totalAmount: integer("total_amount").notNull(),
  status: text("status").default("pending").notNull(),
  orderDetails: json("order_details").$type<OrderDetails>(),
  shippingAddress: json("shipping_address").$type<ShippingAddress>(),
  trackingId: text("tracking_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
  trackingId: true
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
    size: string;
    quantity: number;
    gender: string;
    price: number;
  }[];
  addOns?: {
    name: string;
    price: number;
    quantity: number;
  }[];
  discount?: number;
  isTeamOrder: boolean;
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

export const kitTypeOptions = [
  "jersey",
  "jerseyShorts",
  "fullKit",
  "completeKit"
] as const;

export const sleeveOptions = [
  "short",
  "long",
  "raglan"
] as const;

export const collarOptions = [
  "crew",
  "v",
  "polo",
  "henley"
] as const;

export const patternOptions = [
  "solid",
  "stripes",
  "gradient",
  "geometric",
  "camo"
] as const;

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
