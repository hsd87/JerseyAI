import { Router } from 'express';
import { createPaymentIntent } from '../services/stripe-service';
import { storage } from '../storage';

const router = Router();

/**
 * Create a payment intent for Stripe Elements
 * POST /api/create-payment-intent
 */
router.post('/create-payment-intent', async (req, res) => {
  // Generate a unique transaction ID for tracking this request
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  try {
    const { amount, items, requestId } = req.body;
    
    // Log the request details with transaction ID
    console.log(`Payment intent request [${transactionId}]${requestId ? ` (client: ${requestId})` : ''}`);
    
    if (!amount || amount < 0.5) {
      console.warn(`[${transactionId}] Invalid amount: ${amount}`);
      return res.status(400).json({
        error: 'Invalid amount provided. Amount must be at least $0.50',
        success: false,
        transactionId
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.warn(`[${transactionId}] Missing or invalid items`);
      return res.status(400).json({
        error: 'No items provided for payment',
        success: false,
        transactionId
      });
    }

    // Log transaction details for debugging
    console.log(`[${transactionId}] Payment Intent Request:`, {
      hasItems: Boolean(items),
      itemsCount: items.length,
      amount,
      userId: req.user?.id || 'not-authenticated'
    });

    // Convert dollar amount to cents for Stripe
    const amountInCents = Math.round(amount * 100);
    console.log(`[${transactionId}] Creating payment intent for amount: ${amountInCents} cents`);

    // Determine the customer ID
    let customerId = null;
    
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      // Get user from storage
      const user = await storage.getUser(req.user.id);
      if (user && user.stripeCustomerId) {
        customerId = user.stripeCustomerId;
        console.log(`[${transactionId}] Using existing Stripe customer ID: ${customerId} for user ${user.id}`);
      } else {
        console.log(`[${transactionId}] User ${req.user.id} has no Stripe customer ID`);
      }
    } else {
      console.log(`[${transactionId}] Creating payment intent for unauthenticated user`);
    }

    // Create the payment intent
    const clientSecret = await createPaymentIntent(amountInCents, customerId);
    console.log(`[${transactionId}] Payment intent created successfully for amount: ${amountInCents} cents`);

    res.json({
      clientSecret,
      amount: amountInCents,
      success: true,
      transactionId
    });
  } catch (error: any) {
    console.error(`[${transactionId}] Error creating payment intent:`, error);
    
    // Categorize errors for better client feedback
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred processing your payment';
    
    if (error.type === 'StripeAuthenticationError') {
      statusCode = 503;
      errorMessage = 'Payment service temporarily unavailable';
    } else if (error.type === 'StripeInvalidRequestError') {
      statusCode = 400;
      errorMessage = 'Invalid payment request';
    } else if (error.type === 'StripeConnectionError') {
      statusCode = 503;
      errorMessage = 'Could not connect to payment service';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      success: false,
      transactionId
    });
  }
});

/**
 * Webhook endpoint for Stripe event handling
 * POST /api/payment/webhook
 */
router.post('/webhook', async (req, res) => {
  // Generate a webhook handling ID for tracking this specific webhook
  const webhookId = `whk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(`[${webhookId}] Received Stripe webhook`);
  
  const event = req.body;

  // Simple validation of the event
  if (!event || !event.type) {
    console.warn(`[${webhookId}] Invalid webhook event received - missing type`);
    return res.status(400).json({ error: 'Invalid event', webhookId });
  }

  console.log(`[${webhookId}] Processing webhook event type: ${event.type}`);
  
  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`[${webhookId}] Payment succeeded: ${paymentIntent.id}`);
        
        // Check for metadata to link to order
        if (paymentIntent.metadata && paymentIntent.metadata.orderId) {
          console.log(`[${webhookId}] Updating order ${paymentIntent.metadata.orderId} to paid status`);
          // TODO: Update order status here
          // await storage.updateOrderStatus(paymentIntent.metadata.orderId, 'paid');
        } else {
          console.warn(`[${webhookId}] Payment ${paymentIntent.id} succeeded but no orderId in metadata`);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`[${webhookId}] Payment failed: ${failedPayment.id}`);
        
        // Check for failure reason if available
        const failureMessage = failedPayment.last_payment_error?.message || 'Unknown reason';
        console.log(`[${webhookId}] Failure reason: ${failureMessage}`);
        
        // Check for metadata to link to order
        if (failedPayment.metadata && failedPayment.metadata.orderId) {
          console.log(`[${webhookId}] Updating order ${failedPayment.metadata.orderId} to payment_failed status`);
          // TODO: Update order status here
          // await storage.updateOrderStatus(failedPayment.metadata.orderId, 'payment_failed');
        }
        break;
        
      case 'charge.succeeded':
        const charge = event.data.object;
        console.log(`[${webhookId}] Charge succeeded: ${charge.id}`);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        console.log(`[${webhookId}] Subscription event ${event.type} received`);
        // Forward to subscription-specific handler
        // await handleSubscriptionEvent(event);
        break;
        
      default:
        // Unexpected event type
        console.log(`[${webhookId}] Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of the event
    console.log(`[${webhookId}] Webhook processing completed successfully`);
    res.json({ received: true, webhookId });
  } catch (error: any) {
    console.error(`[${webhookId}] Error processing webhook:`, error);
    res.status(500).json({ 
      error: error.message || 'Webhook processing failed',
      webhookId 
    });
  }
});

export default router;