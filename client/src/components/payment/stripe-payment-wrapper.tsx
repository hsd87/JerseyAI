import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './stripe-payment-form';
import { Loader2 } from 'lucide-react';
import { orderService } from '@/lib/order-service';

// Make sure to call loadStripe outside of a component's render to avoid recreation on each render
let stripePromise: Promise<Stripe | null> | null = null;

const getStripePromise = () => {
  if (!stripePromise && import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.log('Initializing Stripe with key prefix:', import.meta.env.VITE_STRIPE_PUBLIC_KEY.substring(0, 8));
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  } else if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.error('Missing Stripe public key (VITE_STRIPE_PUBLIC_KEY)');
  }
  return stripePromise;
};

interface StripePaymentWrapperProps {
  items: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
  amount: number;
}

export const StripePaymentWrapper: React.FC<StripePaymentWrapperProps> = ({
  items,
  onSuccess,
  onCancel,
  amount,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        setLoading(true);
        console.log('Creating payment intent with:', {
          amount,
          itemsCount: items?.length,
          hasItems: items?.length > 0
        });
        
        // This will call the /api/create-payment-intent endpoint
        const response = await orderService.createPaymentIntent({
          amount: amount, // Use the amount prop
          orderItems: items // Use the items prop
        });
        
        console.log('Payment intent created successfully:', {
          hasClientSecret: !!response.clientSecret,
          secretLength: response.clientSecret?.length
        });
        
        setClientSecret(response.clientSecret);
      } catch (err: any) {
        console.error('Error fetching payment intent:', err);
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    if (amount > 0 && items) {
      fetchPaymentIntent();
    } else {
      console.error('Invalid amount or items:', { amount, items });
      setError('Missing payment amount or order items');
      setLoading(false);
    }
  }, [items, amount]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Initializing payment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <p className="font-semibold">Payment Error</p>
        <p>{error}</p>
        <button 
          onClick={onCancel} 
          className="mt-4 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="bg-amber-50 p-4 rounded-md text-amber-700">
        <p>Unable to initialize payment. Please try again.</p>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      labels: 'floating',
    },
  };

  return (
    <Elements options={options} stripe={getStripePromise()}>
      <StripePaymentForm 
        onSuccess={onSuccess} 
        onCancel={onCancel} 
        amount={amount}
      />
    </Elements>
  );
};