import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { calculateOrderAmount } from '../stripe';

// Import types
import type { 
  OrderItem,
  OrderDetails,
  ShippingAddress,
  CreateOrderRequest,
  Order
} from '@shared/types/order';

// Validation schema for order creation
const orderItemSchema = z.object({
  type: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().positive(),
  gender: z.string().min(1),
  price: z.number().nonnegative()
});

const orderDetailsSchema = z.object({
  items: z.array(orderItemSchema),
  packageType: z.string().min(1),
  isTeamOrder: z.boolean(),
  teamName: z.string().optional(),
  discount: z.number().optional(),
  addOns: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
      quantity: z.number()
    })
  ).optional(),
  deliveryTimeline: z.string().optional()
});

const shippingAddressSchema = z.object({
  name: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
  phone: z.string().optional()
});

const createOrderSchema = z.object({
  designId: z.number().int().positive(),
  sport: z.string().min(1),
  totalAmount: z.number().positive(),
  orderDetails: orderDetailsSchema,
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.string().min(1),
  designUrls: z.object({
    front: z.string(),
    back: z.string()
  }).optional(),
  prompt: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Create a new order
 */
export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized', message: 'You must be logged in to create an order' });
    }

    // Validate request body
    const validationResult = createOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'validation_error',
        message: 'Invalid order data',
        details: validationResult.error.format()
      });
    }

    const orderData = validationResult.data;
    
    // Verify the order amount matches our calculation
    const calculatedAmount = await calculateOrderAmount(
      orderData.orderDetails.items,
      req.user.subscriptionTier === 'pro'
    );
    
    // Allow a small difference (1%) to account for rounding errors
    const amountDifference = Math.abs(calculatedAmount - (orderData.totalAmount * 100));
    const percentageDifference = amountDifference / calculatedAmount;
    
    if (percentageDifference > 0.01) {
      return res.status(400).json({
        error: 'amount_mismatch',
        message: 'The order amount does not match our calculation',
        details: {
          provided: orderData.totalAmount,
          calculated: calculatedAmount / 100
        }
      });
    }

    // Create order in database
    const order = await storage.createOrder({
      userId: req.user.id,
      designId: orderData.designId,
      sport: orderData.sport,
      prompt: orderData.prompt,
      designUrls: orderData.designUrls,
      totalAmount: orderData.totalAmount,
      orderDetails: orderData.orderDetails,
      shippingAddress: orderData.shippingAddress,
      metadata: {
        ...orderData.metadata,
        paymentMethod: orderData.paymentMethod,
        createdAt: new Date().toISOString()
      }
    });

    // Return the created order
    res.status(201).json(order);
  } catch (error: any) {
    console.error('Order creation error:', error);
    
    // Determine appropriate error response
    if (error.code === 'P2002' && error.meta?.target?.includes('designId')) {
      return res.status(400).json({
        error: 'duplicate_order',
        message: 'An order for this design already exists'
      });
    }
    
    if (error.message?.includes('foreign key constraint')) {
      return res.status(400).json({
        error: 'invalid_reference',
        message: 'The design or user referenced in this order does not exist'
      });
    }
    
    res.status(500).json({
      error: 'order_creation_error',
      message: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get all orders for the current user
 */
export async function getUserOrders(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized', message: 'You must be logged in to view orders' });
    }

    // Get orders from the database
    const orders = await storage.getUserOrders(req.user.id);

    // Return the orders
    res.json(orders);
  } catch (error: any) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      error: 'order_fetch_error',
      message: 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized', message: 'You must be logged in to view order details' });
    }

    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'invalid_id', message: 'Invalid order ID' });
    }

    // Get the order from the database
    const order = await storage.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'not_found', message: 'Order not found' });
    }

    // Check if the order belongs to the current user or the user is an admin
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden', message: 'You do not have permission to view this order' });
    }

    // Return the order
    res.json(order);
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      error: 'order_fetch_error',
      message: 'Failed to fetch order details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Update an order's status (admin only)
 */
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated || !req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden', message: 'You do not have permission to update order status' });
    }

    // Validate inputs
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'invalid_id', message: 'Invalid order ID' });
    }

    const { status, trackingId } = req.body;
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ error: 'invalid_status', message: 'Invalid status' });
    }

    // Valid statuses
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'canceled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'invalid_status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update the order status
    const updatedOrder = await storage.updateOrderStatus(orderId, status, trackingId);

    // Return the updated order
    res.json(updatedOrder);
  } catch (error: any) {
    console.error('Error updating order status:', error);
    
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: 'not_found', message: 'Order not found' });
    }
    
    res.status(500).json({
      error: 'update_error',
      message: 'Failed to update order status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get all orders (admin only)
 */
export async function getAllOrders(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated || !req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden', message: 'You do not have permission to view all orders' });
    }

    // Get all orders from the database
    const orders = await storage.getAllOrders();

    // Return the orders
    res.json(orders);
  } catch (error: any) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      error: 'order_fetch_error',
      message: 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}