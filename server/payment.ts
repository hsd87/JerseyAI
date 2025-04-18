import { Express, Request, Response } from 'express';
import { storage } from './storage';
import { 
  getStripe, 
  createCheckoutSession, 
  verifyCheckoutSession, 
  getReceiptUrl,
  createPaymentLink,
  checkStripeApiKey,
  createPaymentIntent
} from './services/stripe-service';
import { sendOrderConfirmationEmail } from './services/email-service';
import { db } from './db';
import path from 'path';
import fs from 'fs';
import { generateOrderPDF } from './utils/pdf-generator';
import { generateInvoice } from './utils/invoice-generator';
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
      
      // Generate invoice for the completed order
      try {
        console.log(`Generating invoice for order ${order.id}`);
        const invoiceData = await generateInvoice(updatedOrder);
        console.log(`Invoice generated: ${invoiceData.invoiceNumber}`);
        
        // Store invoice data with the order
        await storage.updateOrderInvoice(order.id, invoiceData);
      } catch (invoiceError) {
        console.error('Error generating invoice:', invoiceError);
        // Continue even if invoice generation fails
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
          
          // Get receipt URL if possible
          let receiptUrl = null;
          try {
            if (session.payment_intent) {
              receiptUrl = await getReceiptUrl(session.id);
            }
          } catch (error) {
            console.error('Error getting receipt URL:', error);
          }
          
          // Update order metadata with payment info
          const orderMetadata = order.metadata && typeof order.metadata === 'string' 
            ? JSON.parse(order.metadata) 
            : {};
            
          orderMetadata.stripeSessionId = session.id;
          if (receiptUrl) {
            orderMetadata.stripeReceiptUrl = receiptUrl;
          }
          orderMetadata.paymentCompleted = new Date().toISOString();
          
          // Update order status to paid
          const updatedOrder = await storage.updateOrder(order.id, {
            status: 'paid',
            // @ts-ignore
            metadata: JSON.stringify(orderMetadata)
          });
          
          console.log(`Order ${order.id} marked as paid via webhook`);
          
          // Generate invoice for the completed order
          try {
            console.log(`Generating invoice for order ${order.id} via webhook`);
            const invoiceData = await generateInvoice(updatedOrder);
            console.log(`Invoice generated via webhook: ${invoiceData.invoiceNumber}`);
            
            // Store invoice data with the order
            await storage.updateOrderInvoice(order.id, invoiceData);
          } catch (invoiceError) {
            console.error('Error generating invoice via webhook:', invoiceError);
            // Continue even if invoice generation fails
          }
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
          
          // Include invoice information if available
          if (metadata.invoice) {
            paymentInfo.invoice = metadata.invoice;
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
  
  // Create a payment intent for Stripe Elements
  app.post('/api/create-payment-intent', async (req: Request, res: Response) => {
    try {
      // Verify Stripe configuration
      const stripeStatus = await checkStripeApiKey();
      if (!stripeStatus.valid) {
        return res.status(503).json({
          message: 'Payment service is currently unavailable',
          error: 'stripe_unavailable'
        });
      }
      
      const { amount, items } = req.body;
      
      if (!amount || amount < 0.5) {
        return res.status(400).json({
          error: 'Invalid amount provided. Amount must be at least $0.50',
          success: false
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'No items provided for payment',
          success: false
        });
      }

      // Log transaction details for debugging
      console.log('Payment Intent Request:', {
        hasItems: Boolean(items),
        itemsCount: items.length,
        amount,
        userId: req.user?.id || 'not-authenticated'
      });

      // Convert dollar amount to cents for Stripe
      const amountInCents = Math.round(amount * 100);

      // Determine the customer ID
      let customerId = null;
      
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const user = await storage.getUser(req.user.id);
        if (user && user.stripeCustomerId) {
          customerId = user.stripeCustomerId;
        }
      }

      // Create the payment intent
      const clientSecret = await createPaymentIntent(amountInCents, customerId);

      res.json({
        clientSecret,
        amount: Math.round(amountInCents),
        success: true
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      
      res.status(500).json({
        error: error.message || 'Failed to create payment intent',
        success: false
      });
    }
  });

  // Create a payment link for an order
  app.post('/api/payment/create-payment-link', async (req: Request, res: Response) => {
    try {
      // Verify Stripe configuration
      const stripeStatus = await checkStripeApiKey();
      if (!stripeStatus.valid) {
        return res.status(503).json({
          message: 'Payment service is currently unavailable',
          error: 'stripe_unavailable'
        });
      }
      
      const { order } = req.body;
      
      if (!order || !order.items || !Array.isArray(order.items) || order.items.length === 0) {
        return res.status(400).json({
          message: 'Invalid order data. Order must include items array.',
          error: 'invalid_order'
        });
      }
      
      // Check if user is authenticated
      let userId = null;
      if (req.isAuthenticated() && req.user) {
        userId = req.user.id;
        
        // Add user information to the order if not already present
        if (!order.email && req.user.email) {
          order.email = req.user.email;
        }
        
        if (!order.customerName && req.user.username) {
          order.customerName = req.user.username;
        }
      }
      
      console.log(`Creating payment link for order with ${order.items.length} items`);
      
      try {
        // Create a payment link
        const paymentLinkUrl = await createPaymentLink(order);
        
        // If this is an existing order with ID, update it
        if (order.id) {
          const existingOrder = await storage.getOrderById(Number(order.id));
          
          if (existingOrder) {
            // Only update if the user is the order owner or not authenticated
            if (!userId || existingOrder.userId === userId) {
              const orderMetadata = existingOrder.metadata && typeof existingOrder.metadata === 'string'
                ? JSON.parse(existingOrder.metadata)
                : {};
                
              orderMetadata.stripePaymentLinkUrl = paymentLinkUrl;
              orderMetadata.paymentLinkCreatedAt = new Date().toISOString();
              
              await storage.updateOrder(existingOrder.id, {
                // @ts-ignore
                metadata: JSON.stringify(orderMetadata)
              });
            }
          }
        }
        
        // Return the payment link URL
        res.status(200).json({
          success: true,
          paymentLinkUrl
        });
      } catch (error: any) {
        console.error('Error creating payment link:', error);
        res.status(500).json({
          message: `Failed to create payment link: ${error.message}`,
          error: 'payment_link_creation_failed'
        });
      }
    } catch (error: any) {
      console.error('Unexpected error creating payment link:', error);
      res.status(500).json({
        message: 'An unexpected error occurred',
        error: 'server_error'
      });
    }
  });
  
  // Get invoice for an order
  app.get('/api/payment/invoice/:orderId', async (req: Request, res: Response) => {
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
      
      // Verify the user owns this order or is an admin
      if (order.userId !== req.user?.id && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // If order is not paid, no invoice exists
      if (order.status !== 'paid') {
        return res.status(400).json({ message: 'Order is not paid, no invoice available' });
      }
      
      // Check order metadata for invoice information
      let invoiceData = null;
      
      if (order.metadata && typeof order.metadata === 'string') {
        try {
          const metadata = JSON.parse(order.metadata);
          
          if (metadata.invoice) {
            invoiceData = metadata.invoice;
          }
        } catch (e) {
          console.error("Error parsing order metadata:", e);
        }
      }
      
      // If no invoice exists, generate one
      if (!invoiceData) {
        try {
          console.log(`Generating invoice on-demand for order ${order.id}`);
          invoiceData = await generateInvoice(order);
          console.log(`Invoice generated on-demand: ${invoiceData.invoiceNumber}`);
          
          // Store invoice data with the order
          await storage.updateOrderInvoice(order.id, invoiceData);
        } catch (invoiceError) {
          console.error('Error generating invoice on-demand:', invoiceError);
          return res.status(500).json({ message: 'Failed to generate invoice' });
        }
      }
      
      // Return the invoice data or redirect to the invoice URL
      if (req.query.format === 'json') {
        res.status(200).json(invoiceData);
      } else {
        // Redirect to the invoice URL (for direct viewing in browser)
        res.redirect(invoiceData.invoiceUrl);
      }
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ message: `Failed to fetch invoice: ${error.message}` });
    }
  });
}