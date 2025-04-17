import { apiRequest } from './queryClient';

class OrderService {
  
  /**
   * Creates a payment intent for the given cart items
   * @param items Cart items to create payment for
   * @returns Promise with client secret
   */
  async createPaymentIntent(items: any[]): Promise<{ clientSecret: string }> {
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', { items });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment intent');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Creates a subscription payment intent
   * @returns Promise with client secret and subscription ID
   */
  async createSubscription(): Promise<{ clientSecret: string, subscriptionId: string }> {
    try {
      const response = await apiRequest('POST', '/api/get-or-create-subscription');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create subscription');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Checks current subscription status
   * @returns Promise with subscription status
   */
  async getSubscriptionStatus(): Promise<{ isActive: boolean, endDate: Date | null, tier: string }> {
    try {
      const response = await apiRequest('GET', '/api/subscription/status');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check subscription status');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error checking subscription status:', error);
      throw error;
    }
  }

  /**
   * Cancels a subscription
   * @returns Promise with success status
   */
  async cancelSubscription(): Promise<{ success: boolean }> {
    try {
      const response = await apiRequest('POST', '/api/cancel-subscription');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel subscription');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Creates a new order in the system
   * @param orderData Order data to save
   * @returns Promise with the created order
   */
  async createOrder(orderData: any): Promise<any> {
    try {
      const response = await apiRequest('POST', '/api/orders', orderData);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Gets all orders for the current user
   * @returns Promise with list of orders
   */
  async getOrders(): Promise<any[]> {
    try {
      const response = await apiRequest('GET', '/api/orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get orders');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Gets a specific order by ID
   * @param orderId Order ID to fetch
   * @returns Promise with order details
   */
  async getOrderById(orderId: string): Promise<any> {
    try {
      const response = await apiRequest('GET', `/api/orders/${orderId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get order');
      }
      
      return data;
    } catch (error: any) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }
}

export const orderService = new OrderService();