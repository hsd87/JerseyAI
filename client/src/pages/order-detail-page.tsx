import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Order } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, Download, Truck, CalendarDays, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch order details
  const {
    data: order,
    isLoading,
    error,
  } = useQuery<Order>({
    queryKey: [`/api/orders/${id}`],
    enabled: !!id && !!user,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  // Format date
  const formatDate = (dateStr: Date | string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in production":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    if (!order?.pdfUrl) {
      toast({
        title: "PDF Not Available",
        description: "The order PDF is not available yet.",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary anchor element to download the file
    const link = document.createElement("a");
    link.href = order.pdfUrl;
    link.target = "_blank";
    link.download = `order_${order.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloading PDF",
      description: "Your order PDF is being downloaded.",
      variant: "default",
    });
  };

  // Handle going back
  const handleGoBack = () => {
    setLocation("/dashboard");
  };

  // Handle order tracking
  const handleTrackOrder = () => {
    if (!order?.trackingId) {
      toast({
        title: "Tracking Unavailable",
        description: "Tracking information is not available for this order yet.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, we might redirect to a carrier's tracking page
    // For now, just show a toast
    toast({
      title: "Order Tracking",
      description: `Tracking ID: ${order.trackingId}`,
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Order</h1>
        <p className="text-gray-600 mb-6">
          {error instanceof Error ? error.message : "Failed to load order details."}
        </p>
        <Button onClick={handleGoBack}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          className="mb-6 flex items-center"
          onClick={handleGoBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Order #{order.id}</CardTitle>
                  <CardDescription>Placed on {formatDate(order.createdAt)}</CardDescription>
                </div>
                <div className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {order.orderDetails?.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-3">
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-md mr-3">
                            <Package className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{item.type} - {item.gender}</p>
                            <p className="text-sm text-gray-500">Size: {item.size}, Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium">${item.price.toFixed(2)}</p>
                      </div>
                    ))}

                    {/* Add-ons */}
                    {order.orderDetails?.addOns && order.orderDetails.addOns.length > 0 && (
                      <div className="pt-3">
                        <h4 className="text-md font-medium mb-2">Add-ons</h4>
                        {order.orderDetails.addOns.map((addon, index) => (
                          <div key={index} className="flex justify-between items-center mb-2">
                            <p>{addon.name} x{addon.quantity}</p>
                            <p>${addon.price.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-1">
                    <p>Subtotal</p>
                    <p>{formatCurrency(order.totalAmount)}</p>
                  </div>
                  {order.orderDetails?.discount && (
                    <div className="flex justify-between mb-1 text-green-600">
                      <p>Discount</p>
                      <p>-${order.orderDetails.discount.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <p>Total</p>
                    <p>{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={handleDownloadPDF}
                disabled={!order.pdfUrl}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>
              
              <Button
                variant="default"
                className="flex items-center"
                onClick={handleTrackOrder}
                disabled={!order.trackingId}
              >
                <Truck className="mr-2 h-4 w-4" />
                Track Order
              </Button>
            </CardFooter>
          </Card>

          {/* Order Info and Jersey Preview */}
          <div className="space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Package Type</h3>
                  <p>{order.orderDetails?.packageType || "Custom Jersey"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Sport</h3>
                  <p>{order.sport.charAt(0).toUpperCase() + order.sport.slice(1)}</p>
                </div>
                {order.orderDetails?.teamName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Team Name</h3>
                    <p>{order.orderDetails.teamName}</p>
                  </div>
                )}
                {order.orderDetails?.isTeamOrder && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Team Order</h3>
                    <p>Yes</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Expected Delivery</h3>
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                    <p>{order.orderDetails?.deliveryTimeline || "2-3 weeks"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Info */}
            {order.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    <p className="mt-2">
                      <span className="text-sm text-gray-500">Phone: </span>
                      {order.shippingAddress.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Design Preview */}
            {order.designUrls && (order.designUrls.front || order.designUrls.back) && (
              <Card>
                <CardHeader>
                  <CardTitle>Jersey Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
                    <img
                      src={order.designUrls.front || order.designUrls.back}
                      alt="Jersey Design"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}