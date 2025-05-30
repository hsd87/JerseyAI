import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOrderStore } from '@/hooks/use-order-store';
import { useToast } from '@/hooks/use-toast';
import { useFormatPrice } from '@/hooks/use-format-price';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { orderService } from '@/lib/order-service';
import { SimplifiedStripeForm } from '@/components/payment/simplified-stripe-form';
import okdioLogo from '@/assets/okdio-logo.png';

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
  Download,
  FileText,
} from 'lucide-react';

// We're using the initializeStripe function from the SimplifiedStripeForm component

const CheckoutPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const orderStore = useOrderStore();
  const { getCartItems, priceBreakdown, orderDetails, clearCart, setOrderCompleted } = orderStore;
  // Get cart items directly using the function
  const cart = getCartItems();
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  // Check for authentication and empty cart
  useEffect(() => {
    // Enhanced authentication check with more detailed logging
    if (!user) {
      console.log('User authentication check failed:', {
        userExists: !!user,
        authState: 'unauthenticated',
        currentUrl: window.location.pathname
      });
      
      // Show a friendly toast notification
      toast({
        title: 'Login Required',
        description: 'Please login to continue with checkout',
        variant: 'default',
      });
      
      // Allow animations to complete before redirecting
      setTimeout(() => {
        setLocation('/auth?redirect=checkout');
      }, 500);
      
      return; // Skip the rest of the initialization
    }
    
    // Additional check for user ID to ensure complete authentication
    if (!user.id) {
      console.warn('User object incomplete - missing ID:', {
        userObject: user,
        authState: 'incomplete'
      });
      
      toast({
        title: 'Authentication Error',
        description: 'Your session appears to be incomplete. Please log in again.',
        variant: 'destructive',
      });
      
      // Redirect to auth page with return URL
      setTimeout(() => {
        setLocation('/auth?redirect=checkout');
      }, 500);
      
      return;
    }
    
    // Log successful authentication for debugging
    console.log('User authenticated successfully:', {
      userId: user.id,
      username: user.username,
      authState: 'authenticated'
    });
    
    // Then check if cart is empty
    if (!cart || cart.length === 0) {
      console.log('Empty cart detected, redirecting to designer');
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
  }, [user, cart, priceBreakdown, setLocation]);

  // Create payment intent when page loads
  useEffect(() => {
    if (!priceBreakdown || !cart || cart.length === 0) {
      console.log('Skipping payment intent creation - missing price/cart data:', {
        hasPriceBreakdown: !!priceBreakdown,
        hasCart: !!cart,
        cartLength: cart?.length || 0
      });
      return;
    }
    
    // Enhanced authentication check for payment intent creation
    if (!user || !user.id) {
      console.log('Skipping payment intent creation - authentication issue:', {
        userExists: !!user,
        hasUserId: user ? !!user.id : false,
        stage: 'payment_intent_creation'
      });
      setLoading(false);
      
      // No need to show a toast here as the first useEffect will handle the redirect
      return;
    }
    
    // Additional check for Stripe customer ID
    if (!user.stripeCustomerId) {
      console.warn('User missing Stripe customer ID - may cause payment creation issues:', {
        userId: user.id,
        hasStripeId: !!user.stripeCustomerId
      });
      // Continue anyway as the server will create a customer if needed
    }
    
    const createPaymentIntent = async () => {
      setLoading(true);
      
      // Set timeout to prevent hanging on network issues
      const timeoutId = setTimeout(() => {
        console.log('Payment intent creation timed out after 10 seconds');
        setLoading(false);
        // Show timeout toast
        toast({
          title: 'Payment Service Timeout',
          description: 'We\'re experiencing high demand. Your order details have been saved - please try again later.',
          variant: 'destructive',
          duration: 5000,
        });
      }, 10000); // 10 second timeout
      
      // IMPORTANT: Ensure we're using cents for Stripe payments (our pricing model)
      // This is a critical step to ensure the Stripe dashboard shows correct amounts
      let amountInCents = Math.round(priceBreakdown.grandTotal);
      
      // Prevent errors with very small amounts - enforce minimum charge of $0.50
      if (amountInCents < 50) {
        console.warn(`Amount too small (${amountInCents} cents), using minimum 50 cents instead`);
        amountInCents = 50;
      }
      
      // Double check that amount is a positive integer to avoid Stripe errors
      if (isNaN(amountInCents) || amountInCents <= 0) {
        console.error('Invalid amount for payment intent:', amountInCents);
        toast({
          title: 'Price Calculation Error',
          description: 'Unable to calculate price. Please try again or contact support.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      console.log('Creating payment intent for checkout with:', {
        amount: amountInCents,
        amountInDollars: `$${(amountInCents/100).toFixed(2)}`,
        cartItems: cart.length,
        userId: user?.id
      });
      
      try {
        const response = await orderService.createPaymentIntent({
          amount: amountInCents,
          orderItems: cart || [],
        });
        
        // Clear timeout since request completed
        clearTimeout(timeoutId);
        
        console.log('Payment intent created successfully:', { 
          hasClientSecret: !!response.clientSecret,
          clientSecretLength: response.clientSecret?.length,
          amount: response.amount
        });
        
        if (!response.clientSecret) {
          throw new Error('No client secret returned from payment service');
        }
        
        setClientSecret(response.clientSecret);
      } catch (error: any) {
        // Clear timeout since request completed (with error)
        clearTimeout(timeoutId);
        
        console.error('Payment intent creation failed:', error);
        
        // Check for specific error types
        if (error.message?.includes('Payment system') || 
            error.message?.includes('Stripe') ||
            error.message?.includes('service unavailable') ||
            error.message?.includes('Failed to fetch')) {
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
  }, [priceBreakdown, cart, user]);

  const handlePaymentSuccess = async () => {
    setOrderProcessing(true);
    
    try {
      // Create the order in the backend
      const orderResponse = await orderService.createOrder({
        // Required fields
        designId: cart[0]?.designId || 0,
        sport: orderDetails?.packageType?.includes('soccer') ? 'soccer' : 'basketball', // Default to common sports based on package
        totalAmount: priceBreakdown?.grandTotal || 0, // Important: This should already be in CENTS per our pricing model
        paymentMethod: 'stripe',
        
        // These fields are derived from the order details
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
        
        // Add shipping address (required by interface)
        shippingAddress: {
          name: user?.username || 'Customer',
          street: '', // Using correct property name 'street' instead of 'address1'
          city: '',
          state: '',
          postalCode: '',
          country: 'US',
        },
      });
      
      // Update order status and track order ID
      setOrderCompleted(true);
      
      // Store order information for receipt generation
      if (orderResponse?.id) {
        setOrderId(String(orderResponse.id));
        
        // Generate a user-friendly order number (e.g., OKD-12345)
        const friendlyOrderNumber = `OKD-${String(orderResponse.id).padStart(5, '0')}`;
        setOrderNumber(friendlyOrderNumber);
      }
      
      // Clear the cart
      clearCart();
      
      // Toast success
      toast({
        title: 'Order Successful!',
        description: 'Your order has been placed and is being processed.',
      });
      
      // We'll now show the success step with receipt download instead of redirecting immediately
      // setLocation('/order-confirmation');
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
  
  // Handle PDF receipt download
  const handleDownloadReceipt = async () => {
    if (!orderId) {
      toast({
        title: 'Unable to generate receipt',
        description: 'Order information not available',
        variant: 'destructive',
      });
      return;
    }
    
    setDownloadingReceipt(true);
    
    try {
      // Call the backend to generate and return a PDF receipt
      const response = await orderService.generateReceipt(orderId);
      
      // Create a download link for the PDF
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OKDIO_Receipt_${orderNumber}.pdf`;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Receipt Downloaded',
        description: 'Your receipt has been saved to your device',
      });
    } catch (error: any) {
      console.error('Receipt generation failed:', error);
      toast({
        title: 'Receipt Generation Failed',
        description: error.message || 'Unable to generate your receipt',
        variant: 'destructive',
      });
    } finally {
      setDownloadingReceipt(false);
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
        {cart.map((item, index) => {
          // Safely handle potentially undefined values
          // Price is in cents per our pricing model
          const priceInCents = item.price || 0;
          const quantity = item.quantity || 1;
          const gender = item.gender || 'Unisex';
          const size = item.size || 'One size';
          const type = item.type || 'Item';
          const name = item.name || type;
          
          // Convert to dollars for display
          const priceInDollars = priceInCents / 100;
          const itemTotalInDollars = (priceInCents * quantity) / 100;
          
          return (
            <div key={index} className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-muted w-12 h-12 rounded-md flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-muted-foreground">
                    {gender} / {size} / Qty: {quantity}
                  </p>
                </div>
              </div>
              <p className="font-medium">${itemTotalInDollars.toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    );
  };

  // Render order summary with simplified pricing (no discounts, taxes, or shipping)
  const renderOrderSummary = () => {
    if (!priceBreakdown) return null;
    
    // Safely handle potentially undefined values in price breakdown
    const subtotalInCents = priceBreakdown.subtotal || 0;
    const grandTotalInCents = priceBreakdown.grandTotal || 0;
    
    // Convert from cents to dollars for display
    const subtotalInDollars = subtotalInCents / 100;
    const grandTotalInDollars = grandTotalInCents / 100;
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotalInDollars.toFixed(2)}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${grandTotalInDollars.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  // Final authentication check before rendering main content
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
    <>
      {/* OKDIO Navigation Header */}
      <div className="bg-[#121212] text-white">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img 
                src={okdioLogo} 
                alt="OKDIO Logo" 
                className="h-6 md:h-8" 
              />
            </Link>
            <div className="hidden md:flex items-center space-x-8 text-sm">
              <Link href="/designer" className="text-white hover:text-gray-300 transition-colors">
                Design
              </Link>
              <Link href="/pricing" className="text-white hover:text-gray-300 transition-colors">
                Pricing
              </Link>
              <Link href="/partner" className="text-white hover:text-gray-300 transition-colors">
                Partner With Us
              </Link>
              <Link href="/faq" className="text-white hover:text-gray-300 transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Checkout Content */}
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

        {/* Payment form or Order Success */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          {orderNumber ? (
            <Card>
              <CardHeader className="bg-green-50 border-b">
                <CardTitle className="flex items-center text-green-800">
                  <Check className="mr-2 h-5 w-5" />
                  Order Confirmed!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Your payment was successful and your order has been placed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-1">Order Number:</p>
                  <p className="text-lg font-bold">{orderNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please save this number for your records
                  </p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm">
                    We'll email you a confirmation with order details and tracking information once your order ships.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/dashboard')}
                      className="sm:flex-1"
                    >
                      View My Orders
                    </Button>
                    
                    <Button
                      onClick={handleDownloadReceipt}
                      disabled={downloadingReceipt || !orderId}
                      className="sm:flex-1"
                    >
                      {downloadingReceipt ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Receipt...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download Receipt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                  // Using the simplified stripe form component
                  <SimplifiedStripeForm
                    clientSecret={clientSecret}
                    amount={priceBreakdown?.grandTotal || 0}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Setting up payment form...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default CheckoutPage;