import { Express, Request, Response } from 'express';
import { storage } from './storage';
import { getStripe, createCheckoutSession, verifyCheckoutSession, getReceiptUrl } from './services/stripe-service';
import { sendOrderConfirmationEmail } from './services/email-service';
import { db } from './db';
import path from 'path';
import fs from 'fs';
import { generateOrderPDF } from './utils/pdf-generator';
import Stripe from 'stripe';

export function registerPaymentRoutes(app: Express) {
  // Initialize Stripe
  const stripe = getStripe();
  
  // Create a checkout session for an order
  app.post('/api/payment/create-checkout-session', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
      }
      
      // Fetch the order
      const order = await storage.getOrderById(Number(orderId));
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Verify the user owns this order
      if (order.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Create success and cancel URLs
      const successUrl = `${req.protocol}://${req.get('host')}/payment-success`;
      const cancelUrl = `${req.protocol}://${req.get('host')}/checkout`;
      
      // Get user info for checkout
      const user = await storage.getUser(order.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create checkout session
      const session = await createCheckoutSession(order, successUrl, cancelUrl);
      
      // Update order with session ID
      const orderMetadata = order.metadata && typeof order.metadata === 'string' 
        ? JSON.parse(order.metadata) 
        : {};
        
      orderMetadata.stripeSessionId = session.id;
      
      await storage.updateOrder(order.id, {
        // @ts-ignore
        metadata: JSON.stringify(orderMetadata),
      });
      
      // Return session ID to client
      res.status(200).json({
        sessionId: session.id,
        url: session.url
      });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: `Failed to create checkout session: ${error.message}` });
    }
  });
  
  // Verify payment and update order status
  app.get('/api/payment/verify', async (req: Request, res: Response) => {
    try {
      const { session_id: sessionId } = req.query;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ message: 'Session ID is required' });
      }
      
      // Verify the session payment status
      const { success, session } = await verifyCheckoutSession(sessionId);
      
      if (!success) {
        return res.status(400).json({ 
          message: 'Payment not complete', 
          paymentStatus: session.payment_status 
        });
      }
      
      // Get the order ID from the session
      const orderId = session.client_reference_id;
      
      if (!orderId) {
        return res.status(404).json({ message: 'Order not found in session' });
      }
      
      // Fetch the order
      const order = await storage.getOrderById(Number(orderId));
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // If the order is already paid, just return success
      if (order.status === 'paid') {
        return res.status(200).json({ 
          message: 'Order is already paid',
          order
        });
      }
      
      // Get receipt URL
      const receiptUrl = await getReceiptUrl(sessionId);
      
      // Update order metadata with payment info
      const orderMetadata = order.metadata && typeof order.metadata === 'string' 
        ? JSON.parse(order.metadata) 
        : {};
        
      orderMetadata.stripeSessionId = sessionId;
      orderMetadata.stripeReceiptUrl = receiptUrl;
      orderMetadata.paymentCompleted = new Date().toISOString();
      
      // Update order status to paid
      const updatedOrder = await storage.updateOrder(order.id, {
        status: 'paid',
        // @ts-ignore
        metadata: JSON.stringify(orderMetadata)
      });
      
      // Get the user
      const user = await storage.getUser(order.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Send confirmation email with PDF
      if (user.email) {
        try {
          // Generate PDF if not already attached to order
          let pdfPath = '';
          
          if (order.pdfUrl) {
            // PDF already exists
            const pdfFilename = path.basename(order.pdfUrl);
            pdfPath = path.join(process.cwd(), 'orders', 'pdfs', pdfFilename);
            
            // Check if the file exists
            if (!fs.existsSync(pdfPath)) {
              // Regenerate the PDF
              const pdfUrl = await generateOrderPDF(updatedOrder);
              pdfPath = path.join(process.cwd(), 'orders', 'pdfs', path.basename(pdfUrl));
            }
          } else {
            // Generate new PDF
            const pdfUrl = await generateOrderPDF(updatedOrder);
            pdfPath = path.join(process.cwd(), 'orders', 'pdfs', path.basename(pdfUrl));
            
            // Update order with PDF URL
            await storage.updateOrderPdfUrl(order.id, pdfUrl);
          }
          
          // Send email
          const emailResult = await sendOrderConfirmationEmail(user, updatedOrder, pdfPath);
          
          // Update order metadata with email info
          if (emailResult.success) {
            const metadataWithEmail = updatedOrder.metadata && typeof updatedOrder.metadata === 'string' 
              ? JSON.parse(updatedOrder.metadata) 
              : {};
              
            metadataWithEmail.emailSent = new Date().toISOString();
            metadataWithEmail.emailMessageId = emailResult.messageId;
            
            await storage.updateOrder(order.id, {
              // @ts-ignore
              metadata: JSON.stringify(metadataWithEmail)
            });
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Continue even if email fails
        }
      }
      
      // Return success
      res.status(200).json({
        success: true,
        order: updatedOrder,
        receiptUrl
      });
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ message: `Failed to verify payment: ${error.message}` });
    }
  });
  
  // Stripe webhook handler for async events
  app.post('/api/payment/webhook', async (req: Request, res: Response) => {
    const stripeInstance = getStripe();
    
    if (!stripeInstance) {
      return res.status(500).json({ message: 'Stripe is not initialized' });
    }
    
    const payload = req.body;
    const sig = req.headers['stripe-signature'] as string;
    
    // Webhook secret should be stored in an environment variable
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET is not set, skipping webhook signature verification');
      return res.status(400).json({ message: 'Webhook secret not configured' });
    }
    
    let event;
    
    try {
      // Construct and verify the event
      event = stripeInstance.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }
    
    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get the order ID from the session
        const orderId = session.client_reference_id;
        
        if (!orderId) {
          console.error('Order ID not found in session');
          return res.status(400).json({ message: 'Order ID not found in session' });
        }
        
        try {
          // Fetch the order
          const order = await storage.getOrderById(Number(orderId));
          
          if (!order) {
            console.error(`Order not found: ${orderId}`);
            return res.status(404).json({ message: 'Order not found' });
          }
          
          // If the order is already paid, just return success
          if (order.status === 'paid') {
            return res.status(200).json({ message: 'Order is already paid' });
          }
          
          // Update order status to paid
          const updatedOrder = await storage.updateOrder(order.id, {
            status: 'paid',
          });
          
          console.log(`Order ${order.id} marked as paid via webhook`);
        } catch (error: any) {
          console.error(`Error processing checkout.session.completed webhook: ${error.message}`);
        }
        break;
      }
      
      // Add more event handlers as needed
    }
    
    // Return success
    res.status(200).json({ received: true });
  });
  
  // Get payment status for an order
  app.get('/api/payment/status/:orderId', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const orderId = Number(req.params.orderId);
      
      // Fetch the order
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Verify the user owns this order
      if (order.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get payment info from order metadata
      let paymentInfo: any = {
        status: order.status,
        paid: order.status === 'paid',
      };
      
      if (order.metadata && typeof order.metadata === 'string') {
        try {
          const metadata = JSON.parse(order.metadata);
          
          if (metadata.stripeSessionId) {
            paymentInfo.sessionId = metadata.stripeSessionId;
          }
          
          if (metadata.stripeReceiptUrl) {
            paymentInfo.receiptUrl = metadata.stripeReceiptUrl;
          }
          
          if (metadata.paymentCompleted) {
            paymentInfo.paymentDate = metadata.paymentCompleted;
          }
        } catch (e) {
          console.error("Error parsing order metadata:", e);
        }
      }
      
      // Return payment status
      res.status(200).json(paymentInfo);
    } catch (error: any) {
      console.error('Error getting payment status:', error);
      res.status(500).json({ message: `Failed to get payment status: ${error.message}` });
    }
  });
}