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
  
  // Ensure the URL is properly normalized for the current environment
  const normalizedUrl = url.replace(/\/+/g, '/');
  
  // Track retry attempts for this request
  let retryCount = 0;
  const MAX_RETRIES = 2;
  
  const executeRequest = async (): Promise<Response> => {
    try {
      const res = await fetch(normalizedUrl, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        // Add a longer timeout for slower connections
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
  
      // Check for non-ok responses and handle them appropriately
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API error for ${method} ${normalizedUrl}:`, {
          status: res.status,
          statusText: res.statusText,
          body: errorText
        });
        
        // For certain status codes, we can attempt retry
        if ((res.status >= 500 || res.status === 408) && retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying ${method} request to ${normalizedUrl} (attempt ${retryCount})`);
          return executeRequest();
        }
      }
  
      await throwIfResNotOk(res);
      return res;
    } catch (error) {
      console.error(`Fetch error for ${method} ${normalizedUrl}:`, error);
      
      // Network errors or timeouts can be retried
      if ((error instanceof TypeError || error instanceof DOMException) && retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = 1000 * retryCount; // Exponential backoff
        console.log(`Network error, retrying in ${delay}ms (attempt ${retryCount})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeRequest();
      }
      
      throw error;
    }
  };
  
  return executeRequest();
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
    
    // Normalize URL to prevent double slashes
    const normalizedUrl = fullUrl.replace(/\/+/g, '/');
    
    // Track retry attempts
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    const executeQuery = async (): Promise<T> => {
      try {
        const res = await fetch(normalizedUrl, {
          credentials: "include",
          // Add a longer timeout for slower connections
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
  
        // Log response status
        console.log(`Response from ${url}:`, res.status);
        
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null as unknown as T;
        }
  
        // Check for server errors that might benefit from retry
        if ((res.status >= 500 || res.status === 408) && retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = 1000 * retryCount;
          console.log(`Server error ${res.status}, retrying query in ${delay}ms (attempt ${retryCount})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeQuery();
        }
  
        await throwIfResNotOk(res);
        return await res.json();
      } catch (error) {
        console.error(`Fetch error for query ${url}:`, error);
        
        // Network errors or timeouts can be retried
        if ((error instanceof TypeError || error instanceof DOMException) && retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = 1000 * retryCount; // Exponential backoff
          console.log(`Network error, retrying query in ${delay}ms (attempt ${retryCount})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeQuery();
        }
        
        throw error;
      }
    };
    
    return executeQuery();
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
