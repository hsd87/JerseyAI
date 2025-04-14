import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Design, Order } from "@shared/schema";
import { Link } from "wouter";
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

    if (design.frontImageUrl && design.backImageUrl) {
      setImages(design.frontImageUrl, design.backImageUrl);
      setHasGenerated(true);
    }

    setDesignId(design.id);
    
    // Navigate to the customize page
    window.location.href = '/customize';
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
      default:
        return "bg-gray-100 text-gray-800";
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
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90 text-white font-medium rounded-full px-4 py-1.5 h-auto">
                  <i className="fas fa-plus mr-2"></i> New Design
                </Button>
              </Link>
            </div>
          </div>

          <Tabs defaultValue="designs" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 bg-gray-100/70 p-1 rounded-full border border-gray-200">
              <TabsTrigger className="rounded-full data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm" value="designs">My Designs</TabsTrigger>
              <TabsTrigger className="rounded-full data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm" value="team">Team Details</TabsTrigger>
              <TabsTrigger className="rounded-full data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm" value="orders">Track Orders</TabsTrigger>
              <TabsTrigger className="rounded-full data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm" value="addons">Add-ons</TabsTrigger>
              <TabsTrigger className="rounded-full data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm" value="favorites">Favorites</TabsTrigger>
              <TabsTrigger className="rounded-full data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm" value="subscription">Subscription</TabsTrigger>
            </TabsList>

            {/* Designs Tab */}
            <TabsContent value="designs" className="space-y-4">
              {isLoadingDesigns ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : designsError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading designs. Please try again.</p>
                </div>
              ) : designs && designs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designs.map((design) => (
                    <Card key={design.id} className="overflow-hidden border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-52 bg-gray-50">
                        {design.frontImageUrl ? (
                          <img
                            src={design.frontImageUrl}
                            alt={`${design.sport} jersey design`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400">No image available</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleFavorite(design)}
                          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors"
                        >
                          <i className={`fas fa-heart ${design.isFavorite ? 'text-primary' : 'text-gray-400'}`}></i>
                        </button>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium">
                          {design.sport.charAt(0).toUpperCase() + design.sport.slice(1)} Kit
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          Created on {formatDate(design.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between pt-2">
                        <Link href="/">
                          <Button
                            variant="outline"
                            className="text-sm rounded-full border-gray-200 text-gray-700 hover:text-primary hover:border-primary/30 hover:bg-primary/5"
                            onClick={() => handleEditDesign(design)}
                          >
                            <i className="fas fa-pencil-alt mr-1"></i> Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          className="text-sm rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteDesign(design.id)}
                        >
                          <i className="fas fa-trash mr-1"></i> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-tshirt text-gray-400 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No designs yet</h3>
                  <p className="text-gray-500 mb-6">Create your first custom jersey design</p>
                  <Link href="/">
                    <Button className="bg-black hover:bg-gray-800">
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
                  <CardTitle>Available Add-ons</CardTitle>
                  <CardDescription>Enhance your jersey design with premium add-ons</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-gray-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1">Premium Name Badge</h3>
                        <p className="text-sm text-gray-500 mb-3">High-quality embroidered name badge</p>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">$12.99</span>
                          <Button size="sm" variant="outline">Add to Cart</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-gray-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                        </svg>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1">Team Logo Patch</h3>
                        <p className="text-sm text-gray-500 mb-3">Custom embroidered team logo</p>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">$15.99</span>
                          <Button size="sm" variant="outline">Add to Cart</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-gray-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                        </svg>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1">Performance Fabric Upgrade</h3>
                        <p className="text-sm text-gray-500 mb-3">Premium breathable material</p>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">$9.99</span>
                          <Button size="sm" variant="outline">Add to Cart</Button>
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
                  <CardTitle>Team Details</CardTitle>
                  <CardDescription>Manage your team roster and details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                      <input 
                        type="text" 
                        id="team-name" 
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter team name"
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Team Members</h3>
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900">John Doe</td>
                              <td className="px-4 py-3 text-sm text-gray-900">10</td>
                              <td className="px-4 py-3 text-sm text-gray-900">M</td>
                              <td className="px-4 py-3 text-sm text-gray-900">1</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900">Jane Smith</td>
                              <td className="px-4 py-3 text-sm text-gray-900">7</td>
                              <td className="px-4 py-3 text-sm text-gray-900">S</td>
                              <td className="px-4 py-3 text-sm text-gray-900">1</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <Button className="mt-4">
                        <i className="fas fa-plus mr-2"></i>
                        Add Team Member
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              {isLoadingOrders ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : ordersError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading orders. Please try again.</p>
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/70">
                      <tr>
                        <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">
                          Order ID
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            #{order.id}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 space-x-2">
                            <Link href={`/orders/${order.id}`}>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-full">
                                View Details
                              </Button>
                            </Link>
                            {order.pdfUrl && (
                              <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-full">
                                  <i className="fas fa-file-pdf mr-1"></i> PDF
                                </Button>
                              </a>
                            )}
                            {order.trackingId && (
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-full">
                                <i className="fas fa-truck mr-1"></i> Track
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-shopping-cart text-gray-400 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-6">Design a jersey and place your first order</p>
                  <Link href="/">
                    <Button className="bg-black hover:bg-gray-800">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-4">
              {isLoadingDesigns ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : designsError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading favorites. Please try again.</p>
                </div>
              ) : designs && designs.filter(d => d.isFavorite).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designs.filter(d => d.isFavorite).map((design) => (
                    <Card key={design.id} className="overflow-hidden border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-52 bg-gray-50">
                        {design.frontImageUrl ? (
                          <img
                            src={design.frontImageUrl}
                            alt={`${design.sport} jersey design`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400">No image available</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleFavorite(design)}
                          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors"
                        >
                          <i className="fas fa-heart text-primary"></i>
                        </button>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium">
                          {design.sport.charAt(0).toUpperCase() + design.sport.slice(1)} Kit
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          Created on {formatDate(design.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between pt-2">
                        <Link href="/">
                          <Button
                            variant="outline"
                            className="text-sm rounded-full border-gray-200 text-gray-700 hover:text-primary hover:border-primary/30 hover:bg-primary/5"
                            onClick={() => handleEditDesign(design)}
                          >
                            <i className="fas fa-pencil-alt mr-1"></i> Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          className="text-sm rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteDesign(design.id)}
                        >
                          <i className="fas fa-trash mr-1"></i> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-heart text-gray-400 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-500 mb-6">Mark designs as favorites to see them here</p>
                  <Link href="/">
                    <Button className="bg-black hover:bg-gray-800">
                      Browse Designs
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className={`border ${user?.subscriptionTier === "free" ? "bg-gray-50/50 border-gray-300" : "border-gray-200"} rounded-xl shadow-sm overflow-hidden`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Free Tier</CardTitle>
                    <CardDescription className="text-sm text-gray-500">Basic jersey design capabilities</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div className="mb-6">
                      <span className="text-4xl font-medium">$0</span>
                      <span className="text-gray-500 ml-1">/month</span>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center">
                        <i className="fas fa-check text-primary mr-2.5"></i>
                        <span>6 design generations per month</span>
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-primary mr-2.5"></i>
                        <span>Basic customization options</span>
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-primary mr-2.5"></i>
                        <span>Standard rendering queue</span>
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-primary mr-2.5"></i>
                        <span>Regular pricing on orders</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-2 pb-6">
                    {user?.subscriptionTier === "free" ? (
                      <Button disabled className="w-full rounded-full bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed h-10">
                        Current Plan
                      </Button>
                    ) : (
                      <Button className="w-full rounded-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 h-10">
                        Downgrade
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                <Card className={`border ${user?.subscriptionTier === "pro" ? "border-primary/30 bg-primary/5" : "border-gray-200"} rounded-xl shadow-sm overflow-hidden relative`}>
                  {user?.subscriptionTier === "pro" && (
                    <div className="absolute top-0 right-0 left-0 h-1 bg-primary"></div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">Pro Tier</CardTitle>
                      {user?.subscriptionTier === "pro" && (
                        <Badge className="bg-primary/10 text-primary border-primary">CURRENT</Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm text-gray-500">Premium jersey design experience</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div className="mb-6">
                      <span className="text-4xl font-medium">$9</span>
                      <span className="text-gray-500 ml-1">/month</span>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center">
                        <i className="fas fa-check text-primary mr-2.5"></i>
                        <span className="font-medium">Unlimited design generations</span>
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-primary mr-2.5"></i>
                        <span className="font-medium">Advanced customization options</span>
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-primary mr-2.5"></i>
                        <span className="font-medium">Priority rendering queue</span>
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-primary mr-2.5"></i>
                        <span className="font-medium">15% discount on all orders</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-2 pb-6">
                    {user?.subscriptionTier === "pro" ? (
                      <Button disabled className="w-full rounded-full bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed h-10">
                        Current Plan
                      </Button>
                    ) : (
                      <Button className="w-full rounded-full bg-primary text-white hover:bg-primary/90 h-10">
                        Upgrade to Pro
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>

              {/* Subscription Details */}
              {user?.subscriptionTier === "pro" && (
                <Card className="mt-8 border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <CardHeader className="pb-4 border-b border-gray-100">
                    <CardTitle className="text-xl font-medium">Subscription Details</CardTitle>
                  </CardHeader>
                  <CardContent className="py-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</dt>
                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Active
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Next billing date</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment method</dt>
                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                          <i className="fab fa-cc-visa text-blue-600 mr-2"></i>
                          Visa ending in 4242
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Billing address</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          1234 Main St, San Francisco, CA 94110
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                  <CardFooter className="pt-2 pb-6 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
                    <Button variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50">
                      <i className="fas fa-credit-card mr-2"></i> Update Payment Method
                    </Button>
                    <Button variant="ghost" className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50">
                      <i className="fas fa-ban mr-2"></i> Cancel Subscription
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
