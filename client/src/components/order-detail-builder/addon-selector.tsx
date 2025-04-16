import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useOrderStore } from "@/hooks/use-order-store";
import { AddOn } from "@/hooks/use-order-types";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "@/components/ui/badge";

interface AddonSelectorProps {
  sport?: string;
  kitType?: string;
}

export default function AddonSelector({ sport = "soccer", kitType = "jersey" }: AddonSelectorProps) {
  const { addOns, addAddOn, removeAddOn } = useOrderStore();
  const [availableAddons, setAvailableAddons] = useState<AddOn[]>([]);
  
  // Load available add-ons based on sport and kit type
  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll just provide static data
    const sportSpecificAddons: Record<string, AddOn[]> = {
      soccer: [
        { 
          id: "name-print", 
          name: "Name Printing", 
          price: 999, 
          quantity: 1 
        },
        { 
          id: "number-print", 
          name: "Number Printing", 
          price: 799, 
          quantity: 1 
        },
        { 
          id: "badge", 
          name: "Team Badge", 
          price: 1499, 
          quantity: 1 
        },
        { 
          id: "captain-armband", 
          name: "Captain's Armband", 
          price: 799, 
          quantity: 1 
        }
      ],
      basketball: [
        { 
          id: "name-print", 
          name: "Name Printing", 
          price: 999, 
          quantity: 1 
        },
        { 
          id: "number-print", 
          name: "Number Printing", 
          price: 799, 
          quantity: 1 
        },
        { 
          id: "logo-print", 
          name: "Team Logo", 
          price: 1499, 
          quantity: 1 
        }
      ],
      default: [
        { 
          id: "name-print", 
          name: "Name Printing", 
          price: 999, 
          quantity: 1 
        },
        { 
          id: "number-print", 
          name: "Number Printing", 
          price: 799, 
          quantity: 1 
        }
      ]
    };
    
    // Set available add-ons based on sport
    setAvailableAddons(sportSpecificAddons[sport] || sportSpecificAddons.default);
  }, [sport, kitType]);
  
  // Check if an add-on is selected
  const isSelected = (id: string): boolean => {
    return addOns.some(addon => addon.id === id);
  };
  
  // Handle add-on selection
  const handleAddonToggle = (addon: AddOn, checked: boolean) => {
    if (checked) {
      // Add the add-on with a unique ID
      addAddOn({
        ...addon,
        id: `${addon.id}-${uuidv4().slice(0, 8)}`
      });
    } else {
      // Find and remove the specific add-on
      const addonIndex = addOns.findIndex(a => a.id.startsWith(addon.id));
      if (addonIndex !== -1) {
        removeAddOn(addonIndex);
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Customization Add-ons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableAddons.map((addon) => (
            <div 
              key={addon.id} 
              className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50"
            >
              <Checkbox 
                id={`addon-${addon.id}`} 
                checked={isSelected(addon.id)}
                onCheckedChange={(checked) => handleAddonToggle(addon, checked as boolean)}
              />
              <div className="flex justify-between w-full items-center">
                <Label 
                  htmlFor={`addon-${addon.id}`}
                  className="font-medium cursor-pointer"
                >
                  {addon.name}
                </Label>
                <Badge variant="outline" className="ml-auto">
                  ${(addon.price / 100).toFixed(2)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {availableAddons.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No add-ons available for this kit type
          </div>
        )}
      </CardContent>
    </Card>
  );
}