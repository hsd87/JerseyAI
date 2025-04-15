import { apiRequest } from "@/lib/queryClient";
import { type OrderDetails, type ShippingAddress } from "@shared/schema";

/**
 * Service for managing orders
 */
export const orderService = {
  /**
   * Create a new order in the database
   * 
   * @param userId User ID
   * @param designId Design ID
   * @param orderDetails Order details including items, add-ons, etc.
   * @param shippingAddress Shipping address information
   * @param totalAmount Total amount in cents
   * @param sport Sport type
   * @param designUrls Design image URLs
   * @returns The created order
   */
  async createOrder({
    userId,
    designId,
    orderDetails,
    shippingAddress,
    totalAmount,
    sport,
    designUrls,
  }: {
    userId: number;
    designId: number;
    orderDetails: OrderDetails;
    shippingAddress: ShippingAddress;
    totalAmount: number;
    sport: string;
    designUrls: { front: string; back: string };
  }) {
    try {
      console.log("Creating order with details:", {
        userId,
        designId,
        totalAmount,
        sport,
      });
      
      const response = await apiRequest("POST", "/api/orders", {
        userId,
        designId,
        orderDetails,
        shippingAddress,
        totalAmount,
        sport,
        designUrls,
      });
      
      return await response.json();
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },
  
  /**
   * Get all orders for the current user
   * 
   * @returns Array of user orders
   */
  async getUserOrders() {
    try {
      const response = await apiRequest("GET", "/api/orders");
      return await response.json();
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  },
  
  /**
   * Get details for a specific order
   * 
   * @param orderId Order ID
   * @returns Order details
   */
  async getOrderById(orderId: number) {
    try {
      const response = await apiRequest("GET", `/api/orders/${orderId}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a payment intent for checkout
   * 
   * @param items Array of items for the order
   * @returns Client secret for Stripe payment
   */
  async createPaymentIntent(items: any[]) {
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", { items });
      return await response.json();
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  },
};