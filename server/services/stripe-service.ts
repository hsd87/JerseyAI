import Stripe from 'stripe';

// Get the Stripe instance from the main file
import { stripeInstance } from '../stripe';

export function getStripe(): Stripe | null {
  return stripeInstance;
}

export async function checkStripeApiKey(): Promise<{ valid: boolean, message: string }> {
  try {
    // Validate STRIPE_SECRET_KEY is present
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return { 
        valid: false, 
        message: "STRIPE_SECRET_KEY is not configured in the environment variables." 
      };
    }

    // Check that it starts with sk_test_ for test mode or sk_live_ for live mode
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      return {
        valid: false,
        message: "Invalid Stripe key format. Key must start with sk_test_ or sk_live_."
      };
    }

    // Create a temporary Stripe instance to verify the key
    // This ensures we're using the exact environment key and not any cached value
    const tempStripe = new Stripe(stripeKey, { 
      apiVersion: '2022-11-15' as any // Use a compatible API version
    });
    
    // Attempt to make a test API call to verify the key is working
    const balance = await tempStripe.balance.retrieve();
    
    // If we get here, the key is valid and working
    console.log("✅ Stripe API key validated successfully with direct check");
    
    return { 
      valid: true, 
      message: "Stripe API key is valid and working." 
    };
  } catch (error: any) {
    console.error("Error validating Stripe API key:", error);
    
    // Return specific error messages based on error type
    if (error.type === 'StripeAuthenticationError') {
      return {
        valid: false,
        message: "Invalid API key provided. Please check your STRIPE_SECRET_KEY environment variable."
      };
    } else if (error.type === 'StripeConnectionError') {
      return {
        valid: false,
        message: "Could not connect to Stripe API. Please check your internet connection."
      };
    } else {
      return {
        valid: false,
        message: `Stripe API key validation failed: ${error.message}`
      };
    }
  }
}

export async function createCheckoutSession(order: any, successUrl: string, cancelUrl: string) {
  // Create a checkout session using the Stripe API
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  // Format the line items for the session
  const lineItems = order.items.map((item: any) => {
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name || `${item.productType} - ${item.size}`,
          description: item.description || `${item.sport} ${item.productType}`,
          metadata: {
            productId: item.productId || item.id
          }
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    };
  });
  
  // Create session with line items
  const session = await stripeInstance.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: order.id.toString(),
    customer_email: order.customerEmail,
    line_items: lineItems,
    metadata: {
      orderId: order.id.toString()
    }
  });
  
  return session;
}

export async function verifyCheckoutSession(sessionId: string) {
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
  
  return {
    success: session.payment_status === 'paid',
    session
  };
}

export async function getReceiptUrl(sessionId: string): Promise<string | null> {
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  const session = await stripeInstance.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent']
  });
  
  const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
  
  // Since the Stripe types may not fully capture the expanded properties,
  // we need to cast with care. Expanded payment intents can have charges.
  const paymentIntentWithCharges = paymentIntent as any;
  
  if (paymentIntentWithCharges && 
      paymentIntentWithCharges.charges && 
      paymentIntentWithCharges.charges.data && 
      paymentIntentWithCharges.charges.data.length) {
    return paymentIntentWithCharges.charges.data[0].receipt_url;
  }
  
  return null;
}

/**
 * Check the status of a user's subscription
 * @param subscriptionId The Stripe subscription ID to check
 * @returns An object with status information
 */
export async function checkSubscriptionStatus(subscriptionId: string): Promise<{
  status: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}> {
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  try {
    // Retrieve the subscription
    const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
    
    return {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    };
  } catch (error: any) {
    console.error(`Error checking subscription status for ${subscriptionId}:`, error);
    
    if (error.code === 'resource_missing') {
      return {
        status: 'not_found'
      };
    }
    
    // Re-throw for other errors
    throw error;
  }
}

/**
 * Create a payment intent for a one-time charge
 * @param amount Amount in cents
 * @param customerId Stripe customer ID
 * @returns The client secret for the payment intent
 */
/**
 * Helper function to create a payment intent with a specific Stripe instance
 * @param stripe Stripe instance to use
 * @param amount Amount in cents
 * @param customerId Stripe customer ID
 * @returns The client secret for the payment intent
 */
async function createPaymentIntentWithStripe(
  stripe: Stripe, 
  amount: number, 
  customerId: string
): Promise<string> {
  // Validate the amount (minimum 50 cents)
  if (!amount || amount < 50) {
    console.warn(`Invalid amount provided: ${amount}. Setting to minimum 50 cents.`);
    amount = 50; // Set to minimum rather than throwing error
  }
  
  // Ensure amount is an integer
  const intAmount = Math.round(amount);
  console.log(`Creating payment intent for ${intAmount} cents for customer ${customerId} with local Stripe instance`);
  
  try {
    // Add timing logs to track potential bottlenecks
    const startTime = Date.now();
    
    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: intAmount,
      currency: 'usd',
      customer: customerId,
      payment_method_types: ['card'],
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`Payment intent created in ${duration}ms with ID: ${paymentIntent.id}`);
    
    if (!paymentIntent.client_secret) {
      throw new Error('No client secret returned from Stripe');
    }
    
    return paymentIntent.client_secret;
  } catch (error: any) {
    console.error('Error creating payment intent with local Stripe instance:', error);
    
    // Handle common error types
    if (error.type === 'StripeCardError') {
      throw new Error(`Card error: ${error.message}`);
    } else if (error.type === 'StripeInvalidRequestError') {
      if (error.message?.includes('customer') || error.param === 'customer') {
        throw new Error('Customer account not found. Please try again or contact support.');
      }
      throw new Error(`Invalid request: ${error.message}`);
    } else if (error.type === 'StripeAuthenticationError') {
      throw new Error('Payment service authentication failed. Please contact support.');
    }
    
    throw error;
  }
}

