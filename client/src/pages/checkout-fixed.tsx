import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOrderStore } from '@/hooks/use-order-store';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/lib/order-service';
import StripeElementsWrapper from '@/components/payment/stripe-elements-wrapper-fixed';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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
  UserCircle2,
  CreditCard,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Customer information form schema
const customerInfoSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(5, { message: "Phone number is required" }),
  street: z.string().min(3, { message: "Street address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  postalCode: z.string().min(3, { message: "Postal code is required" }),
  country: z.string().min(2, { message: "Country is required" }).default("US"),
  additionalInfo: z.string().optional(),
});

type CustomerInfo = z.infer<typeof customerInfoSchema>;

// Checkout steps enum
enum CheckoutStep {
  CUSTOMER_INFO = 0,
  PAYMENT = 1,
  CONFIRMATION = 2,
}

export default function CheckoutFixedPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    getCartItems, 
    priceBreakdown, 
    orderDetails, 
    clearCart, 
    setOrderCompleted,
    updateOrderDetails,
  } = useOrderStore();
  
  // Get cart items directly
  const cart = getCartItems();
  
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(CheckoutStep.CUSTOMER_INFO);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [checkoutProgress, setCheckoutProgress] = useState(33);

  // Customer info form
  const form = useForm<CustomerInfo>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      firstName: user?.username?.split(' ')[0] || '',
      lastName: user?.username?.split(' ')[1] || '',
      email: user?.email || '',
      phone: '',
      street: orderDetails?.shippingAddress?.street || '',
      city: orderDetails?.shippingAddress?.city || '',
      state: orderDetails?.shippingAddress?.state || '',
      postalCode: orderDetails?.shippingAddress?.postalCode || '',
      country: orderDetails?.shippingAddress?.country || 'US',
      additionalInfo: '',
    },
  });

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

  // Handle customer info submission
  const onSubmitCustomerInfo = (data: CustomerInfo) => {
    console.log('Customer information collected:', data);
    setCustomerInfo(data);
    
    // Update order details with customer info
    updateOrderDetails({
      shippingAddress: {
        name: `${data.firstName} ${data.lastName}`,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
      },
      customerEmail: data.email,
      customerPhone: data.phone,
      additionalInfo: data.additionalInfo,
    });
    
    // Proceed to payment step
    setCheckoutStep(CheckoutStep.PAYMENT);
    setCheckoutProgress(66);
    
    toast({
      title: 'Information Saved',
      description: 'Your information has been saved. Proceed to payment.',
    });
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setPaymentSuccess(true);
    setOrderProcessing(true);
    setCheckoutStep(CheckoutStep.CONFIRMATION);
    setCheckoutProgress(100);
    
    try {
      console.log('Payment successful, creating order:', {
        paymentId: paymentIntent.id,
        status: paymentIntent.status
      });
      
      if (!customerInfo) {
        throw new Error('Customer information is missing');
      }
      
      // Create the order in the backend
      await orderService.createOrder({
        // Required fields
        designId: cart[0]?.designId || 0,
        sport: orderDetails?.packageType?.includes('soccer') ? 'soccer' : 'basketball',
        totalAmount: priceBreakdown?.grandTotal || 0,
        paymentMethod: 'stripe',
        
        // Customer info
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        
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
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          street: customerInfo.street,
          city: customerInfo.city,
          state: customerInfo.state,
          postalCode: customerInfo.postalCode,
          country: customerInfo.country,
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
      setTimeout(() => {
        setLocation('/order-confirmation');
      }, 2000);
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
    // Go back to customer info step
    setCheckoutStep(CheckoutStep.CUSTOMER_INFO);
    setCheckoutProgress(33);
  };

  const handleBackToCart = () => {
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
        <p className="text-muted-foreground">Please wait while we set up your checkout</p>
      </div>
    );
  }

  // Render checkout step indicator
  const renderCheckoutProgress = () => {
    return (
      <div className="mb-8">
        <Progress value={checkoutProgress} className="h-2 mb-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className={checkoutStep >= CheckoutStep.CUSTOMER_INFO ? "text-primary font-medium" : ""}>
            Customer Information
          </div>
          <div className={checkoutStep >= CheckoutStep.PAYMENT ? "text-primary font-medium" : ""}>
            Payment
          </div>
          <div className={checkoutStep >= CheckoutStep.CONFIRMATION ? "text-primary font-medium" : ""}>
            Confirmation
          </div>
        </div>
      </div>
    );
  };

  // Render customer information form
  const renderCustomerInfoForm = () => {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitCustomerInfo)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCircle2 className="mr-2 h-5 w-5" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Please provide your contact information for this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email address" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Shipping Address
              </CardTitle>
              <CardDescription>
                Where should we ship your order?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes, delivery instructions, etc." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={handleBackToCart}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cart
              </Button>
              <Button type="submit">
                Continue to Payment
                <CreditCard className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    );
  };

  // Render payment form
  const renderPaymentForm = () => {
    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCircle2 className="mr-2 h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customerInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Contact Information:</p>
                  <p>{customerInfo.firstName} {customerInfo.lastName}</p>
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" /> {customerInfo.email}
                  </p>
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" /> {customerInfo.phone}
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Shipping Address:</p>
                  <p>{customerInfo.street}</p>
                  <p>{customerInfo.city}, {customerInfo.state} {customerInfo.postalCode}</p>
                  <p>{customerInfo.country}</p>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCheckoutStep(CheckoutStep.CUSTOMER_INFO)}
              >
                Edit Information
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Complete your purchase securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StripeElementsWrapper 
              amount={priceBreakdown?.grandTotal || 0}
              items={cart || []}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </CardContent>
        </Card>
      </>
    );
  };

  // Render confirmation
  const renderConfirmation = () => {
    return (
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
    );
  };

  // Main checkout UI
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => setLocation('/designer')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Designer
        </Button>
        <h1 className="text-2xl font-bold ml-auto">Checkout</h1>
      </div>

      {renderCheckoutProgress()}

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

        {/* Dynamic content based on checkout step */}
        <div className="md:col-span-2">
          {checkoutStep === CheckoutStep.CUSTOMER_INFO && renderCustomerInfoForm()}
          {checkoutStep === CheckoutStep.PAYMENT && renderPaymentForm()}
          {checkoutStep === CheckoutStep.CONFIRMATION && renderConfirmation()}
        </div>
      </div>
    </div>
  );
}