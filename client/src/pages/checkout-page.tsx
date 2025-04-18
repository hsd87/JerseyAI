import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOrderStore } from '@/hooks/use-order-store';
import { useToast } from '@/hooks/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { StripePaymentForm } from '@/components/payment/stripe-payment-form';
import { orderService } from '@/lib/order-service';

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
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Check,
} from 'lucide-react';

// Make sure to call loadStripe outside of a component's render to avoid recreation on each render
let stripePromise: Promise<Stripe | null> | null = null;
const getStripePromise = () => {
  if (!stripePromise && import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

const CheckoutPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const orderStore = useOrderStore();
  const { cart, priceBreakdown, orderDetails, clearCart, setOrderCompleted } = orderStore;
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderProcessing, setOrderProcessing] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart || cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty. Add items before checkout.',
        variant: 'destructive',
      });
      
      // Allow animations to complete before redirecting
      setTimeout(() => {
        setLocation('/designer');
      }, 500);
      
      return; // Skip the rest of the initialization
    }
    
    // Validate that we have valid price data
    if (!priceBreakdown || priceBreakdown.grandTotal <= 0) {
      console.warn('Invalid price breakdown detected:', priceBreakdown);
      toast({
        title: 'Price Calculation Error',
        description: 'Unable to calculate price. Please try again or contact support.',
        variant: 'destructive',
      });
      
      // Allow animations to complete before redirecting
      setTimeout(() => {
        setLocation('/designer');
      }, 500);
    }
  }, [cart, priceBreakdown]);

  // Create payment intent when page loads
  useEffect(() => {
    if (!priceBreakdown) return;
    
    const createPaymentIntent = async () => {
      setLoading(true);
      
      try {
        const { clientSecret } = await orderService.createPaymentIntent({
          amount: priceBreakdown.grandTotal,
          orderItems: cart || [],
        });
        
        setClientSecret(clientSecret);
      } catch (error: any) {
        console.error('Payment intent creation failed:', error);
        
        // Check for specific error types
        if (error.message?.includes('Payment system') || 
            error.message?.includes('Stripe') ||
            error.message?.includes('service unavailable')) {
          // Show a nicer toast for payment system errors
          toast({
            title: 'Payment System Unavailable',
            description: 'Our payment system is currently undergoing maintenance. Your order details have been saved - please try again later.',
            variant: 'destructive',
            duration: 5000,
          });
        } else {
          // Generic error
          toast({
            title: 'Checkout Error',
            description: error.message || 'Failed to initialize payment',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [priceBreakdown]);

  const handlePaymentSuccess = async () => {
    setOrderProcessing(true);
    
    try {
      // Create the order in the backend
      await orderService.createOrder({
        items: cart?.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name || `${item.type}`,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          gender: item.gender,
        })) || [],
        orderDetails: orderDetails ? {
          // Convert client-side OrderDetails to the format expected by the backend API
          items: orderDetails.items || [],
          // Ensure addOns have required properties for OrderAddOn type
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
        totalAmount: priceBreakdown?.grandTotal || 0,
        paymentMethod: 'stripe',
      });
      
      // Update order status
      setOrderCompleted(true);
      
      // Clear the cart
      clearCart();
      
      // Toast success
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
    toast({
      title: 'Payment Cancelled',
      description: 'Your payment was cancelled. Your cart items are still available.',
    });
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

  // Render order summary
  const renderOrderSummary = () => {
    if (!priceBreakdown) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${priceBreakdown.subtotal.toFixed(2)}</span>
        </div>
        
        {priceBreakdown.subscriptionDiscountApplied && (
          <div className="flex justify-between text-green-600">
            <span>Subscription Discount</span>
            <span>-${priceBreakdown.subscriptionDiscountAmount.toFixed(2)}</span>
          </div>
        )}
        
        {priceBreakdown.tierDiscountApplied && (
          <div className="flex justify-between text-green-600">
            <span>Quantity Discount</span>
            <span>-${priceBreakdown.tierDiscountAmount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {priceBreakdown.shippingFreeThresholdApplied ? (
              <span className="text-green-600">Free</span>
            ) : (
              `$${priceBreakdown.shipping.toFixed(2)}`
            )}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${priceBreakdown.tax.toFixed(2)}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${priceBreakdown.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to complete your purchase</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/auth')} className="w-full">
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

  // Show alternate payment UI if Stripe is unavailable
  if (!clientSecret) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Payment System Unavailable</h1>
          <p className="text-muted-foreground">Our payment system is currently undergoing maintenance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order summary and cart items */}
          <div className="lg:col-span-1">
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

          {/* Payment unavailable notice */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment System Maintenance</CardTitle>
                <CardDescription>
                  We're sorry for the inconvenience. Our payment system is temporarily unavailable.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md">
                  <h3 className="font-semibold flex items-center">
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Your Order Is Saved
                  </h3>
                  <p className="mt-2">
                    Don't worry! Your order details and design have been saved. You can come back later to complete your purchase.
                  </p>
                </div>
                <p>
                  Our team is working to restore payment services as quickly as possible. Please check back soon to complete your purchase.
                </p>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.history.back()}
                  >
                    Return to Designer
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">Complete your purchase to get your custom jersey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order summary and cart items */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderCartItems()}
              
              <Separator />
              
              {renderOrderSummary()}
            </CardContent>
          </Card>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Secure Checkout</h3>
                <p className="text-sm text-muted-foreground">
                  All payment information is encrypted and secure
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-lg">
              <Truck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Fast Shipping</h3>
                <p className="text-sm text-muted-foreground">
                  Standard delivery in 2-4 weeks after design approval
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Enter your card information to complete your purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clientSecret ? (
                <Elements
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      labels: 'floating',
                    },
                  }}
                  stripe={getStripePromise()}
                >
                  <StripePaymentForm
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                    amount={priceBreakdown?.grandTotal || 0}
                    isProcessing={orderProcessing}
                  />
                </Elements>
              ) : (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;