import { useState, useEffect } from "react";
import { useLocation, useRoute, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { orderService } from "@/lib/order-service";
import { Helmet } from "react-helmet";
import { FileText, Truck, ShoppingBag, ArrowRight, CheckCircle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        toast({
          title: "Order Not Found",
          description: "No order ID was provided. Please return to the orders page.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      try {
        const orderData = await orderService.getOrderById(Number(orderId));
        setOrder(orderData);
      } catch (error: any) {
        console.error("Error fetching order:", error);
        toast({
          title: "Error Fetching Order",
          description: error.message || "There was an error retrieving your order.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, toast]);

  const handleViewInvoice = () => {
    if (order?.pdfUrl) {
      window.open(order.pdfUrl, '_blank');
    } else {
      toast({
        title: "Invoice Not Available",
        description: "The invoice is still being processed. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-12">
        <Helmet>
          <title>Order Confirmation - ProJersey</title>
        </Helmet>
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-4xl py-12">
        <Helmet>
          <title>Order Not Found - ProJersey</title>
        </Helmet>
        <Alert variant="destructive">
          <AlertTitle>Order Not Found</AlertTitle>
          <AlertDescription>
            We couldn't find the order you're looking for. Please check the order ID and try again.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/account/orders")}>
            View My Orders
          </Button>
        </div>
      </div>
    );
  }

  // Parse metadata for price breakdown if available
  let priceBreakdown: any = null;
  if (order.metadata && typeof order.metadata === 'string') {
    try {
      const metadata = JSON.parse(order.metadata);
      priceBreakdown = metadata.priceBreakdown;
    } catch (e) {
      console.error("Error parsing order metadata:", e);
    }
  }

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 14); // Assuming 2 weeks delivery time

  return (
    <div className="container max-w-4xl py-12">
      <Helmet>
        <title>Order Confirmation - ProJersey</title>
      </Helmet>

      <div className="flex flex-col items-center mb-8 text-center">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for your order. We've sent a confirmation email to your inbox.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order #{order.id}</CardTitle>
              <CardDescription>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </div>
            <Badge className="uppercase bg-green-100 text-green-700 border-0 px-3 py-1">
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Order summary */}
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-3">
                {order.orderDetails && order.orderDetails.items && order.orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.type}</span>
                      <span className="text-muted-foreground ml-2">
                        {item.gender}'s, Size: {item.size} × {item.quantity}
                      </span>
                    </div>
                    <div>${item.price.toFixed(2)} ea</div>
                  </div>
                ))}
                
                {order.orderDetails && order.orderDetails.addOns && order.orderDetails.addOns.map((addon, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{addon.name}</span>
                      <span className="text-muted-foreground ml-2">
                        (Add-on) × {addon.quantity}
                      </span>
                    </div>
                    <div>${addon.price.toFixed(2)} ea</div>
                  </div>
                ))}
                
                <div className="pt-3 mt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {priceBreakdown ? formatPrice(priceBreakdown.baseTotal) : formatPrice(order.totalAmount)}
                    </span>
                  </div>
                  
                  {priceBreakdown && priceBreakdown.tierDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Quantity Discount ({priceBreakdown.tierDiscountApplied})</span>
                      <span>-{formatPrice(priceBreakdown.tierDiscountAmount)}</span>
                    </div>
                  )}
                  
                  {priceBreakdown && priceBreakdown.subscriptionDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Pro Member Discount ({priceBreakdown.subscriptionDiscountApplied})</span>
                      <span>-{formatPrice(priceBreakdown.subscriptionDiscountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {priceBreakdown && priceBreakdown.shippingCost === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        formatPrice(priceBreakdown?.shippingCost || 0)
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between font-medium text-base pt-3 mt-3 border-t">
                    <span>Total</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Shipping info */}
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-3">Shipping Information</h3>
              {order.shippingAddress ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">Contact</h4>
                    <p className="text-sm">{order.shippingAddress.name}</p>
                    <p className="text-sm">{order.shippingAddress.phone}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">Address</h4>
                    <p className="text-sm">{order.shippingAddress.street}</p>
                    <p className="text-sm">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                    </p>
                    <p className="text-sm">{order.shippingAddress.country}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Shipping information not available</p>
              )}
            </div>
            
            {/* Order timeline */}
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-3">Order Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-3 h-10 w-10 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start opacity-75">
                  <div className="mr-3 h-10 w-10 flex-shrink-0 bg-orange-100 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">In Production</p>
                    <p className="text-sm text-muted-foreground">Your custom jerseys are being prepared</p>
                  </div>
                </div>
                
                <div className="flex items-start opacity-50">
                  <div className="mr-3 h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Estimated Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      {deliveryDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {order.trackingId && (
                      <p className="text-xs mt-1">
                        Tracking #: <span className="font-medium">{order.trackingId}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button variant="outline" onClick={handleViewInvoice}>
            <FileText className="h-4 w-4 mr-2" />
            View Invoice
          </Button>
          <div className="space-x-3">
            <Button variant="outline" onClick={() => navigate("/account/orders")}>
              View All Orders
            </Button>
            <Button onClick={() => navigate("/")}>
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}