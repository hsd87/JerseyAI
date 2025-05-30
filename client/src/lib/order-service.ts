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
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

class OrderService {
  /**
   * Create a payment intent with Stripe
   */
  // Class-level cache to store the last successful payment intent
  private static paymentIntentCache: {
    amount: number; // amount in cents (following our cents-based pricing model)
    timestamp: number;
    response: CreatePaymentIntentResponse;
  } | null = null;
  
  // Static variable to track if a request is in progress
  private static requestInProgress = false;
  
  // Reference to the auth service
  private authService: any;
  
  constructor() {
    // Initialize authService - it will be set by the component that uses this service
    this.authService = { userId: null };
    
    // Try to get auth info from the page if available
    try {
      const userElement = document.getElementById('user-data');
      if (userElement && userElement.dataset.userId) {
        this.authService = { 
          userId: parseInt(userElement.dataset.userId),
          username: userElement.dataset.username || 'guest'
        };
      }
    } catch (e) {
      console.warn('Failed to get user data from page:', e);
    }
  }
  
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    try {
      // IMPORTANT: New implementation - all prices are already in cents
      const amountInCents = Math.round(request.amount || 0);
      if (isNaN(amountInCents) || amountInCents <= 0) {
        console.error(`Invalid amount provided: ${amountInCents} cents`);
        throw new Error('Invalid payment amount. Please try again.');
      }
      
      // The amount is already in cents, no conversion needed
      const amountInDollars = amountInCents / 100;
      console.log(`Processing payment for ${amountInCents} cents (= $${amountInDollars.toFixed(2)})`);
      
      // Check class-level cache first (valid for 5 minutes to ensure fresher cache)
      const now = Date.now();
      if (OrderService.paymentIntentCache && 
          OrderService.paymentIntentCache.amount === amountInCents &&
          now - OrderService.paymentIntentCache.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        console.log(`Cached payment intent for amount: ${amountInCents} cents (= $${amountInDollars.toFixed(2)})`, {
          hasClientSecret: !!OrderService.paymentIntentCache.response.clientSecret,
          clientSecretLength: OrderService.paymentIntentCache.response.clientSecret?.length || 0,
          amount: OrderService.paymentIntentCache.response.amount
        });
        return OrderService.paymentIntentCache.response;
      }
      
      // Check if a request is already in progress
      if (OrderService.requestInProgress) {
        console.log('Payment intent request already in progress, waiting...');
        // Wait for up to 3 seconds for the ongoing request to complete (reduced from 5s for faster response)
        for (let i = 0; i < 6; i++) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          if (!OrderService.requestInProgress) {
            // If the cache was populated while waiting, check it again
            if (OrderService.paymentIntentCache?.amount === amountInCents) {
              console.log('Payment intent became available while waiting');
              return OrderService.paymentIntentCache.response;
            }
            break;
          }
        }
      }
      
      // Mark that a request is in progress
      OrderService.requestInProgress = true;
      
      // Ensure we have valid items to send
      const items = request.orderItems && request.orderItems.length > 0 
        ? request.orderItems.map(item => ({
            // Ensure every item has a valid ID
            id: item.id || `${item.type}-${Date.now()}`,
            type: item.type,
            price: item.price,
            quantity: item.quantity || 1,
            size: item.size || 'M',
            gender: item.gender || 'unisex'
          }))
        : [{ 
            id: `jersey-${Date.now()}`, 
            type: 'jersey', 
            price: request.amount, 
            quantity: 1, 
            size: 'M', 
            gender: 'unisex' 
          }];
      
      console.log(`Creating payment intent for checkout with:`, {
        amountInCents, 
        amountInDollars: amountInDollars.toFixed(2),
        cartItems: items.length,
        userId: this.authService?.userId
      });
      
