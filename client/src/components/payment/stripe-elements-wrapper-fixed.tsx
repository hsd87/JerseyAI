import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import StripeElementsForm from './stripe-elements-form';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import stripePromise from '@/lib/stripe-client';

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

  // Track if the component is mounted to prevent state updates after unmounting
  const isMounted = React.useRef(true);
  
  // Use a ref to track if we're already fetching to prevent duplicate requests
  const isRequestInProgress = React.useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false; // Set to false when component unmounts
    };
  }, []);

  useEffect(() => {
    // Create a PaymentIntent as soon as the page loads, but only if not already in progress
    const fetchPaymentIntent = async () => {
      // Prevent duplicate requests for same amount and items
      if (isRequestInProgress.current || !amount || items.length === 0) {
        return;
      }

      isRequestInProgress.current = true;
      setIsLoading(true);
      setError(null);

      // For debugging - generate a request ID to track this specific request
      const requestId = `req_${Date.now()}`;
      console.log(`[${requestId}] Creating payment intent for amount: $${amount} with ${items.length} items`);
      
      try {
        console.log(`[${requestId}] Starting payment intent creation with timeout of 30 seconds`);
        
        // Create an AbortController with a longer timeout (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount,
          items,
          requestId, // Add request ID to track on server
        }, controller.signal);
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Could not create payment intent');
        }
        
        console.log(`[${requestId}] Payment intent created successfully:`, {
          hasClientSecret: !!data.clientSecret,
          clientSecretLength: data.clientSecret?.length,
          amount: data.amount
        });
        
        if (!data.clientSecret) {
          throw new Error('No client secret returned from payment service');
        }
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setClientSecret(data.clientSecret);
        }
      } catch (err: any) {
        console.error(`[${requestId}] Error creating payment intent:`, err);
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setError(err.message || 'An unexpected error occurred');
        }
      } finally {
        isRequestInProgress.current = false;
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setIsLoading(false);
        }
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