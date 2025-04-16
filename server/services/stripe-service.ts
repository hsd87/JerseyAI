import Stripe from 'stripe';
import { InsertOrder, Order } from '@shared/schema';

// Will be initialized once the secret key is available
let stripe: Stripe | null = null;

export const initStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not set, Stripe functionality will be limited');
    return null;
  }
  
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10' // Update to the latest version as needed
  });
  
  return stripe;
};

export const getStripe = (): Stripe | null => {
  if (!stripe) {
    return initStripe();
  }
  return stripe;
};

/**
 * Create a Stripe Checkout Session for the given order
 * @param order The order to create a checkout session for
 * @param successUrl Success redirect URL
 * @param cancelUrl Cancel redirect URL
 * @returns Checkout session
 */
export const createCheckoutSession = async (
  order: Order,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> => {
  const stripeInstance = getStripe();
  
  if (!stripeInstance) {
    throw new Error('Stripe is not initialized');
  }
  
  // Calculate metadata including discounts from order.metadata
  let priceBreakdown: any = null;
  if (order.metadata && typeof order.metadata === 'string') {
    try {
      const metadata = JSON.parse(order.metadata);
      priceBreakdown = metadata.priceBreakdown;
    } catch (e) {
      console.error("Error parsing order metadata:", e);
    }
  }
  
  // Create line items from order details
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  
  // Add main items
  if (order.orderDetails && order.orderDetails.items) {
    order.orderDetails.items.forEach(item => {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.type} (${item.gender}, Size: ${item.size})`,
            description: `${order.sport} ${item.type}`,
            images: [order.designUrls?.front || ''] // Include image if available
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      });
    });
  }
  
  // Add add-ons
  if (order.orderDetails && order.orderDetails.addOns) {
    order.orderDetails.addOns.forEach(addon => {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${addon.name} (Add-on)`,
            description: `Additional item: ${addon.name}`,
          },
          unit_amount: Math.round(addon.price * 100), // Convert to cents
        },
        quantity: addon.quantity,
      });
    });
  }
  
  // Add shipping cost if applicable
  if (priceBreakdown && priceBreakdown.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping',
          description: 'Shipping and handling',
        },
        unit_amount: priceBreakdown.shippingCost,
      },
      quantity: 1,
    });
  }
  
  // Apply discounts
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  
  // If we have tier discount or subscription discount, create a coupon
  if (priceBreakdown && 
      (priceBreakdown.tierDiscountAmount > 0 || 
       priceBreakdown.subscriptionDiscountAmount > 0)
  ) {
    const totalDiscount = (priceBreakdown.tierDiscountAmount || 0) + 
                         (priceBreakdown.subscriptionDiscountAmount || 0);
    const discountPercentage = Math.round(
      (totalDiscount / priceBreakdown.baseTotal) * 100
    );
    
    if (discountPercentage > 0) {
      // Create a one-time coupon for this checkout
      const coupon = await stripeInstance.coupons.create({
        percent_off: discountPercentage,
        duration: 'once',
        name: `Order #${order.id} Discount`,
      });
      
      discounts.push({ coupon: coupon.id });
    }
  }
  
  // Create the session
  const session = await stripeInstance.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    discounts,
    mode: 'payment',
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    client_reference_id: order.id.toString(),
    customer_email: order.user?.email, // If we have user's email
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'JP'],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 0,
            currency: 'usd',
          },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 5,
            },
            maximum: {
              unit: 'business_day',
              value: 10,
            },
          },
        },
      },
    ],
    metadata: {
      order_id: order.id.toString(),
      user_id: order.userId.toString(),
      sport: order.sport,
    },
  });
  
  return session;
};

/**
 * Verify a checkout session's payment status
 * @param sessionId Stripe session ID
 * @returns Boolean indicating success and session data
 */
export const verifyCheckoutSession = async (sessionId: string): Promise<{
  success: boolean;
  session: Stripe.Checkout.Session;
}> => {
  const stripeInstance = getStripe();
  
  if (!stripeInstance) {
    throw new Error('Stripe is not initialized');
  }
  
  const session = await stripeInstance.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'line_items'],
  });
  
  // Check if payment is complete
  const isComplete = session.payment_status === 'paid';
  
  return {
    success: isComplete,
    session,
  };
};

/**
 * Get a receipt URL for a successful payment
 * @param sessionId Stripe session ID
 * @returns Receipt URL or null if not available
 */
export const getReceiptUrl = async (sessionId: string): Promise<string | null> => {
  const stripeInstance = getStripe();
  
  if (!stripeInstance) {
    throw new Error('Stripe is not initialized');
  }
  
  const session = await stripeInstance.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });
  
  if (!session.payment_intent || typeof session.payment_intent === 'string') {
    return null;
  }
  
  // Get charge to find receipt URL
  const charges = await stripeInstance.charges.list({
    payment_intent: session.payment_intent.id,
  });
  
  if (charges.data.length === 0) {
    return null;
  }
  
  return charges.data[0].receipt_url;
};