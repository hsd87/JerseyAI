import React, { useEffect, useState, Suspense } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useOrderStore } from "@/hooks/use-order-store";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { orderService } from "@/lib/order-service";
import { Loader2, FileText, ShoppingBag, CreditCard } from "lucide-react";
// Lazy load components that might cause issues
const OrderSummary = React.lazy(() => import("@/components/order-summary"));
import type { ShippingAddress } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger, 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// List of countries for dropdown
const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", 
  "Germany", "France", "Spain", "Italy", "Japan", "Brazil", 
  "Mexico", "China", "India", "South Africa", "Other"
];

// Enhanced shipping info form validation schema
const shippingFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  street: z.string().min(5, { message: "Street address is required." }),
  street2: z.string().optional(),
  city: z.string().min(2, { message: "City is required." }),
  state: z.string().min(2, { message: "State/Province is required." }),
  zip: z.string().min(4, { message: "Zip/Postal code is required." }),
  country: z.string().min(2, { message: "Country is required." }),
  phone: z.string().min(7, { message: "Valid phone number is required." }),
  deliveryInstructions: z.string().optional(),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

export default function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStep, setOrderStep] = useState<'shipping' | 'payment'>('shipping');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { 
    items, 
    addOns, 
    priceBreakdown, 
    resetOrder, 
    isTeamOrder, 
    teamMembers, 
    designId, 
    designUrls,
    sport 
  } = useOrderStore();
  const { user } = useAuth();

  // Initialize form with default values or user data if available
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      name: user?.username || "",
      email: user?.email || "",
      street: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "United States",
      phone: "",
      deliveryInstructions: "",
    },
  });

  // Redirect to home if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [items, setLocation, toast]);

  // Handle form submission
  const onSubmit = async (formData: ShippingFormValues) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to complete your purchase.",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    try {
      setIsProcessing(true);

      // Create shipping address object
      const shippingAddress: ShippingAddress = {
        name: formData.name,
        street: formData.street + (formData.street2 ? `, ${formData.street2}` : ''),
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        phone: formData.phone,
      };

      // Use the design ID from the store or fall back to a default
      const designIdToUse = designId || 1;
      
      // Calculate total amount in cents from the price breakdown or items
      const totalAmount = priceBreakdown ? 
        priceBreakdown.grandTotal : 
        Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100);

      // Design URLs from store or defaults - using front-view only approach
      const designUrlsToUse = designUrls || {
        front: "https://placehold.co/600x800/0071e3/ffffff.png?text=Front",
        back: "" // Empty string for back view as per front-view-only approach
      };

      // Create order in the database
      const order = await orderService.createOrder({
        userId: user.id,
        designId: designIdToUse,
        orderDetails: {
          items: items,
          addOns: addOns || [],
          packageType: items[0]?.type || "jerseyOnly",
          isTeamOrder: isTeamOrder,
          teamName: isTeamOrder ? "Team Order" : undefined,
          deliveryTimeline: "2-3 weeks",
        },
        shippingAddress,
        totalAmount,
        sport: sport || "soccer",
        designUrls: designUrlsToUse,
      });

      console.log("Order created:", order);
      setOrderId(order.id);
      setPdfUrl(order.pdfUrl || null);

      toast({
        title: "Shipping Info Saved",
        description: "Your shipping information has been saved. Proceed to payment.",
      });

      // Advance to payment step
      setOrderStep('payment');
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "There was an error processing your order.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle proceeding to payment
  const handleProceedToPayment = async () => {
    try {
      setIsProcessing(true);
      
      // Create payment intent for Stripe checkout
      const { clientSecret } = await orderService.createPaymentIntent(items);
      console.log("Payment intent created, client secret obtained");
      
      // In a real implementation, this would redirect to the Stripe Elements UI
      // For now, we'll just simulate success and redirect to confirmation
      
      toast({
        title: "Order Ready for Payment",
        description: "Redirecting to payment processor...",
      });
      
      // For this prototype, just redirect to the confirmation page
      setTimeout(() => {
        resetOrder();
        setLocation(`/order-confirmation?orderId=${orderId}`);
      }, 2000);
      
    } catch (error: any) {
      console.error("Payment setup error:", error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "There was an error setting up payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Handle view PDF
  const handleViewPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: "PDF Not Available",
        description: "The order PDF is still being generated. Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <Helmet>
        <title>Checkout - ProJersey</title>
      </Helmet>
      
      {/* Progress steps */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Checkout</h1>
        
        <div className="relative flex items-center justify-between max-w-xl">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${orderStep === 'shipping' ? 'bg-primary text-white' : 'bg-primary text-white'}`}>
              <ShoppingBag size={20} />
            </div>
            <span className="mt-2 text-sm font-medium">Shipping</span>
          </div>
          
          <div className="flex-1 h-1 mx-2 bg-gray-200">
            <div className={`h-full bg-primary ${orderStep === 'shipping' ? 'w-0' : 'w-full'} transition-all duration-300`}></div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${orderStep === 'payment' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
              <CreditCard size={20} />
            </div>
            <span className="mt-2 text-sm font-medium">Payment</span>
          </div>
          
          <div className="flex-1 h-1 mx-2 bg-gray-200"></div>
          
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-500">
              <FileText size={20} />
            </div>
            <span className="mt-2 text-sm font-medium">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Main content - changes based on step */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orderStep === 'shipping' ? (
          // Shipping Information Form
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
                <CardDescription>
                  Enter your shipping details for delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="johndoe@example.com" 
                                type="email"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="street2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apartment, Suite, etc. (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Apt 4B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-6 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="col-span-3 md:col-span-2">
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="col-span-3 md:col-span-2">
                            <FormLabel>State/Province *</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem className="col-span-3 md:col-span-2">
                            <FormLabel>Zip/Postal Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <Select
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="deliveryInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Instructions (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Leave at the front door" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-4" />

                    <CardFooter className="px-0 pt-2">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Continue to Payment"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Payment Step
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Payment Details</CardTitle>
                    <CardDescription>
                      Complete your purchase securely
                    </CardDescription>
                  </div>
                  {pdfUrl && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={handleViewPdf}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Invoice
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Opens PDF invoice in a new tab
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium">Order #{orderId}</p>
                      <p className="text-sm text-muted-foreground">Ready for payment</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Verified
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your order has been created and is ready for payment. A confirmation email will be sent upon completion.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    For this demo, we'll simulate payment completion. In a real application, 
                    Stripe Elements would be integrated here for secure credit card processing.
                  </p>
                  
                  {/* Simulated payment UI */}
                  <Tabs defaultValue="credit_card" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="credit_card">Credit Card</TabsTrigger>
                      <TabsTrigger value="paypal">PayPal</TabsTrigger>
                      <TabsTrigger value="apple_pay">Apple Pay</TabsTrigger>
                    </TabsList>
                    <TabsContent value="credit_card" className="border rounded-md p-4 mt-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="card_number">Card Number</Label>
                          <Input id="card_number" placeholder="**** **** **** ****" disabled />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input id="expiry" placeholder="MM/YY" disabled />
                          </div>
                          <div>
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="***" disabled />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="name">Name on Card</Label>
                          <Input id="name" placeholder="John Doe" disabled />
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="paypal" className="border rounded-md p-4 mt-4 flex items-center justify-center h-40">
                      <p className="text-center text-muted-foreground">PayPal integration would appear here</p>
                    </TabsContent>
                    <TabsContent value="apple_pay" className="border rounded-md p-4 mt-4 flex items-center justify-center h-40">
                      <p className="text-center text-muted-foreground">Apple Pay integration would appear here</p>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleProceedToPayment} 
                  className="w-full bg-primary"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    "Complete Purchase"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Order Summary (shown in both steps) */}
        <div>
          <Suspense fallback={
            <div className="p-6 bg-gray-50 rounded-md flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-gray-500">Loading order summary...</p>
            </div>
          }>
            <OrderSummary showDetailed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}