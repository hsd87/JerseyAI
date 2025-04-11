import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription-store";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";

// Lazy-loaded components
const CheckoutPage = React.lazy(() => import('./pages/checkout-page'));
const SubscribePage = React.lazy(() => import('./pages/subscribe-page'));

// Main application component that handles routing and subscription updates
function AppContent() {
  const { user } = useAuth();
  const subscription = useSubscription();
  
  // Fetch subscription status when user is logged in
  React.useEffect(() => {
    if (user) {
      // Use a ref to prevent this effect from running multiple times
      const fetchSub = async () => {
        try {
          await subscription.fetchSubscription();
        } catch (error) {
          console.error("Failed to fetch subscription status:", error);
        }
      };
      
      fetchSub();
    } else {
      // Reset subscription state when user is not logged in
      subscription.reset();
    }
  }, [user]); // Remove subscription from dependencies
  
  return (
    <>
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/dashboard" component={DashboardPage} />
          <ProtectedRoute path="/checkout" component={CheckoutPage} />
          <ProtectedRoute path="/subscribe" component={SubscribePage} />
          <Route component={NotFound} />
        </Switch>
      </React.Suspense>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
