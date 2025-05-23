// Order and payment related types

export interface OrderItem {
  id: string;
  type: string; // jersey, shorts, etc.
  size: string;
  quantity: number;
  gender: string; // Male, Female, Youth
  price: number;
  name?: string;
  customValue?: string;
  designId?: number;
}

export interface OrderAddOn {
  name: string; // e.g., "socks", "headwear"
  price: number;
  quantity: number;
}

export interface OrderDetails {
  items: OrderItem[];
  addOns?: OrderAddOn[];
  packageType: string; // "Jersey only", "Jersey + Shorts", etc.
  discount?: number;
  isTeamOrder: boolean;
  teamName?: string;
  deliveryTimeline?: string;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
}

export interface CreateOrderRequest {
  designId: number;
  sport: string;
  totalAmount: number;
  orderDetails: OrderDetails;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  designUrls?: { front: string; back: string };
  prompt?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentIntentRequest {
  amount?: number;
  orderItems?: OrderItem[];
  items?: any[]; // Support generic items data structure
  requestId?: string; // For request tracking
  componentId?: string; // For component identification
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  amount?: number;
  success?: boolean;
  error?: string;
}

export interface CreateSubscriptionResponse {
  clientSecret: string;
  subscriptionId: string;
}

export interface Order {
  id: number;
  userId: number;
  designId: number;
  prompt?: string;
  designUrls?: { front: string; back: string };
  sport: string;
  totalAmount: number;
  status: string;
  orderDetails: OrderDetails;
  shippingAddress: ShippingAddress;
  metadata?: Record<string, any>;
  pdfUrl?: string;
  trackingId?: string;
  createdAt: string;
}