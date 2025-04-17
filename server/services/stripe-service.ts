import Stripe from 'stripe';

// Get the Stripe instance from the main file
import { stripeInstance } from '../stripe';

export function getStripe(): Stripe | null {
  return stripeInstance;
}

export async function checkStripeApiKey(): Promise<{ valid: boolean, message: string }> {
  try {
    // Validate STRIPE_SECRET_KEY is present
    if (!process.env.STRIPE_SECRET_KEY) {
      return { 
        valid: false, 
        message: "STRIPE_SECRET_KEY is not configured in the environment variables." 
      };
    }

    // Check if the instance was initialized properly
    if (!stripeInstance) {
      return { 
        valid: false, 
        message: "Stripe instance failed to initialize." 
      };
    }

    // Attempt to make a test API call to verify the key is working
    const balance = await stripeInstance.balance.retrieve();
    
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