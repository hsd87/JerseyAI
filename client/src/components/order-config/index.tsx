import React, { useState } from "react";
import PackageSelection from "./package-selection";
import SizingOptions from "./sizing-options";
import AddOns, { AddOn } from "./add-ons";
import OrderSummary from "./order-summary";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, ChevronLeft, Info } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const fabricOptions = {
  "soccer": ["Standard Polyester", "Premium Breathable", "Pro Performance"],
  "basketball": ["Standard Mesh", "Premium Breathable", "Pro Performance"],
  "rugby": ["Standard Polyester", "Heavy Duty", "Pro Performance"],
  "cricket": ["Standard Polyester", "Premium Breathable", "Pro Performance"],
  "esports": ["Standard Cotton Blend", "Premium Polyester", "Pro Performance"],
  "volleyball": ["Standard Polyester", "Premium Breathable", "Pro Performance"],
  "feild hockey": ["Standard Polyester", "Premium Breathable", "Pro Performance"],
  "handball": ["Standard Polyester", "Premium Breathable", "Pro Performance"]
};

export default function OrderConfig({
  designId,
  designUrls,
  sport,
  kitType,
  onBackToCustomization
}: OrderConfigProps) {
  const [selectedPackage, setSelectedPackage] = useState("jersey-only");
  const [gender, setGender] = useState("mens");
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [isTeamOrder, setIsTeamOrder] = useState(false);
  const [fabric, setFabric] = useState(fabricOptions[sport as keyof typeof fabricOptions]?.[0] || "Standard Polyester");
  const [showSizeChart, setShowSizeChart] = useState(false);
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
  
  const availableFabrics = fabricOptions[sport as keyof typeof fabricOptions] || fabricOptions.soccer;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configure Your Order</h1>
        <p className="text-gray-600">Choose your package type, size and add-ons</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-8">
            {/* Package Selection */}
            <div>
              <h2 className="text-xl font-medium mb-4">Package</h2>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-1 text-gray-400">
                      <Info size={16} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-60 text-sm">
                        Team orders allow you to specify different names, numbers, 
                        and sizes for multiple jerseys. Bulk discounts apply 
                        automatically.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
            </div>
            
            {/* Add-ons */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-medium mb-4">Add-Ons</h2>
              <AddOns 
                addOns={addOns}
                onUpdateQuantity={handleUpdateAddOnQuantity}
              />
            </div>
            
            {/* Sizing & Fabric */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Sizing & Fabric Details</h2>
                <Dialog open={showSizeChart} onOpenChange={setShowSizeChart}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Size Chart</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <div className="p-4">
                      <h3 className="text-xl font-bold mb-4">Size Chart for {sport.charAt(0).toUpperCase() + sport.slice(1)}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2">Size</th>
                              <th className="border p-2">Chest (in)</th>
                              <th className="border p-2">Waist (in)</th>
                              <th className="border p-2">Hip (in)</th>
                              <th className="border p-2">Recommended Height</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2">XS</td>
                              <td className="border p-2">32-34</td>
                              <td className="border p-2">26-28</td>
                              <td className="border p-2">34-36</td>
                              <td className="border p-2">5'1" - 5'5"</td>
                            </tr>
                            <tr>
                              <td className="border p-2">S</td>
                              <td className="border p-2">34-36</td>
                              <td className="border p-2">28-30</td>
                              <td className="border p-2">36-38</td>
                              <td className="border p-2">5'3" - 5'7"</td>
                            </tr>
                            <tr>
                              <td className="border p-2">M</td>
                              <td className="border p-2">36-38</td>
                              <td className="border p-2">30-32</td>
                              <td className="border p-2">38-40</td>
                              <td className="border p-2">5'5" - 5'9"</td>
                            </tr>
                            <tr>
                              <td className="border p-2">L</td>
                              <td className="border p-2">38-40</td>
                              <td className="border p-2">32-34</td>
                              <td className="border p-2">40-42</td>
                              <td className="border p-2">5'7" - 6'0"</td>
                            </tr>
                            <tr>
                              <td className="border p-2">XL</td>
                              <td className="border p-2">40-42</td>
                              <td className="border p-2">34-36</td>
                              <td className="border p-2">42-44</td>
                              <td className="border p-2">5'9" - 6'2"</td>
                            </tr>
                            <tr>
                              <td className="border p-2">XXL</td>
                              <td className="border p-2">42-44</td>
                              <td className="border p-2">36-38</td>
                              <td className="border p-2">44-46</td>
                              <td className="border p-2">5'11" - 6'4"</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-4 text-sm text-gray-600">
                        Note: Size charts are approximate. For team orders, we recommend collecting accurate measurements.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Card className="mb-6">
                <CardContent className="pt-6 space-y-6">
                  {/* Fabric Options */}
                  <div className="mb-4">
                    <Label htmlFor="fabric-type" className="mb-2 block font-medium">
                      Fabric Type
                    </Label>
                    <Select 
                      value={fabric} 
                      onValueChange={setFabric}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fabric type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFabrics.map((fabricType) => (
                          <SelectItem key={fabricType} value={fabricType}>
                            {fabricType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      {fabric === "Pro Performance" 
                        ? "Our highest quality fabric with moisture-wicking technology" 
                        : fabric === "Premium Breathable" || fabric === "Premium Polyester" || fabric === "Heavy Duty"
                          ? "Enhanced comfort and durability for frequent use"
                          : "Standard quality fabric suitable for recreational use"}
                    </p>
                  </div>
                  
                  {/* Gender and Sizing */}
                  <SizingOptions 
                    gender={gender}
                    size={size}
                    onSelectGender={setGender}
                    onSelectSize={setSize}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-between pt-4">
              {onBackToCustomization && (
                <Button 
                  variant="outline" 
                  onClick={onBackToCustomization}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Customization
                </Button>
              )}
              <div className="ml-auto">
                <Button onClick={() => handleProceedToCheckout()}>
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <OrderSummary 
            packageType={selectedPackage}
            packagePrice={packagePrices[selectedPackage as keyof typeof packagePrices]}
            size={size}
            gender={gender}
            fabric={fabric}
            quantity={quantity}
            addOns={addOns}
            onProceedToCheckout={handleProceedToCheckout}
          />
        </div>
      </div>
    </div>
  );
}