import { useState } from "react";
import DesignForm from "@/components/design-form";
import DesignResults from "@/components/design-results";
import { useDesignStore } from "@/hooks/use-design-store";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight } from "lucide-react";
import OrderConfig from "@/components/order-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DesignerPage() {
  const [currentTab, setCurrentTab] = useState<"customize" | "order">("customize");
  const {
    formData,
    isGenerating,
    hasGenerated,
    frontImage,
    backImage,
    designId
  } = useDesignStore();
  
  const generatedDesign = hasGenerated && designId ? {
    id: designId,
    urls: {
      front: frontImage || '',
      back: backImage || ''
    }
  } : null;
  
  const handleShowOrderConfig = () => {
    setCurrentTab("order");
  };
  
  const handleBackToCustomization = () => {
    setCurrentTab("customize");
  };
  
  return (
    <div className="flex flex-col min-h-screen px-4 sm:px-6">
      <div className="container mx-auto py-6">
        <Tabs 
          value={currentTab} 
          onValueChange={(value) => setCurrentTab(value as "customize" | "order")}
          className="w-full"
        >
          <TabsList className="w-full mb-8">
            <TabsTrigger value="customize" className="text-base flex-1">
              Design Kit
            </TabsTrigger>
            {generatedDesign && (
              <TabsTrigger value="order" className="text-base flex-1">
                Order Configuration
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="customize" className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <DesignForm />
              </div>
              
              <div className="lg:col-span-3">
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 border rounded-lg">
                    <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary/70" />
                    <h3 className="text-xl font-semibold mb-2">
                      Designing your kit...
                    </h3>
                    <p className="text-center text-muted-foreground">
                      Our AI is hard at work creating your custom design.
                      This may take up to 30 seconds.
                    </p>
                  </div>
                ) : generatedDesign ? (
                  <div className="space-y-6">
                    <DesignResults
                      urls={generatedDesign.urls}
                      designId={generatedDesign.id}
                    />
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleShowOrderConfig} 
                        size="lg" 
                        className="mt-4"
                      >
                        Next: Configure Your Order
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 border rounded-lg">
                    <div className="text-center max-w-md">
                      <h3 className="text-xl font-semibold mb-4">
                        Ready to create your custom kit?
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Fill out the form to generate your custom design. 
                        Our AI will create a unique kit based on your preferences.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <span className="bg-primary/10 text-primary font-semibold rounded-full w-5 h-5 flex items-center justify-center mr-2">1</span>
                          <p className="text-left">Choose sport type and colors</p>
                        </div>
                        <div className="flex items-start">
                          <span className="bg-primary/10 text-primary font-semibold rounded-full w-5 h-5 flex items-center justify-center mr-2">2</span>
                          <p className="text-left">Specify design style and preferences</p>
                        </div>
                        <div className="flex items-start">
                          <span className="bg-primary/10 text-primary font-semibold rounded-full w-5 h-5 flex items-center justify-center mr-2">3</span>
                          <p className="text-left">Generate and customize your design</p>
                        </div>
                        <div className="flex items-start">
                          <span className="bg-primary/10 text-primary font-semibold rounded-full w-5 h-5 flex items-center justify-center mr-2">4</span>
                          <p className="text-left">Order your custom kit</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {generatedDesign && (
            <TabsContent value="order" className="flex-1">
              <OrderConfig
                designId={generatedDesign.id}
                designUrls={generatedDesign.urls}
                sport={formData.sport}
                kitType={formData.kitType}
                onBackToCustomization={handleBackToCustomization}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}