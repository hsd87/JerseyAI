import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { orderService } from "@/lib/order-service";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("checkout");
  
  // Test create order
  const handleCreateTestOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to create an order",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a basic test order with minimal data
      const order = await orderService.createOrder({
        userId: user.id,
        designId: 1, // Assuming at least one design exists
        orderDetails: {
          items: [
            {
              type: "jerseyOnly",
              size: "M",
              quantity: 1,
              gender: "Male",
              price: 59.99,
            }
          ],
          addOns: [],
          packageType: "jerseyOnly",
          isTeamOrder: false,
        },
        shippingAddress: {
          name: "Test User",
          street: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345",
          country: "Test Country",
          phone: "+1234567890",
        },
        totalAmount: 5999, // $59.99 in cents
        sport: "soccer",
        designUrls: {
          front: "https://example.com/front.jpg",
          back: "https://example.com/back.jpg",
        },
      });
      
      toast({
        title: "Test Order Created",
        description: `Order ID: ${order.id}`,
      });
    } catch (error: any) {
      console.error("Error creating test order:", error);
      toast({
        title: "Order Creation Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test fetch orders
  const handleFetchOrders = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to fetch orders",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userOrders = await orderService.getUserOrders();
      setOrders(userOrders);
      
      toast({
        title: "Orders Fetched",
        description: `Found ${userOrders.length} orders`,
      });
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Fetch Orders Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6">eCommerce Flow Test Page</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="checkout">Order Creation Test</TabsTrigger>
          <TabsTrigger value="orders">Order Listing Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="checkout" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Test Order</CardTitle>
              <CardDescription>
                This will create a test order with minimal data to test the database connection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Test order details:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Product: Jersey Only ($59.99)</li>
                <li>Quantity: 1</li>
                <li>Size: Medium</li>
                <li>Sport: Soccer</li>
                <li>Shipping: Test Address</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateTestOrder} 
                disabled={isLoading || !user}
              >
                {isLoading ? "Creating..." : "Create Test Order"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
              <CardDescription>
                Fetch and display your orders from the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleFetchOrders} 
                disabled={isLoading || !user}
                className="mb-4"
              >
                {isLoading ? "Fetching..." : "Fetch Orders"}
              </Button>
              
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Order ID:</div>
                        <div>{order.id}</div>
                        
                        <div className="font-medium">Date:</div>
                        <div>{formatDate(order.createdAt)}</div>
                        
                        <div className="font-medium">Status:</div>
                        <div className="capitalize">{order.status}</div>
                        
                        <div className="font-medium">Amount:</div>
                        <div>${(order.totalAmount / 100).toFixed(2)}</div>
                        
                        <div className="font-medium">Sport:</div>
                        <div className="capitalize">{order.sport}</div>
                        
                        {order.trackingId && (
                          <>
                            <div className="font-medium">Tracking:</div>
                            <div>{order.trackingId}</div>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No orders found. Create a test order first or fetch your orders.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {!user && (
        <div className="bg-yellow-100 p-4 rounded-md text-yellow-800 text-sm">
          <strong>Note:</strong> You must be logged in to test the order functionality. Please log in first.
        </div>
      )}
    </div>
  );
}