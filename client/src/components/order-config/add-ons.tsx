import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, Plus } from "lucide-react";
import { Product } from "@shared/products";
import { OrderItem } from "@shared/products";

interface AddOnsProps {
  addOns: Product[];
  selectedAddons: OrderItem[];
  onAddAddon: (addon: Product) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
}

export default function AddOns({ 
  addOns, 
  selectedAddons, 
  onAddAddon, 
  onUpdateQuantity 
}: AddOnsProps) {
  // Find the OrderItem index for a given product SKU
  const findSelectedAddonIndex = (skuId: string): number => {
    return selectedAddons.findIndex(item => item.skuId === skuId);
  };
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Add Matching Accessories</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {addOns.map((addon) => {
          const addonIndex = findSelectedAddonIndex(addon.skuId);
          const isSelected = addonIndex !== -1;
          const quantity = isSelected ? selectedAddons[addonIndex].quantity : 0;
          
          return (
            <Card key={addon.skuId} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{addon.name}</h4>
                  <p className="text-sm text-gray-500">SKU: {addon.skuId}</p>
                  <p className="text-sm font-medium">${addon.basePrice.toFixed(2)}</p>
                </div>
                
                {!isSelected ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onAddAddon(addon)}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                ) : (
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-gray-200 flex items-center justify-center"
                      onClick={() => onUpdateQuantity(addonIndex, Math.max(0, quantity - 1))}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-gray-200 flex items-center justify-center"
                      onClick={() => onUpdateQuantity(addonIndex, quantity + 1)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      
      {selectedAddons.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Selected Add-ons</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {selectedAddons.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}