import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StripePaymentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  amount: number;
  isProcessing?: boolean;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  onSuccess,
  onCancel,
  amount,
  isProcessing = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/order-confirmation',
          payment_method_data: {
            billing_details: {
              // You can pre-fill these with customer information if available
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to your customer
        setErrorMessage(error.message || 'An unexpected error occurred.');
        setIsSubmitting(false);
      } else {
        // The payment has been processed!
        setIsSubmitting(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <PaymentElement
        options={{
          layout: {
            type: 'tabs',
            defaultCollapsed: false,
          },
        }}
      />

      <div className="pt-4">
        <p className="text-sm text-muted-foreground mb-2">
          You'll be charged ${amount.toFixed(2)}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={!stripe || isSubmitting || isProcessing}
            className="flex-1"
          >
            {isSubmitting || isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ? () => onCancel() : undefined}
            disabled={isSubmitting || isProcessing}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};