import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import OrderForm from '@/components/order-form';
import { Design } from '@shared/schema';
import { getQueryFn } from '@/lib/queryClient';

export default function CheckoutPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const match = location.match(/\/checkout\/(\d+)/);
  const designId = match ? parseInt(match[1]) : null;
  const [design, setDesign] = useState<Design | null>(null);
  
  // Fetch the design
  const { data: designData, isLoading, error } = useQuery({
    queryKey: ['/api/designs', designId],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!designId && !!user,
  });
  
  useEffect(() => {
    if (designData) {
      setDesign(designData as Design);
    }
  }, [designData]);

  // If no design ID, redirect to dashboard
  useEffect(() => {
    if (!designId) {
      setLocation('/dashboard');
    }
  }, [designId, setLocation]);
  
  // Handle successful order completion
  const handleOrderSuccess = () => {
    setLocation('/dashboard');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !design) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Design Not Found</h1>
        <p className="text-gray-600 mb-6">
          The design you're looking for could not be found or you don't have permission to access it.
        </p>
        <button
          onClick={() => setLocation('/dashboard')}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Complete Your Order</h1>
        <p className="text-gray-600">
          Configure your order options and provide shipping details to complete your purchase.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <OrderForm design={design} onSuccess={handleOrderSuccess} />
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">Your Design</h2>
            
            {design.frontImageUrl && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Front View</h3>
                <img 
                  src={design.frontImageUrl} 
                  alt="Front design" 
                  className="w-full h-auto rounded-md border border-gray-200"
                />
              </div>
            )}
            
            {design.backImageUrl && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Back View</h3>
                <img 
                  src={design.backImageUrl} 
                  alt="Back design" 
                  className="w-full h-auto rounded-md border border-gray-200"
                />
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">Design Details</h3>
              <ul className="text-sm space-y-1">
                <li><span className="font-medium">Sport:</span> {design.sport}</li>
                <li><span className="font-medium">Type:</span> {design.kitType}</li>
                <li><span className="font-medium">Colors:</span> {design.primaryColor}, {design.secondaryColor}</li>
                {design.sleeveStyle && <li><span className="font-medium">Sleeves:</span> {design.sleeveStyle}</li>}
                {design.collarType && <li><span className="font-medium">Collar:</span> {design.collarType}</li>}
                {design.patternStyle && <li><span className="font-medium">Pattern:</span> {design.patternStyle}</li>}
              </ul>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setLocation('/dashboard')}
                className="w-full py-2 border border-gray-300 rounded-md text-center"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}