      // Set a reasonable timeout for payment API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Payment request timeout', 'TimeoutError')), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout using updated API that accepts AbortSignal
        // We're only sending amount in cents now (following our new pricing model)
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount: amountInCents, // Amount in cents (e.g., 25000 = $250.00)
          items,
          requestId: request.requestId,
          componentId: request.componentId
        }, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        // Store response for later use
        let responseData;
        
        // Handle error responses
        if (!response.ok) {
          try {
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
          } catch (jsonError) {
            console.error('Error parsing error response:', jsonError);
            throw new Error(`Payment request failed with status: ${response.status} ${response.statusText}`);
          }
        }
        
        // Process successful response
        try {
          responseData = await response.json();
          console.log('Payment intent created successfully:', responseData);
          
          // Ensure the response contains the required clientSecret
          if (!responseData.clientSecret) {
            console.error('Missing client secret in payment intent response:', responseData);
            throw new Error('Invalid response from payment service. Please try again.');
          }
          
          // Store in class-level cache
          OrderService.paymentIntentCache = {
            amount: amountInCents,
            timestamp: Date.now(),
            response: responseData
          };
          
          // Log successful cache
          console.log('Cached payment intent for request:', {
            amountInCents,
            amountInDollars: amountInDollars.toFixed(2),
            hasClientSecret: !!responseData.clientSecret,
            clientSecretLength: responseData.clientSecret?.length || 0
          });
          
          // Add a small delay before releasing the lock to prevent rapid repeat requests
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Reset the in-progress flag
          OrderService.requestInProgress = false;
          
          return responseData;
        } catch (jsonError) {
          console.error('Error parsing payment intent response:', jsonError);
          throw new Error('Invalid response format from payment service. Please try again.');
        }
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Reset the in-progress flag
        OrderService.requestInProgress = false;
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error('Payment request timed out after 15 seconds');
          throw new Error('Payment system is taking too long to respond. Your order has been saved for later processing.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      // Always make sure to reset the in-progress flag on any error
      OrderService.requestInProgress = false;
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
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Subscription request timeout', 'TimeoutError')), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout using updated API that accepts AbortSignal
        const response = await apiRequest('POST', '/api/get-or-create-subscription', undefined, 
          controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        // Clone the response first since we might need to read it multiple times
        const responseClone = response.clone();
        
        if (!response.ok) {
          // Safely get error data even if response format is unexpected
          let errorData: any = {};
          try {
            errorData = await responseClone.json();
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
        
        // Process successful response using the original response object
        try {
          const responseData = await response.json();
          return responseData;
        } catch (jsonError) {
          console.error('Error parsing subscription response:', jsonError);
          throw new Error('Invalid response format from subscription service. Please try again.');
        }
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
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Subscription cancellation timeout', 'TimeoutError')), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('POST', '/api/cancel-subscription', undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Clone the response first since we might need to read it multiple times
          const responseClone = response.clone();
          
          let errorData: any = {};
          try {
            errorData = await responseClone.json();
          } catch (jsonError) {
            console.error('Error parsing cancellation error response:', jsonError);
            // If we can't parse the JSON, create a basic error object based on status
            errorData = { 
              message: `Cancellation error (${response.status})`, 
              error: 'parse_error',
              details: response.statusText 
            };
          }
          
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
        
        // Process successful response
        try {
          const responseData = await response.json();
          return responseData;
        } catch (jsonError) {
          console.error('Error parsing cancellation response:', jsonError);
          throw new Error('Invalid response format from cancellation service. Please try again.');
        }
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
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Order creation timeout', 'TimeoutError')), 20000); // 20 seconds timeout for order creation
      
      try {
        // Make API request with timeout
        const response = await apiRequest('POST', '/api/orders', request, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Clone the response first since we might need to read it multiple times
          const responseClone = response.clone();
          
          let errorData: any = {};
          try {
            errorData = await responseClone.json();
          } catch (jsonError) {
            console.error('Error parsing order creation error response:', jsonError);
            // If we can't parse the JSON, create a basic error object based on status
            errorData = { 
              message: `Order creation error (${response.status})`, 
              error: 'parse_error',
              details: response.statusText 
            };
          }
          
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
        
        // Process successful response
        try {
          const responseData = await response.json();
          return responseData;
        } catch (jsonError) {
          console.error('Error parsing order creation response:', jsonError);
          throw new Error('Invalid response format from order service. Please try again.');
        }
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
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Order fetch timeout', 'TimeoutError')), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('GET', '/api/orders', undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Clone the response first since we might need to read it multiple times
          const responseClone = response.clone();
          
          let errorData: any = {};
          try {
            errorData = await responseClone.json();
          } catch (jsonError) {
            console.error('Error parsing order fetch error response:', jsonError);
            // If we can't parse the JSON, create a basic error object based on status
            errorData = { 
              message: `Order fetch error (${response.status})`, 
              error: 'parse_error',
              details: response.statusText 
            };
          }
          
          console.error('Order fetch error response:', errorData);
          
          // Handle specific error types
          if (errorData.error === 'authentication_required' || response.status === 401) {
            throw new Error('Authentication required. Please log in to view your orders.');
          } else {
            throw new Error(errorData.message || 'Failed to fetch orders');
          }
        }
        
        // Process successful response
        try {
          const responseData = await response.json();
          return responseData;
        } catch (jsonError) {
          console.error('Error parsing orders response:', jsonError);
          throw new Error('Invalid response format from order service. Please try again.');
        }
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
   * Generate a PDF receipt for an order
   */
  async generateReceipt(orderId: string | number): Promise<ArrayBuffer> {
    try {
      // Set a reasonable timeout for PDF generation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Receipt generation timeout', 'TimeoutError')), 20000); // 20 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('GET', `/api/orders/${orderId}/receipt`, undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required to generate receipt');
          } else if (response.status === 404) {
            throw new Error('Order not found');
          }
          
          // Try to parse error message if available
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || `Receipt generation failed: ${response.statusText}`);
          } catch (jsonError) {
            throw new Error(`Receipt generation failed: ${response.statusText}`);
          }
        }
        
        // Return the PDF as an array buffer
        return await response.arrayBuffer();
      } catch (fetchError: any) {
        // Clear timeout if fetch fails
        clearTimeout(timeoutId);
        
        // Handle fetch-specific errors (timeout, network issues)
        if (fetchError.name === 'AbortError') {
          console.error('Receipt generation request timed out after 20 seconds');
          throw new Error('Receipt generation is taking longer than expected. Please try again later.');
        }
        
        // Rethrow other errors
        throw fetchError;
      }
    } catch (error: any) {
      console.error(`Error generating receipt for order ${orderId}:`, error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('Receipt generation is taking longer than expected. Please try again later.');
      }
      
      throw new Error(error.message || 'Failed to generate receipt');
    }
  }

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: number): Promise<Order> {
    try {
      // Set a reasonable timeout for fetching order details
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Order details fetch timeout', 'TimeoutError')), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('GET', `/api/orders/${orderId}`, undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Clone the response first since we might need to read it multiple times
          const responseClone = response.clone();
          
          let errorData: any = {};
          try {
            errorData = await responseClone.json();
          } catch (jsonError) {
            console.error('Error parsing order details error response:', jsonError);
            // If we can't parse the JSON, create a basic error object based on status
            errorData = { 
              message: `Order details fetch error (${response.status})`, 
              error: 'parse_error',
              details: response.statusText 
            };
          }
          
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
        
        // Process successful response
        try {
          const responseData = await response.json();
          return responseData;
        } catch (jsonError) {
          console.error('Error parsing order details response:', jsonError);
          throw new Error('Invalid response format from order service. Please try again.');
        }
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
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Payment status fetch timeout', 'TimeoutError')), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('GET', `/api/payment/status/${orderId}`, undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Clone the response first since we might need to read it multiple times
          const responseClone = response.clone();
          
          let errorData: any = {};
          try {
            errorData = await responseClone.json();
          } catch (jsonError) {
            console.error('Error parsing payment status error response:', jsonError);
            // If we can't parse the JSON, create a basic error object based on status
            errorData = { 
              message: `Payment status fetch error (${response.status})`, 
              error: 'parse_error',
              details: response.statusText 
            };
          }
          
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
        
        // Process successful response
        try {
          const responseData = await response.json();
          return responseData;
        } catch (jsonError) {
          console.error('Error parsing payment status response:', jsonError);
          throw new Error('Invalid response format from payment service. Please try again.');
        }
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
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Invoice fetch timeout', 'TimeoutError')), 15000); // 15 seconds timeout
      
      try {
        // Make API request with timeout
        const response = await apiRequest('GET', `/api/payment/invoice/${orderId}?format=json`, undefined, controller.signal);
        
        // Clear timeout if request completes
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Clone the response first since we might need to read it multiple times
          const responseClone = response.clone();
          
          let errorData: any = {};
          try {
            errorData = await responseClone.json();
          } catch (jsonError) {
            console.error('Error parsing invoice error response:', jsonError);
            // If we can't parse the JSON, create a basic error object based on status
            errorData = { 
              message: `Invoice fetch error (${response.status})`, 
              error: 'parse_error',
              details: response.statusText 
            };
          }
          
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
        
        // Process successful response
        try {
          const responseData = await response.json();
          return responseData;
        } catch (jsonError) {
          console.error('Error parsing invoice response:', jsonError);
          throw new Error('Invalid response format from invoice service. Please try again.');
        }
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