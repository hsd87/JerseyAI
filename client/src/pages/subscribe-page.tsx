import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription-store';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';

// Load Stripe outside of component render
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) 
  : null;

function SubscriptionForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const subscription = useSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred with your subscription');
        toast({
          title: 'Subscription Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, fetch updated subscription status
        await subscription.fetchSubscription();
        toast({
          title: 'Subscription Active',
          description: 'Your Pro subscription is now active!',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast({
        title: 'Subscription Error',
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
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
}

export default function SubscribePage() {
  const { user } = useAuth();
  const subscription = useSubscription();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Create subscription when component mounts
  useEffect(() => {
    if (!user) return;

    // If already on pro tier, redirect to dashboard
    if (subscription.isSubscribed) {
      toast({
        title: 'Already subscribed',
        description: 'You are already on the Pro plan.',
      });
      navigate('/dashboard');
      return;
    }

    const createSubscription = async () => {
      try {
        const response = await apiRequest('POST', '/api/subscribe', {});
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: `Could not initialize subscription: ${error.message}`,
          variant: 'destructive',
        });
      }
    };

    createSubscription();
  }, [user, navigate, toast, subscription]);

  // Options for the Stripe Elements
  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#39FF14',
        colorBackground: '#ffffff',
        colorText: '#000000',
      },
    },
  } : {};

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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold font-sora mb-8">
            Upgrade to Pro
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Subscription Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Pro Subscription - $9/month</CardTitle>
                  <CardDescription>
                    Complete your subscription using a credit or debit card.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientSecret && stripePromise ? (
                    <Elements stripe={stripePromise} options={options}>
                      <SubscriptionForm />
                    </Elements>
                  ) : (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Benefits */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Pro Benefits</CardTitle>
                  <CardDescription>
                    Upgrade to unlock these premium features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="bg-green-100 text-green-600 p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium">Unlimited Designs</h4>
                      <p className="text-sm text-gray-600">Create as many AI-generated jersey designs as you need</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="bg-green-100 text-green-600 p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium">Exclusive Discount</h4>
                      <p className="text-sm text-gray-600">Get 15% off on all jersey orders</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="bg-green-100 text-green-600 p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium">Priority Support</h4>
                      <p className="text-sm text-gray-600">Get faster responses and dedicated customer service</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="bg-green-100 text-green-600 p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium">Premium Design Features</h4>
                      <p className="text-sm text-gray-600">Access to exclusive patterns and customization options</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
                  <p>Cancel anytime. No long-term commitment required.</p>
                </CardFooter>
              </Card>
              
              {/* Compare Plans */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Compare Plans</h3>
                <div className="overflow-hidden ring-1 ring-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Feature</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Free</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pro</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">Monthly designs</td>
                        <td className="px-3 py-4 text-sm text-gray-500">6</td>
                        <td className="px-3 py-4 text-sm font-medium text-green-600">Unlimited</td>
                      </tr>
                      <tr>
                        <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">Order discount</td>
                        <td className="px-3 py-4 text-sm text-gray-500">None</td>
                        <td className="px-3 py-4 text-sm font-medium text-green-600">15%</td>
                      </tr>
                      <tr>
                        <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">Support</td>
                        <td className="px-3 py-4 text-sm text-gray-500">Standard</td>
                        <td className="px-3 py-4 text-sm font-medium text-green-600">Priority</td>
                      </tr>
                      <tr>
                        <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">Price</td>
                        <td className="px-3 py-4 text-sm text-gray-500">$0</td>
                        <td className="px-3 py-4 text-sm font-medium text-green-600">$9/month</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}