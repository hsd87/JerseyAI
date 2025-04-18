import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StripeElementsFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripeElementsForm({ amount, onSuccess, onCancel }: StripeElementsFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }
    
    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card element not found');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Get the clientSecret from the Stripe Elements wrapper
      const clientSecret = (window as any).stripeClientSecret;
      
      if (!clientSecret) {
        setError('Payment setup error: Missing client secret');
        setIsProcessing(false);
        return;
      }

      const { error: submitError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // These would typically come from form values
            name: 'Customer Name',
          },
        },
      });
      
      if (submitError) {
        setError(submitError.message || 'An error occurred with your payment');
        setIsProcessing(false);
        return;
      }
      
      // Payment success
      setIsComplete(true);
      setIsProcessing(false);
      
      // Notify parent of success
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };
  
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };
  
  // Success view
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="bg-green-100 p-3 rounded-full mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
        <p className="text-center text-muted-foreground mb-8">
          Your payment has been processed successfully. We're creating your order now.
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="card-element">Card Details</Label>
        <div className="p-3 border rounded-md">
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
        <p className="text-sm text-muted-foreground">
          We use Stripe to process payments securely. Your card information is never stored on our servers.
        </p>
      </div>
      
      <div className="pt-4 flex justify-between">
        <Button 
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}