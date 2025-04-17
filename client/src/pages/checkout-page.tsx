import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { StripePaymentWrapper } from '@/components/payment/stripe-payment-wrapper';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useOrderStore } from '@/hooks/use-order-store';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, ShoppingCart, Check } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'review' | 'payment' | 'confirmation'>('review');
  
  // Get order data from the store
  const { 
    cart, 
    orderDetails, 
    teamMembers, 
    priceBreakdown,
    clearCart,
    setOrderCompleted 
  } = useOrderStore();
  
  // Calculate the total amount in cents (for Stripe)
  const totalAmount = priceBreakdown?.grandTotal ? Math.round(priceBreakdown.grandTotal * 100) : 0;
  
  useEffect(() => {
    // If no items in cart, redirect back to design page
    if (!cart || cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty. Please add items before checkout.',
        variant: 'destructive'
      });
      setLocation('/designer');
    }
  }, [cart, setLocation, toast]);
  
  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please log in to continue with checkout</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/auth')}>
              Login or Register
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (isProcessing) {
    return (
      <div className="container max-w-4xl mx-auto py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Processing Your Order</h2>
        <p className="text-muted-foreground">Please wait while we process your payment...</p>
      </div>
    );
  }
  
  const handlePaymentSuccess = () => {
    setIsProcessing(true);
    
    // Simulate order completion and processing delay
    setTimeout(() => {
      // Mark order as completed in the store
      setOrderCompleted(true);
      
      // Clear cart
      clearCart();
      
      // Update UI
      setPaymentStep('confirmation');
      setIsProcessing(false);
      
      // Show success toast
      toast({
        title: 'Order Successful!',
        description: 'Your order has been placed successfully',
        variant: 'default'
      });
    }, 2000);
  };
  
  const handlePaymentCancel = () => {
    setPaymentStep('review');
    
    toast({
      title: 'Payment Cancelled',
      description: 'You can continue shopping or try again',
      variant: 'default'
    });
  };
  
  const renderOrderSummary = () => {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Order Summary</h3>
        
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between items-start py-2">
            <div>
              <p className="font-medium">{item.name || item.kitType}</p>
              <p className="text-sm text-muted-foreground">
                {item.sport} - {item.kitType} x{item.quantity}
              </p>
            </div>
            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        
        <Separator />
        
        {priceBreakdown && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${priceBreakdown.subtotal.toFixed(2)}</span>
            </div>
            
            {priceBreakdown.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-${priceBreakdown.discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>${priceBreakdown.shipping.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${priceBreakdown.tax.toFixed(2)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${priceBreakdown.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderOrderDetails = () => {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Order Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
            <p>{orderDetails.contactName}</p>
            <p>{orderDetails.contactEmail}</p>
            <p>{orderDetails.contactPhone}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Shipping Address</p>
            <p>{orderDetails.shippingAddress}</p>
            <p>{orderDetails.shippingCity}, {orderDetails.shippingState} {orderDetails.shippingZip}</p>
            <p>{orderDetails.shippingCountry}</p>
          </div>
        </div>
        
        {teamMembers && teamMembers.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Team Members</p>
            <p className="text-sm">{teamMembers.length} team members included</p>
          </div>
        )}
        
        <div>
          <p className="text-sm font-medium text-muted-foreground">Additional Information</p>
          <p className="text-sm">{orderDetails.orderNotes || 'No additional notes'}</p>
        </div>
      </div>
    );
  };
  
  if (paymentStep === 'confirmation') {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
            <CardDescription>Thank you for your purchase</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg">Your order has been successfully placed.</p>
              <p className="text-muted-foreground">
                A confirmation email has been sent to {user.email || orderDetails.contactEmail}
              </p>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-medium text-lg mb-2">Order Summary</h3>
              <p className="text-sm">Order ID: ORDER-{Date.now().toString().substring(5)}</p>
              <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm">Total Amount: ${priceBreakdown?.grandTotal.toFixed(2) || '0.00'}</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => setLocation('/account/orders')}>
              View Your Orders
            </Button>
            <Button variant="outline" onClick={() => setLocation('/designer')}>
              Design Another Kit
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation('/cart')} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>
        
        <h1 className="text-3xl font-bold mt-2">Checkout</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {paymentStep === 'review' ? 'Order Review' : 'Payment Details'}
              </CardTitle>
              <CardDescription>
                {paymentStep === 'review' 
                  ? 'Review your order before proceeding to payment' 
                  : 'Enter your payment information to complete your order'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {paymentStep === 'review' ? (
                <div className="space-y-6">
                  {renderOrderDetails()}
                  
                  <div className="md:hidden">
                    {renderOrderSummary()}
                  </div>
                </div>
              ) : (
                <StripePaymentWrapper 
                  items={cart}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                  amount={totalAmount}
                />
              )}
            </CardContent>
            
            {paymentStep === 'review' && (
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => setPaymentStep('payment')}
                  disabled={isProcessing}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        <div className="hidden md:block">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            
            <CardContent>
              {renderOrderSummary()}
            </CardContent>
            
            {paymentStep === 'review' && (
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => setPaymentStep('payment')}
                  disabled={isProcessing}
                >
                  Proceed to Payment
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;