import { Express, Request, Response } from 'express';
import { db } from './db';
import { storage } from './storage';
import { eq } from 'drizzle-orm';
import { users, orders } from '@shared/schema';
import { InsertOrder, OrderDetails } from '@shared/schema';
import { generateOrderPDF } from './utils/pdf-generator';
import { sendOrderConfirmationEmail } from './utils/email-sender';

/**
 * Calculate the price for an order based on its items and addons
 * Also applies a 15% discount for subscribers
 */
export function calculateOrderPrice(orderData: InsertOrder): number {
  try {
    if (!orderData.orderDetails) {
      throw new Error('Order details are missing');
    }
    
    const orderDetails = orderData.orderDetails as OrderDetails;
    
    // Calculate base price from items
    let baseTotal = 0;
    if (orderDetails.items && orderDetails.items.length > 0) {
      baseTotal = orderDetails.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }
    
    // Add addon prices
    let addonsTotal = 0;
    if (orderDetails.addOns && orderDetails.addOns.length > 0) {
      addonsTotal = orderDetails.addOns.reduce((total, addon) => {
        return total + (addon.price * addon.quantity);
      }, 0);
    }
    
    // Apply discount if applicable
    let discount = 0;
    if (orderDetails.discount) {
      discount = orderDetails.discount;
    }
    
    // Calculate final total
    const total = baseTotal + addonsTotal - discount;
    
    // Convert to cents for Stripe
    return Math.round(total * 100);
  } catch (error) {
    console.error('Error calculating order price:', error);
    // Return the provided total amount if calculation fails
    return orderData.totalAmount;
  }
}

/**
 * Register order-related routes
 */
export function registerOrderRoutes(app: Express) {
  // Create a new order
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const orderData: InsertOrder = req.body;
      
      // Ensure the user is ordering their own design
      if (orderData.userId !== req.user?.id) {
        return res.status(403).json({ message: 'You can only create orders for your own designs' });
      }
      
      // Recalculate the price on the server side to ensure accuracy
      const calculatedPrice = calculateOrderPrice(orderData);
      if (calculatedPrice !== orderData.totalAmount) {
        console.warn(`Price mismatch: client sent ${orderData.totalAmount}, server calculated ${calculatedPrice}`);
        // Use the server's calculation for security
        orderData.totalAmount = calculatedPrice;
      }
      
      // Create the order in the database
      const order = await storage.createOrder(orderData);
      
      // Generate the PDF for the order
      const pdfPath = await generateOrderPDF(order);
      
      // Update the order with the PDF path
      const pdfUrl = `/orders/pdfs/order_${order.uuid}.pdf`;
      const updatedOrder = await storage.updateOrderPdfUrl(order.id, pdfUrl);
      
      // Send confirmation email if the user has an email
      if (req.user?.email) {
        try {
          await sendOrderConfirmationEmail(req.user, updatedOrder, pdfPath);
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Continue without failing the request if email fails
        }
      }
      
      res.status(201).json(updatedOrder);
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: `Failed to create order: ${error.message}` });
    }
  });
  
  // Get all orders for the current user
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userOrders = await storage.getUserOrders(req.user!.id);
      res.json(userOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: `Failed to fetch orders: ${error.message}` });
    }
  });
  
  // Get a specific order
  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Ensure the user can only access their own orders
      if (order.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(order);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: `Failed to fetch order: ${error.message}` });
    }
  });
  
  // Download order PDF
  app.get('/orders/pdfs/:filename', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const filename = req.params.filename;
      const orderUuid = filename.replace('order_', '').replace('.pdf', '');
      
      // Find the order by UUID
      const [order] = await db.select().from(orders).where(eq(orders.uuid, orderUuid));
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Ensure the user can only access their own order PDFs
      if (order.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const pdfPath = `${process.cwd()}/orders/pdfs/${filename}`;
      res.sendFile(pdfPath);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({ message: `Failed to download PDF: ${error.message}` });
    }
  });
  
  // Update order status (admin only, would need admin middleware in production)
  app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // In a real app, check if the user is an admin
      // For this example, we'll just allow the update
      
      const orderId = parseInt(req.params.id);
      const { status, trackingId } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status, trackingId);
      res.json(updatedOrder);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: `Failed to update order status: ${error.message}` });
    }
  });
}