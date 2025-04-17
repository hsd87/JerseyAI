import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription-store';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/lib/order-service';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '@/components/payment/stripe-payment-form';
import Navbar from '@/components/layout/navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ChevronRight,
  Star,
  Zap,
  Calendar,
  Award,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Make sure to call loadStripe outside of a component's render to avoid recreation on each render
let stripePromise: Promise<Stripe | null> | null = null;
const getStripePromise = () => {
  if (!stripePromise && import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

const SubscribePage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const subscription = useSubscription();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'plans' | 'payment' | 'success'>('plans');

  useEffect(() => {
    // Fetch subscription status
    if (user) {
      subscription.fetchSubscription();
    }
  }, [user]);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Login Required</CardTitle>
              <CardDescription>Please log in to manage your subscription</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => setLocation('/auth')}>
                Login or Register
              </Button>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  const startSubscription = async () => {
    setLoading(true);
    
    try {
      const { clientSecret, subscriptionId } = await orderService.createSubscription();
      setClientSecret(clientSecret);
      setPaymentStep('payment');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start subscription process',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setLoading(true);
    
    try {
      await orderService.cancelSubscription();
      await subscription.fetchSubscription();
      
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentStep('success');
    await subscription.fetchSubscription();
    
    toast({
      title: 'Subscription Activated!',
      description: 'You now have access to Pro features',
    });
  };

  const handlePaymentCancel = () => {
    setPaymentStep('plans');
    setClientSecret(null);
  };

  const renderCurrentSubscription = () => {
    const { isSubscribed, subscriptionStatus, subscriptionExpiry, remainingDesigns } = subscription;
    
    if (!isSubscribed) {
      return (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Current Plan: Free</CardTitle>
            <CardDescription>
              Limited features with {remainingDesigns === -1 ? 'unlimited' : remainingDesigns} designs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upgrade to Pro to unlock all features and unlimited designs
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={startSubscription}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Upgrade to Pro
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return (
      <Card className="bg-primary/5 border-primary/30">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">
                Current Plan: Pro
                <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                  Active
                </Badge>
              </CardTitle>
              <CardDescription>
                Full access to all premium features
              </CardDescription>
            </div>
            <Star className="h-8 w-8 text-primary/70" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionExpiry && (
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <p className="text-sm">
                Renews on: {new Date(subscriptionExpiry).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <div className="space-y-1">
            <p className="font-medium">Included Benefits:</p>
            <ul className="space-y-1">
              <li className="flex items-center text-sm">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Unlimited jersey design generations
              </li>
              <li className="flex items-center text-sm">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                10% discount on all orders
              </li>
              <li className="flex items-center text-sm">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Priority customer support
              </li>
              <li className="flex items-center text-sm">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Access to premium design templates
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={cancelSubscription}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Cancel Subscription
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderPlansComparison = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>For casual users</CardDescription>
            <div className="mt-2">
              <p className="text-3xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground">Free forever</p>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>6 jersey designs per month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Basic design options</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Standard support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="border-primary shadow-md relative">
          <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
            RECOMMENDED
          </div>
          <CardHeader>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>For serious teams & designers</CardDescription>
            <div className="mt-2">
              <p className="text-3xl font-bold">$9.99</p>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Unlimited jersey designs</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>All advanced design options</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>10% discount on all orders</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Premium design templates</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={startSubscription}
              disabled={loading || subscription.isSubscribed}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : subscription.isSubscribed ? (
                "Current Plan"
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Now
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  // Success page after subscription is activated
  if (paymentStep === 'success') {
    return (
      <>
        <Navbar />
        <div className="container max-w-2xl mx-auto py-16 px-4">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to VORO Pro!</CardTitle>
              <CardDescription>Your subscription has been activated</CardDescription>
            </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-6">You now have access to unlimited designs and all premium features.</p>
            <div className="bg-muted p-4 rounded-lg max-w-md mx-auto">
              <h3 className="font-medium text-lg mb-2">Pro Benefits Include:</h3>
              <ul className="space-y-2 text-left">
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-2 text-green-500" />
                  Unlimited jersey designs
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-2 text-green-500" />
                  10% discount on all orders
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-2 text-green-500" />
                  Priority customer support
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-2 text-green-500" />
                  Access to premium design templates
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button onClick={() => setLocation('/designer')}>
              Start Designing
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Payment form
  if (paymentStep === 'payment' && clientSecret) {
    const options: StripeElementsOptions = {
      clientSecret,
      appearance: {
        theme: 'stripe',
        labels: 'floating',
      },
    };

    return (
      <>
        <Navbar />
        <div className="container max-w-2xl mx-auto py-12 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
              <CardDescription>Enter your payment details to activate Pro features</CardDescription>
            </CardHeader>
            <CardContent>
              <Elements options={options} stripe={getStripePromise()}>
                <StripePaymentForm 
                  onSuccess={handlePaymentSuccess} 
                  onCancel={handlePaymentCancel} 
                  amount={999} // $9.99
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Default view - subscription plans
  return (
    <>
      <Navbar />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground mt-2">
            Choose the right plan for your jersey design needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            {renderPlansComparison()}
          </div>
          <div className="md:col-span-1">
            {renderCurrentSubscription()}
          </div>
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">What's included in the Pro plan?</h3>
              <p className="mt-2 text-muted-foreground">
                Pro plan includes unlimited jersey designs, 10% discount on all orders, priority customer support, 
                and access to premium design templates.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">Can I cancel my subscription anytime?</h3>
              <p className="mt-2 text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue to have access to Pro features 
                until the end of your current billing period.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">How does the design limit work on the free plan?</h3>
              <p className="mt-2 text-muted-foreground">
                Free users can create up to 6 jersey designs per month. Once you reach this limit, you'll need to 
                wait until the next month or upgrade to Pro for unlimited designs.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">Is my payment information secure?</h3>
              <p className="mt-2 text-muted-foreground">
                Yes, all payments are processed securely through Stripe. We never store your payment information 
                on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscribePage;