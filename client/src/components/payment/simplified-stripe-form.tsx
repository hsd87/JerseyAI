import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Initialize Stripe outside the component to avoid re-initialization
let stripePromise: Promise<Stripe | null> | null = null;

export const initializeStripe = () => {
  // Using the provided live key directly
  const stripeKey = 'pk_live_51QAbrIHFoCUNb2Ppc7kzDStznKQGD4waxbo6mncC4KLmCUMV71jk1JJGahmEuRqD6RdLHshi5NCOcP9mUmJktMM600pWPqXPDF';
  
  if (!stripePromise && stripeKey) {
    try {
      // Log information about the key for debugging (securely)
      console.log('Initializing Stripe with live key:', stripeKey.substring(0, 7) + '...' + stripeKey.substring(stripeKey.length - 4));
      console.log('Key properties:', {
        keyLength: stripeKey.length,
        isLiveKey: stripeKey.startsWith('pk_live_')
      });
      
      // Using live key as provided in all environments
      console.log('Using live Stripe key in current environment');

      // Initialize Stripe with the public key
      stripePromise = loadStripe(stripeKey);
      
      return true;
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      return false;
    }
  } else if (!stripeKey) {
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
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  // Clear error when Stripe or Elements changes
  useEffect(() => {
    if (stripe && elements) {
      setError(null);
    }
  }, [stripe, elements]);

  // Process payment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Safety check for Stripe initialization
    if (!stripe || !elements) {
      console.error('Stripe.js hasn\'t loaded yet');
      setError('Payment system not loaded. Please refresh the page and try again.');
      return;
    }
    
    // Validate cardholder name
    if (!cardholderName.trim()) {
      setError('Please enter the cardholder name');
      return;
    }

    setProcessing(true);
    setError(null);

    // Add a safety timeout to prevent UI hanging if Stripe is slow
    const timeoutId = setTimeout(() => {
      setProcessing(false);
      setError('Payment processing took too long. Please try again.');
    }, 30000); // 30 second timeout
    
    try {
      console.log('Confirming payment with Stripe...');
      
      // Ensure the PaymentElement is complete before submitting
      const { error: elementsError } = await elements.submit();
      if (elementsError) {
        console.error('Elements validation error:', elementsError);
        setError(elementsError.message || 'Please check your payment details and try again.');
        clearTimeout(timeoutId);
        setProcessing(false);
        return;
      }
      
      // Confirm payment with Stripe
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: cardholderName
            }
          },
          return_url: window.location.origin + '/order-confirmation',
        },
        redirect: 'if_required',
      });

      clearTimeout(timeoutId); // Clear timeout since request completed

      if (result.error) {
        console.error('Payment error:', {
          type: result.error.type,
          code: result.error.code,
          message: result.error.message
        });
        
        // Handle common error types with user-friendly messages
        if (result.error.type === 'card_error') {
          if (result.error.code === 'card_declined') {
            setError('Your card was declined. Please try a different payment method.');
          } else if (result.error.code === 'expired_card') {
            setError('Your card has expired. Please try a different card.');
          } else if (result.error.code === 'incorrect_cvc') {
            setError('The security code (CVC) is incorrect. Please check and try again.');
          } else {
            setError(result.error.message || 'There was an issue with your card. Please try again.');
          }
        } else if (result.error.type === 'validation_error') {
          setError('Please check your payment details and try again.');
        } else {
          setError(result.error.message || 'Payment failed. Please try again.');
        }
      } else {
        console.log('Payment successful!');
        setPaymentSuccess(true);
        
        // Call success callback
        if (onSuccess) {
          try {
            onSuccess();
          } catch (callbackError) {
            console.error('Error in success callback:', callbackError);
            // Continue even if callback fails, payment was successful
          }
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('Payment error:', err);
      
      // Provide more specific error messages based on error type
      if (err.message?.includes('network')) {
        setError('Network connection issue. Please check your internet and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {paymentSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md flex items-start">
          <ShieldCheck className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
          <span>Payment successful! Processing your order...</span>
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="cardholderName" className="block text-sm font-medium mb-1">
          Cardholder Name
        </label>
        <input
          id="cardholderName"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Name on card"
          required
        />
      </div>

      <PaymentElement />
      
      <div className="mt-2 text-sm text-muted-foreground">
        <p className="flex items-center">
          <ShieldCheck className="h-4 w-4 mr-1 text-primary" />
          Your payment information is encrypted and secure
        </p>
      </div>

      <div className="flex space-x-4 mt-4">
        <Button
          type="submit"
          disabled={!stripe || processing || paymentSuccess}
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : paymentSuccess ? (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Payment Complete
            </>
          ) : (
            // Convert cents to dollars for display
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </Button>

        {onCancel && !paymentSuccess && (
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
  amount = 0, // Provide default value of 0
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