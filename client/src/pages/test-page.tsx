import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export default function TestPage() {
  const { user, loginMutation, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAuth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/test-auth', {
        credentials: 'include'
      });
      const data = await res.json();
      setSessionInfo(data);
      toast({
        title: 'Session Info',
        description: `Session ID: ${data.sessionID}, Views: ${data.views}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testQuickLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/test-login', {
        credentials: 'include'
      });
      const data = await res.json();
      toast({
        title: 'Test Login',
        description: `Logged in as ${data.user.username}. Session ID: ${data.sessionID}`,
      });
      // Refresh user data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testUserAPI = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user', {
        credentials: 'include'
      });
      if (res.status === 401) {
        toast({
          title: 'Not Authenticated',
          description: 'You are not logged in.',
          variant: 'destructive',
        });
        return;
      }
      const data = await res.json();
      toast({
        title: 'User API',
        description: `Authenticated as ${data.username}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOrderList = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('GET', '/api/orders');
      const data = await res.json();
      toast({
        title: 'Orders API',
        description: `Found ${data.length} orders`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>Current user authentication status</CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <p className="font-medium text-green-800">Authenticated</p>
                  <p className="text-sm text-green-700">Username: {user.username}</p>
                  <p className="text-sm text-green-700">Email: {user.email || 'Not provided'}</p>
                  <p className="text-sm text-green-700">Subscription: {user.subscriptionTier}</p>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                  <p className="font-medium text-yellow-800">Not authenticated</p>
                  <p className="text-sm text-yellow-700">Please log in first</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              {user ? (
                <Button 
                  variant="destructive" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending || isLoading}
                >
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </Button>
              ) : (
                <Button 
                  onClick={() => loginMutation.mutate({ username: 'testuser', password: 'password' })}
                  disabled={loginMutation.isPending || isLoading}
                >
                  {loginMutation.isPending ? 'Logging in...' : 'Login as testuser'}
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
              <CardDescription>Test various authentication endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button 
                  className="w-full" 
                  onClick={testAuth}
                  disabled={isLoading}
                >
                  Test Session
                </Button>
                <p className="text-sm text-gray-500 mt-1">
                  Checks if a session exists and increments a counter
                </p>
              </div>
              
              <div>
                <Button 
                  className="w-full" 
                  onClick={testQuickLogin}
                  disabled={isLoading}
                >
                  Quick Login
                </Button>
                <p className="text-sm text-gray-500 mt-1">
                  Uses the test-login endpoint to login as testuser
                </p>
              </div>
              
              <div>
                <Button 
                  className="w-full" 
                  onClick={testUserAPI}
                  disabled={isLoading}
                >
                  Test User API
                </Button>
                <p className="text-sm text-gray-500 mt-1">
                  Tests the /api/user endpoint directly
                </p>
              </div>
              
              <div>
                <Button 
                  className="w-full" 
                  onClick={testOrderList}
                  disabled={isLoading}
                >
                  Test Orders API
                </Button>
                <p className="text-sm text-gray-500 mt-1">
                  Tests the /api/orders endpoint (requires auth)
                </p>
              </div>
            </CardContent>
            <CardFooter>
              {sessionInfo && (
                <pre className="text-xs bg-gray-100 p-2 rounded w-full overflow-auto">
                  {JSON.stringify(sessionInfo, null, 2)}
                </pre>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}