/**
 * Create a payment intent for a one-time charge
 * @param amount Amount in cents
 * @param customerId Stripe customer ID
 * @returns The client secret for the payment intent
 */
export async function createPaymentIntent(amount: number, customerId: string): Promise<string> {
  // First validate the Stripe instance
  if (!stripeInstance) {
    console.error('Stripe instance not initialized when creating payment intent');
    
    // Check if API key exists
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('Stripe is not configured - missing API key');
    }
    
    // Try to create a local Stripe instance
    try {
      console.log('Creating local Stripe instance for payment intent');
      const localStripeInstance = new Stripe(stripeKey, {
        apiVersion: '2022-11-15' as any // Use compatible API version
      });
      
      // Use the local instance for this request
      return createPaymentIntentWithStripe(localStripeInstance, amount, customerId);
    } catch (initError) {
      console.error('Failed to create local Stripe instance:', initError);
      throw new Error('Stripe payment service is unavailable. Please try again later.');
    }
  }
  
  // Use the main instance
  return createPaymentIntentWithStripe(stripeInstance, amount, customerId);
}

/**
 * Create a customer in Stripe
 * @param user User object from the database
 * @returns The Stripe customer ID
 */
export async function createCustomer(user: any): Promise<string> {
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  // Check if we have either email or username
  if ((!user.email || user.email === null) && !user.username) {
    throw new Error('User must have either an email or username');
  }
  
  try {
    // Create a customer object in Stripe with proper null handling
    const customer = await stripeInstance.customers.create({
      email: user.email || undefined, // Convert null to undefined for Stripe
      name: user.username,
      metadata: {
        userId: user.id.toString()
      }
    });
    
    if (!customer.id) {
      throw new Error('No customer ID returned from Stripe');
    }
    
    // Update the user record with the new Stripe customer ID
    try {
      const { storage } = await import('../storage');
      await storage.updateUserStripeCustomerId(user.id, customer.id);
      console.log(`Updated user ${user.id} with Stripe customer ID: ${customer.id}`);
    } catch (storageError) {
      console.error('Error updating user with Stripe customer ID:', storageError);
      // Continue anyway since we have created the customer
    }
    
    console.log(`Created Stripe customer: ${customer.id} for user: ${user.id}`);
    return customer.id;
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid request: ${error.message}`);
    }
    
    // Re-throw the original error
    throw error;
  }
}

/**
 * Create a subscription for a user
 * @param userId User ID in the database
 * @param customerId Optional Stripe customer ID (will be created if not provided)
 * @returns Object with client secret and subscription ID
 */
export async function createSubscription(
  userId: number, 
  customerId?: string
): Promise<{ clientSecret: string; subscriptionId: string }> {
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  // Get the price ID from the environment or use the hardcoded one
  const priceId = process.env.STRIPE_PRICE_ID || 'price_1P5fLVCjzXg59EQpTjGcjjZM';
  
  try {
    // Import and use the storage to update user information
    const { storage } = await import('../storage');
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Create customer if it doesn't exist
    if (!customerId && !user.stripeCustomerId) {
      const newCustomerId = await createCustomer(user);
      await storage.updateUserStripeCustomerId(user.id, newCustomerId);
      customerId = newCustomerId;
    } else if (!customerId && user.stripeCustomerId) {
      customerId = user.stripeCustomerId;
    }
    
    if (!customerId) {
      throw new Error('Could not determine Stripe customer ID');
    }
    
    console.log(`Creating subscription with price: ${priceId} for customer: ${customerId}`);
    
    // Create the subscription with a trial period
    const subscription = await stripeInstance.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    
    // Get the client secret from the invoice
    const invoice = subscription.latest_invoice as any;
    if (!invoice || !invoice.payment_intent || !invoice.payment_intent.client_secret) {
      throw new Error('No client secret in invoice');
    }
    
    // Update the user's subscription information
    await storage.updateUserSubscription(userId, 'pro', subscription.id);
    
    return {
      clientSecret: invoice.payment_intent.client_secret,
      subscriptionId: subscription.id
    };
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid request: ${error.message}`);
    }
    
    // Re-throw the original error
    throw error;
  }
}

/**
 * Cancel a subscription
 * @param subscriptionId The Stripe subscription ID to cancel
 * @param cancelImmediately Whether to cancel immediately or at the end of the period
 * @returns True if successful
 */
export async function cancelSubscription(subscriptionId: string, cancelImmediately = false): Promise<boolean> {
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  try {
    console.log(`Canceling subscription: ${subscriptionId}, immediate: ${cancelImmediately}`);
    
    if (cancelImmediately) {
      // Cancel immediately
      await stripeInstance.subscriptions.cancel(subscriptionId);
    } else {
      // Cancel at period end - the user can still use the subscription until it expires
      await stripeInstance.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }
    
    return true;
  } catch (error: any) {
    console.error(`Error canceling subscription ${subscriptionId}:`, error);
    
    // Handle the case where the subscription doesn't exist
    if (error.code === 'resource_missing') {
      console.log(`Subscription ${subscriptionId} not found - considering it already canceled`);
      return true;
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid request: ${error.message}`);
    }
    
    // Re-throw the original error
    throw error;
  }
}