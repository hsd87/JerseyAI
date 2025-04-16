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
  
  // Set longer timeout for design generation endpoints
  const isDesignGenerateRequest = normalizedUrl.includes('/generate');
  const timeout = isDesignGenerateRequest ? 180000 : 30000; // 3 minutes for generation, 30 seconds for others
  
  // Disable retries for design generation to prevent duplicate API calls
  let retryCount = 0;
  const MAX_RETRIES = isDesignGenerateRequest ? 0 : 2; // No retries for generation
  
  const executeRequest = async (): Promise<Response> => {
    try {
      console.log(`Request timeout set to ${timeout/1000} seconds`);
      
      const res = await fetch(normalizedUrl, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        signal: AbortSignal.timeout(timeout)
      });
  
      // Check for non-ok responses and handle them appropriately
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API error for ${method} ${normalizedUrl}:`, {
          status: res.status,
          statusText: res.statusText,
          body: errorText
        });
        
        // For certain status codes, we can attempt retry if retries are allowed
        if (!isDesignGenerateRequest && (res.status >= 500 || res.status === 408) && retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying ${method} request to ${normalizedUrl} (attempt ${retryCount})`);
          return executeRequest();
        }
      }
  
      await throwIfResNotOk(res);
      return res;
    } catch (error) {
      console.error(`Fetch error for ${method} ${normalizedUrl}:`, error);
      
      // Only retry network errors for non-generation requests
      if (!isDesignGenerateRequest && (error instanceof TypeError || error instanceof DOMException) && retryCount < MAX_RETRIES) {
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
export const getQueryFn = <TData = any,>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<TData> => {
  const { on401: unauthorizedBehavior } = options;
  
  return async ({ queryKey }) => {
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
    
    // Set longer timeout for design endpoints
    const isDesignRelatedRequest = normalizedUrl.includes('/designs') || normalizedUrl.includes('/generate');
    const timeout = isDesignRelatedRequest ? 180000 : 30000; // 3 minutes for design, 30 seconds for others
  
    // Disable retries for design generation to prevent duplicate API calls
    let retryCount = 0;
    const MAX_RETRIES = isDesignRelatedRequest ? 0 : 2; // No retries for design-related endpoints
    
    const executeQuery = async (): Promise<any> => {
      try {
        console.log(`Query timeout set to ${timeout/1000} seconds`);
        
        const res = await fetch(normalizedUrl, {
          credentials: "include",
          signal: AbortSignal.timeout(timeout)
        });
  
        // Log response status
        console.log(`Response from ${url}:`, res.status);
        
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null as any;
        }
  
        // Check for server errors that might benefit from retry - only for non-design requests
        if (!isDesignRelatedRequest && (res.status >= 500 || res.status === 408) && retryCount < MAX_RETRIES) {
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
        
        // Network errors or timeouts can be retried, but only for non-design requests
        if (!isDesignRelatedRequest && (error instanceof TypeError || error instanceof DOMException) && retryCount < MAX_RETRIES) {
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
