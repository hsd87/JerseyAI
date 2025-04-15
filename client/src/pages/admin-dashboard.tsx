import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  UserCog, 
  Package2, 
  BarChart2, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Loader2
} from "lucide-react";

// Custom type for analytics data
type AnalyticsData = {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalUsers: number;
    proUsers: number;
    totalDesigns: number;
    totalB2BLeads: number;
  };
  dailyRevenue: Record<string, number>;
  sportCounts: Record<string, number>;
};

// Type for Orders
type Order = {
  id: number;
  userId: number;
  designId: number;
  sport: string;
  totalAmount: number;
  status: string;
  trackingId?: string;
  createdAt: string;
};

// Type for Users (without sensitive data)
type User = {
  id: number;
  username: string;
  email: string | null;
  remainingDesigns: number;
  subscriptionTier: string;
  role: string;
  createdAt: string;
};

// Type for B2B Leads
type B2BLead = {
  id: number;
  fullName: string;
  company: string;
  email: string;
  phone: string | null;
  country: string;
  partnershipType: string;
  orderSize: string;
  needsCustomBranding: boolean;
  status: string;
  createdAt: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<string>("");
  const [trackingId, setTrackingId] = useState<string>("");
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [newLeadStatus, setNewLeadStatus] = useState<string>("");
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newUserRole, setNewUserRole] = useState<string>("");
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Fetch analytics data
  const { 
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch orders
  const { 
    data: orders, 
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders
  } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch users
  const { 
    data: users, 
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers
  } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch B2B leads
  const { 
    data: leads, 
    isLoading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads
  } = useQuery<B2BLead[]>({
    queryKey: ['/api/admin/leads'],
    enabled: !!user && user.role === 'admin',
  });

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      setLocation('/');
    } else if (!authLoading && !user) {
      setLocation('/auth');
    }
  }, [user, authLoading, setLocation]);

  // Format revenue for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Prepare daily revenue chart data
  const getDailyRevenueData = () => {
    if (!analyticsData?.dailyRevenue) return [];
    
    return Object.entries(analyticsData.dailyRevenue)
      .map(([date, revenue]) => ({
        date,
        revenue: revenue / 100 // Convert cents to dollars
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Prepare sport distribution chart data
  const getSportDistributionData = () => {
    if (!analyticsData?.sportCounts) return [];
    
    return Object.entries(analyticsData.sportCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Filter orders based on status and search query
  const getFilteredOrders = () => {
    if (!orders) return [];
    
    return orders.filter(order => {
      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
      const matchesSearch = searchQuery === "" || 
        order.id.toString().includes(searchQuery) ||
        order.sport.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  };

  // Update order status
  const handleUpdateOrderStatus = async () => {
    if (!selectedOrderId || !newOrderStatus) return;
    
    setIsUpdatingOrder(true);
    
    try {
      await apiRequest('PATCH', `/api/admin/orders/${selectedOrderId}/status`, {
        status: newOrderStatus,
        trackingId: trackingId || undefined
      });
      
      // Refetch orders and analytics
      refetchOrders();
      refetchAnalytics();
      
      // Reset form
      setSelectedOrderId(null);
      setNewOrderStatus("");
      setTrackingId("");
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Update lead status
  const handleUpdateLeadStatus = async () => {
    if (!selectedLeadId || !newLeadStatus) return;
    
    setIsUpdatingLead(true);
    
    try {
      await apiRequest('PATCH', `/api/admin/leads/${selectedLeadId}/status`, {
        status: newLeadStatus
      });
      
      // Refetch leads
      refetchLeads();
      
      // Reset form
      setSelectedLeadId(null);
      setNewLeadStatus("");
    } catch (error) {
      console.error('Error updating lead status:', error);
    } finally {
      setIsUpdatingLead(false);
    }
  };

  // Update user role
  const handleUpdateUserRole = async () => {
    if (!selectedUserId || !newUserRole) return;
    
    setIsUpdatingUser(true);
    
    try {
      await apiRequest('PATCH', `/api/admin/users/${selectedUserId}/role`, {
        role: newUserRole
      });
      
      // Refetch users
      refetchUsers();
      
      // Reset form
      setSelectedUserId(null);
      setNewUserRole("");
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Get badge color based on status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'new':
        return 'bg-blue-500';
      case 'contacted':
        return 'bg-purple-500';
      case 'qualified':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // User will be redirected by the useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <UserCog className="mr-2 h-8 w-8" /> Admin Dashboard
      </h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center">
            <ShoppingBag className="mr-2 h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" /> B2B Leads
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" /> Users
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : analyticsError ? (
            <Card>
              <CardHeader>
                <CardTitle>Error Loading Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Failed to load analytics data. Please try again later.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {formatCurrency(analyticsData?.summary.totalRevenue || 0)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Package2 className="h-5 w-5 text-blue-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {analyticsData?.summary.totalOrders || 0}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {analyticsData?.summary.pendingOrders || 0} pending · 
                      {analyticsData?.summary.completedOrders || 0} completed
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-purple-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {analyticsData?.summary.totalUsers || 0}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {analyticsData?.summary.proUsers || 0} pro subscribers
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      B2B Leads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {analyticsData?.summary.totalB2BLeads || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getDailyRevenueData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip 
                            formatter={(value) => [`$${value}`, 'Revenue']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#0071e3" 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sport Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getSportDistributionData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getSportDistributionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} orders`, name]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>View and manage customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by order ID or sport"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Select
                    value={orderStatusFilter}
                    onValueChange={setOrderStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : ordersError ? (
                <div className="text-center py-4">
                  <p>Failed to load orders. Please try again later.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>
                      {getFilteredOrders().length === 0 
                        ? "No orders found matching your criteria." 
                        : `Showing ${getFilteredOrders().length} orders`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Sport</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredOrders().map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="capitalize">{order.sport}</TableCell>
                          <TableCell>{formatCurrency(order.totalAmount / 100)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.trackingId || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setNewOrderStatus(order.status);
                                setTrackingId(order.trackingId || "");
                              }}
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Order Update Form */}
              {selectedOrderId && (
                <div className="mt-6 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Update Order #{selectedOrderId}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <Select
                        value={newOrderStatus}
                        onValueChange={setNewOrderStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tracking ID (optional)</label>
                      <Input
                        placeholder="Enter tracking ID"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedOrderId(null);
                        setNewOrderStatus("");
                        setTrackingId("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      disabled={isUpdatingOrder || !newOrderStatus}
                      onClick={handleUpdateOrderStatus}
                    >
                      {isUpdatingOrder ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Order"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* B2B Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>B2B Lead Management</CardTitle>
              <CardDescription>View and manage business leads</CardDescription>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : leadsError ? (
                <div className="text-center py-4">
                  <p>Failed to load leads. Please try again later.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>
                      {!leads || leads.length === 0 
                        ? "No B2B leads found." 
                        : `Total of ${leads.length} B2B leads`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads && leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>{lead.id}</TableCell>
                          <TableCell>{formatDate(lead.createdAt)}</TableCell>
                          <TableCell>
                            <div>{lead.fullName}</div>
                            <div className="text-xs text-muted-foreground">{lead.email}</div>
                          </TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{lead.partnershipType}</TableCell>
                          <TableCell>{lead.orderSize}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLeadId(lead.id);
                                setNewLeadStatus(lead.status);
                              }}
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Lead Update Form */}
              {selectedLeadId && (
                <div className="mt-6 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Update Lead #{selectedLeadId}</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select
                      value={newLeadStatus}
                      onValueChange={setNewLeadStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="negotiating">Negotiating</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedLeadId(null);
                        setNewLeadStatus("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      disabled={isUpdatingLead || !newLeadStatus}
                      onClick={handleUpdateLeadStatus}
                    >
                      {isUpdatingLead ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Lead"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage system users</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : usersError ? (
                <div className="text-center py-4">
                  <p>Failed to load users. Please try again later.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>
                      {!users || users.length === 0 
                        ? "No users found." 
                        : `Total of ${users.length} users`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={user.subscriptionTier === 'pro' ? 'default' : 'outline'}>
                              {user.subscriptionTier}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.remainingDesigns === -1 ? "Unlimited" : user.remainingDesigns}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setNewUserRole(user.role);
                              }}
                              // Disable changing your own role to prevent locking yourself out
                              disabled={user.id === (authLoading ? null : user?.id)}
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* User Update Form */}
              {selectedUserId && (
                <div className="mt-6 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Update User #{selectedUserId}</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <Select
                      value={newUserRole}
                      onValueChange={setNewUserRole}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedUserId(null);
                        setNewUserRole("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      disabled={isUpdatingUser || !newUserRole}
                      onClick={handleUpdateUserRole}
                    >
                      {isUpdatingUser ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update User"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}