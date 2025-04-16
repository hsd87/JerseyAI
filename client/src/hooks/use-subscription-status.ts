import { useQuery } from '@tanstack/react-query';

interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptionTier: string;
  subscriptionExpiry: string | null;
  subscriptionStatus: string;
  remainingDesigns: number;
}

export function useSubscriptionStatus() {
  return useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    // This query will retry when the user logs in
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}