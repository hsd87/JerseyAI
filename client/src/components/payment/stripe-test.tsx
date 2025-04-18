import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

export function StripeEnvironmentTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Testing Stripe configuration...');
  const [details, setDetails] = useState<string | null>(null);

  useEffect(() => {
    async function testStripeConfig() {
      try {
        // Get the key directly from env
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        
        if (!stripeKey) {
          setStatus('error');
          setMessage('No Stripe publishable key found in environment variables');
          setDetails('Make sure VITE_STRIPE_PUBLIC_KEY is set correctly');
          return;
        }
        
        // Log key information for debugging (without revealing the full key)
        const keyInfo = {
          prefix: stripeKey.substring(0, 7),
          length: stripeKey.length,
          isLiveKey: stripeKey.startsWith('pk_live_'),
          isTestKey: stripeKey.startsWith('pk_test_')
        };
        
        console.log('Attempting to initialize Stripe with key:', keyInfo);
        
        // Try to load Stripe
        const stripeInstance = await loadStripe(stripeKey);
        
        if (!stripeInstance) {
          setStatus('error');
          setMessage('Failed to initialize Stripe');
          setDetails('Stripe.js loaded but returned null instance');
          return;
        }
        
        // Successfully loaded Stripe
        setStatus('success');
        setMessage('Stripe initialized successfully');
        setDetails(`Using ${keyInfo.isLiveKey ? 'LIVE' : 'TEST'} mode`);
      } catch (error: any) {
        console.error('Stripe initialization error:', error);
        setStatus('error');
        setMessage('Error initializing Stripe');
        setDetails(error.message || 'Unknown error');
      }
    }
    
    testStripeConfig();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stripe Configuration</CardTitle>
        <CardDescription>
          Testing Stripe API connectivity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'loading' && (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Testing Stripe configuration...</span>
          </div>
        )}
        
        {status === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Stripe Connected</AlertTitle>
            <AlertDescription className="text-green-700">
              {message}
              {details && <div className="mt-2 text-sm">{details}</div>}
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertTitle>Stripe Configuration Error</AlertTitle>
            <AlertDescription>
              {message}
              {details && <div className="mt-2 text-sm">{details}</div>}
              <div className="mt-4 text-xs">
                Please check your environment variables and Stripe API keys.
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}