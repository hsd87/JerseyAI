import React, { useEffect, useState } from 'react';
import { 
  PaymentElement, 
  useStripe, 
  useElements,
  AddressElement,
} from '@stripe/react-stripe-js';
import { PaymentIntent } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  amount: number;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ 
  onSuccess,
  onCancel,
  amount,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Get payment information from the form
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: "if_required",
      });

      // This point will only be reached if there is an immediate error when
      // confirming the payment. Otherwise, your customer will be redirected to
      // your `return_url`. For some payment methods like iDEAL, your customer will
      // be redirected to an intermediate site first to authorize the payment, then
      // redirected to the `return_url`.
      if (error) {
        setMessage(error.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Payment was successful
        setMessage('Payment successful!');
        toast({
          title: 'Payment Successful!',
          description: 'Your order has been placed',
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setMessage(`Payment error: ${err.message}`);
      toast({
        title: 'Payment Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="pt-2">
        <AddressElement options={{
          mode: 'shipping',
          allowedCountries: ['US', 'CA', 'GB', 'AU'],
          fields: {
            phone: 'always',
          },
          validation: {
            phone: {
              required: 'always',
            },
          },
        }} />
      </div>
      
      <div className="flex flex-col gap-4">
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay ${(amount / 100).toFixed(2)}</>
          )}
        </Button>
        
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        )}
        
        {message && (
          <div className="text-sm text-center mt-4 p-2 bg-muted rounded">
            {message}
          </div>
        )}
      </div>
    </form>
  );
};