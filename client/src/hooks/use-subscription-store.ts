import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';

interface SubscriptionState {
  // Subscription data
  isSubscribed: boolean;
  subscriptionTier: string;
  subscriptionExpiry: string | null;
  subscriptionStatus: string; // active, canceled, past_due, etc.
  remainingDesigns: number;
  
  // Loading state
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSubscription: () => Promise<void>;
  setSubscription: (data: Partial<SubscriptionState>) => void;
  reset: () => void;
}

const initialState = {
  isSubscribed: false,
  subscriptionTier: 'free',
  subscriptionExpiry: null,
  subscriptionStatus: 'inactive',
  remainingDesigns: 0,
  loading: false,
  error: null,
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  ...initialState,
  
  fetchSubscription: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest('GET', '/api/subscription/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      
      const data = await response.json();
      
      set({
        isSubscribed: data.isSubscribed,
        subscriptionTier: data.subscriptionTier,
        subscriptionExpiry: data.subscriptionExpiry,
        subscriptionStatus: data.subscriptionStatus,
        remainingDesigns: data.remainingDesigns,
        loading: false
      });
    } catch (error: any) {
      set({
        error: error.message || 'An error occurred while fetching subscription status',
        loading: false
      });
    }
  },
  
  setSubscription: (data) => {
    set({ ...data });
  },
  
  reset: () => {
    set(initialState);
  }
}));

// Helper hook for components
export function useSubscription() {
  return useSubscriptionStore();
}