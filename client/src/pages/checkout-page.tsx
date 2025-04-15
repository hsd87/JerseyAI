import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import OrderSummary from "@/components/order-summary";
import type { ShippingAddress } from "@shared/schema";

// Shipping info form validation schema
const shippingFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  street: z.string().min(5, { message: "Street address is required." }),
  city: z.string().min(2, { message: "City is required." }),
  state: z.string().min(2, { message: "State/Province is required." }),
  zip: z.string().min(5, { message: "Zip/Postal code is required." }),
  country: z.string().min(2, { message: "Country is required." }),
  phone: z.string().min(10, { message: "Valid phone number is required." }),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

export default function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { items, addOns, priceBreakdown, resetOrder, isTeamOrder, teamMembers } = useOrderStore();
  const { user } = useAuth();

  // Initialize form with default values
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      name: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "United States",
      phone: "",
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
      return;
    }

    try {
      setIsProcessing(true);

      // Create shipping address object
      const shippingAddress: ShippingAddress = {
        name: formData.name,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        phone: formData.phone,
      };

      // For simplicity, we're using design ID 1. In a real app, you would use the current design ID
      const designId = 1;
      
      // Calculate total amount in cents from the price breakdown or items
      const totalAmount = priceBreakdown ? 
        priceBreakdown.grandTotal : 
        Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100);

      // Create order in the database
      const order = await orderService.createOrder({
        userId: user.id,
        designId: designId,
        orderDetails: {
          items: items,
          addOns: addOns,
          packageType: items[0]?.type || "jerseyOnly",
          isTeamOrder: isTeamOrder,
          teamName: isTeamOrder ? "Team Order" : undefined,
        },
        shippingAddress,
        totalAmount,
        sport: "soccer", // Default sport
        designUrls: {
          front: "https://example.com/front.jpg", // Default URL
          back: "https://example.com/back.jpg", // Default URL
        },
      });

      console.log("Order created:", order);

      // Create payment intent for Stripe checkout
      const { clientSecret } = await orderService.createPaymentIntent(items);

      // For now, show success message without actual payment processing
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been placed. Order ID: " + order.id,
      });

      // Reset cart and redirect to order confirmation page
      resetOrder();
      setLocation("/order-confirmation");
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

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shipping Information Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>
                Enter your shipping details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
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
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip/Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
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
                            <Input placeholder="United States" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
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
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <OrderSummary showDetailed />
        </div>
      </div>
    </div>
  );
}