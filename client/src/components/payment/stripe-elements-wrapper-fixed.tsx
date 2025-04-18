import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { orderService } from '@/lib/order-service';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StripeElementsForm from './stripe-elements-form';

// Initialize Stripe outside component to avoid re-initialization on re-renders
let stripePromise: Promise<Stripe | null> | null = null;

// Utility function to initialize Stripe safely
const initStripe = () => {
  if (!stripePromise) {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    
    if (!stripeKey) {
      console.error('Missing Stripe public key');
      return false;
    }
    
    console.log('Initializing Stripe with key info:', {
      keyPrefix: stripeKey.substring(0, 7),
      keyLength: stripeKey.length,
      isTestKey: stripeKey.startsWith('pk_test_'),
      isLiveKey: stripeKey.startsWith('pk_live_')
    });
    
    stripePromise = loadStripe(stripeKey);
    return true;
  }
  return true;
};

interface StripeElementsWrapperProps {
  amount: number;
  items: any[];
  onSuccess?: (paymentIntent: any) => void;
  onCancel?: () => void;
}

export default function StripeElementsWrapper({ 
  amount, 
  items, 
  onSuccess, 
  onCancel 
}: StripeElementsWrapperProps) {
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Generate a unique component ID for debugging
  const componentId = React.useMemo(() => 
    `stripe-wrapper-${Math.random().toString(36).substring(2, 10)}`, 
    []
  );

  // Initialize Stripe on component mount
  useEffect(() => {
    const initialized = initStripe();
    setStripeLoaded(initialized);
    
    if (!initialized) {
      setError('Unable to initialize payment system');
      setLoading(false);
    }
  }, []);

  // Create payment intent when component mounts
  useEffect(() => {
    if (!stripeLoaded || !amount) {
      return;
    }
    
    const createPaymentIntent = async () => {
      setLoading(true);
      
      // Add a request ID for tracking purposes
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      try {
        console.log('Creating payment intent with:', {
          amount,
          itemsCount: items?.length,
          requestId,
          componentId
        });
        
        const response = await orderService.createPaymentIntent({
          amount,
          items,
          requestId,
          componentId
        });
        
        if (!response.clientSecret) {
          throw new Error('No client secret returned from payment service');
        }
        
        console.log('Payment intent created successfully:', {
          hasClientSecret: !!response.clientSecret,
          clientSecretLength: response.clientSecret.length,
          amount: response.amount
        });
        
        setClientSecret(response.clientSecret);
        setError(null);
      } catch (err: any) {
        console.error('Payment intent creation failed:', err);
        setError(err.message || 'Failed to initialize payment');
        
        toast({
          title: 'Payment Initialization Error',
          description: err.message || 'Failed to initialize payment. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [amount, items, stripeLoaded, componentId, toast]);

  // Handle successful payment
  const handlePaymentSuccess = (paymentIntent: any) => {
    if (onSuccess) {
      onSuccess(paymentIntent);
    }
  };

  // User wants to cancel payment process
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preparing Your Payment</CardTitle>
          <CardDescription>
            Please wait while we set up your secure payment...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Connecting to payment service...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error || !stripeLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment System Unavailable</CardTitle>
          <CardDescription>
            We're having trouble connecting to our payment processor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Payment system is currently unavailable. Please try again later.'}
            </AlertDescription>
          </Alert>
          
          <Button variant="outline" onClick={handleCancel} className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No client secret yet
  if (!clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preparing Payment</CardTitle>
          <CardDescription>
            Initializing payment form...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Configuration for Stripe Elements
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#E34234', // VORO brand color
      },
    },
  };

  // Render Stripe Elements with client secret
  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeElementsForm 
        onSuccess={handlePaymentSuccess}
        onCancel={handleCancel}
        amount={amount}
      />
    </Elements>
  );
}