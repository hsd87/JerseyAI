import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useOrderStore } from "@/hooks/use-order-store";
import AddonSelector from "./addon-selector";
import RosterBuilder from "./roster-builder";  
import SizeChartDisplay from "./size-chart-display";
import PriceCalculator from "./price-calculator";

interface OrderDetailBuilderProps {
  designId?: number;
  designUrls?: {
    front: string;
    back: string;
  };
  sport?: string;
  kitType?: string;
}

export default function OrderDetailBuilder({
  designId,
  designUrls,
  sport = "soccer",
  kitType = "jersey",
}: OrderDetailBuilderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("individual");
  const { isTeamOrder, setIsTeamOrder } = useOrderStore();
  
  // Setup order with design details if provided
  useEffect(() => {
    if (designId && designUrls) {
      // Initialize order with design details
      useOrderStore.getState().setDesign(designId, designUrls);
    }
    
    if (sport) {
      useOrderStore.getState().setSport(sport);
    }
    
    if (kitType) {
      useOrderStore.getState().setPackageType(kitType);
    }
  }, [designId, designUrls, sport, kitType]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsTeamOrder(value === "team");
  };

  return (
    <Card className="w-full my-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Complete Your Order</CardTitle>
        <CardDescription>
          Customize your kit with size options, team details, and optional add-ons
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Order Type Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="individual">Individual Order</TabsTrigger>
            <TabsTrigger value="team">Team Order</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="pt-4">
            {/* Size Chart Display */}
            <SizeChartDisplay />
          </TabsContent>
          
          <TabsContent value="team" className="pt-4">
            {/* Team Order Roster Builder */}
            <RosterBuilder />
          </TabsContent>
        </Tabs>
        
        {/* Add-on Product Selector */}
        <AddonSelector sport={sport} kitType={kitType} />
        
        {/* Dynamic Price Calculation */}
        <PriceCalculator />
      </CardContent>
      
      <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-end">
        <button 
          className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
          onClick={() => {
            // Validate order
            if (!user) {
              toast({
                title: "Sign in required",
                description: "Please sign in to complete your order",
                variant: "destructive",
              });
              return;
            }
            
            // TODO: Navigate to checkout page with order details
            toast({
              title: "Order Ready",
              description: "Proceeding to checkout...",
            });
          }}
        >
          Proceed to Checkout
        </button>
      </CardFooter>
    </Card>
  );
}