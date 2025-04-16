import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

export interface AddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface AddOnsProps {
  addOns: AddOn[];
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const addOnsData: Omit<AddOn, 'quantity'>[] = [
  {
    id: "matching-socks",
    name: "Matching Socks",
    price: 12.99
  },
  {
    id: "beanie-headband",
    name: "Beanie/Headband",
    price: 14.99
  },
  {
    id: "tracksuit",
    name: "Matching Tracksuit",
    price: 79.99
  },
  {
    id: "kit-bag",
    name: "Kit Bag / Backpack",
    price: 24.99
  }
];

export default function AddOns({ addOns, onUpdateQuantity }: AddOnsProps) {
  const handleDecrease = (id: string, currentQuantity: number) => {
    if (currentQuantity > 0) {
      onUpdateQuantity(id, currentQuantity - 1);
    }
  };

  const handleIncrease = (id: string, currentQuantity: number) => {
    onUpdateQuantity(id, currentQuantity + 1);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {addOnsData.map((addon) => {
        const currentAddOn = addOns.find(a => a.id === addon.id) || 
          { ...addon, quantity: 0 };
        
        return (
          <Card key={addon.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">{addon.name}</h3>
              <p className="text-primary font-bold">${addon.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center">
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 rounded-md p-0"
                onClick={() => handleDecrease(addon.id, currentAddOn.quantity)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-9 text-center">{currentAddOn.quantity}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 rounded-md p-0"
                onClick={() => handleIncrease(addon.id, currentAddOn.quantity)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}