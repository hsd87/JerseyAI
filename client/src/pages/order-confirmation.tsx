import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOrderStore } from '@/hooks/use-order-store';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/lib/order-service';
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
import { Check, Package, ShoppingBag, ChevronRight, Loader2 } from 'lucide-react';

const OrderConfirmationPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [_, params] = useRoute('/order-confirmation');
  const { user } = useAuth();
  const { toast } = useToast();
  const { orderCompleted } = useOrderStore();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we navigated here without completing an order, show an error
    if (!orderCompleted) {
      setError('No completed order found');
      setLoading(false);
      return;
    }

    // Get the latest order from the API
    const fetchLatestOrder = async () => {
      try {
        const orders = await orderService.getOrders();
        if (orders && orders.length > 0) {
          // Use the most recent order
          setOrderDetails(orders[0]);
        } else {
          setError('No orders found');
        }
      } catch (err: any) {
        console.error('Error fetching order details', err);
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOrder();
  }, [orderCompleted]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Loading Order Details</h2>
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="container max-w-4xl mx-auto py-16">
        <Card>
          <CardHeader>
            <CardTitle>Order Error</CardTitle>
            <CardDescription>
              We couldn't find your order details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              {error || 'No order information is available'}
            </p>
            <p className="mt-4">
              If you believe this is an error, please contact customer support with
              any confirmation information you received.
            </p>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button onClick={() => setLocation('/designer')}>
              Return to Designer
            </Button>
            {user && (
              <Button variant="outline" onClick={() => setLocation('/dashboard')}>
                Go to Dashboard
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Extract details from the order
  const { id, createdAt, totalAmount, status, items = [] } = orderDetails;
  const orderId = id || `ORDER-${Date.now().toString().substring(5)}`;
  const orderDate = createdAt ? new Date(createdAt).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <div className="container max-w-4xl mx-auto py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-50 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your order has been received.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Order ID:</span>
              <span>{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Order Date:</span>
              <span>{orderDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Order Status:</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                {status || 'Confirmed'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold">${totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Order Summary</h3>
            <div className="space-y-4">
              {items.length > 0 ? (
                items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start border-b pb-3">
                    <div className="flex gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name || 'Product image'}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted flex items-center justify-center rounded border">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.name || `${item.sport} ${item.kitType}`}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground italic">No items in this order</p>
              )}
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">What's Next?</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-1 rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                  <span className="text-primary font-medium">1</span>
                </div>
                <p>
                  Your order is now being processed. You will receive a confirmation email with
                  the order details.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-1 rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                  <span className="text-primary font-medium">2</span>
                </div>
                <p>
                  Our team will review your design and contact you if we need any additional information.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-1 rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                  <span className="text-primary font-medium">3</span>
                </div>
                <p>
                  Your custom jerseys will be manufactured and shipped to the address you provided.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-4 justify-center">
          <Button onClick={() => setLocation('/dashboard')}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            View My Orders
          </Button>
          <Button variant="outline" onClick={() => setLocation('/designer')}>
            <ChevronRight className="mr-2 h-4 w-4" />
            Create Another Design
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderConfirmationPage;