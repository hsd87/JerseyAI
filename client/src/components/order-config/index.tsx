import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PackageSelection from "./package-selection";
import SizingOptions from "./sizing-options";
import AddOns, { AddOn } from "./add-ons";
import OrderSummary from "./order-summary";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface OrderConfigProps {
  designId: number;
  designUrls: {
    front: string;
    back: string;
  };
  sport: string;
  kitType: string;
  onBackToCustomization?: () => void;
}

const packagePrices = {
  "jersey-only": 59.99,
  "jersey-shorts": 89.99,
  "full-kit": 119.99
};

export default function OrderConfig({
  designId,
  designUrls,
  sport,
  kitType,
  onBackToCustomization
}: OrderConfigProps) {
  const [activeTab, setActiveTab] = useState("package");
  const [selectedPackage, setSelectedPackage] = useState("jersey-only");
  const [gender, setGender] = useState("mens");
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [isTeamOrder, setIsTeamOrder] = useState(false);
  const [addOns, setAddOns] = useState<AddOn[]>([
    { id: "matching-socks", name: "Matching Socks", price: 12.99, quantity: 0 },
    { id: "beanie-headband", name: "Beanie/Headband", price: 14.99, quantity: 0 },
    { id: "tracksuit", name: "Matching Tracksuit", price: 79.99, quantity: 0 },
    { id: "kit-bag", name: "Kit Bag / Backpack", price: 24.99, quantity: 0 }
  ]);
  
  const [, navigate] = useLocation();
  
  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
  };
  
  const handleUpdateAddOnQuantity = (id: string, quantity: number) => {
    setAddOns(prevAddOns => 
      prevAddOns.map(addon => 
        addon.id === id ? { ...addon, quantity } : addon
      )
    );
  };
  
  const handleDecrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const handleIncrementQuantity = () => {
    setQuantity(quantity + 1);
  };
  
  const handleProceedToCheckout = () => {
    // In a real implementation, we might save the order details to a global state or context
    // For now, we'll navigate to a checkout page (assuming it exists)
    navigate("/checkout");
  };
  
  const nextTab = () => {
    if (activeTab === "package") setActiveTab("sizing");
    else if (activeTab === "sizing") setActiveTab("add-ons");
  };
  
  const prevTab = () => {
    if (activeTab === "sizing") setActiveTab("package");
    else if (activeTab === "add-ons") setActiveTab("sizing");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configure Your Order</h1>
        <p className="text-gray-600">Choose your package type, size and add-ons</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="w-full p-0 h-auto bg-gray-100 rounded-md">
              <TabsTrigger 
                value="package" 
                className="flex-1 py-3 data-[state=active]:bg-white rounded-md"
              >
                Package
              </TabsTrigger>
              <TabsTrigger 
                value="sizing" 
                className="flex-1 py-3 data-[state=active]:bg-white rounded-md"
              >
                Sizing
              </TabsTrigger>
              <TabsTrigger 
                value="add-ons" 
                className="flex-1 py-3 data-[state=active]:bg-white rounded-md"
              >
                Add-Ons
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="package" className="pt-6">
              <PackageSelection 
                selectedPackage={selectedPackage}
                onSelectPackage={handleSelectPackage}
              />
              
              <div className="flex items-center mt-8 mb-4">
                <Switch 
                  id="team-order" 
                  checked={isTeamOrder}
                  onCheckedChange={setIsTeamOrder}
                />
                <Label htmlFor="team-order" className="ml-2">
                  This is a team order
                </Label>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium mr-4">Quantity:</h3>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-md border border-gray-200 flex items-center justify-center"
                      onClick={handleDecrementQuantity}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-md border border-gray-200 flex items-center justify-center"
                      onClick={handleIncrementQuantity}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <Button onClick={nextTab}>
                  Continue to Sizing
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="sizing" className="pt-6">
              <SizingOptions 
                gender={gender}
                size={size}
                onSelectGender={setGender}
                onSelectSize={setSize}
              />
              
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={prevTab}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Package
                </Button>
                <Button onClick={nextTab}>
                  Continue to Add-Ons
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="add-ons" className="pt-6">
              <AddOns 
                addOns={addOns}
                onUpdateQuantity={handleUpdateAddOnQuantity}
              />
              
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={prevTab}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Sizing
                </Button>
                <Button onClick={() => handleProceedToCheckout()}>
                  Review Order
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          {onBackToCustomization && (
            <Button 
              variant="outline" 
              onClick={onBackToCustomization}
              className="mt-6"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Customization
            </Button>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <OrderSummary 
            packageType={selectedPackage}
            packagePrice={packagePrices[selectedPackage as keyof typeof packagePrices]}
            size={size}
            gender={gender}
            quantity={quantity}
            addOns={addOns}
            onProceedToCheckout={handleProceedToCheckout}
          />
        </div>
      </div>
    </div>
  );
}