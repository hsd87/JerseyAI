import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddOn } from "./add-ons";
import { ChevronRight } from "lucide-react";

interface OrderSummaryProps {
  packageType: string;
  packagePrice: number;
  size: string;
  gender: string;
  quantity: number;
  addOns: AddOn[];
  onProceedToCheckout: () => void;
}

const getPackageName = (packageId: string): string => {
  switch (packageId) {
    case "jersey-only":
      return "Jersey Only";
    case "jersey-shorts":
      return "Jersey + Shorts";
    case "full-kit":
      return "Full Kit";
    default:
      return "Custom Package";
  }
};

const getGenderLabel = (gender: string): string => {
  switch (gender) {
    case "mens":
      return "Male";
    case "womens":
      return "Female";
    case "youth":
      return "Youth";
    default:
      return "";
  }
};

export default function OrderSummary({
  packageType,
  packagePrice,
  size,
  gender,
  quantity,
  addOns,
  onProceedToCheckout,
}: OrderSummaryProps) {
  const activeAddOns = addOns.filter(addon => addon.quantity > 0);
  
  // Calculate total price
  const basePrice = packagePrice * quantity;
  const addOnTotal = activeAddOns.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
  const totalPrice = basePrice + addOnTotal;
  
  const itemLabel = quantity === 1 
    ? `${quantity}x jersey (${size}, ${getGenderLabel(gender)})` 
    : `${quantity}x jerseys (${size}, ${getGenderLabel(gender)})`;

  return (
    <Card className="p-4 border">
      <h2 className="font-bold text-xl mb-1">Order Summary</h2>
      <p className="text-sm text-gray-500 mb-4">{quantity} item{quantity !== 1 ? 's' : ''}</p>
      
      <div className="space-y-3 divide-y divide-gray-100">
        <div className="flex justify-between py-1">
          <span>{itemLabel}</span>
          <span>${(packagePrice * quantity).toFixed(2)}</span>
        </div>
        
        {activeAddOns.map(addon => (
          <div key={addon.id} className="flex justify-between py-1">
            <span>{addon.quantity}x {addon.name}</span>
            <span>${(addon.price * addon.quantity).toFixed(2)}</span>
          </div>
        ))}
        
        <div className="flex justify-between pt-3 font-bold">
          <span>Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <Button 
        className="w-full mt-6 bg-primary text-white rounded-md"
        size="lg"
        onClick={onProceedToCheckout}
      >
        Proceed to Checkout
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
}