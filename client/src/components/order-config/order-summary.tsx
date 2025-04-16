import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddOn } from "./add-ons";
import { ChevronRight, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrderSummaryProps {
  packageType: string;
  packagePrice: number;
  size: string;
  gender: string;
  fabric?: string;
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

// Calculate fabric price adjustment
const getFabricPriceAdjustment = (fabric: string): number => {
  if (fabric.includes("Pro Performance")) {
    return 15; // $15 premium for pro performance
  } else if (fabric.includes("Premium") || fabric.includes("Heavy Duty")) {
    return 7.50; // $7.50 premium for premium fabrics
  }
  return 0; // No adjustment for standard fabrics
};

export default function OrderSummary({
  packageType,
  packagePrice,
  size,
  gender,
  fabric = "Standard Polyester",
  quantity,
  addOns,
  onProceedToCheckout,
}: OrderSummaryProps) {
  const activeAddOns = addOns.filter(addon => addon.quantity > 0);
  
  // Calculate price adjustments for fabric
  const fabricAdjustment = getFabricPriceAdjustment(fabric);
  const totalFabricAdjustment = fabricAdjustment * quantity;
  
  // Calculate total price
  const basePrice = packagePrice * quantity;
  const addOnTotal = activeAddOns.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
  const subtotal = basePrice + totalFabricAdjustment;
  const totalPrice = subtotal + addOnTotal;
  
  // Calculate potential discounts based on quantity
  let discountPercentage = 0;
  let discountAmount = 0;
  
  if (quantity >= 50) {
    discountPercentage = 15; // 15% discount for 50+ items
  } else if (quantity >= 20) {
    discountPercentage = 10; // 10% discount for 20+ items
  } else if (quantity >= 10) {
    discountPercentage = 5; // 5% discount for 10+ items
  }
  
  if (discountPercentage > 0) {
    discountAmount = (subtotal * discountPercentage) / 100;
  }
  
  const finalPrice = totalPrice - discountAmount;
  
  // Label for package item in summary
  const packageLabel = `${getPackageName(packageType)} (${fabric})`;
  const itemLabel = quantity === 1 
    ? `${quantity}x ${packageLabel}` 
    : `${quantity}x ${packageLabel}`;
  const sizeGenderLabel = `Size: ${size}, ${getGenderLabel(gender)}`;

  return (
    <Card className="p-4 border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-xl">Order Summary</h2>
          <p className="text-sm text-gray-500">{quantity} item{quantity !== 1 ? 's' : ''}</p>
        </div>
        {quantity >= 10 && (
          <Badge className="bg-green-600">
            <Tag className="h-3 w-3 mr-1" />
            {discountPercentage}% Bulk Discount
          </Badge>
        )}
      </div>
      
      <div className="space-y-3 divide-y divide-gray-100">
        <div className="py-1">
          <div className="flex justify-between font-medium">
            <div className="text-gray-800">{itemLabel}</div>
            <div>${(packagePrice * quantity).toFixed(2)}</div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <div>{sizeGenderLabel}</div>
            <div>&nbsp;</div>
          </div>
          
          {fabricAdjustment > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <div>Fabric upgrade: {fabric}</div>
              <div>+${totalFabricAdjustment.toFixed(2)}</div>
            </div>
          )}
        </div>
        
        {/* Discount section */}
        {discountAmount > 0 && (
          <div className="flex justify-between py-2 text-green-600">
            <span>Bulk Discount ({discountPercentage}%)</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        
        {/* Add-ons section */}
        {activeAddOns.length > 0 && (
          <div className="pt-2">
            <div className="text-sm font-medium mb-2">Add-ons</div>
            {activeAddOns.map(addon => (
              <div key={addon.id} className="flex justify-between py-1 text-sm">
                <span>{addon.quantity}x {addon.name}</span>
                <span>${(addon.price * addon.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Totals section */}
        <div className="pt-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-bold">
            <span>Total:</span>
            <span>${finalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Button 
          className="w-full bg-primary text-white rounded-md"
          size="lg"
          onClick={onProceedToCheckout}
        >
          Proceed to Checkout
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-xs text-center text-gray-500 mt-2">
          Free shipping on orders over $150
        </p>
      </div>
    </Card>
  );
}