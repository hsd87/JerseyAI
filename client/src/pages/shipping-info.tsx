import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOrderStore } from '@/hooks/use-order-store';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { CustomerInfo, ShippingOption } from '@/types/shipping';

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
import {
  Loader2,
  ShoppingCart,
  Package,
  ArrowLeft,
  UserCircle2,
  MapPin,
  Truck,
  CreditCard,
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

export default function ShippingInfoPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    priceBreakdown, 
    orderDetails, 
    updateOrder,
    items,
    addOns
  } = useOrderStore();
  
  const [loading, setLoading] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>('');
  const [shippingPrice, setShippingPrice] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  
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
  
  // Get subtotal from price breakdown
  useEffect(() => {
    if (priceBreakdown) {
      setSubtotal(priceBreakdown.subtotal);
      setFinalTotal(priceBreakdown.grandTotal);
    }
  }, [priceBreakdown]);
  
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

  // Check if cart has items
  const hasCartItems = (items && items.length > 0) || (addOns && addOns.length > 0);
  
  // Enhanced authentication check
  useEffect(() => {
    if (!user) {
      console.log('User authentication check failed');
      
      toast({
        title: 'Login Required',
        description: 'Please login to continue with checkout',
      });
      
      setTimeout(() => setLocation('/auth?redirect=shipping'), 500);
      return;
    }
    
    // Check for empty cart
    if (!hasCartItems) {
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
  }, [user, priceBreakdown, setLocation, toast, hasCartItems]);

  // Calculate shipping options based on address
  const calculateShippingOptions = async () => {
    const { street, city, state, postalCode, country } = form.getValues();
    
    // Don't calculate if address is incomplete
    if (!street || !city || !state || !postalCode || !country) {
      return;
    }
    
    setCalculatingShipping(true);
    
    try {
      // Use the items and addOns from the component-level variables
      const allItems = [...items, ...addOns];
      
      // Convert cart items to the format expected by the shipping API
      const itemsForShipping = allItems.map(item => ({
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
      const response = await apiRequest('POST', '/api/shipping/calculate', {
        shippingAddress,
        items: itemsForShipping,
        subtotal: subtotal
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate shipping options');
      }
      
      const data = await response.json();
      
      // Set shipping options and select the recommended option
      setShippingOptions(data.shippingOptions);
      
      // Pre-select the recommended option
      const recommendedOption = data.recommendedOptionId;
      if (recommendedOption) {
        setSelectedShippingOption(recommendedOption);
        form.setValue('shippingOption', recommendedOption);
        
        // Update shipping price
        const option = data.shippingOptions.find((opt: ShippingOption) => opt.id === recommendedOption);
        if (option) {
          setShippingPrice(option.price);
          setFinalTotal(subtotal + option.price);
        }
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      
      // Fallback to default shipping options
      const defaultOptions = [
        {
          id: 'standard',
          name: 'Standard Shipping',
          description: 'Standard shipping with tracking',
          price: 8.99,
          estimatedDelivery: '5-7 business days',
        },
        {
          id: 'express',
          name: 'Express Shipping',
          description: 'Faster delivery with priority handling',
          price: 21.99,
          estimatedDelivery: '2-3 business days',
        }
      ];
      
      setShippingOptions(defaultOptions);
      setSelectedShippingOption('standard');
      form.setValue('shippingOption', 'standard');
      setShippingPrice(8.99);
      setFinalTotal(subtotal + 8.99);
      
      toast({
        title: 'Shipping Calculation',
        description: 'Using standard shipping rates. Exact rates will be calculated before final payment.',
      });
    } finally {
      setCalculatingShipping(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof customerInfoSchema>) => {
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
      
      // Use the items and addOns from the component-level variables
      const allItems = [...items, ...addOns];
      
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
          subtotal: subtotal || 0,
          baseTotal: subtotal || 0,
          itemCount: allItems.length,
          shippingCost: shippingOption.price,
          shipping: shippingOption.price,
          discount: 0,
          tax: 0,
          grandTotal: (subtotal || 0) + shippingOption.price
        }
      });
      
      // Navigate to payment page
      toast({
        title: 'Shipping Information Saved',
        description: 'Proceeding to payment...',
      });
      
      // Navigate to payment page
      setLocation('/checkout-fixed');
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

  // Render cart items
  const renderCartItems = () => {
    // Using items and addOns from component-level variables
    if ((!items || items.length === 0) && (!addOns || addOns.length === 0)) {
      return <p>No items in cart</p>;
    }
    
    const allItems = [...items, ...addOns];
    
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
                  {item.gender} / {item.size} / Qty: {item.quantity || 1}
                </p>
              </div>
            </div>
            <p className="font-medium">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
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

  // Main shipping info page UI
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => setLocation('/designer')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Designer
        </Button>
        <h1 className="text-2xl font-bold ml-auto">Checkout</h1>
      </div>

      <div className="mb-8">
        <Progress value={50} className="h-2 mb-2" />
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="mr-2 h-5 w-5" />
                    Shipping Method
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred shipping method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {calculatingShipping ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mr-2" />
                      <p>Calculating shipping options...</p>
                    </div>
                  ) : (
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
                                <div key={option.id} className="flex items-start space-x-2 border p-4 rounded-md">
                                  <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                                  <div className="grid gap-1 grow">
                                    <Label htmlFor={option.id} className="font-medium cursor-pointer flex justify-between">
                                      <span>{option.name}</span>
                                      <span>${option.price.toFixed(2)}</span>
                                    </Label>
                                    <div className="text-sm text-muted-foreground">
                                      {option.description} • {option.estimatedDelivery}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => setLocation('/designer')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Cart
                  </Button>
                  <Button type="submit" disabled={calculatingShipping || loading}>
                    Proceed to Payment
                    <CreditCard className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}