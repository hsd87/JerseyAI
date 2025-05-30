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
  
  // Test endpoint for diagnostic page
  app.post('/api/payment/test', async (req: Request, res: Response) => {
    try {
      // Test if Stripe is properly initialized
      const stripeStatus = await checkStripeApiKey();
      
      if (!stripeStatus.valid) {
        return res.status(503).json({
          success: false,
          error: 'Stripe API key is invalid or missing',
          details: stripeStatus
        });
      }
      
      // Return success with environment info (without exposing sensitive data)
      res.json({
        success: true,
        message: 'Stripe API connection successful',
        environment: process.env.NODE_ENV,
        stripeApiVersion: (stripe as any)?.version || 'unknown',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error testing payment API:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'An unexpected error occurred during payment API test',
        timestamp: new Date().toISOString()
      });
    }
  });
  
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
      
      const { amount, amountInCents, items, requestId, componentId } = req.body;
      
      // Log the request details for debugging
      console.log(`Payment Intent Request [${requestId || 'no-id'}]:`, {
        componentId: componentId || 'unknown',
        hasAmount: Boolean(amount),
        amount: amount ? `$${amount} (${typeof amount})` : 'not provided',
        hasAmountInCents: Boolean(amountInCents),
        amountInCents: amountInCents ? `${amountInCents} cents (${typeof amountInCents})` : 'not provided',
        hasItems: Boolean(items),
        itemsCount: items?.length || 0,
        firstItemAmount: items?.[0]?.price ? `$${items[0].price}` : 'no price',
        userId: req.user?.id || 'not-authenticated',
        requestId
      });
      
      // IMPORTANT: We are now enforcing a cents-based pricing model
      // amount should be in cents (e.g., 100 = $1.00)
      // The minimum value is 50 cents
      if (!amount || amount < 50) {
        return res.status(400).json({
          error: 'Invalid amount provided. Amount must be at least 50 cents (= $0.50)',
          success: false,
          requestId
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'No items provided for payment',
          success: false,
          requestId
        });
      }

      // Determine the amount in cents
      // IMPORTANT: With our new pricing model, all amounts are already in cents
      
      // Force to integer to prevent Stripe errors with non-integer amounts
      const amountValue = Math.round(parseInt(req.body?.amount, 10));
      let finalAmountInCents: number;
      
      // Validate that the amount is provided and is a positive number
      if (!amountValue || isNaN(amountValue) || amountValue <= 0) {
        console.error('Invalid amount provided in payment intent request:', req.body?.amount);
        return res.status(400).json({ 
          error: 'amount_required', 
          message: 'Valid amount in cents is required' 
        });
      }
      
      // Add additional safety check here to ensure we're truly working with cents
      // If the value is too small (likely in dollars), convert it
      if (amountValue > 0 && amountValue < 50) {
        console.warn(`Amount appears to be in dollars instead of cents (${amountValue}), converting to cents`);
        finalAmountInCents = Math.round(amountValue * 100);
      } else {
        finalAmountInCents = amountValue;
      }
      
      // Log the amount for debugging
      console.log(`Processing payment intent for ${finalAmountInCents} cents (= $${(finalAmountInCents/100).toFixed(2)})`);
      
      // Validate minimum amount (50 cents = $0.50)
      if (finalAmountInCents < 50) {
        console.warn(`Amount too small: ${finalAmountInCents} cents is below minimum threshold of 50 cents`);
        return res.status(400).json({ 
          error: 'amount_too_small', 
          message: 'Amount must be at least $0.50' 
        });
      }

      // Determine the customer ID
      let customerId = null;
      
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const user = await storage.getUser(req.user.id);
        if (user && user.stripeCustomerId) {
          customerId = user.stripeCustomerId;
        }
      }

      // Create the payment intent
      const clientSecret = await createPaymentIntent(finalAmountInCents, customerId || '');

      // Include request ID in the response for better client-side tracking
      const reqId = req.body?.requestId || undefined;
      // Provide both cents and dollars for client convenience
      const amountInDollars = finalAmountInCents / 100;
      
      res.json({
        clientSecret,
        amount: finalAmountInCents,
        amountInDollars: amountInDollars,
        amountFormatted: `$${amountInDollars.toFixed(2)}`,
        amountType: 'cents', // Explicit field so client knows this is in cents
        success: true,
        requestId: reqId
      });
    } catch (error: any) {
      // Get the requestId from the original request body if available
      const reqId = req.body?.requestId || 'no-id';
      console.error(`Error creating payment intent [${reqId}]:`, error);
      
      res.status(500).json({
        error: error.message || 'Failed to create payment intent',
        success: false,
        requestId: reqId
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