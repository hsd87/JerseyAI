import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [succeeded, setSucceeded] = useState(false);
  const [elementsReady, setElementsReady] = useState(false);
  const { toast } = useToast();

  // Track component instance for debugging
  const componentId = React.useMemo(() => 
    `stripe-form-${Math.random().toString(36).substring(2, 10)}`, 
    []
  );

  // Reset error when elements change
  useEffect(() => {
    if (elements) {
      setErrorMessage(undefined);
      setElementsReady(true);
      console.log(`[${componentId}] Stripe Elements loaded successfully`);
    } else {
      setElementsReady(false);
      console.log(`[${componentId}] Waiting for Stripe Elements to load...`);
    }
  }, [elements, componentId]);
  
  // Check Stripe initialization
  useEffect(() => {
    if (!stripe) {
      console.log(`[${componentId}] Waiting for Stripe.js to load...`);
    } else {
      console.log(`[${componentId}] Stripe initialized successfully:`, {
        stripeJs: 'loaded',
        elementsLoaded: !!elements,
        amount
      });
    }
  }, [stripe, elements, amount, componentId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error(`[${componentId}] Stripe or Elements not loaded`);
      setErrorMessage('Payment system not fully loaded. Please try again.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      console.log(`[${componentId}] Processing payment for amount:`, amount);
      
      // Validate payment element data first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error(`[${componentId}] Payment element validation error:`, submitError);
        throw new Error(submitError.message || 'Please check your payment details');
      }
      
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: 'if_required',
      });

      console.log(`[${componentId}] Payment confirmation response:`, {
        hasError: !!error,
        hasPaymentIntent: !!paymentIntent,
        paymentIntentStatus: paymentIntent?.status
      });

      if (error) {
        console.error(`[${componentId}] Payment confirmation error:`, error);
        
        // Format error message based on type
        let errorMsg = error.message;
        if (error.type === 'card_error') {
          if (error.code === 'card_declined') {
            errorMsg = 'Your card was declined. Please try a different payment method.';
          } else if (error.code === 'expired_card') {
            errorMsg = 'Your card has expired. Please try a different card.';
          }
        }
        
        setErrorMessage(errorMsg);
        toast({
          title: 'Payment failed',
          description: errorMsg,
          variant: 'destructive',
        });
      } else if (paymentIntent) {
        console.log(`[${componentId}] Payment successful:`, paymentIntent.id);
        // Payment succeeded
        setSucceeded(true);
        
        toast({
          title: 'Payment successful',
          description: `Your payment for $${(amount || 0).toFixed(2)} was successful.`,
        });
        
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
      } else {
        console.warn(`[${componentId}] No payment intent or error returned - this is unusual`);
        // This is an edge case but we should handle it
        setErrorMessage('Payment status unclear. Please contact support if your card was charged.');
        
        toast({
          title: 'Payment status unclear',
          description: 'We couldn\'t confirm if your payment was processed. Please check your email for payment confirmation.',
          variant: 'default',
        });
      }
    } catch (err: any) {
      console.error(`[${componentId}] Payment processing error:`, err);
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
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Order</CardTitle>
        <CardDescription>
          Enter your payment details to finalize your purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {succeeded && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-300">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              <AlertDescription>Payment processed successfully!</AlertDescription>
            </Alert>
          )}
          
          <div className="rounded-md p-4 bg-card">
            <PaymentElement />
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            <p className="flex items-center">
              <ShieldCheck className="h-4 w-4 mr-1 text-primary" />
              Your payment information is encrypted and secure
            </p>
          </div>
          
          <div className="flex justify-between mt-6">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || succeeded}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={!stripe || !elementsReady || isLoading || succeeded}
              className={onCancel ? "ml-4" : "w-full"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : succeeded ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Payment Complete
                </>
              ) : (
                `Pay $${(amount || 0).toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}