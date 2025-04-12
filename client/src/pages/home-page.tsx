import { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import DesignForm from "@/components/design-form";
import DesignResults from "@/components/design-results";
import KitEditor from "@/components/kit-editor";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="font-inter bg-white text-gray-900 min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Design Process Steps */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
            <h1 className="font-sora font-bold text-3xl mb-4 sm:mb-0">Create Your Custom Kit</h1>
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Designs left this month:</span>
                <div className="flex items-center space-x-1">
                  {[...Array(user.remainingDesigns !== undefined && user.remainingDesigns <= 6 ? user.remainingDesigns : 6)].map((_, i) => (
                    <div key={i} className="w-3 h-6 bg-[#39FF14] rounded"></div>
                  ))}
                  {[...Array(Math.max(0, 6 - (user.remainingDesigns !== undefined && user.remainingDesigns <= 6 ? user.remainingDesigns : 6)))].map((_, i) => (
                    <div key={i} className="w-3 h-6 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {user.subscriptionTier === 'pro' ? 'Unlimited' : `${user.remainingDesigns !== undefined ? user.remainingDesigns : 0}/6`}
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
                <div className={`flex items-center justify-center w-10 h-10 ${currentStep >= 1 ? 'bg-[#39FF14]' : 'bg-gray-200'} rounded-full ${currentStep >= 1 ? 'text-white' : 'text-gray-600'} font-bold`}>1</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>Design</p>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 ${currentStep >= 2 ? 'bg-[#39FF14]' : 'bg-gray-200'} rounded-full ${currentStep >= 2 ? 'text-white' : 'text-gray-600'} font-medium`}>2</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>Customize</p>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 ${currentStep >= 3 ? 'bg-[#39FF14]' : 'bg-gray-200'} rounded-full ${currentStep >= 3 ? 'text-white' : 'text-gray-600'} font-medium`}>3</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>Order Details</p>
              </div>
              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 ${currentStep >= 4 ? 'bg-[#39FF14]' : 'bg-gray-200'} rounded-full ${currentStep >= 4 ? 'text-white' : 'text-gray-600'} font-medium`}>4</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 4 ? 'text-gray-900' : 'text-gray-500'}`}>Checkout</p>
              </div>
            </div>
          </div>
        </div>

        {/* Design Form and Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Design Form */}
          <div className="lg:col-span-1">
            <DesignForm remainingDesigns={user?.remainingDesigns} />
          </div>

          {/* Right Column - Design Previews */}
          <div className="lg:col-span-2">
            <DesignResults />
          </div>
        </div>
      </main>
      
      <KitEditor />
      <Footer />
    </div>
  );
}
