import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Loader2, Check, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { validateStripeKey, logStripeKeyInfo } from "@/lib/stripe-key-validator";
import { getStripeKey } from "@/lib/stripe-client";
import StripeElementsWrapper from "@/components/payment/stripe-elements-wrapper-fixed";

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

export default function StripeDiagnostic() {
  const [amount, setAmount] = useState<string>("19.99");
  const [results, setResults] = useState<TestResult[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  // Check for Stripe key on mount
  useEffect(() => {
    if (results.length === 0) {
      checkStripeConfig();
    }
  }, [results]);
  
  const resetTests = () => {
    setResults([]);
    setShowPaymentForm(false);
  };
  
  const checkStripeConfig = async () => {
    setIsRunning(true);
    setResults([
      {
        test: 'Environment Check',
        status: 'pending',
        message: 'Checking environment configuration...'
      }
    ]);
    
    try {
      // First check if we have the required environment variables
      const stripeKey = getStripeKey();
      const keyValidation = validateStripeKey(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      
      if (keyValidation.isEmpty) {
        setResults([
          {
            test: 'Environment Check',
            status: 'error',
            message: 'Stripe public key is missing',
            details: 'The VITE_STRIPE_PUBLIC_KEY environment variable is not set'
          }
        ]);
        setIsRunning(false);
        return;
      }
      
      if (!keyValidation.valid) {
        setResults([
          {
            test: 'Environment Check',
            status: 'error',
            message: 'Invalid Stripe public key format',
            details: keyValidation.info
          }
        ]);
        setIsRunning(false);
        return;
      }
      
      // Log additional info for debugging
      logStripeKeyInfo();
      
      // Update the result
      setResults([
        {
          test: 'Environment Check',
          status: 'success',
          message: 'Stripe public key is properly configured',
          details: {
            keyType: keyValidation.type,
            mode: keyValidation.mode,
            prefix: keyValidation.prefix
          }
        }
      ]);
      
      // Next, try to initialize Stripe
      setResults(prev => [...prev, {
        test: 'Stripe Initialization',
        status: 'pending',
        message: 'Attempting to initialize Stripe...'
      }]);
      
      try {
        const stripe = await loadStripe(stripeKey || '');
        
        if (!stripe) {
          setResults(prev => [
            ...prev.slice(0, -1),
            {
              test: 'Stripe Initialization',
              status: 'error',
              message: 'Failed to initialize Stripe',
              details: 'The loadStripe() function returned null'
            }
          ]);
          setIsRunning(false);
          return;
        }
        
        setResults(prev => [
          ...prev.slice(0, -1),
          {
            test: 'Stripe Initialization',
            status: 'success',
            message: 'Stripe initialized successfully'
          }
        ]);
        
        // Finally, check API connectivity by creating a simple PaymentIntent
        setResults(prev => [...prev, {
          test: 'API Connectivity',
          status: 'pending',
          message: 'Testing API connectivity...'
        }]);
        
        const response = await fetch('/api/payment/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          setResults(prev => [
            ...prev.slice(0, -1),
            {
              test: 'API Connectivity',
              status: 'error',
              message: data.error || 'Failed to connect to the payment API',
              details: data
            }
          ]);
          setIsRunning(false);
          return;
        }
        
        setResults(prev => [
          ...prev.slice(0, -1),
          {
            test: 'API Connectivity',
            status: 'success',
            message: 'Successfully connected to the payment API',
            details: data
          }
        ]);
        
        // All tests passed, show the payment form
        setShowPaymentForm(true);
      } catch (error: any) {
        // Handle Stripe initialization error
        setResults(prev => [
          ...prev.slice(0, -1),
          {
            test: 'Stripe Initialization',
            status: 'error',
            message: error.message || 'Failed to initialize Stripe',
            details: error
          }
        ]);
      }
    } catch (error: any) {
      // Handle any unexpected errors
      setResults(prev => [
        ...prev,
        {
          test: 'Unexpected Error',
          status: 'error',
          message: error.message || 'An unexpected error occurred',
          details: error
        }
      ]);
    } finally {
      setIsRunning(false);
    }
  };
  
  const handlePaymentSuccess = (result: any) => {
    setResults(prev => [
      ...prev,
      {
        test: 'Payment Intent Test',
        status: 'success',
        message: 'Payment intent confirmed successfully',
        details: result
      }
    ]);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow valid decimal numbers
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setAmount(value);
    }
  };
  
  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration Diagnostic</CardTitle>
          <CardDescription>
            Test your Stripe integration and diagnose any issues with the payment flow
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Test Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Test Results</h3>
              
              {results.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No tests have been run yet
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <Alert key={index} variant={result.status === 'error' ? 'destructive' : 'default'}>
                      <div className="flex items-center gap-2">
                        {result.status === 'pending' && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {result.status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {result.status === 'error' && (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>{result.test}</AlertTitle>
                      </div>
                      <AlertDescription className="mt-2">
                        {result.message}
                        
                        {result.details && typeof result.details === 'object' && (
                          <pre className="mt-2 rounded bg-secondary p-2 overflow-auto text-xs">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Payment Test */}
            {showPaymentForm && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Test</h3>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="amount"
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="19.99"
                        className="max-w-[150px]"
                      />
                      <span className="text-sm text-muted-foreground">
                        Test with different amounts (minimum $0.50)
                      </span>
                    </div>
                  </div>
                  
                  <StripeElementsWrapper
                    amount={parseFloat(amount) || 0.5}
                    items={[{ id: 'test-item', name: 'Test Item', price: parseFloat(amount) || 0.5 }]}
                    onSuccess={handlePaymentSuccess}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetTests} disabled={isRunning}>
            Reset Tests
          </Button>
          <Button onClick={checkStripeConfig} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Diagnostic'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}