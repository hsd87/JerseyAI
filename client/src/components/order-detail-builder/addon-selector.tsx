import { useState, useEffect } from "react";
import { Check, Plus, Minus, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useOrderStore } from "@/hooks/use-order-store";

interface Addon {
  id: string;
  name: string;
  price: number;
  description: string;
  availableSports: string[];
  kitTypes: string[];
}

interface AddonSelectorProps {
  sport: string;
  kitType: string;
}

export default function AddonSelector({ sport, kitType }: AddonSelectorProps) {
  const { addOns, addAddOn, removeAddOn } = useOrderStore();
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  
  // Load addons from pricing CSV
  useEffect(() => {
    // For now, using the hardcoded values from pricing CSV
    // In a production app, these would come from an API call
    const allAddons: Addon[] = [
      {
        id: "addon_socks",
        name: "Matching Socks",
        price: 1999,
        description: "Team-matched socks with your kit design",
        availableSports: ["soccer", "basketball", "rugby"],
        kitTypes: ["jersey", "jerseyShorts", "jerseyTrousers"]
      },
      {
        id: "addon_trackpants",
        name: "Matching Track Pants",
        price: 5999,
        description: "Team-matched track pants with your kit design",
        availableSports: ["soccer", "basketball", "rugby", "cricket", "esports"],
        kitTypes: ["jersey", "jerseyShorts", "jerseyTrousers", "tracksuit", "trackjacket", "trackhoodie"]
      },
      {
        id: "addon_kitbag",
        name: "Matching Kitbag",
        price: 3999,
        description: "Team-matched gear bag with your design",
        availableSports: ["soccer", "basketball", "rugby", "cricket", "esports"],
        kitTypes: ["jersey", "jerseyShorts", "jerseyTrousers", "tracksuit", "trackjacket", "trackhoodie"]
      },
      {
        id: "addon_cap",
        name: "Matching Cap",
        price: 2499,
        description: "Team-matched cap with your design",
        availableSports: ["cricket", "esports"],
        kitTypes: ["jersey", "jerseyShorts", "jerseyTrousers", "tracksuit", "trackjacket", "trackhoodie"]
      },
      {
        id: "addon_beanie",
        name: "Matching Beanie",
        price: 2499,
        description: "Team-matched beanie with your design",
        availableSports: ["soccer", "rugby", "basketball"],
        kitTypes: ["jersey", "jerseyShorts", "jerseyTrousers", "tracksuit", "trackjacket", "trackhoodie"]
      },
      {
        id: "addon_jacket",
        name: "Matching Track Jacket",
        price: 8999,
        description: "Team-matched track jacket with your design",
        availableSports: ["soccer", "basketball", "rugby", "cricket", "esports"],
        kitTypes: ["jersey", "jerseyShorts", "jerseyTrousers"]
      },
      {
        id: "addon_hoodie",
        name: "Matching Track Hoodie",
        price: 9499,
        description: "Team-matched hoodie with your design",
        availableSports: ["soccer", "basketball", "rugby", "cricket", "esports"],
        kitTypes: ["jersey", "jerseyShorts", "jerseyTrousers"]
      },
      {
        id: "addon_halfzip",
        name: "Matching Half-Zip Jacket",
        price: 8499,
        description: "Team-matched half-zip jacket with your design",
        availableSports: ["soccer", "basketball", "rugby", "cricket", "esports"],
        kitTypes: ["jersey", "jerseyShorts", "jerseyTrousers"]
      },
      {
        id: "addon_away",
        name: "Away Kit (Alternate Colors)",
        price: 6999,
        description: "Alternate colorway jersey with inverted colors",
        availableSports: ["soccer", "basketball", "rugby", "cricket", "esports"],
        kitTypes: ["jersey", "jerseyShorts", "jerseyTrousers"]
      }
    ];
    
    // Filter addons based on selected sport and kitType
    const filtered = allAddons.filter(addon => 
      addon.availableSports.includes(sport) && 
      addon.kitTypes.includes(kitType)
    );
    
    setAvailableAddons(filtered);
  }, [sport, kitType]);
  
  // Check if addon is in cart
  const isAddonSelected = (addonId: string): boolean => {
    return addOns.some(addon => addon.id === addonId);
  };
  
  // Toggle addon selection
  const toggleAddon = (addon: Addon) => {
    if (isAddonSelected(addon.id)) {
      removeAddOn(addOns.findIndex(item => item.id === addon.id));
    } else {
      addAddOn({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        quantity: 1
      });
    }
  };
  
  // Format price to display in dollars
  const formatPrice = (price: number): string => {
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          Add-on Products
          <Badge variant="outline" className="ml-2">Optional</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableAddons.map((addon) => (
            <div 
              key={addon.id}
              className={`flex items-start space-x-3 p-3 rounded-md border transition-colors
                ${isAddonSelected(addon.id) ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
            >
              <Checkbox
                id={`addon-${addon.id}`}
                checked={isAddonSelected(addon.id)}
                onCheckedChange={() => toggleAddon(addon)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor={`addon-${addon.id}`}
                  className="font-medium cursor-pointer flex items-center"
                >
                  {addon.name}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">{addon.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-sm text-gray-600 mt-1">{formatPrice(addon.price)}</p>
              </div>
              {isAddonSelected(addon.id) && (
                <div className="flex items-center space-x-2 border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 h-8"
                    onClick={() => {
                      // Find the addon in the cart
                      const index = addOns.findIndex(item => item.id === addon.id);
                      if (index !== -1) {
                        // Remove if quantity would become 0
                        if (addOns[index].quantity <= 1) {
                          removeAddOn(index);
                        } else {
                          // Otherwise update quantity
                          const updated = [...addOns];
                          updated[index] = { ...updated[index], quantity: updated[index].quantity - 1 };
                          useOrderStore.getState().setAddOns(updated);
                        }
                      }
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm w-6 text-center">
                    {addOns.find(item => item.id === addon.id)?.quantity || 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 h-8"
                    onClick={() => {
                      // Find the addon in the cart
                      const index = addOns.findIndex(item => item.id === addon.id);
                      if (index !== -1) {
                        // Update quantity
                        const updated = [...addOns];
                        updated[index] = { ...updated[index], quantity: updated[index].quantity + 1 };
                        useOrderStore.getState().setAddOns(updated);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}