import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PackageSelection from "./package-selection";
import SizingOptions from "./sizing-options";
import AddOns from "./add-ons";
import OrderSummary from "./order-summary";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, ChevronLeft, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import { useProductStore } from "@/hooks/use-product-store";
import { Product, Size, Gender } from "@shared/products";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import TeamOrderForm from "./team-order-form";

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

export default function OrderConfig({
  designId,
  designUrls,
  sport,
  kitType,
  onBackToCustomization
}: OrderConfigProps) {
  // Tabs state
  const [activeTab, setActiveTab] = useState("package");
  
  // Basic order configuration
  const [gender, setGender] = useState<Gender>("male");
  const [size, setSize] = useState<Size>("M");
  const [baseQuantity, setBaseQuantity] = useState(1);
  
  // Product store for managing products and order items
  const {
    kitProducts,
    addonProducts,
    isLoading,
    error,
    selectedItems,
    isTeamOrder,
    fetchKitProductsForDesign,
    fetchAddonProducts,
    addItemToOrder,
    updateOrderItem,
    removeOrderItem,
    setTeamOrder,
    calculateTotalPrice,
    resetOrderItems
  } = useProductStore();
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch products on component mount
  useEffect(() => {
    fetchKitProductsForDesign(kitType);
    fetchAddonProducts();
    
    // Reset order items when component unmounts
    return () => {
      resetOrderItems();
    };
  }, [fetchKitProductsForDesign, fetchAddonProducts, kitType, resetOrderItems]);
  
  // Add base products to order when kitProducts change
  useEffect(() => {
    if (kitProducts.length > 0 && selectedItems.length === 0) {
      // Add each kit product to the order automatically
      kitProducts.forEach(product => {
        addItemToOrder(product, size, gender, baseQuantity);
      });
    }
  }, [kitProducts, selectedItems.length, addItemToOrder, size, gender, baseQuantity]);
  
  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, baseQuantity + change);
    setBaseQuantity(newQuantity);
    
    // Update all base product quantities
    selectedItems.forEach((item, index) => {
      // Only update items that are part of the kit (not add-ons)
      const isKitItem = kitProducts.some(p => p.skuId === item.skuId);
      if (isKitItem) {
        updateOrderItem(index, { quantity: newQuantity });
      }
    });
  };
  
  const handleSizeChange = (newSize: Size) => {
    setSize(newSize);
    
    // Update all kit item sizes
    selectedItems.forEach((item, index) => {
      const isKitItem = kitProducts.some(p => p.skuId === item.skuId);
      if (isKitItem) {
        updateOrderItem(index, { size: newSize });
      }
    });
  };
  
  const handleGenderChange = (newGender: Gender) => {
    setGender(newGender);
    
    // Update all kit item genders
    selectedItems.forEach((item, index) => {
      const isKitItem = kitProducts.some(p => p.skuId === item.skuId);
      if (isKitItem) {
        updateOrderItem(index, { gender: newGender });
      }
    });
  };
  
  const handleAddAddon = (addonProduct: Product) => {
    // Check if the addon is already in the order
    const existingIndex = selectedItems.findIndex(item => item.skuId === addonProduct.skuId);
    
    if (existingIndex >= 0) {
      // If already in the order, increment quantity
      const currentQuantity = selectedItems[existingIndex].quantity;
      updateOrderItem(existingIndex, { quantity: currentQuantity + 1 });
    } else {
      // If not in the order, add it
      addItemToOrder(addonProduct, size, gender, 1);
    }
    
    toast({
      title: "Added to order",
      description: `Added ${addonProduct.name} to your order`,
    });
  };
  
  const handleUpdateAddonQuantity = (index: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeOrderItem(index);
    } else {
      updateOrderItem(index, { quantity: newQuantity });
    }
  };
  
  const handleTeamOrderToggle = (value: boolean) => {
    setTeamOrder(value);
  };
  
  const handleProceedToCheckout = () => {
    // Create an order in the backend
    // For this example, we'll just navigate to the checkout page
    navigate("/checkout");
  };
  
  const nextTab = () => {
    if (activeTab === "package") setActiveTab("sizing");
    else if (activeTab === "sizing") setActiveTab("add-ons");
    else if (activeTab === "add-ons" && isTeamOrder) setActiveTab("team-roster");
    else if (activeTab === "add-ons" && !isTeamOrder) handleProceedToCheckout();
    else if (activeTab === "team-roster") handleProceedToCheckout();
  };
  
  const prevTab = () => {
    if (activeTab === "sizing") setActiveTab("package");
    else if (activeTab === "add-ons") setActiveTab("sizing");
    else if (activeTab === "team-roster") setActiveTab("add-ons");
  };

  // Get next button text based on active tab
  const getNextButtonText = () => {
    if (activeTab === "add-ons" && !isTeamOrder) return "Review Order";
    if (activeTab === "team-roster") return "Review Order";
    return `Continue to ${
      activeTab === "package" ? "Sizing" : 
      activeTab === "sizing" ? "Add-Ons" : 
      "Team Roster"
    }`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => { fetchKitProductsForDesign(kitType); fetchAddonProducts(); }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configure Your Order</h1>
        <p className="text-gray-600">Choose your package type, size and add-ons</p>
      </div>
      
      {/* Design Preview */}
      <div className="mb-8">
        <Card className="overflow-hidden">
          <div className="aspect-w-16 aspect-h-9 bg-gray-100">
            <img 
              src={designUrls.front} 
              alt="Your design" 
              className="object-contain w-full h-[300px]"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg">Your Custom {sport.charAt(0).toUpperCase() + sport.slice(1)} Design</h3>
            <p className="text-sm text-gray-500">Design ID: {designId}</p>
          </div>
        </Card>
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
              {isTeamOrder && (
                <TabsTrigger 
                  value="team-roster" 
                  className="flex-1 py-3 data-[state=active]:bg-white rounded-md"
                >
                  Team Roster
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="package" className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Base Package</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {kitProducts.map((product) => (
                      <Card key={product.skuId} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-500">SKU: {product.skuId}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${product.basePrice.toFixed(2)}</div>
                            <span className="text-xs text-green-600">Included</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center mt-8 mb-4">
                  <Switch 
                    id="team-order" 
                    checked={isTeamOrder}
                    onCheckedChange={handleTeamOrderToggle}
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
                        onClick={() => handleQuantityChange(-1)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{baseQuantity}</span>
                      <button
                        type="button"
                        className="h-9 w-9 rounded-md border border-gray-200 flex items-center justify-center"
                        onClick={() => handleQuantityChange(1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <Button onClick={nextTab}>
                  {getNextButtonText()}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="sizing" className="pt-6">
              <SizingOptions 
                gender={gender}
                size={size}
                onSelectGender={handleGenderChange}
                onSelectSize={handleSizeChange}
              />
              
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={prevTab}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Package
                </Button>
                <Button onClick={nextTab}>
                  {getNextButtonText()}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="add-ons" className="pt-6">
              <AddOns 
                addOns={addonProducts}
                selectedAddons={selectedItems.filter(item => 
                  !kitProducts.some(p => p.skuId === item.skuId)
                )}
                onAddAddon={handleAddAddon}
                onUpdateQuantity={handleUpdateAddonQuantity}
              />
              
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={prevTab}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Sizing
                </Button>
                <Button onClick={nextTab}>
                  {getNextButtonText()}
                </Button>
              </div>
            </TabsContent>
            
            {isTeamOrder && (
              <TabsContent value="team-roster" className="pt-6">
                <TeamOrderForm 
                  products={kitProducts}
                  baseSize={size}
                  baseGender={gender}
                />
                
                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={prevTab}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Add-Ons
                  </Button>
                  <Button onClick={nextTab}>
                    {getNextButtonText()}
                  </Button>
                </div>
              </TabsContent>
            )}
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
            items={selectedItems}
            totalPrice={calculateTotalPrice()}
            isTeamOrder={isTeamOrder}
            onProceedToCheckout={handleProceedToCheckout}
          />
        </div>
      </div>
    </div>
  );
}