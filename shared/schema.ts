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
  accentColor1: text("accent_color1"),     // New accent color field
  accentColor2: text("accent_color2"),     // New accent color field 
  sleeveStyle: text("sleeve_style"),
  collarType: text("collar_type"),
  patternStyle: text("pattern_style"),
  designNotes: text("design_notes"),
  // We use a front-view-only approach in the UI, showing only frontImageUrl
  // backImageUrl is kept for backward compatibility but will be empty in new designs
  frontImageUrl: text("front_image_url"),
  backImageUrl: text("back_image_url"),
  frontImageData: text("front_image_data"), // Base64 encoded image data
  backImageData: text("back_image_data"),   // Base64 encoded image data (not used in front-view-only approach)
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
  // We use front-view-only approach but keep the back field for compatibility
  // In new designs, front will contain the image and back will be empty or same as front
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
    fontSize?: number;            // Added for font size slider (12-72px)
    outline?: boolean;            // Toggle for text outline
    outlineColor?: string;        // Color for text outline
    outlineWidth?: number;        // Width of text outline
  }[];
  numbers?: {
    value: number;
    position: { x: number; y: number };
    color: string;
    size: string;
    fontSize?: number;            // Added for font size slider
    outline?: boolean;            // Toggle for number outline
    outlineColor?: string;        // Color for number outline
    outlineWidth?: number;        // Width of number outline
  }[];
  logos?: {
    url: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation?: number;            // Added for logo rotation (0-360 degrees)
    maintainAspectRatio?: boolean; // Toggle to maintain aspect ratio when resizing
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
  "esports",
  "feild hockey", // Note: Typo in CSV, keeping as-is for consistency
  "volleyball",
  "handball"
] as const;

// Common kit types across sports
export const kitTypeOptions = [
  "jerseyOnly",
  "jerseyShorts",
  "tracksuit",
  "trackjacket",
  "trackTrouser",
  "jerseyTrousers",
  "jersey", // for esports
  "esportsjacket",
  "esportshoodie",
  "esportsTrouser"
] as const;

// Export the types for use in other files
export type SportType = typeof sportOptions[number];
export type KitType = typeof kitTypeOptions[number];
export type SleeveStyle = typeof sleeveOptions[number];
export type CollarType = typeof collarOptions[number];
export type PatternType = typeof patternOptions[number];

// Sport-specific kit type mapping based on CSV configuration
export const sportKitTypeMapping: Record<SportType, KitType[]> = {
  soccer: ["jerseyOnly", "jerseyShorts", "tracksuit", "trackjacket", "trackTrouser"],
  basketball: ["jerseyOnly", "jerseyShorts", "tracksuit", "trackjacket", "trackTrouser"],
  rugby: ["jerseyOnly", "jerseyShorts", "tracksuit", "trackjacket", "trackTrouser"],
  cricket: ["jerseyOnly", "jerseyTrousers", "tracksuit", "trackjacket", "trackTrouser"],
  esports: ["jersey", "esportsjacket", "esportsTrouser"],
  "feild hockey": ["jerseyOnly", "jerseyShorts", "tracksuit", "trackjacket", "trackTrouser"],
  volleyball: ["jerseyOnly", "jerseyShorts", "tracksuit", "trackjacket", "trackTrouser"],
  handball: ["jerseyOnly", "jerseyShorts", "tracksuit", "trackjacket", "trackTrouser"]
};

export const sleeveOptions = [
  "sleeveless",
  "short",
  "long",
  "sleeveless/short/long"
] as const;

// Define special types for sport+kit component combinations
export type SportKitComponent = `${SportType}-${KitType}`;

// Define type for form option configurations
export type FormOptionConfig = {
  showFields: string[];
  gender: string[];
  colors: string[];
  sleeveLength?: string[];
  collarStyle?: string[];
  patternStyle: string[];
};

// Define collar options from CSV data
export const collarOptions = [
  "crew", // crew neck
  "v", // V-neck
  "mandarin",
  "polo",
  "polo-no-button", // polo collar without button
  "scoop", // for basketball
  "deep", // for basketball
  "full-zip", // for tracksuits
  "hooded", // for tracksuits
  "half-zip" // for tracksuits
] as const;

// Sport-specific collar mappings based on CSV
export const sportCollarMapping: Record<SportType, CollarType[]> = {
  soccer: ["v", "crew", "mandarin", "polo", "polo-no-button"],
  basketball: ["v", "crew", "scoop", "deep"],
  rugby: ["v", "crew", "mandarin", "polo", "polo-no-button"],
  cricket: ["v", "crew", "mandarin", "polo", "polo-no-button"],
  esports: ["v", "crew", "mandarin", "polo", "polo-no-button"],
  "feild hockey": ["v", "crew", "mandarin", "polo", "polo-no-button"],
  volleyball: ["v", "crew", "mandarin", "polo", "polo-no-button"],
  handball: ["v", "crew", "mandarin", "polo", "polo-no-button"]
};

// Sport-specific pattern type mapping
export const sportPatternMapping: Record<SportType, PatternType[]> = {
  soccer: ["gradient", "slash", "panel", "striped", "digital", "minimal", "geometric", "tech"],
  basketball: ["gradient", "slash", "panel", "digital", "geometric", "tech"],
  rugby: ["panel", "striped", "digital", "solid", "gradient"],
  cricket: ["gradient", "minimal", "striped", "solid"],
  esports: ["digital", "minimal", "electric", "tech", "geometric-gradient"],
  "feild hockey": ["gradient", "slash", "panel", "striped"],
  volleyball: ["gradient", "panel", "digital", "minimal"],
  handball: ["gradient", "panel", "striped", "minimal"]
};

export const patternOptions = [
  "gradient",
  "slash",
  "panel", 
  "striped",
  "digital",
  "minimal",
  "solid",
  "electric",
  "multicolor",
  "geometric",
  "micro-geometric",
  "geometric-gradient",
  "front-heavy",
  "tech"
] as const;

// Add-on product options
export const addonProductOptions = [
  "socks", "headwear", "kitbag", "cap", 
  "tracksuitFull", "tracksuitHalf", "tracksuitHooded"
] as const;

export type AddonProduct = typeof addonProductOptions[number];

// Add-on products by sport
export const addonOptions: Record<SportType, AddonProduct[]> = {
  soccer: ["socks", "headwear", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"],
  basketball: ["socks", "headwear", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"],
  rugby: ["socks", "headwear", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"],
  cricket: ["cap", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"],
  esports: ["headwear", "kitbag", "tracksuitFull", "tracksuitHalf", "tracksuitHooded"],
  "feild hockey": ["socks", "headwear", "kitbag"],
  volleyball: ["socks", "headwear", "kitbag"],
  handball: ["socks", "headwear", "kitbag"]
};

export const designFormSchema = z.object({
  sport: z.enum(sportOptions),
  kitType: z.enum(kitTypeOptions),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  accentColor1: z.string().min(1).optional(),
  accentColor2: z.string().min(1).optional(),
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
