import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrderStore } from "@/hooks/use-order-store";
import { OrderItem } from "@/hooks/use-order-types";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MinusCircle } from "lucide-react";

type Addon = {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceLabel: string;
  image?: string;
};

// Predefined add-ons
const AVAILABLE_ADDONS: Addon[] = [
  {
    id: 'name-printing',
    name: 'Name Printing',
    description: 'Add custom name to the back of your jersey',
    price: 9.99,
    priceLabel: '$9.99',
    image: '/assets/name-printing.png',
  },
  {
    id: 'number-printing',
    name: 'Number Printing',
    description: 'Add custom number to the back of your jersey',
    price: 7.99,
    priceLabel: '$7.99',
    image: '/assets/number-printing.png',
  },
  {
    id: 'team-badge',
    name: 'Team Badge',
    description: 'Add your team badge to the front of your jersey',
    price: 12.99,
    priceLabel: '$12.99',
    image: '/assets/team-badge.png',
  },
  {
    id: 'premium-fabric',
    name: 'Premium Fabric',
    description: 'Upgrade to our premium moisture-wicking fabric',
    price: 14.99,
    priceLabel: '$14.99',
  },
  {
    id: 'express-shipping',
    name: 'Express Shipping',
    description: 'Get your order delivered in 3-5 business days',
    price: 19.99,
    priceLabel: '$19.99',
  },
];

export default function AddonSelector() {
  const { addOns, addItem, removeItem, updateItem } = useOrderStore();
  const [customName, setCustomName] = useState<string>('');
  const [customNumber, setCustomNumber] = useState<string>('');
  
  // Check if an add-on is already selected
  const isAddonSelected = (addonId: string) => {
    return addOns.some(addon => addon.type === addonId);
  };
  
  // Toggle add-on selection
  const toggleAddon = (addon: Addon) => {
    if (isAddonSelected(addon.id)) {
      // Remove addon
      const addonToRemove = addOns.find(item => item.type === addon.id);
      if (addonToRemove) {
        removeItem(addonToRemove.type);
      }
    } else {
      // Add addon
      addItem({
        id: addon.id,
        type: addon.id,
        name: addon.name,
        price: addon.price,
        quantity: 1,
      } as OrderItem);
    }
  };
  
  // Update custom name or number
  const updateCustomization = (type: string, value: string) => {
    const addon = addOns.find(addon => addon.type === type);
    
    if (type === 'name-printing') {
      setCustomName(value);
      if (addon) {
        updateItem(type, {
          ...addon,
          customValue: value,
        });
      }
    } else if (type === 'number-printing') {
      setCustomNumber(value);
      if (addon) {
        updateItem(type, {
          ...addon,
          customValue: value,
        });
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Customization Options</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Name Printing Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="name-printing" 
                checked={isAddonSelected('name-printing')}
                onCheckedChange={() => toggleAddon(AVAILABLE_ADDONS[0])}
              />
              <Label htmlFor="name-printing" className="font-medium">
                {AVAILABLE_ADDONS[0].name}
                <Badge variant="outline" className="ml-2">{AVAILABLE_ADDONS[0].priceLabel}</Badge>
              </Label>
            </div>
          </div>
          
          {isAddonSelected('name-printing') && (
            <div className="pl-6">
              <Label htmlFor="custom-name" className="text-sm text-muted-foreground">Enter name for the back of jersey</Label>
              <Input 
                id="custom-name" 
                value={customName}
                onChange={(e) => updateCustomization('name-printing', e.target.value)}
                className="mt-1"
                placeholder="e.g. SMITH"
              />
            </div>
          )}
        </div>
        
        {/* Number Printing Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="number-printing" 
                checked={isAddonSelected('number-printing')}
                onCheckedChange={() => toggleAddon(AVAILABLE_ADDONS[1])}
              />
              <Label htmlFor="number-printing" className="font-medium">
                {AVAILABLE_ADDONS[1].name}
                <Badge variant="outline" className="ml-2">{AVAILABLE_ADDONS[1].priceLabel}</Badge>
              </Label>
            </div>
          </div>
          
          {isAddonSelected('number-printing') && (
            <div className="pl-6">
              <Label htmlFor="custom-number" className="text-sm text-muted-foreground">Enter number for the back of jersey</Label>
              <Input 
                id="custom-number" 
                value={customNumber}
                onChange={(e) => updateCustomization('number-printing', e.target.value)}
                className="mt-1 w-20"
                placeholder="e.g. 10"
                type="number"
                min="0"
                max="99"
              />
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Other Addons */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Additional Options</h3>
          
          {AVAILABLE_ADDONS.slice(2).map((addon) => (
            <div key={addon.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={addon.id} 
                  checked={isAddonSelected(addon.id)}
                  onCheckedChange={() => toggleAddon(addon)}
                />
                <div>
                  <Label htmlFor={addon.id} className="font-medium">{addon.name}</Label>
                  <p className="text-sm text-muted-foreground">{addon.description}</p>
                </div>
              </div>
              <Badge variant="outline">{addon.priceLabel}</Badge>
            </div>
          ))}
        </div>
        
        {/* Selected Add-ons Summary */}
        {addOns.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Selected Customizations</h3>
            <ul className="space-y-2">
              {addOns.map(addon => (
                <li key={addon.type} className="flex justify-between items-center text-sm">
                  <span>
                    {addon.name}
                    {addon.customValue && <span className="text-muted-foreground ml-1">({addon.customValue})</span>}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => removeItem(addon.type)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}