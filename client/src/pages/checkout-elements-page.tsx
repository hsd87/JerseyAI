import React, { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import StripeElementsWrapper from '@/components/payment/stripe-elements-wrapper-fixed';
import { useOrderStore } from '@/hooks/use-order-store';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

export default function CheckoutElementsPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/checkout-elements/:orderId?');
  const { 
    items, 
    totalAmount, 
    clearItems, 
    addItem, 
    setOrderDetails, 
    setPriceBreakdown 
  } = useOrderStore();
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const { toast } = useToast();
  
  // Calculate total from items as a fallback if totalAmount is not available
  const calculatedTotal = React.useMemo(() => {
    return items.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
  }, [items]);

  // Use the order ID from the route if it exists
  const orderId = match ? params?.orderId : null;
  
  // Extract draft param from URL (e.g. /checkout-elements?draft=123)
  const urlParams = new URLSearchParams(window.location.search);
  const draftOrderId = urlParams.get('draft');

  // Handle successful payment
  const handlePaymentSuccess = async (paymentResult: any) => {
    console.log('Payment successful details:', {
      id: paymentResult.id,
      status: paymentResult.status,
      amount: paymentResult.amount,
      created: new Date(paymentResult.created * 1000).toISOString()
    });
    
    setPaymentCompleted(true);
    
    // If this was a draft order, convert it to a real order
    if (draftOrderId) {
      try {
        // Call API to convert draft to real order
        const response = await apiRequest('POST', `/api/orders/${draftOrderId}/convert-draft`, {
          paymentIntentId: paymentResult.id,
          paymentStatus: paymentResult.status,
          amount: paymentResult.amount
        });
        
        console.log('Draft order converted successfully:', await response.json());
      } catch (error) {
        console.error('Error converting draft order:', error);
        // Still continue with checkout flow even if conversion fails
        // The order was still processed through Stripe
      }
    }
    
    // Clear the cart
    clearItems();
    
    // Show success toast
    toast({
      title: 'Payment completed!',
      description: 'Your order has been successfully processed.',
    });
    
    // Redirect to success page after a short delay
    setTimeout(() => {
      console.log('Redirecting to payment success page');
      setLocation('/payment-success');
    }, 2000);
  };

  // Fetch draft order if draftOrderId is present in the URL
  const { data: draftOrder, isLoading: isDraftLoading } = useQuery({
    queryKey: ['/api/orders', draftOrderId],
    queryFn: async () => {
      if (!draftOrderId) return null;
      setLoadingDraft(true);
      try {
        const response = await apiRequest('GET', `/api/orders/${draftOrderId}`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching draft order:', error);
        toast({
          title: 'Failed to load draft order',
          description: 'Could not retrieve your saved order. Please try again.',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoadingDraft(false);
      }
    },
    enabled: !!draftOrderId,
  });

  // Load draft order data into the store
  useEffect(() => {
    if (draftOrder && draftOrder.status === 'draft') {
      // Clear current cart first
      clearItems();

      // Parse order details
      const orderDetails = draftOrder.orderDetails || {};
      
      // Add items to cart
      if (orderDetails.items && orderDetails.items.length > 0) {
        orderDetails.items.forEach((item: {
          id?: string;
          type: string;
          name?: string;
          price: number;
          quantity?: number;
          size?: string;
          gender?: string;
        }) => {
          addItem({
            id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: item.type,
            name: item.name || item.type,
            price: item.price,
            quantity: item.quantity || 1,
            size: item.size || 'M',
            gender: item.gender || 'unisex',
          });
        });
      }
      
      // Set full order details
      setOrderDetails(orderDetails);
      
      // Set price breakdown if available
      try {
        const metadata = typeof draftOrder.metadata === 'string' 
          ? JSON.parse(draftOrder.metadata) 
          : draftOrder.metadata;
          
        if (metadata && metadata.priceBreakdown) {
          setPriceBreakdown(metadata.priceBreakdown);
        }
      } catch (error) {
        console.error('Error parsing draft order metadata:', error);
      }
      
      toast({
        title: 'Draft order loaded',
        description: 'Your saved order has been loaded. Continue with checkout when ready.',
      });
    }
  }, [draftOrder, clearItems, addItem, setOrderDetails, setPriceBreakdown, toast]);

  // If there are no items, redirect to the designer page
  useEffect(() => {
    // Only redirect if no items, no draft is loading, and payment is not completed
    if (items.length === 0 && !isDraftLoading && !loadingDraft && !paymentCompleted) {
      console.log('No items in cart, redirecting to designer page');
      setLocation('/designer');
    } else {
      console.log('Checkout started with', items.length, 'items, total amount:', totalAmount || calculatedTotal);
    }
  }, [items, paymentCompleted, setLocation, totalAmount, calculatedTotal, isDraftLoading, loadingDraft]);

  if (paymentCompleted) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Payment Successful</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-green-50 p-4 rounded-[1px]">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <p className="text-center">Your payment has been processed successfully. Thank you for your purchase!</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation('/designer')}>Go to Designer</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show loading state while fetching draft order
  if (isDraftLoading || loadingDraft) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Loading Saved Order</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="bg-blue-50 p-4 rounded-[1px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-center">Loading your saved order. Please wait...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show empty cart message if no items and not loading
  if (items.length === 0) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="bg-gray-50 p-4 rounded-[1px]">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation('/designer')}>Go to Designer</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => setLocation('/designer')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Designer
        </Button>
        <h1 className="text-2xl font-bold ml-auto">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name || item.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.size} | Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${(totalAmount || calculatedTotal || 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        <div>
          <StripeElementsWrapper 
            amount={totalAmount || calculatedTotal}
            items={items}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setLocation('/designer')}
          />
        </div>
      </div>
    </div>
  );
}