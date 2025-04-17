import { apiRequest } from './queryClient';
// Import types from our shared definitions
import { 
  OrderItem, 
  OrderDetails, 
  ShippingAddress,
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  CreateSubscriptionResponse,
  Order
} from '@shared/types/order';

// Define request for creating an order
interface CreateOrderRequest {
  designId: number;
  sport: string;
  totalAmount: number;
  orderDetails: OrderDetails;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  designUrls?: { front: string; back: string };
  prompt?: string;
  metadata?: Record<string, any>;
}

class OrderService {
  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    try {
      // Ensure we have valid items to send
      const items = request.orderItems && request.orderItems.length > 0 
        ? request.orderItems 
        : [{ 
            id: 'default', 
            type: 'jersey', 
            price: request.amount, 
            quantity: 1, 
            size: 'M', 
            gender: 'unisex' 
          }];
      
      // Validate amount
      const amount = request.amount;
      if (isNaN(amount) || amount <= 0) {
        console.error(`Invalid amount provided: ${amount}`);
        throw new Error('Invalid payment amount. Please try again.');
      }
      
      console.log(`Creating payment intent for amount: $${amount} with ${items.length} items`);
      
      // Make API request
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount,
        items,
      });
      
      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment intent error response:', errorData);
        
        // Handle specific error types
        if (errorData.error === 'stripe_not_configured') {
          throw new Error('Payment system is not properly configured. Please contact support.');
        } else if (errorData.error === 'authentication_required' || response.status === 401) {
          throw new Error('Authentication required. Please log in and try again.');
        } else if (errorData.error === 'stripe_auth_error') {
          throw new Error('Payment system configuration error. Please contact support.');
        } else if (errorData.error === 'stripe_connection_error') {
          throw new Error('Unable to connect to payment service. Please try again later.');
        } else {
          throw new Error(errorData.message || 'Failed to create payment intent');
        }
      }
      
      // Process successful response
      const responseData = await response.json();
      console.log('Payment intent created successfully:', responseData);
      
      // Ensure the response contains the required clientSecret
      if (!responseData.clientSecret) {
        console.error('Missing client secret in payment intent response:', responseData);
        throw new Error('Invalid response from payment service. Please try again.');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('Stripe') || error.message.includes('payment')) {
        // Pass through payment-specific errors
        throw error;
      }
      
      // Generic fallback error
      throw new Error(error.message || 'Unable to initialize payment. Please try again later.');
    }
  }

  /**
   * Create a new subscription with Stripe
   */
  async createSubscription(): Promise<CreateSubscriptionResponse> {
    try {
      const response = await apiRequest('POST', '/api/get-or-create-subscription');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      throw new Error(error.message || 'Subscription initialization failed');
    }
  }

  /**
   * Cancel an existing subscription
   */
  async cancelSubscription(): Promise<{ success: boolean }> {
    try {
      const response = await apiRequest('POST', '/api/cancel-subscription');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      throw new Error(error.message || 'Failed to cancel subscription');
    }
  }

  /**
   * Create a new order in the database
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      const response = await apiRequest('POST', '/api/orders', request);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Order creation error:', error);
      throw new Error(error.message || 'Order creation failed');
    }
  }

  /**
   * Get all orders for the current user
   */
  async getOrders(): Promise<Order[]> {
    try {
      const response = await apiRequest('GET', '/api/orders');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch orders');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Order fetch error:', error);
      throw new Error(error.message || 'Failed to fetch orders');
    }
  }

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: number): Promise<Order> {
    try {
      const response = await apiRequest('GET', `/api/orders/${orderId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch order');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Order fetch error:', error);
      throw new Error(error.message || 'Failed to fetch order details');
    }
  }
}

export const orderService = new OrderService();