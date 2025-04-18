import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeElementsForm from './stripe-elements-form';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Load Stripe outside of a component's render to avoid recreating the Stripe object
// on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeElementsWrapperProps {
  amount: number | undefined;
  items: any[];
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
}

export default function StripeElementsWrapper({
  amount,
  items,
  onSuccess,
  onCancel
}: StripeElementsWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create a PaymentIntent as soon as the page loads
    const fetchPaymentIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Creating payment intent for amount: $${amount} with ${items.length} items`);
        
        console.log("Starting payment intent creation with timeout of 30 seconds");
        
        // Create an AbortController with a longer timeout (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount,
          items
        }, controller.signal);
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Could not create payment intent');
        }
        
        console.log('Payment intent created successfully:', {
          hasClientSecret: !!data.clientSecret,
          clientSecretLength: data.clientSecret?.length,
          amount: data.amount
        });
        
        if (!data.clientSecret) {
          throw new Error('No client secret returned from payment service');
        }
        
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [amount, items]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Secure Payment</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripeElementsForm 
              amount={Math.round((amount || 0) * 100)} 
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Elements>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              Could not initialize payment form. Please try again later.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}