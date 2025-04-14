import Stripe from 'stripe';
import { storage } from './storage';
import { User } from '@shared/schema';
import { calculatePrice } from './utils/pricing';
import type { CartItem } from './types';
// Using type assertion to avoid Stripe types issues
declare module 'stripe' {
  namespace Stripe {
    interface Invoice {
      payment_intent?: Stripe.PaymentIntent;
    }
  }
}

// Make sure to check if the API key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe secret key. Stripe functionality will not work.');
}

// Initialize Stripe with API key if available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Price IDs should be configured in a real system
const SUBSCRIPTION_PRICE_ID = 'price_placeholder'; // Replace with actual price ID when available

export async function createCustomer(user: User): Promise<string> {
  if (!stripe) throw new Error('Stripe is not configured');
  if (!user.email) throw new Error('User email is required to create a customer');

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.username,
    metadata: {
      userId: user.id.toString()
    }
  });

  // Update user record with Stripe customer ID
  await storage.updateUser(user.id, { stripeCustomerId: customer.id });
  
  return customer.id;
}

export async function createSubscription(userId: number): Promise<{ clientSecret: string, subscriptionId: string }> {
  if (!stripe) throw new Error('Stripe is not configured');
  
  // Get user from database
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  // Ensure user has a Stripe customer ID
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    customerId = await createCustomer(user);
  }

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: SUBSCRIPTION_PRICE_ID }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });

  // Update user with subscription ID
  await storage.updateUser(user.id, { 
    stripeSubscriptionId: subscription.id 
  });

  // Get client secret for frontend payment confirmation
  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

  return {
    clientSecret: paymentIntent.client_secret as string,
    subscriptionId: subscription.id
  };
}

export async function checkSubscriptionStatus(subscriptionId: string): Promise<{
  status: Stripe.Subscription.Status,
  current_period_end: number
}> {
  if (!stripe) throw new Error('Stripe is not configured');

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return {
    status: subscription.status,
    current_period_end: subscription.current_period_end
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (!stripe) throw new Error('Stripe is not configured');
  
  await stripe.subscriptions.cancel(subscriptionId);
}

export async function createPaymentIntent(amount: number, customerId: string): Promise<string> {
  if (!stripe) throw new Error('Stripe is not configured');

  const paymentIntent = await stripe.paymentIntents.create({
    amount, // Amount in cents
    currency: 'usd',
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent.client_secret as string;
}

export async function calculateOrderAmount(items: any[], isSubscriber: boolean = false): Promise<number> {
  try {
    // Convert items to CartItem format
    const cartItems: CartItem[] = items.map(item => ({
      productId: item.productId || item.id || 'unknown',
      productType: item.productType || 'jersey',
      basePrice: Math.round(item.price * 100), // Convert to cents
      quantity: item.quantity
    }));
    
    // Use the pricing module to calculate the final price
    const priceResult = calculatePrice(cartItems, isSubscriber);
    
    // Return the grand total (already in cents)
    return priceResult.breakdown.grandTotal;
  } catch (error) {
    console.error('Error calculating order amount:', error);
    // Fallback to simple calculation if pricing module fails
    return items.reduce((total, item) => {
      return total + Math.round((item.price * item.quantity) * 100);
    }, 0);
  }
}

// Webhook handling for subscription events
export async function handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
  if (!stripe) throw new Error('Stripe is not configured');

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      // Find user by Stripe customer ID
      const users = await storage.findUsersByStripeCustomerId(customerId);
      if (users.length === 0) return;
      
      const user = users[0];
      
      // Update user's subscription status based on Stripe status
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscription.id,
        subscriptionTier: subscription.status === 'active' ? 'pro' : 'free'
      });
      
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      // Find user by Stripe customer ID
      const users = await storage.findUsersByStripeCustomerId(customerId);
      if (users.length === 0) return;
      
      const user = users[0];
      
      // Downgrade user to free tier
      await storage.updateUser(user.id, {
        subscriptionTier: 'free',
        // Note: We keep the subscription ID for historical purposes
      });
      
      break;
    }
  }
}