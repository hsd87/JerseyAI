import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Calculator, ShoppingBag, TrendingUp, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Define types for the pricing calculation response
interface PriceBreakdown {
  baseTotal: number;
  tierDiscountApplied: string;
  tierDiscountAmount: number;
  subscriptionDiscountApplied: string;
  subscriptionDiscountAmount: number;
  subtotalAfterDiscounts: number;
  shippingCost: number;
  grandTotal: number;
}

interface PricingResult {
  success: boolean;
  breakdown: PriceBreakdown;
  formatted: {
    baseTotal: string;
    tierDiscount: string;
    subscriptionDiscount: string;
    subtotal: string;
    shipping: string;
    grandTotal: string;
  };
}

interface CartItem {
  productId: string;
  productType: string;
  basePrice: number;
  quantity: number;
}

interface PricingRule {
  tierDiscounts: { threshold: number; discount: string }[];
  subscriptionDiscount: string;
  shipping: { threshold: number; cost: number }[];
}

export default function PricingCalculatorPage() {
  const { user } = useAuth();
  const isSubscriber = user?.subscriptionTier === 'pro' || false;
  
  const [productType, setProductType] = useState<string>('jersey');
  const [quantity, setQuantity] = useState<number>(1);
  const [basePrice, setBasePrice] = useState<number>(8999); // $89.99
  const [useSubscription, setUseSubscription] = useState<boolean>(isSubscriber);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  
  // Fetch pricing rules for informational display
  const { data: pricingRules } = useQuery<PricingRule>({
    queryKey: ['/api/price/rules'],
    enabled: true,
  });
  
  // Calculate price based on inputs
  const [priceResult, setPriceResult] = useState<PricingResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  // Reset subscription toggle when user auth changes
  useEffect(() => {
    setUseSubscription(isSubscriber);
  }, [isSubscriber]);
  
  const calculatePrice = async () => {
    setIsCalculating(true);
    
    try {
      // Create cart item from inputs
      const cartItem: CartItem = {
        productId: '1',
        productType,
        basePrice,
        quantity,
      };
      
      // Make API request for calculation
      const response = await apiRequest('POST', '/api/price/estimate', {
        cart: [cartItem],
        isSubscriber: useSubscription,
      });
      
      const result = await response.json();
      setPriceResult(result);
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Calculate price on initial render
  useEffect(() => {
    calculatePrice();
  }, []);
  
  // Format price labels
  const formatPriceLabel = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(priceInCents / 100);
  };
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Pricing Calculator</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Calculate the cost of your custom jerseys with our dynamic pricing system. Save more when you order in bulk!
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Calculator Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Jersey Price Calculator
              </CardTitle>
              <CardDescription>
                Adjust the options below to calculate your price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Product Type Selector */}
                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <Tabs defaultValue="jersey" value={productType} onValueChange={setProductType}>
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="jersey">Jersey Only</TabsTrigger>
                      <TabsTrigger value="jersey_shorts">Jersey + Shorts</TabsTrigger>
                      <TabsTrigger value="kit">Full Kit</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {/* Quantity Selector */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-32"
                    />
                    <div className="text-sm text-muted-foreground">
                      {quantity >= 50 ? (
                        <span className="text-green-600 font-medium">15% Bulk Discount Applied!</span>
                      ) : quantity >= 20 ? (
                        <span className="text-green-600 font-medium">10% Bulk Discount Applied!</span>
                      ) : quantity >= 10 ? (
                        <span className="text-green-600 font-medium">5% Bulk Discount Applied!</span>
                      ) : (
                        <span>No bulk discount</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Base Price (Advanced) */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center">
                    Base Price (Per Item) 
                    <span className="ml-2 text-xs text-muted-foreground">
                      Advanced
                    </span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="price"
                      type="number"
                      min="1000"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseInt(e.target.value) || 8999)}
                      className="w-32"
                    />
                    <div className="text-sm text-muted-foreground">
                      {formatPriceLabel(basePrice)}
                    </div>
                  </div>
                </div>
                
                {/* Subscription Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="subscription" className="text-base">
                      Apply Pro Subscription Discount
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Save 10% with a Pro subscription
                    </p>
                  </div>
                  <Switch
                    id="subscription"
                    checked={useSubscription}
                    onCheckedChange={setUseSubscription}
                    disabled={!isSubscriber}
                  />
                </div>
                
                {!isSubscriber && (
                  <div className="text-sm p-3 rounded bg-opacity-10 bg-gradient text-gradient">
                    <p className="font-medium">Pro Tip:</p>
                    <p>Subscribe to Pro for just $9/month to unlock a 10% discount on all orders!</p>
                  </div>
                )}
                
                {/* Calculate Button */}
                <Button 
                  onClick={calculatePrice} 
                  className="w-full bg-gradient hover:opacity-90 text-white" 
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <>Calculating <RefreshCw className="ml-2 h-4 w-4 animate-spin" /></>
                  ) : (
                    <>Calculate Price</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Results Card */}
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Price Estimate
              </CardTitle>
              <CardDescription>
                Your personalized price breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceResult ? (
                <div className="space-y-6">
                  {/* Grand Total */}
                  <div className="text-center p-6 bg-background rounded-lg shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Price</div>
                    <div className="text-4xl font-bold mt-1 text-gradient">{priceResult.formatted.grandTotal}</div>
                    <div className="text-sm mt-2">
                      for {quantity} {quantity === 1 ? 'item' : 'items'}
                      {useSubscription && ' with Pro discount'}
                    </div>
                  </div>
                  
                  {/* Summary and Detail Toggle */}
                  <div>
                    <button
                      onClick={() => setDetailsOpen(!detailsOpen)}
                      className="flex items-center justify-between w-full text-sm font-medium py-2"
                    >
                      <span>Price Breakdown</span>
                      {detailsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    
                    {detailsOpen && (
                      <div className="space-y-3 mt-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Price:</span>
                          <span>{priceResult.formatted.baseTotal}</span>
                        </div>
                        
                        {priceResult.breakdown.tierDiscountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Quantity Discount ({priceResult.breakdown.tierDiscountApplied}):</span>
                            <span>-{priceResult.formatted.tierDiscount}</span>
                          </div>
                        )}
                        
                        {priceResult.breakdown.subscriptionDiscountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Pro Subscription (10% off):</span>
                            <span>-{priceResult.formatted.subscriptionDiscount}</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between font-medium">
                          <span>Subtotal:</span>
                          <span>{priceResult.formatted.subtotal}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>{priceResult.formatted.shipping}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>{priceResult.formatted.grandTotal}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Savings Callout */}
                  {(priceResult.breakdown.tierDiscountAmount > 0 || priceResult.breakdown.subscriptionDiscountAmount > 0) && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center text-green-800 font-medium mb-1">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Your Savings
                      </div>
                      <p className="text-green-700 text-sm">
                        You're saving{' '}
                        <strong>
                          {formatPriceLabel(
                            priceResult.breakdown.tierDiscountAmount +
                            priceResult.breakdown.subscriptionDiscountAmount
                          )}
                        </strong>{' '}
                        on this order!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Calculating...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Pricing Explanation Card */}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Our Transparent Pricing System</CardTitle>
            <CardDescription>
              We believe in honest and straightforward pricing for your custom sports jerseys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-6">
              {/* Quantity Discounts */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-2 text-gradient">Quantity Discounts</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span>1-9 items:</span>
                    <span className="font-medium">No discount</span>
                  </li>
                  <li className="flex justify-between">
                    <span>10-19 items:</span>
                    <span className="font-medium text-green-600">5% off</span>
                  </li>
                  <li className="flex justify-between">
                    <span>20-49 items:</span>
                    <span className="font-medium text-green-600">10% off</span>
                  </li>
                  <li className="flex justify-between">
                    <span>50+ items:</span>
                    <span className="font-medium text-green-600">15% off</span>
                  </li>
                </ul>
                <p className="text-xs mt-3 text-gradient">
                  The more jerseys you order, the more you save per jersey.
                </p>
              </div>
              
              {/* Subscription Benefits */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-2 text-gradient">Pro Subscription</h3>
                <div className="mb-4 text-sm">
                  <p className="font-medium">For just $9/month, you get:</p>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-start">
                      <span className="mr-1">•</span> 
                      <span>10% discount on all orders</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>Unlimited design generations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>Priority customer support</span>
                    </li>
                  </ul>
                </div>
                {!isSubscriber && (
                  <Button size="sm" className="w-full bg-gradient text-white hover:opacity-90">
                    Subscribe Now
                  </Button>
                )}
              </div>
              
              {/* Shipping Costs */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-2 text-gradient">Shipping Costs</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span>Orders under $200:</span>
                    <span className="font-medium">$30 shipping</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Orders $200-$499:</span>
                    <span className="font-medium">$20 shipping</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Orders $500+:</span>
                    <span className="font-medium text-green-600">FREE shipping</span>
                  </li>
                </ul>
                <p className="text-xs mt-3 text-gradient">
                  Larger orders qualify for reduced or free shipping!
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mt-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2 text-gradient">How We Calculate Your Final Price</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex">
                  <span className="font-semibold text-slate-700 mr-2">1.</span>
                  <span>We start with your <strong>base price</strong> (product price × quantity)</span>
                </li>
                <li className="flex">
                  <span className="font-semibold text-slate-700 mr-2">2.</span>
                  <span>We apply any <strong>quantity discounts</strong> based on the number of items</span>
                </li>
                <li className="flex">
                  <span className="font-semibold text-slate-700 mr-2">3.</span>
                  <span>For Pro subscribers, we apply your <strong>10% subscription discount</strong> on the subtotal</span>
                </li>
                <li className="flex">
                  <span className="font-semibold text-slate-700 mr-2">4.</span>
                  <span>We calculate <strong>shipping costs</strong> based on your subtotal</span>
                </li>
                <li className="flex">
                  <span className="font-semibold text-slate-700 mr-2">5.</span>
                  <span>We add everything together for your final, transparent price!</span>
                </li>
              </ol>
              <p className="text-sm mt-4">
                No hidden fees. No surprises. Just clear and fair pricing that rewards higher quantities and loyal customers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}