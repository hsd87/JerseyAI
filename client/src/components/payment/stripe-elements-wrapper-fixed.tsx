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
  
  // Store the last amount and items to avoid duplicate requests
  const lastRequestData = React.useRef({ amount: 0, itemCount: 0, itemIds: [] as string[] });
  
  // Store the last client secret to avoid duplicates
  const lastClientSecret = React.useRef<string | null>(null);

  // Create component instance ID to track renders
  const componentId = React.useRef(`stripe_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`);
  console.log(`[${componentId.current}] Stripe Elements Wrapper initialized`);

  useEffect(() => {
    console.log(`[${componentId.current}] Component mounted`);
    
    return () => {
      console.log(`[${componentId.current}] Component unmounting`);
      isMounted.current = false; // Set to false when component unmounts
    };
  }, []);

  useEffect(() => {
    // Create a PaymentIntent, but with additional safeguards against duplicates
    const fetchPaymentIntent = async () => {
      // Validate we have the required data
      if (!amount || !items || items.length === 0) {
        console.log(`[${componentId.current}] No amount or items provided, skipping payment intent creation`);
        return;
      }
      
      // Check if we already have a request in progress
      if (isRequestInProgress.current) {
        console.log(`[${componentId.current}] Request already in progress, skipping duplicate call`);
        return;
      }
      
      // Check if the data is identical to the last request
      const currentItemIds = items.map(item => item.id).sort().join(',');
      const lastItemIds = lastRequestData.current.itemIds.sort().join(',');
      
      if (
        lastRequestData.current.amount === amount && 
        lastRequestData.current.itemCount === items.length &&
        currentItemIds === lastItemIds &&
        lastClientSecret.current
      ) {
        console.log(`[${componentId.current}] Data unchanged from previous request, reusing existing client secret`);
        return;
      }
      
      // Update the last request data
      lastRequestData.current = {
        amount: amount,
        itemCount: items.length,
        itemIds: items.map(item => item.id)
      };
      
      // Set the request in progress flag
      isRequestInProgress.current = true;
      setIsLoading(true);
      setError(null);

      // Generate a request ID that is truly unique
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[${componentId.current}] [${requestId}] Creating payment intent for amount: $${amount} with ${items.length} items`);
      
      try {
        console.log(`[${componentId.current}] [${requestId}] Starting payment intent creation with timeout of 30 seconds`);
        
        // Create an AbortController with a 30 second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`[${componentId.current}] [${requestId}] Request timed out after 30 seconds`);
          controller.abort();
        }, 30000);
        
        // Add a unique componentId to track this specific component instance
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount,
          items,
          requestId,
          componentId: componentId.current
        }, controller.signal);
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Parse the response data
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Could not create payment intent');
        }
        
        console.log(`[${componentId.current}] [${requestId}] Payment intent created successfully:`, {
          hasClientSecret: !!data.clientSecret,
          clientSecretLength: data.clientSecret?.length,
          amount: data.amount,
          transactionId: data.transactionId || 'none'
        });
        
        if (!data.clientSecret) {
          throw new Error('No client secret returned from payment service');
        }
        
        // Store the client secret for deduplication
        lastClientSecret.current = data.clientSecret;
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setClientSecret(data.clientSecret);
        } else {
          console.log(`[${componentId.current}] [${requestId}] Component unmounted, not setting client secret`);
        }
      } catch (err: any) {
        console.error(`[${componentId.current}] [${requestId}] Error creating payment intent:`, err);
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setError(err.message || 'An unexpected error occurred');
        } else {
          console.log(`[${componentId.current}] [${requestId}] Component unmounted, not setting error`);
        }
      } finally {
        // Always reset the request in progress flag
        isRequestInProgress.current = false;
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setIsLoading(false);
        } else {
          console.log(`[${componentId.current}] [${requestId}] Component unmounted, not updating loading state`);
        }
      }
    };

    // Execute the fetch function
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