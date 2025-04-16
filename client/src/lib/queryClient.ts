import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add logging to debug request details
  console.log(`Making ${method} request to:`, url);
  if (data) {
    console.log('Request payload:', data);
  }
  
  // Add proper API base URL if not included
  if (!url.startsWith('http') && !url.startsWith('/')) {
    url = '/' + url;
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Fetch error for ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add logs for debugging
    const url = queryKey[0] as string;
    console.log(`Making query request to:`, url);
    
    // Ensure proper URL formatting
    let fullUrl = url;
    if (!url.startsWith('http') && !url.startsWith('/')) {
      fullUrl = '/' + url;
    }
    
    try {
      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      // Log response status
      console.log(`Response from ${url}:`, res.status);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Fetch error for query ${url}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
