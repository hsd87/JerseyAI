import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Initialize Stripe outside the component to avoid re-initialization
let stripePromise: Promise<Stripe | null> | null = null;

export const initializeStripe = () => {
  if (!stripePromise && import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.log('Initializing Stripe with key prefix:', import.meta.env.VITE_STRIPE_PUBLIC_KEY.substring(0, 8));
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
    return true;
  } else if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.error('Missing VITE_STRIPE_PUBLIC_KEY environment variable');
    return false;
  }
  return !!stripePromise;
};

// Simple payment form component inside the Elements provider
const CheckoutForm: React.FC<{
  onSuccess?: () => void;
  onCancel?: () => void;
  amount: number;
}> = ({ onSuccess, onCancel, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe.js hasn\'t loaded yet');
      setError('Payment system not loaded. Please try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/order-confirmation',
        },
        redirect: 'if_required',
      });

      if (result.error) {
        console.error('Payment error:', result.error);
        setError(result.error.message || 'Payment failed');
      } else {
        console.log('Payment successful!');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PaymentElement />

      <div className="flex space-x-4 mt-4">
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={processing}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

// Main component that handles the client secret and Elements wrapper
interface SimplifiedStripeFormProps {
  clientSecret: string;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SimplifiedStripeForm: React.FC<SimplifiedStripeFormProps> = ({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}) => {
  const [initialized, setInitialized] = useState(false);

  // Ensure Stripe is initialized
  useEffect(() => {
    const init = initializeStripe();
    setInitialized(init);

    if (!init) {
      console.error('Failed to initialize Stripe');
    }
  }, []);

  if (!initialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment System Unavailable</CardTitle>
          <CardDescription>
            Unable to initialize the payment system. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Button variant="outline" onClick={onCancel}>Go Back</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preparing Payment</CardTitle>
          <CardDescription>
            Please wait while we set up your payment...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#E34234', // VORO brand color
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Order</CardTitle>
          <CardDescription>
            Enter your payment details to complete your purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutForm
            onSuccess={onSuccess}
            onCancel={onCancel}
            amount={amount}
          />
        </CardContent>
      </Card>
    </Elements>
  );
};