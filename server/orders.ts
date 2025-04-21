import { Express, Request, Response } from 'express';
import { db } from './db';
import { storage } from './storage';
import { eq } from 'drizzle-orm';
import { users, orders } from '@shared/schema';
import { InsertOrder, OrderDetails } from '@shared/schema';
import { generateOrderPDF } from './utils/pdf-generator';
import { sendOrderConfirmationEmail } from './utils/email-sender';
import { calculatePrice } from './utils/pricing';
import { CartItem, PriceBreakdown } from './types';
import { generateOrderReceipt } from './controllers/order-controller';

/**
 * Convert OrderDetails to a format suitable for pricing calculations
 */
function orderDetailsToCartItems(orderDetails: OrderDetails): CartItem[] {
  const cartItems: CartItem[] = [];
  
  // Convert regular items to CartItems
  if (orderDetails.items && orderDetails.items.length > 0) {
    orderDetails.items.forEach(item => {
      cartItems.push({
        productId: item.type, // Use type as the product ID
        productType: item.type as any, // Cast to the expected type
        basePrice: item.price * 100, // Convert to cents
        quantity: item.quantity
      });
    });
  }
  
  // Convert add-ons to CartItems if present
  if (orderDetails.addOns && orderDetails.addOns.length > 0) {
    orderDetails.addOns.forEach(addon => {
      cartItems.push({
        productId: addon.name,
        productType: 'jersey' as any, // Default to jersey for add-ons
        basePrice: addon.price * 100, // Convert to cents
        quantity: addon.quantity
      });
    });
  }
  
  return cartItems;
}

/**
 * Calculate the price for an order based on its items and addons
 * Uses the simplified pricing model with no discounts, shipping costs, or taxes
 */
export function calculateOrderPrice(orderData: InsertOrder, isSubscriber: boolean = false): {
  totalInCents: number;
  breakdown: PriceBreakdown;
} {
  try {
    if (!orderData.orderDetails) {
      throw new Error('Order details are missing');
    }
    
    const orderDetails = orderData.orderDetails as OrderDetails;
    
    // Convert order details to cart items for pricing calculation
    const cartItems = orderDetailsToCartItems(orderDetails);
    
    // Calculate price with full breakdown using the pricing module
    const priceResult = calculatePrice(cartItems, isSubscriber);
    const priceBreakdown = priceResult.breakdown;
    
    // Return both the total amount in cents and the full breakdown
    return {
      totalInCents: priceBreakdown.grandTotal,
      breakdown: priceBreakdown
    };
  } catch (error) {
    console.error('Error calculating order price:', error);
    // Return the provided total amount if calculation fails
    return {
      totalInCents: orderData.totalAmount,
      breakdown: {
        baseTotal: orderData.totalAmount,
        subtotal: orderData.totalAmount,
        grandTotal: orderData.totalAmount,
        itemCount: 1 // Default to 1 if we can't determine the actual count
      }
    };
  }
}

/**
 * Register order-related routes
 */
export function registerOrderRoutes(app: Express) {
  // Create a new order (regular or draft)
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const orderData: InsertOrder = req.body;
      
      // Check if this is a draft order
      const isDraft = req.query.draft === 'true' || orderData.metadata?.isDraft;
      
      // Ensure the user is ordering their own design
      if (orderData.userId !== req.user?.id) {
        return res.status(403).json({ message: 'You can only create orders for your own designs' });
      }
      
      // Get user subscription status for pricing
      const isSubscriber = req.user?.subscriptionTier === 'pro';
      
      // Recalculate the price on the server side to ensure accuracy
      const { totalInCents, breakdown } = calculateOrderPrice(orderData, isSubscriber);
      
      // Prepare metadata - include price breakdown and draft status
      const existingMetadata = orderData.metadata ? 
        (typeof orderData.metadata === 'string' ? JSON.parse(orderData.metadata) : orderData.metadata) : 
        {};
        
      const metadataValue = JSON.stringify({ 
        ...existingMetadata,
        priceBreakdown: breakdown,
        isDraft: isDraft,
        draftCreatedAt: isDraft ? new Date().toISOString() : undefined,
        completedAt: !isDraft ? new Date().toISOString() : undefined
      });
      
      // @ts-ignore - This is fine since we added the metadata column to the schema
      orderData.metadata = metadataValue;
      
      if (totalInCents !== orderData.totalAmount) {
        console.warn(`Price mismatch: client sent ${orderData.totalAmount}, server calculated ${totalInCents}`);
        // Use the server's calculation for security
        orderData.totalAmount = totalInCents;
      }
      
      // We'll set the status after creation
      const initialStatus = isDraft ? 'draft' : 'pending';
      
      console.log(`Creating ${isDraft ? 'draft' : 'regular'} order for user ${req.user.id}`);
      
      // Create the order in the database
      const order = await storage.createOrder(orderData);
      
      // Only generate PDF and send email for non-draft orders
      if (!isDraft) {
        // Generate the PDF for the order
        const pdfPath = await generateOrderPDF(order);
        
        // Update the order with the PDF path
        const pdfUrl = `/orders/pdfs/order_${order.id}.pdf`;
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
      } else {
        // For draft orders, just return the created order
        res.status(201).json(order);
      }
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
      const orderId = parseInt(filename.replace('order_', '').replace('.pdf', ''));
      
      // Find the order by ID
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      
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
  
  // Generate a PDF receipt for an order
  app.get('/api/orders/:id/receipt', generateOrderReceipt);
  
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
  
  // Convert a draft order to a pending order when user proceeds to checkout
  app.post('/api/orders/:id/convert-draft', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const orderId = parseInt(req.params.id);
      
      // Get the order
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Ensure the user owns this order
      if (order.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Ensure this is a draft order
      if (order.status !== 'draft') {
        return res.status(400).json({ 
          message: 'Only draft orders can be converted', 
          currentStatus: order.status 
        });
      }
      
      // Update the order metadata
      let metadata = order.metadata ? 
        (typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata) : 
        {};
      
      // Update metadata with conversion details
      metadata = {
        ...metadata,
        isDraft: false,
        draftConvertedAt: new Date().toISOString(),
      };
      
      // Update the order status to pending
      const updatedOrder = await storage.updateOrder(orderId, {
        status: 'pending',
        // @ts-ignore - Metadata typing is complex
        metadata: JSON.stringify(metadata)
      });
      
      // Generate PDF if needed (can be done asynchronously later)
      if (!order.pdfUrl) {
        try {
          const pdfPath = await generateOrderPDF(updatedOrder);
          const pdfUrl = `/orders/pdfs/order_${order.id}.pdf`;
          await storage.updateOrderPdfUrl(order.id, pdfUrl);
        } catch (pdfError) {
          console.error('Error generating PDF for converted draft:', pdfError);
          // Continue without failing the request
        }
      }
      
      res.json(updatedOrder);
    } catch (error: any) {
      console.error('Error converting draft order:', error);
      res.status(500).json({ message: `Failed to convert draft order: ${error.message}` });
    }
  });
}