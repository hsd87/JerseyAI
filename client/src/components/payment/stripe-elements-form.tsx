import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StripeElementsFormProps {
  onSuccess?: (paymentIntent: any) => void;
  onCancel?: () => void;
  amount: number;
}

export default function StripeElementsForm({ onSuccess, onCancel, amount }: StripeElementsFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  // Reset error when elements change
  useEffect(() => {
    if (elements) {
      setErrorMessage(undefined);
      console.log('Stripe Elements loaded successfully');
    } else {
      console.log('Waiting for Stripe Elements to load...');
    }
  }, [elements]);
  
  // Check Stripe initialization
  useEffect(() => {
    if (!stripe) {
      console.log('Waiting for Stripe.js to load...');
    } else {
      console.log('Stripe initialized successfully:', {
        stripeJs: 'loaded',
        elementsLoaded: !!elements,
        amount: amount
      });
    }
  }, [stripe, elements, amount]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      console.log('Confirming payment with amount:', amount);
      
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      console.log('Payment confirmation response:', {
        hasError: !!error,
        hasPaymentIntent: !!paymentIntent,
        paymentIntentStatus: paymentIntent?.status
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        // Show error to your customer
        setErrorMessage(error.message);
        toast({
          title: 'Payment failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (paymentIntent) {
        console.log('Payment successful:', paymentIntent.id);
        // Payment succeeded
        toast({
          title: 'Payment successful',
          description: `Your payment for $${(amount || 0).toFixed(2)} was successful.`,
        });
        
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
      } else {
        console.warn('No payment intent or error returned - this is unusual');
        // This is an edge case but we should handle it
        toast({
          title: 'Payment status unclear',
          description: 'We couldn\'t confirm if your payment was processed. Please check your email for payment confirmation.',
          variant: 'default',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
      toast({
        title: 'Payment error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md border border-border p-4 bg-card">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <div className="flex justify-between">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={!stripe || !elements || isLoading}
          className="ml-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${(amount || 0).toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}