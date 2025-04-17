import { apiRequest } from './queryClient';
import { OrderItem, OrderDetails } from '@/hooks/use-order-types';

interface CreatePaymentIntentRequest {
  amount: number;
  orderItems: OrderItem[];
}

interface CreatePaymentIntentResponse {
  clientSecret: string;
}

interface CreateOrderRequest {
  items: OrderItem[];
  orderDetails: OrderDetails;
  totalAmount: number;
  paymentMethod: string;
}

interface CreateSubscriptionResponse {
  clientSecret: string;
  subscriptionId: string;
}

interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: any[];
}

class OrderService {
  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: request.amount,
        items: request.orderItems,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      throw new Error(error.message || 'Payment initialization failed');
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