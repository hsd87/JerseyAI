import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription-store";

import LandingPage from "@/pages/landing-page";
import DesignerPage from "@/pages/designer-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";

// Lazy-loaded components
const CheckoutPage = React.lazy(() => import('./pages/checkout-page'));
const SubscribePage = React.lazy(() => import('./pages/subscribe-page'));
const JerseyEditorPage = React.lazy(() => import('./pages/jersey-editor-page'));
const TestPage = React.lazy(() => import('./pages/test-page'));

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
          {/* Regular routes */}
          <Route path="/">
            <LandingPage />
          </Route>
          <Route path="/designer">
            <DesignerPage />
          </Route>
          <Route path="/auth">
            <AuthPage />
          </Route>
          <Route path="/jersey-editor">
            <JerseyEditorPage />
          </Route>
          
          {/* Protected routes */}
          <Route path="/dashboard">
            <ProtectedRoute path="/dashboard" component={DashboardPage} />
          </Route>
          <Route path="/checkout">
            <ProtectedRoute path="/checkout" component={CheckoutPage} />
          </Route>
          <Route path="/subscribe">
            <ProtectedRoute path="/subscribe" component={SubscribePage} />
          </Route>
          <Route path="/test">
            <ProtectedRoute path="/test" component={TestPage} />
          </Route>
          
          {/* 404 route */}
          <Route>
            <NotFound />
          </Route>
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
