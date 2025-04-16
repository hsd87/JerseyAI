import { useDesignStore } from "@/hooks/use-design-store";
import { Button } from "@/components/ui/button";
import { useOrderStore } from "@/hooks/use-order-store";
import { ShoppingCart, PenSquare, RotateCcw } from "lucide-react";

export default function DesignResults() {
  const { 
    isGenerating, 
    hasGenerated, 
    frontImage, 
    backImage,
    toggleEditor,
    formData
  } = useDesignStore();

  const handleCustomize = () => {
    toggleEditor(true);
  };

  const handleGenerateNew = () => {
    // This will trigger a new design generation
    document.getElementById('generateButton')?.click();
  };
  
  const handleBuyNow = () => {
    // This will be implemented to proceed to order configuration step
    // We'll handle this from the parent component for now
  };

  return (
    <div id="resultsContainer" className="space-y-6">
      {/* Loading State */}
      {isGenerating && (
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
          <div className="animate-pulse flex flex-col items-center space-y-6">
            <div className="rounded-xl bg-gray-200 h-64 w-full"></div>
            
            <div className="flex justify-center">
              <div className="inline-flex space-x-1">
                <span className="w-3 h-3 bg-[#39FF14] rounded-full animate-bounce" style={{ animationDelay: "-0.32s" }}></span>
                <span className="w-3 h-3 bg-[#39FF14] rounded-full animate-bounce" style={{ animationDelay: "-0.16s" }}></span>
                <span className="w-3 h-3 bg-[#39FF14] rounded-full animate-bounce"></span>
              </div>
            </div>
            
            <div className="text-lg font-sora text-gray-800">
              Your kit design is being generated...
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              Our AI is creating a unique design based on your preferences. This typically takes 20-30 seconds.
            </p>
          </div>
        </div>
      )}
      
      {/* Results Content */}
      {!isGenerating && (
        <div id="resultsContent">
          {/* Intro Message - First View */}
          {!hasGenerated && (
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
              <div className="text-center">
                <img 
                  src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop" 
                  alt="Soccer Jersey Design" 
                  className="mx-auto rounded-lg w-full max-w-lg h-auto object-cover mb-6" 
                />
                
                <h2 className="text-2xl font-sora font-semibold mb-2">Ready to create your dream kit?</h2>
                <p className="text-gray-600 max-w-xl mx-auto mb-8">
                  Fill out the design form and let our AI generate a custom jersey based on your preferences. Then customize with your logo, name, and number.
                </p>
                
                <div className="flex flex-wrap justify-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <i className="fas fa-tshirt mr-1"></i> 5 Sports
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <i className="fas fa-palette mr-1"></i> Custom Colors
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <i className="fas fa-bolt mr-1"></i> AI-Generated
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <i className="fas fa-users mr-1"></i> Team Orders
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Generated Results - After Generation */}
          {hasGenerated && (
            <div className="w-full max-w-3xl mx-auto">
              {/* Front View Card Only */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="relative">
                  <img 
                    src={frontImage || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=600&auto=format&fit=crop"} 
                    alt="Front view of generated jersey" 
                    className="w-full h-[500px] object-contain bg-gray-50" 
                  />
                  
                  {/* Preview Overlay */}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-full transition-colors">
                      <i className="fas fa-expand-alt"></i>
                    </button>
                    <button className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-full transition-colors">
                      <i className="fas fa-heart"></i>
                    </button>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-4">
                    <span className="text-sm font-medium">Jersey Preview</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-sora font-medium">
                      {formData.sport.charAt(0).toUpperCase() + formData.sport.slice(1)} Jersey - Design #{Math.floor(Math.random() * 10000)}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Front View</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons - Added Next button for customization */}
          {hasGenerated && (
            <div className="space-y-4 mt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleGenerateNew}
                  variant="outline" 
                  className="flex-1 inline-flex justify-center items-center py-3 px-4"
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Generate New Design
                </Button>
                <Button
                  onClick={handleCustomize}
                  className="flex-1 bg-primary hover:bg-primary/90 inline-flex justify-center items-center py-3 px-4"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
