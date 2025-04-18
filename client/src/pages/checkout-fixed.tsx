import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOrderStore } from '@/hooks/use-order-store';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/lib/order-service';
import StripeElementsWrapper from '@/components/payment/stripe-elements-wrapper-fixed';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ShoppingCart,
  Package,
  ShieldCheck,
  ArrowLeft,
  Check,
} from 'lucide-react';

export default function CheckoutFixedPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    getCartItems, 
    priceBreakdown, 
    orderDetails, 
    clearCart, 
    setOrderCompleted 
  } = useOrderStore();
  
  // Get cart items directly
  const cart = getCartItems();
  
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);

  // Enhanced authentication check with detailed logging
  useEffect(() => {
    if (!user) {
      console.log('User authentication check failed:', {
        userExists: !!user,
        authState: 'unauthenticated',
        currentUrl: window.location.pathname
      });
      
      toast({
        title: 'Login Required',
        description: 'Please login to continue with checkout',
      });
      
      setTimeout(() => setLocation('/auth?redirect=checkout'), 500);
      return;
    }
    
    if (!user.id) {
      console.warn('User object incomplete - missing ID:', user);
      toast({
        title: 'Authentication Error',
        description: 'Your session appears to be incomplete. Please log in again.',
        variant: 'destructive',
      });
      
      setTimeout(() => setLocation('/auth?redirect=checkout'), 500);
      return;
    }
    
    console.log('User authenticated successfully:', {
      userId: user.id,
      username: user.username,
      authState: 'authenticated'
    });
    
    // Check for empty cart
    if (!cart || cart.length === 0) {
      console.log('Empty cart detected, redirecting to designer');
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty. Add items before checkout.',
        variant: 'destructive',
      });
      
      setTimeout(() => setLocation('/designer'), 500);
      return;
    }
    
    // Validate pricing data
    if (!priceBreakdown || priceBreakdown.grandTotal <= 0) {
      console.warn('Invalid price breakdown detected:', priceBreakdown);
      toast({
        title: 'Price Calculation Error',
        description: 'Unable to calculate price. Please try again.',
        variant: 'destructive',
      });
      
      setTimeout(() => setLocation('/designer'), 500);
    }
  }, [user, cart, priceBreakdown, setLocation, toast]);

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setPaymentSuccess(true);
    setOrderProcessing(true);
    
    try {
      console.log('Payment successful, creating order:', {
        paymentId: paymentIntent.id,
        status: paymentIntent.status
      });
      
      // Create the order in the backend
      await orderService.createOrder({
        // Required fields
        designId: cart[0]?.designId || 0,
        sport: orderDetails?.packageType?.includes('soccer') ? 'soccer' : 'basketball',
        totalAmount: priceBreakdown?.grandTotal || 0,
        paymentMethod: 'stripe',
        
        // Order details
        orderDetails: orderDetails ? {
          items: orderDetails.items || [],
          addOns: (orderDetails.addOns || []).map(addon => ({
            name: addon.name || addon.id || 'Unknown Add-on',
            price: addon.price,
            quantity: addon.quantity
          })),
          isTeamOrder: orderDetails.isTeamOrder || false,
          packageType: orderDetails.packageType || '',
        } : {
          items: [],
          addOns: [],
          isTeamOrder: false,
          packageType: '',
        },
        
        // Shipping address
        shippingAddress: {
          name: user?.username || 'Customer',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US',
        },
      });
      
      // Update order status
      setOrderCompleted(true);
      
      // Clear the cart
      clearCart();
      
      toast({
        title: 'Order Successful!',
        description: 'Your order has been placed and is being processed.',
      });
      
      // Redirect to confirmation page
      setLocation('/order-confirmation');
    } catch (error: any) {
      console.error('Order creation failed:', error);
      toast({
        title: 'Order Error',
        description: error.message || 'Failed to create your order',
        variant: 'destructive',
      });
    } finally {
      setOrderProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    setLocation('/designer');
  };

  // Render cart items
  const renderCartItems = () => {
    if (!cart || cart.length === 0) return <p>No items in cart</p>;
    
    return (
      <div className="space-y-4">
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-muted w-12 h-12 rounded-md flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{item.name || `${item.type}`}</p>
                <p className="text-sm text-muted-foreground">
                  {item.gender} / {item.size} / Qty: {item.quantity}
                </p>
              </div>
            </div>
            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>
    );
  };

  // Render order summary with simplified pricing
  const renderOrderSummary = () => {
    if (!priceBreakdown) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${priceBreakdown.subtotal.toFixed(2)}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${priceBreakdown.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  // Authentication guard
  if (!user || !user.id) {
    return (
      <div className="container max-w-lg mx-auto py-12">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to complete your purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your session may have expired. Please login again to continue with your purchase.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setLocation('/auth?redirect=checkout')} 
              className="w-full"
            >
              Login or Register
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Preparing Your Order</h2>
        <p className="text-muted-foreground">Please wait while we set up your payment</p>
      </div>
    );
  }

  // Main checkout UI
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => setLocation('/designer')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Designer
        </Button>
        <h1 className="text-2xl font-bold ml-auto">Checkout</h1>
      </div>

      {paymentSuccess ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <Check className="mr-2 h-5 w-5" />
              Payment Successful
            </CardTitle>
            <CardDescription>
              Your payment has been processed successfully. We're finalizing your order...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              {orderProcessing ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              ) : (
                <ShieldCheck className="h-12 w-12 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order summary and cart items */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Your Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderCartItems()}
                
                <Separator />
                
                {renderOrderSummary()}
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-2">
            <StripeElementsWrapper 
              amount={priceBreakdown?.grandTotal || 0}
              items={cart || []}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}