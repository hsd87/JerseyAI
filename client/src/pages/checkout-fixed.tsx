import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOrderStore } from '@/hooks/use-order-store';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { orderService } from '@/lib/order-service';
import { shippingService, type ShippingOption } from '@/lib/shipping-service';
import { CustomerInfo } from '@/hooks/use-order-types';
import StripeElementsForm from '@/components/payment/stripe-elements-form';
import okdioLogo from "@/assets/okdio-logo.png";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ShoppingCart,
  Package,
  ArrowLeft,
  User,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  CheckCircle2,
} from 'lucide-react';

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
  shippingOption: z.string().min(1, { message: "Please select a shipping option" }),
});

// Initialize Stripe (ensure this is outside the component to prevent re-initialization)
let stripePromise: any = null;
if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
} else {
  console.error('Missing Stripe public key');
}

// Checkout steps enum
enum CheckoutStep {
  SHIPPING_INFO = 0,
  PAYMENT = 1,
  CONFIRMATION = 2,
}

export default function CheckoutFixedPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    items, 
    addOns,
    priceBreakdown, 
    orderDetails, 
    clearCart, 
    setOrderCompleted,
    updateOrder,
    designId,
    designUrls,
    sport,
  } = useOrderStore();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(CheckoutStep.SHIPPING_INFO);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [checkoutProgress, setCheckoutProgress] = useState(33);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingPrice, setShippingPrice] = useState(0);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>('');
  
  // Calculate cart totals
  const subtotal = React.useMemo(() => {
    const itemsTotal = items.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
    
    const addOnsTotal = addOns.reduce((total, addon) => {
      return total + (addon.price * (addon.quantity || 1));
    }, 0);
    
    return Number((itemsTotal + addOnsTotal).toFixed(2));
  }, [items, addOns]);
  
  // Total with shipping
  const [finalTotal, setFinalTotal] = useState(subtotal);
  
  // Customer info form
  const form = useForm<z.infer<typeof customerInfoSchema>>({
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
      shippingOption: '',
    },
  });
  
  // Watch form values to calculate shipping when address changes
  const formValues = form.watch();
  
  // Calculate shipping options when form values change
  useEffect(() => {
    const { street, city, state, postalCode, country } = formValues;
    
    // Only calculate if we have a valid address
    if (street && city && state && postalCode && country) {
      calculateShippingOptions();
    }
  }, [formValues.street, formValues.city, formValues.state, formValues.postalCode, formValues.country]);
  
  // Update selected shipping option price when changed
  useEffect(() => {
    if (selectedShippingOption && shippingOptions.length > 0) {
      const option = shippingOptions.find(opt => opt.id === selectedShippingOption);
      if (option) {
        setShippingPrice(option.price);
        setFinalTotal(subtotal + option.price);
      }
    }
  }, [selectedShippingOption, shippingOptions, subtotal]);
  
  // Enhanced authentication check
  useEffect(() => {
    if (!user) {
      console.log('User authentication check failed');
      
      toast({
        title: 'Login Required',
        description: 'Please login to continue with checkout',
      });
      
      setTimeout(() => setLocation('/auth?redirect=checkout'), 500);
      return;
    }
    
    // Check for empty cart
    if (!items || items.length === 0) {
      console.log('Empty cart detected, redirecting to designer');
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty. Add items before checkout.',
        variant: 'destructive',
      });
      
      setTimeout(() => setLocation('/designer'), 500);
      return;
    }
    
    // Check for missing design
    if (!designId || !designUrls) {
      console.warn('Missing design information');
      toast({
        title: 'Missing Design',
        description: 'Please complete your design before checkout',
        variant: 'destructive',
      });
      
      setTimeout(() => setLocation('/designer'), 500);
      return;
    }
  }, [user, items, designId, designUrls, setLocation, toast]);
  
  // Create payment intent when moving to payment step
  useEffect(() => {
    if (checkoutStep === CheckoutStep.PAYMENT && !clientSecret) {
      createPaymentIntent();
    }
  }, [checkoutStep]);
  
  // Calculate shipping options based on address
  const calculateShippingOptions = async () => {
    const { street, city, state, postalCode, country } = form.getValues();
    
    // Don't calculate if address is incomplete
    if (!street || !city || !state || !postalCode || !country) {
      return;
    }
    
    setCalculatingShipping(true);
    
    try {
      // Convert cart items to the format expected by the shipping API
      const itemsForShipping = items.map(item => ({
        quantity: item.quantity || 1,
        size: item.size
      }));
      
      // Create the shipping address
      const shippingAddress = {
        name: `${form.getValues().firstName} ${form.getValues().lastName}`,
        street,
        city,
        state,
        postalCode,
        country
      };
      
      // Call the API
      const result = await shippingService.calculateShipping({
        shippingAddress,
        items: itemsForShipping,
        subtotal
      });
      
      // Set shipping options and select the recommended option
      setShippingOptions(result.shippingOptions);
      
      // Pre-select the recommended option
      const recommendedOption = result.recommendedOptionId;
      if (recommendedOption) {
        setSelectedShippingOption(recommendedOption);
        form.setValue('shippingOption', recommendedOption);
        
        // Update shipping price
        const option = result.shippingOptions.find(opt => opt.id === recommendedOption);
        if (option) {
          setShippingPrice(option.price);
          setFinalTotal(subtotal + option.price);
        }
      }
    } catch (error: any) {
      console.error('Error calculating shipping:', error);
      
      // Show error message
      toast({
        title: 'Shipping Calculation Error',
        description: 'Unable to calculate shipping rates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCalculatingShipping(false);
    }
  };
  
  // Create a Stripe payment intent
  const createPaymentIntent = async () => {
    setLoading(true);
    
    try {
      // Ensure we have a valid total amount
      if (!finalTotal || finalTotal <= 0) {
        throw new Error('Invalid order amount');
      }
      
      // Create a payment intent through our API
      const response = await orderService.createPaymentIntent({
        amount: finalTotal,
        items: [...items, ...addOns],
      });
      
      if (!response.clientSecret) {
        throw new Error('Failed to create payment intent');
      }
      
      // Store the client secret
      setClientSecret(response.clientSecret);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      setError(error.message || 'Failed to set up payment. Please try again.');
      
      // Show error message
      toast({
        title: 'Payment Error',
        description: 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
      
      // Go back to shipping step
      setCheckoutStep(CheckoutStep.SHIPPING_INFO);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle shipping form submission
  const onShippingSubmit = async (data: z.infer<typeof customerInfoSchema>) => {
    setLoading(true);
    
    try {
      // Get the selected shipping option
      const shippingOption = shippingOptions.find(opt => opt.id === data.shippingOption);
      
      if (!shippingOption) {
        throw new Error('Please select a shipping option');
      }
      
      // Create customer info object from form data
      const customerInfo: CustomerInfo = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        additionalInfo: data.additionalInfo
      };
      
      // Create shipping address object
      const shippingAddress = {
        name: `${data.firstName} ${data.lastName}`,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country
      };
      
      // Update order store with customer information and shipping details
      updateOrder({
        customerInfo,
        shippingAddress,
        shippingOption: {
          id: shippingOption.id,
          name: shippingOption.name,
          price: shippingOption.price
        },
        priceBreakdown: {
          subtotal: subtotal,
          baseTotal: subtotal,
          itemCount: items.length + addOns.length,
          shippingCost: shippingOption.price,
          shipping: shippingOption.price,
          discount: 0,
          tax: 0,
          grandTotal: subtotal + shippingOption.price
        }
      });
      
      // Save customer info for later
      setCustomerInfo(customerInfo);
      
      // Move to payment step
      setCheckoutStep(CheckoutStep.PAYMENT);
      setCheckoutProgress(66);
      
      toast({
        title: 'Shipping Information Saved',
        description: 'Proceeding to payment...',
      });
    } catch (error: any) {
      console.error('Error saving shipping information:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save shipping information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle payment success
  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    setOrderProcessing(true);
    
    try {
      if (!designId) {
        throw new Error('Design ID is missing');
      }
      
      // Create order in database with shipping and payment information
      const order = await orderService.createOrder({
        designId,
        sport: sport || 'soccer',
        totalAmount: finalTotal,
        orderDetails: {
          items,
          addOns: addOns.map(addon => ({
            ...addon,
            name: addon.name || addon.type,
          })),
          isTeamOrder: false,
          packageType: 'jerseyOnly',
          paymentMethod: 'stripe',
          shippingAddress: {
            name: `${customerInfo?.firstName} ${customerInfo?.lastName}`,
            street: customerInfo?.street || '',
            city: customerInfo?.city || '',
            state: customerInfo?.state || '',
            postalCode: customerInfo?.postalCode || '',
            country: customerInfo?.country || 'US',
          },
          priceBreakdown: {
            subtotal,
            shipping: shippingPrice,
            grandTotal: finalTotal,
          },
          customerEmail: customerInfo?.email,
          customerPhone: customerInfo?.phone,
          additionalInfo: customerInfo?.additionalInfo,
        },
        shippingAddress: {
          name: `${customerInfo?.firstName} ${customerInfo?.lastName}`,
          street: customerInfo?.street || '',
          city: customerInfo?.city || '',
          state: customerInfo?.state || '',
          postalCode: customerInfo?.postalCode || '',
          country: customerInfo?.country || 'US',
        },
        paymentMethod: 'stripe',
        designUrls: designUrls || { front: '', back: '' },
      });
      
      // Mark order as completed
      setOrderCompleted(true);
      
      // Move to confirmation step
      setCheckoutStep(CheckoutStep.CONFIRMATION);
      setCheckoutProgress(100);
      
      // Clear cart after 2 seconds
      setTimeout(() => {
        clearCart();
      }, 2000);
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: 'Order Processing Error',
        description: 'Payment completed but there was an error creating your order. Our team will contact you shortly.',
        variant: 'destructive',
      });
    } finally {
      setOrderProcessing(false);
    }
  };
  
  // Render cart items
  const renderCartItems = () => {
    const allItems = [...items, ...addOns];
    
    if (!allItems || allItems.length === 0) return <p>No items in cart</p>;
    
    return (
      <div className="space-y-4">
        {allItems.map((item, index) => (
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
            <p className="font-medium">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
          </div>
        ))}
      </div>
    );
  };
  
  // Render order summary with price breakdown
  const renderOrderSummary = () => {
    return (
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Shipping</span>
          {calculatingShipping ? (
            <span className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Calculating...
            </span>
          ) : (
            <span>${shippingPrice.toFixed(2)}</span>
          )}
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${finalTotal.toFixed(2)}</span>
        </div>
      </div>
    );
  };
  
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
  
  // Render shipping information step
  if (checkoutStep === CheckoutStep.SHIPPING_INFO) {
    return (
      <>
        {/* Navigation Bar */}
        <div className="bg-[#2C2C2E] text-white">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <img 
                  src={okdioLogo} 
                  alt="OKDIO Logo" 
                  className="h-5 md:h-6" 
                />
              </Link>
              <div className="hidden md:flex items-center space-x-8 text-sm">
                <Link href="/designer" className="text-white hover:text-gray-300 transition-colors">
                  Design
                </Link>
                <Link href="/how-it-works" className="text-white hover:text-gray-300 transition-colors">
                  How It Works
                </Link>
                <Link href="/help" className="text-white hover:text-gray-300 transition-colors">
                  Help
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="text-sm text-white/80">
                    Hi, {user.username}
                  </div>
                ) : (
                  <Link href="/auth" className="text-sm text-white hover:text-gray-300 transition-colors">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      
        <div className="container max-w-4xl mx-auto py-8">
          <div className="flex items-center mb-8">
            <Button variant="ghost" onClick={() => setLocation('/designer')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Designer
            </Button>
            <h1 className="text-2xl font-bold ml-auto text-gradient">Checkout</h1>
          </div>
  
        <div className="mb-8">
          <Progress value={checkoutProgress} className="h-2 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <div className="text-primary font-medium">
              Shipping Information
            </div>
            <div>
              Payment
            </div>
            <div>
              Confirmation
            </div>
          </div>
        </div>
  
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
  
          {/* Shipping information form */}
          <div className="md:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onShippingSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
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
                              <Input type="email" placeholder="Email" {...field} />
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
                            <FormLabel>Phone</FormLabel>
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
                      Where should we send your order?
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
  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input placeholder="State/Province" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              placeholder="Delivery instructions or other notes" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
  
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="mr-2 h-5 w-5" />
                      Shipping Method
                    </CardTitle>
                    <CardDescription>
                      Choose your preferred shipping option
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {calculatingShipping ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mr-3" />
                        <p>Calculating shipping options...</p>
                      </div>
                    ) : shippingOptions.length > 0 ? (
                      <FormField
                        control={form.control}
                        name="shippingOption"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-3"
                              >
                                {shippingOptions.map((option) => (
                                  <div
                                    key={option.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${
                                      field.value === option.id
                                        ? "border-primary bg-primary/5"
                                        : "border-border"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <RadioGroupItem
                                        value={option.id}
                                        id={option.id}
                                        className="mt-1"
                                      />
                                      <div>
                                        <Label
                                          htmlFor={option.id}
                                          className="text-base font-medium"
                                        >
                                          {option.name}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                          {option.description}
                                        </p>
                                        <p className="text-sm mt-1">
                                          Estimated delivery: {option.estimatedDelivery}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-base font-medium">
                                      ${option.price.toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="text-muted-foreground py-4">
                        Please enter your shipping address to see available shipping options.
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation('/designer')}
                    >
                      Back to Designer
                    </Button>
                    <Button 
                      type="submit"
                      disabled={calculatingShipping || shippingOptions.length === 0}
                    >
                      Continue to Payment
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </div>
        </div>
      </div>
      </>
    );
  }
  
  // Render payment step
  if (checkoutStep === CheckoutStep.PAYMENT) {
    return (
      <>
        {/* Navigation Bar */}
        <div className="bg-[#2C2C2E] text-white">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <img 
                  src={okdioLogo} 
                  alt="OKDIO Logo" 
                  className="h-5 md:h-6" 
                />
              </Link>
              <div className="hidden md:flex items-center space-x-8 text-sm">
                <Link href="/designer" className="text-white hover:text-gray-300 transition-colors">
                  Design
                </Link>
                <Link href="/how-it-works" className="text-white hover:text-gray-300 transition-colors">
                  How It Works
                </Link>
                <Link href="/help" className="text-white hover:text-gray-300 transition-colors">
                  Help
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="text-sm text-white/80">
                    Hi, {user.username}
                  </div>
                ) : (
                  <Link href="/auth" className="text-sm text-white hover:text-gray-300 transition-colors">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="container max-w-4xl mx-auto py-8">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => {
                setCheckoutStep(CheckoutStep.SHIPPING_INFO);
                setCheckoutProgress(33);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shipping
            </Button>
            <h1 className="text-2xl font-bold ml-auto text-gradient">Payment</h1>
          </div>
  
        <div className="mb-8">
          <Progress value={checkoutProgress} className="h-2 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <div>
              Shipping Information
            </div>
            <div className="text-primary font-medium">
              Payment
            </div>
            <div>
              Confirmation
            </div>
          </div>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order summary and shipping info */}
          <div className="md:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show mini cart summary - just totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shippingPrice.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customerInfo && (
                  <>
                    <div>
                      <p className="font-medium">{customerInfo.firstName} {customerInfo.lastName}</p>
                      <p className="text-sm text-muted-foreground">{customerInfo.email}</p>
                      <p className="text-sm text-muted-foreground">{customerInfo.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm">{customerInfo.street}</p>
                      <p className="text-sm">{customerInfo.city}, {customerInfo.state} {customerInfo.postalCode}</p>
                      <p className="text-sm">{customerInfo.country}</p>
                    </div>
                    {customerInfo.additionalInfo && (
                      <div>
                        <p className="text-sm text-muted-foreground italic">"{customerInfo.additionalInfo}"</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
  
          {/* Payment form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Payment Information
                </CardTitle>
                <CardDescription>
                  Complete your purchase securely
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    {/* Store client secret in window object for the form to access */}
                    {(() => {
                      // Make the client secret available to the StripeElementsForm
                      (window as any).stripeClientSecret = clientSecret;
                      return (
                        <StripeElementsForm
                          amount={finalTotal}
                          onSuccess={handlePaymentSuccess}
                          onCancel={() => {
                            setCheckoutStep(CheckoutStep.SHIPPING_INFO);
                            setCheckoutProgress(33);
                          }}
                        />
                      );
                    })()}
                  </Elements>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </>
    );
  }
  
  // Render confirmation step
  if (checkoutStep === CheckoutStep.CONFIRMATION) {
    return (
      <>
        {/* Navigation Bar */}
        <div className="bg-[#2C2C2E] text-white">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <img 
                  src={okdioLogo} 
                  alt="OKDIO Logo" 
                  className="h-5 md:h-6" 
                />
              </Link>
              <div className="hidden md:flex items-center space-x-8 text-sm">
                <Link href="/designer" className="text-white hover:text-gray-300 transition-colors">
                  Design
                </Link>
                <Link href="/how-it-works" className="text-white hover:text-gray-300 transition-colors">
                  How It Works
                </Link>
                <Link href="/help" className="text-white hover:text-gray-300 transition-colors">
                  Help
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="text-sm text-white/80">
                    Hi, {user.username}
                  </div>
                ) : (
                  <Link href="/auth" className="text-sm text-white hover:text-gray-300 transition-colors">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="container max-w-4xl mx-auto py-8">
          <div className="mb-8">
            <Progress value={checkoutProgress} className="h-2 mb-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <div>
                Shipping Information
              </div>
              <div>
                Payment
              </div>
              <div className="text-primary font-medium">
                Confirmation
              </div>
            </div>
          </div>
  
        <Card className="mx-auto max-w-2xl mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Order Confirmed!</CardTitle>
            <CardDescription className="text-base">
              Thank you for your purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 p-4 rounded-lg text-center">
              <p className="font-medium">Order Total: ${finalTotal.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to {customerInfo?.email}
              </p>
            </div>
  
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Shipping Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Shipping Address:</p>
                  <p className="text-sm">{customerInfo?.street}</p>
                  <p className="text-sm">{customerInfo?.city}, {customerInfo?.state} {customerInfo?.postalCode}</p>
                  <p className="text-sm">{customerInfo?.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Contact Information:</p>
                  <p className="text-sm">{customerInfo?.firstName} {customerInfo?.lastName}</p>
                  <p className="text-sm">{customerInfo?.email}</p>
                  <p className="text-sm">{customerInfo?.phone}</p>
                </div>
              </div>
            </div>
  
            <Separator />
  
            <div>
              <h3 className="font-semibold mb-3">Order Summary</h3>
              {items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.type} ({item.size}) x {item.quantity}
                  </span>
                  <span>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
              {addOns.length > 0 && (
                <>
                  <p className="text-sm font-medium mt-2">Add-ons:</p>
                  {addOns.map((addon, index) => (
                    <div key={`addon-${index}`} className="flex justify-between py-2 text-sm">
                      <span>
                        {addon.type} ({addon.size}) x {addon.quantity}
                      </span>
                      <span>${(addon.price * (addon.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="flex justify-between border-t pt-2 mt-2">
                <span>Shipping:</span>
                <span>${shippingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button onClick={() => setLocation('/')}>
              Return to Home
            </Button>
            <Button variant="outline" onClick={() => setLocation('/account/orders')}>
              View Orders
            </Button>
          </CardFooter>
        </Card>
      </div>
      </>
    );
  }
  
  // Fallback UI
  return (
    <div className="container max-w-4xl mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-semibold">Loading Checkout</h2>
      <p className="text-muted-foreground">Please wait...</p>
    </div>
  );
}