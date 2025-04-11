import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Make sure to call loadStripe outside of a component's render to avoid recreating it on every render
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) 
  : null;

// CheckoutForm component for handling the payment form
function CheckoutForm({ items, isSubscription = false }: { items: any[], isSubscription?: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // For subscriptions, use confirmPayment
      if (isSubscription) {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          setErrorMessage(error.message || 'An error occurred with your payment');
          toast({
            title: 'Payment Failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        // For one-time payments
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          setErrorMessage(error.message || 'An error occurred with your payment');
          toast({
            title: 'Payment Failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast({
        title: 'Payment Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
      
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-black hover:bg-gray-800"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${isSubscription ? '$9/month' : 'now'}`
        )}
      </Button>
    </form>
  );
}

// Main checkout page component
export default function CheckoutPage() {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSubscription, setIsSubscription] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Check query parameters for checkout type
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    setIsSubscription(type === 'subscription');
    
    // For demo purposes, create a sample item
    if (type === 'subscription') {
      setItems([{ id: 'pro-subscription', name: 'Pro Subscription', price: 900, quantity: 1 }]);
    } else {
      const designId = params.get('designId');
      const quantity = parseInt(params.get('quantity') || '1', 10);
      const size = params.get('size') || 'M';
      
      if (designId) {
        setItems([
          { id: 'jersey-order', name: 'Custom Jersey', price: 5999, quantity, size, designId }
        ]);
      } else {
        // Default item if nothing specified
        setItems([{ id: 'jersey-order', name: 'Custom Jersey', price: 5999, quantity: 1, size: 'M' }]);
      }
    }
  }, []);

  // Create payment intent when items are set
  useEffect(() => {
    if (!items.length || !user) return;

    const createIntent = async () => {
      try {
        const endpoint = isSubscription ? '/api/subscribe' : '/api/create-payment-intent';
        const response = await apiRequest('POST', endpoint, { items });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: `Could not initialize payment: ${error.message}`,
          variant: 'destructive',
        });
      }
    };

    createIntent();
  }, [items, user, isSubscription, toast]);

  // Options for the Stripe Elements
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#39FF14',
        colorBackground: '#ffffff',
        colorText: '#000000',
      },
    },
  };

  // Calculate order summary
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = isSubscription ? 0 : (user?.subscriptionTier === 'pro' ? Math.round(subtotal * 0.15) : 0);
  const shipping = 1000; // $10 flat shipping
  const tax = Math.round((subtotal - discount) * 0.075); // 7.5% tax
  const total = subtotal - discount + shipping + tax;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold font-sora mb-8">
            {isSubscription ? 'Upgrade to Pro Subscription' : 'Checkout'}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>
                    Complete your {isSubscription ? 'subscription' : 'purchase'} using a credit or debit card.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientSecret && stripePromise ? (
                    <Elements stripe={stripePromise} options={options}>
                      <CheckoutForm items={items} isSubscription={isSubscription} />
                    </Elements>
                  ) : (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {item.name} {item.size ? `(${item.size})` : ''} × {item.quantity}
                      </span>
                      <span>${(item.price / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${(subtotal / 100).toFixed(2)}</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Pro discount (15%)</span>
                        <span>-${(discount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {!isSubscription && (
                      <>
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span>${(shipping / 100).toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Tax</span>
                          <span>${(tax / 100).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    {isSubscription 
                      ? `$${(subtotal / 100).toFixed(2)}/month` 
                      : `$${(total / 100).toFixed(2)}`}
                  </span>
                </CardFooter>
              </Card>
              
              {isSubscription && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
                  <p className="font-medium mb-2">Pro Subscription Benefits:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Unlimited design generations</li>
                    <li>15% discount on all orders</li>
                    <li>Priority customer support</li>
                    <li>Cancel anytime</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}