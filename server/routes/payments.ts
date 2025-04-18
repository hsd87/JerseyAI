import { Router } from 'express';
import { createPaymentIntent } from '../services/stripe-service';
import { storage } from '../storage';

const router = Router();

/**
 * Create a payment intent for Stripe Elements
 * POST /api/create-payment-intent
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
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
      const user = await storage.getUserById(req.user.id);
      if (user && user.stripeCustomerId) {
        customerId = user.stripeCustomerId;
      } else if (user) {
        // Create customer in Stripe if needed
        try {
          customerId = await storage.createStripeCustomer(user);
        } catch (err) {
          console.error('Error creating Stripe customer:', err);
          // Continue without customer ID if creation fails
        }
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

/**
 * Webhook endpoint for Stripe event handling
 * POST /api/payment/webhook
 */
router.post('/webhook', async (req, res) => {
  const event = req.body;

  // Simple validation of the event
  if (!event || !event.type) {
    return res.status(400).json({ error: 'Invalid event' });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Update order status here
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        // Handle failed payment
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;