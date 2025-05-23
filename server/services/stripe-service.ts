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

    // Check that the key format is valid (standard or restricted keys)
    if (!stripeKey.startsWith('sk_test_') && 
        !stripeKey.startsWith('sk_live_') && 
        !stripeKey.startsWith('rk_test_') && 
        !stripeKey.startsWith('rk_live_')) {
      return {
        valid: false,
        message: "Invalid Stripe key format. Key must start with sk_test_, sk_live_, rk_test_, or rk_live_."
      };
    }

    // For restricted keys, use a direct API call instead of the Stripe library
    // This is more reliable with restricted keys that may have limited permissions
    if (stripeKey.startsWith('rk_')) {
      try {
        // Use a fetch or https request to directly check the balance API
        const response = await fetch('https://api.stripe.com/v1/balance', {
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (response.ok) {
          console.log("✅ Stripe API key validated successfully with direct API call");
          return { 
            valid: true, 
            message: "Stripe API key is valid and working." 
          };
        } else {
          const errorData = await response.json();
          return {
            valid: false,
            message: `API validation failed: ${errorData.error?.message || 'Unknown error'}`
          };
        }
      } catch (error) {
        const directApiError = error as Error;
        console.error("Error during direct API validation:", directApiError);
        return {
          valid: false,
          message: `Direct API validation failed: ${directApiError.message || 'Unknown error'}`
        };
      }
    }
    
    // For standard keys, use the Stripe library (more reliable for non-restricted keys)
    // Create a temporary Stripe instance to verify the key
    const tempStripe = new Stripe(stripeKey, { 
      apiVersion: '2025-03-31' as any // Using Basil API version with type assertion
    });
    
    // Attempt to make a test API call to verify the key is working
    const balance = await tempStripe.balance.retrieve();
    
    // If we get here, the key is valid and working
    console.log("✅ Stripe API key validated successfully with Stripe library");
    
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

/**
 * Create a Stripe Checkout session for a one-time payment
 * @param order Order details including items and customer information
 * @param successUrl URL to redirect to after successful payment
 * @param cancelUrl URL to redirect to if payment is cancelled
 * @returns Stripe Checkout session object
 */
export async function createCheckoutSession(
  order: any,
  successUrl: string,
  cancelUrl: string
) {
  // Create a checkout session using the Stripe API
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  try {
    console.log('Creating Stripe Checkout session with success URL:', successUrl);
    
    // Format the line items for the session
    const lineItems = order.items.map((item: any) => {
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name || `${item.productType || 'Jersey'} - ${item.size || 'One Size'}`,
            description: item.description || `${item.sport || 'Custom'} ${item.productType || 'Jersey'}`,
            images: item.imageUrl ? [item.imageUrl] : undefined,
            metadata: {
              productId: item.productId || item.id || 'custom-product'
            }
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity || 1,
      };
    });
    
    // Add any add-ons as separate line items if they exist
    if (order.addOns && order.addOns.length > 0) {
      order.addOns.forEach((addon: any) => {
        if (addon.price && addon.price > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: addon.name || 'Add-on',
                description: addon.description || 'Additional service or product',
              },
              unit_amount: Math.round(addon.price * 100), // Convert to cents
            },
            quantity: addon.quantity || 1,
          });
        }
      });
    }
    
    // Create a type-safe way to convert our session params
    // Use @ts-ignore for shipping options which are difficult to type correctly
    // @ts-ignore - Stripe types are being difficult
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer: order.customerId || undefined,
      customer_email: order.customerEmail || order.email || undefined,
      line_items: lineItems,
      metadata: {
        orderId: order.id?.toString() || 'new-order',
        designId: order.designId?.toString() || '',
        customerSource: 'website',
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA']
      }
    };
    
    // Add shipping if not included
    if (!order.shippingIncluded) {
      // @ts-ignore - Stripe types don't match our usage pattern
      sessionParams.shipping_options = [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: order.shippingCost ? Math.round(order.shippingCost * 100) : 995, // Default to $9.95
            currency: 'usd',
          },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 7,
            },
            maximum: {
              unit: 'business_day',
              value: 14,
            },
          },
        },
      }];
    }
    
    // Create the Checkout Session
    // @ts-ignore - Stripe types don't perfectly align with their API
    const session = await stripeInstance.checkout.sessions.create(sessionParams);
    
    console.log('Checkout session created with ID:', session.id);
    return session;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid request: ${error.message}`);
    }
    
    throw error;
  }
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
// Define the cache structure
interface PaymentIntentCacheEntry {
  clientSecret: string;
  timestamp: number;
}

// Create a simpler cache implementation we can use with multiple functions
const paymentIntentCache = new Map<string, PaymentIntentCacheEntry>();

// Regular function without static properties
async function createPaymentIntentWithStripe(
  stripe: Stripe, 
  amount: number, 
  customerId?: string | null
): Promise<string> {
  // Validate the amount (minimum 50 cents)
  // IMPORTANT: amount is already in cents, should be at least 50 (= $0.50)
  if (!amount || amount < 50) {
    console.warn(`Invalid amount provided: ${amount} cents. Setting to minimum 50 cents.`);
    amount = 50; // Set to minimum rather than throwing error
  }
  
  // Ensure amount is an integer (Stripe requirement)
  const intAmount = Math.round(amount);
  
  // Create a memoization key to enable caching
  const memoKey = `${intAmount}_${customerId || 'no-customer'}`;
  
  // Add timing logs to track potential bottlenecks
  const startTime = Date.now();
  
  // Optimization: Use a global cache of recent payment intents to avoid repeated API calls
  
  // Check if we have a cached client secret for this amount/customer combo from the last 3 minutes
  const cachedIntent = paymentIntentCache.get(memoKey);
  if (cachedIntent && (Date.now() - cachedIntent.timestamp) < 3 * 60 * 1000) { // 3 minutes
    console.log(`Using cached payment intent for ${intAmount} cents (= $${(intAmount/100).toFixed(2)}) - cache age: ${Math.round((Date.now() - cachedIntent.timestamp)/1000)}s`);
    return cachedIntent.clientSecret;
  }
  
  console.log(`Creating payment intent for ${intAmount} cents (= $${(intAmount/100).toFixed(2)}) for customer ${customerId} with local Stripe instance`);
  
  try {
    // Prepare payment intent data with optimized settings
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: intAmount,
      currency: 'usd',
      payment_method_types: ['card'],
      automatic_payment_methods: {
        enabled: true,
      },
      // Add metadata for easier identification in Stripe dashboard
      metadata: {
        source: 'okdio_app',
        cents_amount: intAmount.toString(),
        dollars_amount: (intAmount/100).toFixed(2)
      }
    };
    
    // Only add customer if provided
    if (customerId) {
      paymentIntentData.customer = customerId;
    }
    
    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    
    const duration = Date.now() - startTime;
    console.log(`Payment intent created in ${duration}ms with ID: ${paymentIntent.id}`);
    
    if (!paymentIntent.client_secret) {
      throw new Error('No client secret returned from Stripe');
    }
    
    // Cache the client secret for future requests
    paymentIntentCache.set(memoKey, {
      clientSecret: paymentIntent.client_secret,
      timestamp: Date.now()
    });
    
    // Prune the cache if it gets too large (keep it under 50 entries)
    if (paymentIntentCache.size > 50) {
      // Remove the oldest entries
      const entries = Array.from(paymentIntentCache.entries());
      const oldestEntries = entries
        .sort((a, b) => {
          // Properly typed sort function
          const entryA = a[1] as PaymentIntentCacheEntry;
          const entryB = b[1] as PaymentIntentCacheEntry;
          return entryA.timestamp - entryB.timestamp;
        })
        .slice(0, 10)  // Remove the 10 oldest
        .map(entry => entry[0] as string);
        
      oldestEntries.forEach(key => paymentIntentCache.delete(key));
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
export async function createPaymentIntent(amount: number, customerId?: string | null): Promise<string> {
  // First validate that we have a Stripe key
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('Stripe is not configured - missing API key');
  }
  
  // For restricted keys, use direct API approach
  if (stripeKey.startsWith('rk_')) {
    console.log('Using direct API call approach for restricted key');
    return createPaymentIntentWithDirectApi(stripeKey, amount, customerId);
  }
  
  // For standard keys, use the Stripe library
  if (!stripeInstance) {
    console.error('Stripe instance not initialized when creating payment intent');
    
    // Try to create a local Stripe instance
    try {
      console.log('Creating local Stripe instance for payment intent');
      const localStripeInstance = new Stripe(stripeKey, {
        apiVersion: '2025-03-31' as any // Using Basil API version with type assertion
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
 * Create a payment intent using direct API calls instead of the Stripe library
 * This is more reliable with restricted keys
 */
async function createPaymentIntentWithDirectApi(
  apiKey: string,
  amount: number,
  customerId?: string | null
): Promise<string> {
  console.log(`Processing payment with amount: ${amount} cents for direct API (= $${(amount/100).toFixed(2)})`);
  
  // Validate the amount (minimum 50 cents)
  // IMPORTANT: amount is already in cents, should be at least 50 (= $0.50)
  if (!amount || amount < 50) {
    console.warn(`Invalid amount provided: ${amount} cents. Setting to minimum 50 cents.`);
    amount = 50; // Set to minimum rather than throwing error
  }
  
  // Ensure amount is an integer
  const intAmount = Math.round(amount);
  console.log(`Creating payment intent for ${intAmount} cents (= $${(intAmount/100).toFixed(2)}) with direct API`);
  
  try {
    // Prepare request body
    const params = new URLSearchParams();
    params.append('amount', intAmount.toString());
    params.append('currency', 'usd');
    
    // Only add customer if provided
    if (customerId) {
      params.append('customer', customerId);
    }
    
    // Enable automatic payment methods
    params.append('automatic_payment_methods[enabled]', 'true');
    
    // Make the API call
    const startTime = Date.now();
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    // Handle errors
    if (!response.ok) {
      const errorData = await response.json() as any;
      console.error('Stripe API error:', errorData);
      throw new Error(errorData.error?.message || 'Unknown Stripe API error');
    }
    
    // Parse the response
    const paymentIntent = await response.json() as any;
    
    const duration = Date.now() - startTime;
    console.log(`Payment intent created in ${duration}ms with ID: ${paymentIntent.id}`);
    
    if (!paymentIntent.client_secret) {
      throw new Error('No client secret returned from Stripe');
    }
    
    return paymentIntent.client_secret;
  } catch (error) {
    const apiError = error as Error;
    console.error('Error creating payment intent with direct API:', apiError);
    throw apiError;
  }
}

/**
 * Create a customer in Stripe
 * @param user User object from the database
 * @returns The Stripe customer ID
 */
/**
 * Create a Payment Link for a product or order
 * @param order Order or product details
 * @returns The URL of the payment link
 */
export async function createPaymentLink(order: any): Promise<string> {
  if (!stripeInstance) throw new Error('Stripe is not configured');
  
  try {
    console.log('Creating Stripe Payment Link for order:', order.id);
    
    // First create all products for the line items
    const items = [];
    
    // Create products for each line item
    for (const item of order.items) {
      // Create product first
      const product = await stripeInstance.products.create({
        name: item.name || `${item.productType || 'Jersey'} - ${item.size || 'One Size'}`,
        description: item.description || `${item.sport || 'Custom'} ${item.productType || 'Jersey'}`,
        images: item.imageUrl ? [item.imageUrl] : undefined,
        metadata: {
          productType: item.productType || 'Jersey',
          sport: item.sport || 'Custom',
          size: item.size || 'One Size'
        }
      });
      
      // Create a price for the product
      // IMPORTANT: item.price might already be in cents or in dollars, let's verify and convert if needed
      const priceInCents = item.price >= 100 ? item.price : Math.round(item.price * 100);
      console.log(`Setting price for ${item.name || 'item'}: ${priceInCents} cents (= $${(priceInCents/100).toFixed(2)})`);
      
      const price = await stripeInstance.prices.create({
        product: product.id,
        unit_amount: priceInCents, // Using verified cents amount
        currency: 'usd',
      });
      
      // Add to line items
      items.push({
        price: price.id,
        quantity: item.quantity || 1
      });
    }
    
    // Add any add-ons as separate line items if they exist
    if (order.addOns && order.addOns.length > 0) {
      for (const addon of order.addOns) {
        if (addon.price && addon.price > 0) {
          // Create addon product
          const addonProduct = await stripeInstance.products.create({
            name: addon.name || 'Add-on',
            description: addon.description || 'Additional service or product',
            metadata: {
              type: 'addon'
            }
          });
          
          // Create a price for the addon
          // IMPORTANT: addon.price might already be in cents or in dollars, let's verify and convert if needed
          const addonPriceInCents = addon.price >= 100 ? addon.price : Math.round(addon.price * 100);
          console.log(`Setting price for add-on ${addon.name || 'addon'}: ${addonPriceInCents} cents (= $${(addonPriceInCents/100).toFixed(2)})`);
          
          const addonPrice = await stripeInstance.prices.create({
            product: addonProduct.id,
            unit_amount: addonPriceInCents, // Using verified cents amount
            currency: 'usd',
          });
          
          // Add to line items
          items.push({
            price: addonPrice.id,
            quantity: addon.quantity || 1
          });
        }
      }
    }
    
    // Create the payment link
    const paymentLink = await stripeInstance.paymentLinks.create({
      line_items: items,
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.APP_URL || 'https://voro.replit.app'}/order-confirmation?payment_link_id={PAYMENT_LINK_ID}`,
        },
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      metadata: {
        orderId: order.id?.toString() || 'new-order',
        designId: order.designId?.toString() || '',
        customerSource: 'payment_link',
      },
      custom_text: {
        shipping_address: {
          message: 'Please provide your shipping address for the jersey delivery.',
        },
        submit: {
          message: 'We\'ll process your order as soon as payment is complete.',
        },
      },
    });
    
    console.log('Payment link created with URL:', paymentLink.url);
    return paymentLink.url;
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid request: ${error.message}`);
    }
    
    throw error;
  }
}

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