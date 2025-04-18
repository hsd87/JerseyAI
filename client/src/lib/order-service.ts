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
      const amount = request.amount || 0;
      if (isNaN(amount) || amount <= 0) {
        console.error(`Invalid amount provided: ${amount}`);
        throw new Error('Invalid payment amount. Please try again.');
      }
      
      console.log(`Creating payment intent for amount: $${amount} with ${items.length} items`);
      
      // Set a reasonable timeout for payment API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout using updated API that accepts AbortSignal
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount,
          items,
        }, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        // Handle error responses
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Payment intent error response:', errorData);
          
          // Handle specific error types
          if (errorData.error === 'stripe_not_configured' || errorData.error === 'stripe_unavailable') {
            throw new Error('Payment system is temporarily unavailable. Your order has been saved and you can complete payment later.');
          } else if (errorData.error === 'authentication_required' || response.status === 401) {
            throw new Error('Authentication required. Please log in and try again.');
          } else if (errorData.error === 'stripe_auth_error') {
            throw new Error('Payment system configuration error. Our team has been notified and is working to fix the issue.');
          } else if (errorData.error === 'stripe_connection_error') {
            throw new Error('Unable to connect to payment service. Your order has been saved and you can complete payment later.');
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
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error('Payment request timed out after 15 seconds');
          throw new Error('Payment system is taking too long to respond. Your order has been saved for later processing.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      
      // Log detailed error info for debugging
      console.log('Error details:', { 
        message: error.message, 
        name: error.name, 
        stack: error.stack,
        stripeError: error.type || 'none'
      });
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('The payment system is responding slowly. Your order details have been saved and you can try again later.');
      } else if (error.message.includes('Stripe') || 
                error.message.includes('payment') || 
                error.message.includes('unavailable')) {
        // Pass through payment-specific errors - these are already user-friendly
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
      // Set a reasonable timeout for subscription creation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout using updated API that accepts AbortSignal
        const response = await apiRequest('POST', '/api/get-or-create-subscription', undefined, 
          controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Safely get error data even if response format is unexpected
          let errorData: any = {};
          try {
            errorData = await response.json();
          } catch (jsonError) {
            console.error('Error parsing subscription error response:', jsonError);
            // If we can't parse the JSON, create a basic error object based on status
            errorData = { 
              message: `Subscription error (${response.status})`, 
              error: 'parse_error',
              details: response.statusText 
            };
          }
          
          console.error('Subscription creation error response:', errorData);
          
          // Handle specific error types
          if (errorData.error === 'stripe_not_configured' || errorData.error === 'stripe_unavailable') {
            throw new Error('Subscription service is temporarily unavailable. Please try again later.');
          } else if (errorData.error === 'authentication_required' || response.status === 401) {
            throw new Error('Authentication required. Please log in and try again.');
          } else if (errorData.error === 'stripe_auth_error') {
            throw new Error('Subscription system configuration error. Our team has been notified.');
          } else if (errorData.error === 'stripe_invalid_request') {
            // Handle missing or invalid price ID
            if (errorData.details && errorData.details.includes('price')) {
              throw new Error('Subscription plan is not properly configured. Please contact support.');
            }
            throw new Error(errorData.message || 'Invalid subscription request');
          } else if (errorData.error === 'stripe_connection_error') {
            throw new Error('Unable to connect to subscription service. Please try again later.');
          } else if (errorData.error === 'subscription_exists') {
            throw new Error('You already have an active subscription.');
          } else {
            throw new Error(errorData.message || 'Failed to create subscription');
          }
        }
        
        return await response.json();
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error('Subscription request timed out after 15 seconds');
          throw new Error('Subscription service is taking too long to respond. Please try again later.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      
      // Log detailed error info for debugging
      console.log('Subscription error details:', { 
        message: error.message, 
        name: error.name, 
        stack: error.stack,
        stripeError: error.type || 'none'
      });
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('The subscription service is responding slowly. Please try again later.');
      } else if (error.message.includes('Stripe') || 
                error.message.includes('subscription') || 
                error.message.includes('unavailable')) {
        // Pass through subscription-specific errors - these are already user-friendly
        throw error;
      }
      
      // Generic fallback error
      throw new Error(error.message || 'Subscription initialization failed. Please try again later.');
    }
  }

  /**
   * Cancel an existing subscription
   */
  async cancelSubscription(): Promise<{ success: boolean }> {
    try {
      // Set a reasonable timeout for subscription cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('POST', '/api/cancel-subscription', undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Subscription cancellation error response:', errorData);
          
          // Handle specific error types
          if (errorData.error === 'stripe_not_configured' || errorData.error === 'stripe_unavailable') {
            throw new Error('Subscription service is temporarily unavailable. Please try again later.');
          } else if (errorData.error === 'authentication_required' || response.status === 401) {
            throw new Error('Authentication required. Please log in and try again.');
          } else if (errorData.error === 'stripe_auth_error') {
            throw new Error('Subscription system configuration error. Our team has been notified.');
          } else if (errorData.error === 'stripe_connection_error') {
            throw new Error('Unable to connect to subscription service. Please try again later.');
          } else if (errorData.error === 'no_subscription') {
            throw new Error('You do not have an active subscription to cancel.');
          } else {
            throw new Error(errorData.message || 'Failed to cancel subscription');
          }
        }
        
        return await response.json();
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error('Subscription cancellation request timed out after 15 seconds');
          throw new Error('Subscription service is taking too long to respond. Please try again later.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      
      // Log detailed error info for debugging
      console.log('Cancellation error details:', { 
        message: error.message, 
        name: error.name, 
        stack: error.stack,
        stripeError: error.type || 'none'
      });
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('The subscription service is responding slowly. Please try again later.');
      }
      
      // Pass through subscription-specific errors or use generic message
      throw new Error(error.message || 'Failed to cancel your subscription. Please try again later.');
    }
  }

  /**
   * Create a new order in the database
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      // Set a reasonable timeout for order creation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout for order creation
      
      try {
        // Make API request with timeout
        const response = await apiRequest('POST', '/api/orders', request, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Order creation error response:', errorData);
          
          // Handle specific error types
          if (errorData.error === 'authentication_required' || response.status === 401) {
            throw new Error('Authentication required. Please log in and try again.');
          } else if (errorData.error === 'validation_error') {
            throw new Error('Please check your order details and try again.');
          } else if (errorData.error === 'design_not_found') {
            throw new Error('The selected design could not be found. Please choose another design.');
          } else {
            throw new Error(errorData.message || 'Failed to create order');
          }
        }
        
        return await response.json();
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error('Order creation request timed out after 20 seconds');
          
          // Try to save the order locally or in session storage for recovery
          try {
            const orderBackup = JSON.stringify(request);
            sessionStorage.setItem('pendingOrder', orderBackup);
            console.log('Order details saved to session storage for recovery');
          } catch (storageError) {
            console.error('Failed to save order to session storage:', storageError);
          }
          
          throw new Error('Order creation is taking longer than expected. Your order details have been saved and you can try again later.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      
      // Log detailed error info for debugging
      console.log('Order creation error details:', { 
        message: error.message, 
        name: error.name, 
        stack: error.stack
      });
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('The order system is responding slowly. Your order details have been saved and you can try again later.');
      }
      
      // Rethrow specific errors or use a generic message
      throw new Error(error.message || 'Order creation failed. Please try again later.');
    }
  }

  /**
   * Get all orders for the current user
   */
  async getOrders(): Promise<Order[]> {
    try {
      // Set a reasonable timeout for fetching orders
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('GET', '/api/orders', undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Order fetch error response:', errorData);
          
          // Handle specific error types
          if (errorData.error === 'authentication_required' || response.status === 401) {
            throw new Error('Authentication required. Please log in to view your orders.');
          } else {
            throw new Error(errorData.message || 'Failed to fetch orders');
          }
        }
        
        return await response.json();
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error('Order fetch request timed out after 15 seconds');
          throw new Error('The system is taking too long to fetch your orders. Please try again later.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Order fetch error:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('The system is responding slowly. Please try again later.');
      }
      
      // Rethrow specific errors or use a generic message
      throw new Error(error.message || 'Failed to fetch your orders. Please try again later.');
    }
  }

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: number): Promise<Order> {
    try {
      // Set a reasonable timeout for fetching order details
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('GET', `/api/orders/${orderId}`, undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Order ${orderId} fetch error response:`, errorData);
          
          // Handle specific error types
          if (errorData.error === 'authentication_required' || response.status === 401) {
            throw new Error('Authentication required. Please log in to view this order.');
          } else if (errorData.error === 'order_not_found' || response.status === 404) {
            throw new Error('Order not found. It may have been deleted or you may not have permission to view it.');
          } else {
            throw new Error(errorData.message || 'Failed to fetch order details');
          }
        }
        
        return await response.json();
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error(`Order ${orderId} fetch request timed out after 15 seconds`);
          throw new Error('The system is taking too long to fetch your order details. Please try again later.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      console.error(`Order ${orderId} fetch error:`, error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('The system is responding slowly. Please try again later.');
      }
      
      // Rethrow specific errors or use a generic message
      throw new Error(error.message || 'Failed to fetch order details. Please try again later.');
    }
  }
  
  /**
   * Get payment status for an order including invoice information if available
   */
  async getPaymentStatus(orderId: number): Promise<any> {
    try {
      // Set a reasonable timeout for fetching payment status
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('GET', `/api/payment/status/${orderId}`, undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Payment status for order ${orderId} fetch error:`, errorData);
          
          // Handle specific error types
          if (errorData.error === 'authentication_required' || response.status === 401) {
            throw new Error('Authentication required. Please log in to view payment status.');
          } else if (errorData.error === 'order_not_found' || response.status === 404) {
            throw new Error('Order not found. It may have been deleted or you may not have permission to view it.');
          } else {
            throw new Error(errorData.message || 'Failed to fetch payment status');
          }
        }
        
        return await response.json();
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error(`Payment status fetch request timed out after 15 seconds`);
          throw new Error('The system is taking too long to fetch payment status. Please try again later.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      console.error(`Payment status fetch error for order ${orderId}:`, error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('The system is responding slowly. Please try again later.');
      }
      
      // Rethrow specific errors or use a generic message
      throw new Error(error.message || 'Failed to fetch payment status. Please try again later.');
    }
  }
  
  /**
   * Get the invoice for an order
   * @param orderId The order ID
   * @param format Optional format (json or html)
   * @returns Invoice data or URL
   */
  async getInvoice(orderId: number, format: 'json' | 'url' = 'json'): Promise<any> {
    try {
      // For URL format, return the URL directly (will be redirected on server)
      if (format === 'url') {
        return {
          invoiceUrl: `/api/payment/invoice/${orderId}`
        };
      }
      
      // Set a reasonable timeout for fetching invoice
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('GET', `/api/payment/invoice/${orderId}?format=json`, undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Invoice fetch error for order ${orderId}:`, errorData);
          
          // Handle specific error types
          if (errorData.error === 'authentication_required' || response.status === 401) {
            throw new Error('Authentication required. Please log in to view invoice.');
          } else if (errorData.error === 'order_not_found' || response.status === 404) {
            throw new Error('Invoice not found. The order may be pending or not completed.');
          } else if (errorData.error === 'invoice_generation_failed' || response.status === 500) {
            throw new Error('Failed to generate invoice. Please try again later or contact support.');
          } else {
            throw new Error(errorData.message || 'Failed to fetch invoice');
          }
        }
        
        return await response.json();
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error(`Invoice fetch request timed out after 15 seconds`);
          throw new Error('The system is taking too long to fetch invoice. Please try again later.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      console.error(`Invoice fetch error for order ${orderId}:`, error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('The system is responding slowly. Please try again later.');
      }
      
      // Rethrow specific errors or use a generic message
      throw new Error(error.message || 'Failed to fetch invoice. Please try again later.');
    }
  }
}

export const orderService = new OrderService();