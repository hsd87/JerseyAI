import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useOrderStore } from "@/hooks/use-order-store";

interface AddonSelectorProps {
  sport?: string;
  kitType?: string;
}

// Define available add-ons based on sport and kit type
const AVAILABLE_ADDONS = {
  soccer: {
    jersey: [
      { id: 'socks', name: 'Matching Socks', price: 12.99 },
      { id: 'shorts', name: 'Matching Shorts', price: 24.99 },
      { id: 'numbers', name: 'Player Numbers', price: 5.99 },
      { id: 'captain-armband', name: 'Captain Armband', price: 8.99 },
    ],
    kit: [
      { id: 'goalkeeper-jersey', name: 'Goalkeeper Jersey', price: 59.99 },
      { id: 'training-jersey', name: 'Training Jersey', price: 39.99 },
      { id: 'jacket', name: 'Team Jacket', price: 79.99 },
    ]
  },
  basketball: {
    jersey: [
      { id: 'shorts', name: 'Matching Shorts', price: 29.99 },
      { id: 'shooting-shirt', name: 'Shooting Shirt', price: 34.99 },
      { id: 'compression', name: 'Compression Gear', price: 24.99 },
    ],
    kit: [
      { id: 'warmup-jersey', name: 'Warmup Jersey', price: 44.99 },
      { id: 'team-bag', name: 'Team Bag', price: 69.99 },
    ]
  },
  // Default fallbacks for other sports
  default: {
    jersey: [
      { id: 'shorts', name: 'Matching Shorts', price: 24.99 },
      { id: 'customization', name: 'Name Customization', price: 9.99 },
    ],
    kit: [
      { id: 'training-jersey', name: 'Training Jersey', price: 39.99 },
    ]
  }
};

export default function AddonSelector({ sport = 'soccer', kitType = 'jersey' }: AddonSelectorProps) {
  const { addOns, addItem, removeItem } = useOrderStore();

  // Get the appropriate add-ons list based on sport and kit type
  const getAddons = () => {
    if (AVAILABLE_ADDONS[sport as keyof typeof AVAILABLE_ADDONS]) {
      return AVAILABLE_ADDONS[sport as keyof typeof AVAILABLE_ADDONS][kitType as 'jersey' | 'kit'] || 
             AVAILABLE_ADDONS.default[kitType as 'jersey' | 'kit'];
    }
    return AVAILABLE_ADDONS.default[kitType as 'jersey' | 'kit'];
  };

  const addonsList = getAddons();

  // Check if an add-on is selected
  const isSelected = (addonId: string) => {
    return addOns.some(addon => addon.id === addonId);
  };

  // Handle add-on selection/deselection
  const handleAddonToggle = (addon: { id: string; name: string; price: number }) => {
    if (isSelected(addon.id)) {
      removeItem(addon.id);
    } else {
      addItem({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        type: 'addon',
        quantity: 1,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Enhance Your Kit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addonsList.map((addon) => (
            <div key={addon.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-gray-50 transition-colors">
              <Checkbox 
                id={`addon-${addon.id}`} 
                checked={isSelected(addon.id)}
                onCheckedChange={() => handleAddonToggle(addon)}
              />
              <div className="flex flex-col">
                <Label 
                  htmlFor={`addon-${addon.id}`}
                  className="font-medium cursor-pointer"
                >
                  {addon.name}
                </Label>
                <span className="text-sm text-gray-500">
                  ${addon.price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}