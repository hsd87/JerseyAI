import { useState, useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import DesignForm from "@/components/design-form";
import DesignEditor from "@/components/design-editor";
import DesignResults from "@/components/design-results";
import { useAuth } from "@/hooks/use-auth";
import { useDesignStore } from "@/hooks/use-design-store";
import OrderConfig from "@/components/order-config";
import TeamRoster from "@/components/team-roster";
import OrderSummary from "@/components/order-summary";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";

export default function DesignerPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const { hasGenerated, isEditorOpen } = useDesignStore();
  const [, navigate] = useLocation();

  // Update current step based on design state
  useEffect(() => {
    if (hasGenerated && !isEditorOpen) {
      setCurrentStep(1); // Generated but not customizing
    } else if (hasGenerated && isEditorOpen) {
      setCurrentStep(2); // Customizing
    }
  }, [hasGenerated, isEditorOpen]);

  // Listen for the custom event from design-editor to proceed to order step
  useEffect(() => {
    const handleProceedToOrderStep = () => {
      setCurrentStep(3); // Move to Order Configuration step
    };

    window.addEventListener('proceedToOrderStep', handleProceedToOrderStep);
    
    return () => {
      window.removeEventListener('proceedToOrderStep', handleProceedToOrderStep);
    };
  }, []);

  // Go to next step in the process
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Go to previous step in the process
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="font-inter bg-white text-gray-900 min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Design Process Steps */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
            <h1 className="font-sora font-bold text-3xl mb-4 sm:mb-0">AI Jersey Designer</h1>
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Designs left this month:</span>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(user.remainingDesigns || 0, 6) }).map((_, i) => (
                    <div key={i} className="w-3 h-6 bg-[#39FF14] rounded"></div>
                  ))}
                  {Array.from({ length: Math.max(0, 6 - (user.remainingDesigns || 0)) }).map((_, i) => (
                    <div key={i} className="w-3 h-6 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {user.subscriptionTier === 'pro' ? 'Unlimited' : `${user.remainingDesigns || 0}/6`}
                </span>
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-between">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 ${currentStep >= 1 ? 'bg-[#39FF14]' : 'bg-gray-200'} rounded-full ${currentStep >= 1 ? 'text-white' : 'text-gray-600'} font-bold cursor-pointer`}
                  onClick={() => hasGenerated && setCurrentStep(1)}
                >1</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>Design</p>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 ${currentStep >= 2 ? 'bg-[#39FF14]' : 'bg-gray-200'} rounded-full ${currentStep >= 2 ? 'text-white' : 'text-gray-600'} font-medium cursor-pointer`}
                  onClick={() => hasGenerated && setCurrentStep(2)}
                >2</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>Customize</p>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 ${currentStep >= 3 ? 'bg-[#39FF14]' : 'bg-gray-200'} rounded-full ${currentStep >= 3 ? 'text-white' : 'text-gray-600'} font-medium cursor-pointer`}
                  onClick={() => hasGenerated && setCurrentStep(3)}
                >3</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>Order Details</p>
              </div>
              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 ${currentStep >= 4 ? 'bg-[#39FF14]' : 'bg-gray-200'} rounded-full ${currentStep >= 4 ? 'text-white' : 'text-gray-600'} font-medium cursor-pointer`}
                  onClick={() => hasGenerated && setCurrentStep(4)}
                >4</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 4 ? 'text-gray-900' : 'text-gray-500'}`}>Checkout</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Displays based on current step */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Design Form */}
            <div className="lg:col-span-1">
              <DesignForm remainingDesigns={user?.remainingDesigns} />
            </div>

            {/* Right Column - Design Results */}
            <div className="lg:col-span-2">
              <DesignResults />
              
              {/* Buttons removed as per client request */}
            </div>
          </div>
        )}

        {/* Step 2: Customization */}
        {currentStep === 2 && (
          <div>
            <DesignEditor />
            
            <div className="mt-6 flex justify-between items-center">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Design
              </Button>
              {/* Buttons removed as per client request */}
            </div>
          </div>
        )}

        {/* Step 3: Order Configuration */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-8">
                <OrderConfig 
                  designId={useDesignStore.getState().designId || 0}
                  designUrls={{
                    front: useDesignStore.getState().frontImage || '',
                    back: '' // No back view as per requirement
                  }}
                  sport={useDesignStore.getState().formData.sport}
                  kitType={useDesignStore.getState().formData.kitType}
                  onBackToCustomization={prevStep}
                />
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customization
                </Button>
                <Button onClick={nextStep} className="bg-green-600 hover:bg-green-700">
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Preview panel */}
            <div className="lg:col-span-1">
              <OrderSummary showDetailed={false} />
            </div>
          </div>
        )}

        {/* Step 4: Checkout */}
        {currentStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6">Complete Your Order</h2>
                
                {/* Shipping form will go here - to be built later */}
                <div className="space-y-4">
                  {/* Placeholder for shipping form */}
                  <div className="border border-dashed border-gray-300 rounded-md p-6 text-center text-gray-500">
                    Shipping form will be integrated here
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Order Details
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <OrderSummary showDetailed={true} />
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}