import React from 'react';
import { StripeEnvironmentTest } from '@/components/payment/stripe-test';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import Navbar from '@/components/layout/navbar';

export default function PaymentTestPage() {
  // Extract stripe key from environment for display
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'Not set';
  const maskedKey = stripeKey !== 'Not set' 
    ? `${stripeKey.substring(0, 7)}...${stripeKey.substring(stripeKey.length - 4)}`
    : 'Not set';
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Payment System Configuration</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <StripeEnvironmentTest />
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>
                  Current configuration for payment processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">VITE_STRIPE_PUBLIC_KEY</h3>
                    <p className="text-sm text-muted-foreground">{maskedKey}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      {stripeKey.startsWith('pk_live_') ? 'Live/Production' : 
                       stripeKey.startsWith('pk_test_') ? 'Test/Development' : 
                       'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  If you're seeing configuration errors, please contact the site administrator to update the payment integration settings.
                </p>
              </CardFooter>
            </Card>
          </div>
          
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Steps</CardTitle>
                <CardDescription>
                  If you're experiencing payment issues, try these steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-3">
                  <li>Refresh the page and try again</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Try using a different browser</li>
                  <li>Ensure you're using a supported payment method</li>
                  <li>Check that your card is not expired or blocked</li>
                  <li>Contact your bank to ensure they're not blocking the transaction</li>
                </ol>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button asChild variant="outline">
                  <Link href="/">Return to Home</Link>
                </Button>
                <Button asChild>
                  <Link href="/checkout">Try Checkout Again</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Support</CardTitle>
                <CardDescription>
                  Need help with your payment?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  If you're still experiencing issues with payments, please contact our support team at support@voro.ai with the following information:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>Your account email</li>
                  <li>Time and date of the failed payment attempt</li>
                  <li>Error message you received (if any)</li>
                  <li>Browser and device you're using</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}