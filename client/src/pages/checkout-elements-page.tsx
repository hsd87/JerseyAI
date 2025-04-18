import React, { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import StripeElementsWrapper from '@/components/payment/stripe-elements-wrapper';
import { useOrderStore } from '@/hooks/use-order-store';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutElementsPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/checkout-elements/:orderId?');
  const { items, totalAmount, clearItems } = useOrderStore();
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Calculate total from items as a fallback if totalAmount is not available
  const calculatedTotal = React.useMemo(() => {
    return items.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
  }, [items]);

  // Use the order ID from the route if it exists
  const orderId = match ? params?.orderId : null;

  // Handle successful payment
  const handlePaymentSuccess = (paymentResult: any) => {
    console.log('Payment successful:', paymentResult);
    setPaymentCompleted(true);
    
    // Clear the cart
    clearItems();
    
    // Show success toast
    toast({
      title: 'Payment completed!',
      description: 'Your order has been successfully processed.',
    });
    
    // Redirect to success page after a short delay
    setTimeout(() => {
      setLocation('/payment-success');
    }, 2000);
  };

  // If there are no items, redirect to the designer page
  useEffect(() => {
    if (items.length === 0 && !paymentCompleted) {
      console.log('No items in cart, redirecting to designer page');
      setLocation('/designer');
    } else {
      console.log('Checkout started with', items.length, 'items, total amount:', totalAmount || calculatedTotal);
    }
  }, [items, paymentCompleted, setLocation, totalAmount, calculatedTotal]);

  if (paymentCompleted) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Payment Successful</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-center">Your payment has been processed successfully. Thank you for your purchase!</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation('/designer')}>Go to Designer</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
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