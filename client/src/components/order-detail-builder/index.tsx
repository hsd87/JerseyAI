import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrderStore } from '@/hooks/use-order-store';
import { Shirt, Users, Package, CreditCard, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

// Import sub-components
import AddonSelector from './addon-selector';
import RosterBuilder from './roster-builder';
import SizeChartDisplay from './size-chart-display';
import PriceCalculator from './price-calculator';

export default function OrderDetailBuilder() {
  const { items, addOns, teamMembers, isTeamOrder, setTeamOrder } = useOrderStore();
  const [activeTab, setActiveTab] = useState('sizes');

  // Count total items in cart (including addons)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0) + 
                    addOns.reduce((sum, addon) => sum + addon.quantity, 0);

  // Handle tab change and navigation
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const goToNextTab = () => {
    if (activeTab === 'sizes') setActiveTab('addons');
    else if (activeTab === 'addons') setActiveTab(isTeamOrder ? 'team' : 'checkout');
    else if (activeTab === 'team') setActiveTab('checkout');
  };

  const goToPrevTab = () => {
    if (activeTab === 'checkout') setActiveTab(isTeamOrder ? 'team' : 'addons');
    else if (activeTab === 'team') setActiveTab('addons');
    else if (activeTab === 'addons') setActiveTab('sizes');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Customize your order with sizes, add-ons, and team information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sizes" className="flex items-center">
                <Shirt className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sizes</span>
                <span className="ml-1.5">{items.length > 0 ? `(${items.reduce((sum, item) => sum + item.quantity, 0)})` : ''}</span>
              </TabsTrigger>
              
              <TabsTrigger value="addons" className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add-ons</span>
                <span className="ml-1.5">{addOns.length > 0 ? `(${addOns.length})` : ''}</span>
              </TabsTrigger>
              
              <TabsTrigger value="team" disabled={!isTeamOrder} className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Team</span>
                <span className="ml-1.5">{teamMembers.length > 0 ? `(${teamMembers.length})` : ''}</span>
              </TabsTrigger>
              
              <TabsTrigger value="checkout" disabled={items.length === 0} className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Checkout</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="sizes">
                <div className="grid md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <SizeChartDisplay />
                  </div>
                  
                  <div className="md:col-span-4">
                    <div className="space-y-4">
                      <PriceCalculator />
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Team Order?</span>
                            <Button 
                              variant={isTeamOrder ? "default" : "outline"}
                              size="sm"
                              onClick={() => setTeamOrder(!isTeamOrder)}
                              className="gap-2"
                            >
                              <Users className="h-4 w-4" />
                              {isTeamOrder ? 'Team Order Active' : 'Make Team Order'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={goToNextTab} 
                    disabled={items.length === 0}
                    className="flex items-center"
                  >
                    Continue to Add-ons
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="addons">
                <div className="grid md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <AddonSelector />
                  </div>
                  
                  <div className="md:col-span-4">
                    <PriceCalculator />
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    onClick={goToPrevTab}
                    className="flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Sizes
                  </Button>
                  
                  <Button 
                    onClick={goToNextTab}
                    className="flex items-center"
                  >
                    {isTeamOrder ? 'Continue to Team Roster' : 'Continue to Checkout'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="team">
                <div className="grid md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <RosterBuilder />
                  </div>
                  
                  <div className="md:col-span-4">
                    <PriceCalculator />
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    onClick={goToPrevTab}
                    className="flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Add-ons
                  </Button>
                  
                  <Button 
                    onClick={goToNextTab}
                    disabled={teamMembers.length === 0}
                    className="flex items-center"
                  >
                    Continue to Checkout
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="checkout">
                <div className="grid md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Items Summary */}
                          <div>
                            <h3 className="font-medium mb-2">Selected Items</h3>
                            <ul className="space-y-3">
                              {items.map((item, index) => (
                                <li key={index} className="flex justify-between border-b pb-2">
                                  <div>
                                    <div className="font-medium">{item.type === 'jersey' ? 'Jersey' : item.type}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Size: {item.size}, Qty: {item.quantity}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Add-ons Summary */}
                          {addOns.length > 0 && (
                            <div>
                              <h3 className="font-medium mb-2">Add-ons</h3>
                              <ul className="space-y-3">
                                {addOns.map((addon, index) => (
                                  <li key={index} className="flex justify-between border-b pb-2">
                                    <div>
                                      <div className="font-medium">{addon.name || addon.type}</div>
                                      {addon.customValue && (
                                        <div className="text-sm text-muted-foreground">
                                          Value: {addon.customValue}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      ${addon.price.toFixed(2)}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Team Members Summary (if applicable) */}
                          {isTeamOrder && teamMembers.length > 0 && (
                            <div>
                              <h3 className="font-medium mb-2">Team Roster</h3>
                              <div className="text-sm">
                                <p>Total Players: {teamMembers.length}</p>
                                {teamMembers.length >= 10 && (
                                  <p className="text-green-600">Team discount will be applied!</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="md:col-span-4">
                    <PriceCalculator />
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    onClick={goToPrevTab}
                    className="flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {isTeamOrder ? 'Back to Team Roster' : 'Back to Add-ons'}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Floating action buttons for mobile */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden z-10">
          <Button
            className="rounded-full w-12 h-12 flex items-center justify-center"
            onClick={() => setActiveTab('checkout')}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {totalItems}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}