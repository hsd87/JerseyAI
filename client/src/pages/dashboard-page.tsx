import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Design, Order } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useDesignStore } from "@/hooks/use-design-store";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("designs");
  const { updateFormData, setImages, setDesignId, setHasGenerated } = useDesignStore();
  const [_, navigate] = useLocation();

  // Fetch user designs
  const {
    data: designs,
    isLoading: isLoadingDesigns,
    error: designsError,
  } = useQuery<Design[]>({
    queryKey: ["/api/designs"],
    enabled: !!user,
  });

  // Fetch user orders
  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user && activeTab === "orders",
  });

  const handleEditDesign = (design: Design) => {
    // Set design data in store for editing and navigate to customize page
    updateFormData({
      sport: design.sport as any,
      kitType: design.kitType as any,
      primaryColor: design.primaryColor,
      secondaryColor: design.secondaryColor,
      sleeveStyle: design.sleeveStyle as any,
      collarType: design.collarType as any,
      patternStyle: design.patternStyle as any,
      designNotes: design.designNotes || ''
    });

    // Only use the front image as per updated requirements
    if (design.frontImageUrl) {
      // Set same image for both front and back for compatibility
      // but we'll only display the front image
      setImages(design.frontImageUrl, design.frontImageUrl);
      setHasGenerated(true);
    }

    setDesignId(design.id);
    
    // Navigate to the designer page
    toast({
      title: "Design loaded",
      description: "You can now edit your design."
    });
    navigate('/designer');
  };

  const handleDeleteDesign = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/designs/${id}`);
      toast({
        title: "Design deleted",
        description: "Your design has been deleted successfully.",
      });
      // Refetch designs
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete design. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (design: Design) => {
    try {
      await apiRequest("PATCH", `/api/designs/${design.id}`, {
        isFavorite: !design.isFavorite
      });
      toast({
        title: design.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: design.isFavorite 
          ? "Design removed from your favorites"
          : "Design added to your favorites"
      });
      // Refetch designs
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "production":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Function to resume a draft order
  const handleResumeDraftOrder = async (order: Order) => {
    try {
      // Extract order details
      const metadata = typeof order.metadata === 'string' 
        ? JSON.parse(order.metadata) 
        : order.metadata;
      
      // Navigate to checkout with the draft order details
      navigate(`/checkout-elements?draft=${order.id}`);
      
      toast({
        title: "Draft order loaded",
        description: "You can now complete your purchase.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load draft order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100); // Amount stored in cents
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Manage your designs, orders, and subscription
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm bg-gray-50 px-4 py-1.5 rounded-full flex items-center border border-gray-200">
                <span className="text-gray-600 mr-2">Subscription:</span>
                <Badge className={user?.subscriptionTier === "pro" ? "bg-primary/10 text-primary border-primary" : "bg-gray-200"}>
                  {user?.subscriptionTier === "pro" ? "PRO" : "FREE"}
                </Badge>
              </div>
              <Link href="/designer">
                <Button className="bg-primary hover:bg-primary/90 text-white font-medium rounded-full px-4 py-1.5 h-auto">
                  <i className="fas fa-plus mr-2"></i> New Design
                </Button>
              </Link>
            </div>
          </div>

          <Tabs defaultValue="designs" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 bg-[#eeeeee] p-1 rounded-md border border-[#979797]">
              <TabsTrigger className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#000000] data-[state=active]:shadow-sm text-[#666666] data-[state=active]:font-medium" value="designs">My Designs</TabsTrigger>
              <TabsTrigger className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#000000] data-[state=active]:shadow-sm text-[#666666] data-[state=active]:font-medium" value="team">Team Details</TabsTrigger>
              <TabsTrigger className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#000000] data-[state=active]:shadow-sm text-[#666666] data-[state=active]:font-medium" value="orders">Track Orders</TabsTrigger>
              <TabsTrigger className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#000000] data-[state=active]:shadow-sm text-[#666666] data-[state=active]:font-medium" value="addons">Add-ons</TabsTrigger>
              <TabsTrigger className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#000000] data-[state=active]:shadow-sm text-[#666666] data-[state=active]:font-medium" value="favorites">Favorites</TabsTrigger>
              <TabsTrigger className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#000000] data-[state=active]:shadow-sm text-[#666666] data-[state=active]:font-medium" value="subscription">Subscription</TabsTrigger>
            </TabsList>

            {/* Designs Tab */}
            <TabsContent value="designs" className="space-y-4">
              {isLoadingDesigns ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0088cc]" />
                </div>
              ) : designsError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading designs. Please try again.</p>
                </div>
              ) : designs && designs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designs.map((design) => (
                    <Card key={design.id} className="overflow-hidden border border-[#979797] rounded-md shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-52 bg-[#eeeeee]">
                        {design.frontImageUrl ? (
                          <img
                            src={design.frontImageUrl}
                            alt={`${design.sport} jersey design`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-[#666666]">No image available</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleFavorite(design)}
                          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors"
                        >
                          <i className={`fas fa-heart ${design.isFavorite ? 'text-[#0088cc]' : 'text-[#666666]'}`}></i>
                        </button>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-[#000000]">
                          {design.sport.charAt(0).toUpperCase() + design.sport.slice(1)} Kit
                        </CardTitle>
                        <CardDescription className="text-xs text-[#666666]">
                          Created on {formatDate(design.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between pt-2">
                        <Button
                          variant="outline"
                          className="text-sm rounded-md border-[#979797] text-[#000000] hover:text-[#0088cc] hover:border-[#0088cc]/30 hover:bg-[#0088cc]/5"
                          onClick={() => handleEditDesign(design)}
                        >
                          <i className="fas fa-pencil-alt mr-1"></i> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-sm rounded-md text-[#666666] hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteDesign(design.id)}
                        >
                          <i className="fas fa-trash mr-1"></i> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-md shadow-sm border border-[#979797]">
                  <div className="mx-auto w-16 h-16 bg-[#eeeeee] rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-tshirt text-[#666666] text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-[#000000] mb-2">No designs yet</h3>
                  <p className="text-[#666666] mb-6">Create your first custom jersey design</p>
                  <Link href="/designer">
                    <Button className="bg-[#0088cc] hover:bg-[#0077bb] text-white font-medium rounded-md transition-colors">
                      <i className="fas fa-plus mr-2"></i> Create Design
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            {/* Team Details Tab */}
            <TabsContent value="addons" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#000000]">Available Add-ons</CardTitle>
                  <CardDescription className="text-[#666666]">Enhance your jersey design with premium add-ons</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="border border-[#979797] rounded-md overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-[#eeeeee] flex items-center justify-center">
                        <svg className="w-12 h-12 text-[#0088cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1 text-[#000000]">Premium Name Badge</h3>
                        <p className="text-sm text-[#666666] mb-3">High-quality embroidered name badge</p>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-[#000000]">$12.99</span>
                          <Button size="sm" variant="outline" className="rounded-md border-[#979797] text-[#0088cc] hover:bg-[#0088cc]/5 hover:border-[#0088cc]/30">Add to Cart</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-[#979797] rounded-md overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-[#eeeeee] flex items-center justify-center">
                        <svg className="w-12 h-12 text-[#0088cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                        </svg>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1 text-[#000000]">Team Logo Patch</h3>
                        <p className="text-sm text-[#666666] mb-3">Custom embroidered team logo</p>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-[#000000]">$15.99</span>
                          <Button size="sm" variant="outline" className="rounded-md border-[#979797] text-[#0088cc] hover:bg-[#0088cc]/5 hover:border-[#0088cc]/30">Add to Cart</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-[#979797] rounded-md overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-[#eeeeee] flex items-center justify-center">
                        <svg className="w-12 h-12 text-[#0088cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                        </svg>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1 text-[#000000]">Performance Fabric Upgrade</h3>
                        <p className="text-sm text-[#666666] mb-3">Premium breathable material</p>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-[#000000]">$9.99</span>
                          <Button size="sm" variant="outline" className="rounded-md border-[#979797] text-[#0088cc] hover:bg-[#0088cc]/5 hover:border-[#0088cc]/30">Add to Cart</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#000000]">Team Details</CardTitle>
                  <CardDescription className="text-[#666666]">Manage your team roster and details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="team-name" className="block text-sm font-medium text-[#000000] mb-1">Team Name</label>
                      <input 
                        type="text" 
                        id="team-name" 
                        className="w-full rounded-md border border-[#979797] px-3 py-2 text-[#000000] placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#0088cc] focus:border-transparent"
                        placeholder="Enter team name"
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-[#000000] mb-2">Team Members</h3>
                      <div className="border border-[#979797] rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-[#979797]">
                          <thead className="bg-[#eeeeee]">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Name</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Number</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Size</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Quantity</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-[#979797]">
                            <tr>
                              <td className="px-4 py-3 text-sm text-[#000000]">John Doe</td>
                              <td className="px-4 py-3 text-sm text-[#000000]">10</td>
                              <td className="px-4 py-3 text-sm text-[#000000]">M</td>
                              <td className="px-4 py-3 text-sm text-[#000000]">1</td>
                              <td className="px-4 py-3 text-sm text-[#000000]">
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 rounded-md">
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm text-[#000000]">Jane Smith</td>
                              <td className="px-4 py-3 text-sm text-[#000000]">7</td>
                              <td className="px-4 py-3 text-sm text-[#000000]">S</td>
                              <td className="px-4 py-3 text-sm text-[#000000]">1</td>
                              <td className="px-4 py-3 text-sm text-[#000000]">
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 rounded-md">
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="text-sm rounded-md border-[#979797] text-[#0088cc] hover:bg-[#0088cc]/5 hover:border-[#0088cc]/30">
                          <i className="fas fa-plus mr-1"></i> Add Team Member
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-6">
              {isLoadingOrders ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0088cc]" />
                </div>
              ) : ordersError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading orders. Please try again.</p>
                </div>
              ) : orders && orders.length > 0 ? (
                <>
                  {/* Draft Orders Section */}
                  {orders.filter(order => order.status === 'draft').length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Saved for Later</h2>
                      <div className="space-y-4">
                        {orders.filter(order => order.status === 'draft').map((order) => (
                          <Card key={order.id} className="overflow-hidden border border-[#979797] border-l-4 border-l-[#0088cc]">
                            <CardHeader className="bg-[#eeeeee] border-b border-[#979797] py-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <CardTitle className="text-base font-medium text-[#000000]">Saved Order #{order.id}</CardTitle>
                                  <CardDescription className="text-xs text-[#666666]">
                                    Saved on {formatDate(order.createdAt)}
                                  </CardDescription>
                                </div>
                                <div>
                                  <Badge className="bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20">
                                    Draft
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="py-4">
                              <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2">
                                  <h3 className="text-sm font-medium text-[#000000]">Order Details</h3>
                                  <div className="text-sm text-[#666666]">
                                    <p>Total Amount: {formatCurrency(order.totalAmount)}</p>
                                    <p>Sport: {order.sport}</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <h3 className="text-sm font-medium text-[#000000]">Status</h3>
                                  <div className="text-sm text-[#666666]">
                                    <p>Complete your purchase to proceed</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="bg-[#eeeeee] border-t border-[#979797] py-3">
                              <div className="flex justify-end gap-2 w-full">
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="text-xs rounded-md bg-[#0088cc] hover:bg-[#0077bb] text-white font-medium"
                                  onClick={() => handleResumeDraftOrder(order)}
                                >
                                  <i className="fas fa-shopping-cart mr-1"></i> Complete Purchase
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Active Orders Section */}
                  {orders.filter(order => order.status !== 'draft').length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Active Orders</h2>
                      <div className="space-y-4">
                        {orders.filter(order => order.status !== 'draft').map((order) => (
                          <Card key={order.id} className="overflow-hidden border border-[#979797]">
                            <CardHeader className="bg-[#eeeeee] border-b border-[#979797] py-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <CardTitle className="text-base font-medium text-[#000000]">Order #{order.id}</CardTitle>
                                  <CardDescription className="text-xs text-[#666666]">
                                    Placed on {formatDate(order.createdAt)}
                                  </CardDescription>
                                </div>
                                <div>
                                  <Badge className="bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20">
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="py-4">
                              <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2">
                                  <h3 className="text-sm font-medium text-[#000000]">Order Details</h3>
                                  <div className="text-sm text-[#666666]">
                                    <p>Total Amount: {formatCurrency(order.totalAmount)}</p>
                                    <p>Sport: {order.sport || 'Custom'}</p>
                                    <p>Items: {order.metadata?.itemCount || 1} item(s)</p>
                                  </div>
                                </div>
                                
                                {order.shippingAddress && (
                                  <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-[#000000]">Shipping Address</h3>
                                    <div className="text-sm text-[#666666]">
                                      <p>{typeof order.shippingAddress === 'string' 
                                        ? order.shippingAddress 
                                        : JSON.stringify(order.shippingAddress)}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {order.trackingId && (
                                  <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-[#000000]">Tracking</h3>
                                    <div className="text-sm">
                                      <a href={`https://track.shipment.com/${order.trackingId}`} className="text-[#0088cc] hover:underline">
                                        {order.trackingId}
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="bg-[#eeeeee] border-t border-[#979797] py-3">
                              <div className="flex justify-end gap-2 w-full">
                                {order.pdfUrl && (
                                  <Button variant="outline" size="sm" className="text-xs rounded-md border-[#979797] text-[#000000] hover:text-[#0088cc] hover:border-[#0088cc]/30 hover:bg-[#0088cc]/5">
                                    <i className="fas fa-download mr-1"></i> Invoice
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" className="text-xs rounded-md border-[#979797] text-[#000000] hover:text-[#0088cc] hover:border-[#0088cc]/30 hover:bg-[#0088cc]/5">
                                  <i className="fas fa-boxes mr-1"></i> Track Order
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-white rounded-md shadow-sm border border-[#979797]">
                  <div className="mx-auto w-16 h-16 bg-[#eeeeee] rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-shopping-bag text-[#666666] text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-[#000000] mb-2">No orders yet</h3>
                  <p className="text-[#666666] mb-6">Create a design and place your first order</p>
                  <Link href="/designer">
                    <Button className="bg-[#0088cc] hover:bg-[#0077bb] text-white font-medium rounded-md transition-colors">
                      <i className="fas fa-tshirt mr-2"></i> Design Your Jersey
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="favorites" className="space-y-4">
              {isLoadingDesigns ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0088cc]" />
                </div>
              ) : designsError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading designs. Please try again.</p>
                </div>
              ) : designs && designs.filter(d => d.isFavorite).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designs.filter(d => d.isFavorite).map((design) => (
                    <Card key={design.id} className="overflow-hidden border border-[#979797] rounded-md shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-52 bg-[#eeeeee]">
                        {design.frontImageUrl ? (
                          <img
                            src={design.frontImageUrl}
                            alt={`${design.sport} jersey design`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-[#666666]">No image available</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleFavorite(design)}
                          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors"
                        >
                          <i className="fas fa-heart text-[#0088cc]"></i>
                        </button>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-[#000000]">
                          {design.sport.charAt(0).toUpperCase() + design.sport.slice(1)} Kit
                        </CardTitle>
                        <CardDescription className="text-xs text-[#666666]">
                          Created on {formatDate(design.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between pt-2">
                        <Button
                          variant="outline"
                          className="text-sm rounded-md border-[#979797] text-[#000000] hover:text-[#0088cc] hover:border-[#0088cc]/30 hover:bg-[#0088cc]/5"
                          onClick={() => handleEditDesign(design)}
                        >
                          <i className="fas fa-pencil-alt mr-1"></i> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-sm rounded-md text-[#666666] hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteDesign(design.id)}
                        >
                          <i className="fas fa-trash mr-1"></i> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-md shadow-sm border border-[#979797]">
                  <div className="mx-auto w-16 h-16 bg-[#eeeeee] rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-heart text-[#666666] text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-[#000000] mb-2">No favorites yet</h3>
                  <p className="text-[#666666] mb-6">Save designs to your favorites for quick access</p>
                  <Link href="/designer">
                    <Button className="bg-[#0088cc] hover:bg-[#0077bb] text-white font-medium rounded-md transition-colors">
                      <i className="fas fa-plus mr-2"></i> Create Design
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#000000]">Your Subscription</CardTitle>
                  <CardDescription className="text-[#666666]">Manage your VORO subscription</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6 bg-white rounded-md border border-[#979797] shadow-sm">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-1 text-[#000000]">
                          {user?.subscriptionTier === "pro" ? (
                            <>Pro Plan <Badge className="ml-2 bg-[#0088cc]/10 text-[#0088cc]">Active</Badge></>
                          ) : (
                            <>Free Plan</>
                          )}
                        </h3>
                        <p className="text-sm text-[#666666] mb-2">
                          {user?.subscriptionTier === "pro"
                            ? "Unlimited design credits, 15% discount on all orders, priority support"
                            : "6 design credits per month, standard pricing, regular support"}
                        </p>
                        <div className="text-sm text-[#000000]">
                          <span className="font-medium">Design Credits Remaining:</span>{" "}
                          {user?.remainingDesigns || 0}
                        </div>
                      </div>
                      
                      {user?.subscriptionTier === "pro" ? (
                        <Button variant="outline" className="rounded-md border-[#979797] text-[#000000] hover:bg-[#eeeeee]">
                          Manage Subscription
                        </Button>
                      ) : (
                        <Link href="/pricing">
                          <Button className="rounded-md bg-[#0088cc] hover:bg-[#0077bb] text-white">
                            Upgrade to Pro
                          </Button>
                        </Link>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium text-[#000000]">Subscription Benefits</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-3 p-4 bg-white rounded-md border border-[#979797] shadow-sm">
                          <div className="bg-[#0088cc]/10 rounded-full p-2 h-fit">
                            <i className="fas fa-infinity text-[#0088cc]"></i>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-[#000000]">Unlimited Designs</h4>
                            <p className="text-sm text-[#666666]">Create as many designs as you want</p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-4 bg-white rounded-md border border-[#979797] shadow-sm">
                          <div className="bg-[#0088cc]/10 rounded-full p-2 h-fit">
                            <i className="fas fa-tags text-[#0088cc]"></i>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-[#000000]">15% Discount</h4>
                            <p className="text-sm text-[#666666]">On all orders, automatically applied</p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-4 bg-white rounded-md border border-[#979797] shadow-sm">
                          <div className="bg-[#0088cc]/10 rounded-full p-2 h-fit">
                            <i className="fas fa-headset text-[#0088cc]"></i>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-[#000000]">Priority Support</h4>
                            <p className="text-sm text-[#666666]">Get help faster when you need it</p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-4 bg-white rounded-md border border-[#979797] shadow-sm">
                          <div className="bg-[#0088cc]/10 rounded-full p-2 h-fit">
                            <i className="fas fa-file-export text-[#0088cc]"></i>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-[#000000]">Export Options</h4>
                            <p className="text-sm text-[#666666]">Export your designs in high-resolution</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}