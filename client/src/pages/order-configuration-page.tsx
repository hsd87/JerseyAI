import React from 'react';
import OrderConfig from '@/components/order-config';
import { useLocation } from 'wouter';

export default function OrderConfigurationPage() {
  const [location, navigate] = useLocation();
  
  // In a real implementation, we'd get these values from a context, state, or query params
  // For now we'll use mock data
  const mockDesignData = {
    designId: 123,
    designUrls: {
      front: '/images/jersey-front.png',
      back: '/images/jersey-back.png',
    },
    sport: 'soccer',
    kitType: 'jersey',
  };
  
  const handleBackToCustomization = () => {
    navigate('/designer');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OrderConfig 
        {...mockDesignData}
        onBackToCustomization={handleBackToCustomization}
      />
    </div>
  );
}