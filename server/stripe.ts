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
    
    interface Subscription {
      current_period_end: number;
    }
  }
}

// Handle Stripe keys appropriately
if (process.env.STRIPE_SECRET_KEY && 
   (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') || 
    process.env.STRIPE_SECRET_KEY.startsWith('rk_live_'))) {
    
  // Allow live keys in all environments for testing purposes
  console.log('Live Stripe key detected - allowing it since payments are being tested');
  
  // Add a warning just for awareness
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.warn('⚠️ NOTE: Using a live Stripe key in development/testing environment');
    console.warn('Make sure this is intentional and that you are not making unintended charges');
  }
}

// Define the global variables
export let stripeInstance: Stripe | null = null;
export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_test_placeholder';

// Initialize Stripe
function initializeStripe(): Stripe | null {
  try {
    // Get the Stripe key from environment
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      console.warn('Missing Stripe secret key. Stripe functionality will not work.');
      return null;
    }
    
    // Log masked key info for security
    console.log('Stripe secret key is configured -', {
      keyLength: stripeKey.length,
      keyPrefix: stripeKey.substring(0, 4) + '...',
      isValid: stripeKey.startsWith('sk_') || stripeKey.startsWith('rk_')
    });
    
    // Create Stripe instance with the key from environment
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16' // Use the latest API version for best compatibility
    });
    
    // Verify key is working with a simple API call
    stripe.balance.retrieve().then(() => {
      console.log('✅ Stripe API key verified successfully');
    }).catch(err => {
      console.error('❌ Stripe API key verification failed:', err.message);
    });
    
    console.log('Stripe initialized successfully');
    console.log('Using subscription price ID:', SUBSCRIPTION_PRICE_ID);
    
    return stripe;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return null;
  }
}

// Initialize on module load
stripeInstance = initializeStripe();

export async function createCustomer(user: User): Promise<string> {
  if (!stripeInstance) throw new Error('Stripe is not configured');
  if (!user.email) throw new Error('User email is required to create a customer');

  const customer = await stripeInstance.customers.create({
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
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  // Get user from database
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  // Ensure user has a Stripe customer ID
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    customerId = await createCustomer(user);
  }

  try {
    // Validate the price ID before creating subscription
    if (SUBSCRIPTION_PRICE_ID === 'price_test_placeholder') {
      console.warn('Using placeholder price ID. Please set a valid STRIPE_PRICE_ID in your environment.');
      throw new Error('Subscription price not properly configured. Please contact support.');
    }
    
    // Check if price exists before creating subscription
    try {
      await stripeInstance.prices.retrieve(SUBSCRIPTION_PRICE_ID);
    } catch (priceError: any) {
      console.error('Invalid price ID:', SUBSCRIPTION_PRICE_ID, priceError.message);
      if (priceError.type === 'StripeInvalidRequestError') {
        throw new Error(`Price ID ${SUBSCRIPTION_PRICE_ID} does not exist. Please configure a valid price ID.`);
      }
      throw priceError;
    }

    // Create subscription with validated price
    const subscription = await stripeInstance.subscriptions.create({
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
  } catch (error) {
    // Add subscription-specific context to error
    console.error('Subscription creation failed:', error);
    
    // Re-throw with more context
    throw error;
  }
}

export async function checkSubscriptionStatus(subscriptionId: string): Promise<{
  status: Stripe.Subscription.Status,
  current_period_end: number
}> {
  if (!stripeInstance) throw new Error('Stripe is not configured');

  const result = await stripeInstance.subscriptions.retrieve(subscriptionId);
  
  // Cast the result to access the properties we need
  const subscription = result as unknown as {
    status: Stripe.Subscription.Status;
    current_period_end: number;
  };
  
  return {
    status: subscription.status,
    current_period_end: subscription.current_period_end
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  await stripeInstance.subscriptions.cancel(subscriptionId);
}

export async function createPaymentIntent(amount: number, customerId: string): Promise<string> {
  if (!stripeInstance) throw new Error('Stripe is not configured');

  try {
    console.log(`Creating Stripe payment intent for ${amount} cents with customer ${customerId}`);
    
    // Validate amount is a positive integer in cents
    if (!Number.isInteger(amount) || amount < 50) {
      console.warn(`Invalid amount ${amount}, ensuring minimum of 50 cents`);
      amount = Math.max(50, Math.round(amount));
    }
    
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount, // Amount in cents
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`Payment intent created successfully with ID: ${paymentIntent.id}`);
    return paymentIntent.client_secret as string;
  } catch (error: any) {
    // Log the full error for debugging
    console.error('Stripe payment intent creation failed:', error);
    
    // Check for specific Stripe error types for better error handling
    if (error.type === 'StripeAuthenticationError') {
      throw new Error('Stripe API key is invalid or not configured correctly.');
    } else if (error.type === 'StripeConnectionError') {
      throw new Error('Could not connect to Stripe. Please try again later.');
    } else if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid request to Stripe: ${error.message}`);
    }
    
    // Re-throw the original error if not handled specifically
    throw error;
  }
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
  if (!stripeInstance) throw new Error('Stripe is not configured');

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