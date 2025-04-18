import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Enhanced authentication query with more frequent refreshes and better error handling
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 60000, // Refetch every minute to keep session fresh
    refetchOnWindowFocus: true, // Always check auth state when window gets focus
    retry: 2, // Retry failed auth checks a couple times before giving up
    staleTime: 30000 // Consider data stale after 30 seconds (more frequent refreshes)
  });

  // Enhanced login mutation with better error handling and session validation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Attempting login for user:', credentials.username);
      
      try {
        // Add timeout to prevent hanging on network issues
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await apiRequest("POST", "/api/login", credentials, controller.signal);
        
        // Clear timeout since request completed
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          // Try to get detailed error message from response
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || `Login failed with status: ${res.status}`);
          } catch (parseError) {
            throw new Error(`Login failed with status: ${res.status}`);
          }
        }
        
        return await res.json();
      } catch (error: any) {
        // Enhance error by adding authentication context
        if (error.name === 'AbortError') {
          throw new Error('Login request timed out. Please try again.');
        }
        
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log('Login successful for user:', user.username);
      
      // Update cache with user data
      queryClient.setQueryData(["/api/user"], user);
      
      // Immediate refetch to ensure session is established
      setTimeout(() => {
        refetchUser();
      }, 500);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.username}`,
      });
    },
    onError: (error: Error) => {
      console.error('Login mutation error:', error);
      
      toast({
        title: "Login failed",
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Account created",
        description: `Welcome to VORO, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cast to ensure type safety with the SelectUser type
  const safeUser = user ? user as SelectUser : null;
  
  return (
    <AuthContext.Provider
      value={{
        user: safeUser,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
