import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import AddOns from "./add-ons";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

// For mock purposes, we'll implement a simpler version
interface OrderConfigProps {
  designId: number;
  designUrls: {
    front: string;
    back: string;
  };
  sport: string;
  kitType: string;
  onBackToCustomization: () => void;
}

// Mock price calculation
const getBasePrice = (kitType: string) => {
  const prices: Record<string, number> = {
    jerseyOnly: 49.99,
    jerseyShorts: 69.99,
    fullKit: 89.99,
    default: 49.99
  };
  
  return prices[kitType] || prices.default;
};

export default function OrderConfig({
  designId,
  designUrls,
  sport,
  kitType,
  onBackToCustomization
}: OrderConfigProps) {
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("M");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  
  const basePrice = getBasePrice(kitType);
  const addOnPrice = addOns.length * 15;
  const subtotal = (basePrice + addOnPrice) * quantity;
  const discount = quantity >= 10 ? subtotal * 0.1 : 0;
  const total = subtotal - discount;
  
  const handleAddOnsChange = (selected: string[]) => {
    setAddOns(selected);
  };
  
  const handleCheckout = () => {
    // In a real implementation, we would save the order and redirect to checkout
    console.log("Order details:", {
      designId,
      sport,
      kitType,
      quantity,
      size,
      addOns,
      total
    });
    
    // Navigate to checkout
    setLocation("/checkout");
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToCustomization}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Customization
          </Button>
          
          <h2 className="text-2xl font-bold mb-2">Order Configuration</h2>
          <p className="text-muted-foreground">
            Customize your order with the options below
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Product Preview */}
          <div>
            <h3 className="text-lg font-medium mb-4">Your {sport} Kit</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <img 
                src={designUrls.front} 
                alt="Front View" 
                className="rounded-lg shadow-md object-contain bg-gray-50 aspect-square"
              />
              <img 
                src={designUrls.back} 
                alt="Back View" 
                className="rounded-lg shadow-md object-contain bg-gray-50 aspect-square"
              />
            </div>
          </div>
          
          {/* Size Selection */}
          <div>
            <h3 className="text-lg font-medium mb-4">Size</h3>
            <ToggleGroup 
              type="single" 
              value={size}
              onValueChange={(value) => value && setSize(value)}
              className="justify-start"
            >
              {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                <ToggleGroupItem key={s} value={s} aria-label={`Size ${s}`}>
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          
          {/* Quantity Selection */}
          <div>
            <h3 className="text-lg font-medium mb-4">Quantity</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>
          
          {/* Add-ons */}
          <div>
            <h3 className="text-lg font-medium mb-4">Add-Ons</h3>
            <AddOns value={addOns} onChange={handleAddOnsChange} />
          </div>
        </div>
      </div>
      
      {/* Order Summary */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-4">Order Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Base Price ({kitType})</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              
              {addOns.length > 0 && (
                <div className="flex justify-between">
                  <span>Add-Ons ({addOns.length})</span>
                  <span>${addOnPrice.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Quantity</span>
                <span>x{quantity}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Bulk Discount (10%)</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <Button 
                onClick={handleCheckout}
                className="w-full mt-4"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Proceed to Checkout
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                Safe and secure payment processing with Stripe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}