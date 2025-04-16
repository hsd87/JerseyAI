import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart } from "lucide-react";
import { OrderItem } from "@shared/products";

interface OrderSummaryProps {
  items: OrderItem[];
  totalPrice: number;
  isTeamOrder: boolean;
  onProceedToCheckout: () => void;
}

export default function OrderSummary({
  items,
  totalPrice,
  isTeamOrder,
  onProceedToCheckout
}: OrderSummaryProps) {
  // Calculate subtotal, shipping, and total
  const subtotal = totalPrice;
  const shipping = subtotal > 500 ? 0 : subtotal > 200 ? 20 : 30;
  const tax = Math.round((subtotal + shipping) * 0.08 * 100) / 100; // 8% tax
  const total = subtotal + shipping + tax;
  
  // Calculate volume discount if applicable
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const discountPercent = totalQuantity >= 50 ? 15 : totalQuantity >= 20 ? 10 : totalQuantity >= 10 ? 5 : 0;
  const discount = discountPercent > 0 ? Math.round(subtotal * discountPercent / 100 * 100) / 100 : 0;
  
  // Final total with discount
  const finalTotal = subtotal - discount + shipping + tax;
  
  return (
    <Card className="p-6 sticky top-6">
      <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
      
      {/* Order Items */}
      <div className="space-y-3 mb-6">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <div>
              <span>{item.name}</span>
              <div className="text-xs text-gray-500">
                {item.gender === 'male' ? "Men's" : "Women's"} {item.size}, Qty: {item.quantity}
              </div>
            </div>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <Separator className="my-4" />
      
      {/* Price Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        {discountPercent > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Volume Discount ({discountPercent}%)</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>${shipping.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Tax (8%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        
        {isTeamOrder && (
          <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded">
            Team order pricing applies. Your final quote will be sent after order review.
          </div>
        )}
      </div>
      
      <Separator className="my-4" />
      
      {/* Total */}
      <div className="flex justify-between font-semibold text-lg mb-6">
        <span>Total</span>
        <span>${finalTotal.toFixed(2)}</span>
      </div>
      
      {/* Checkout Button */}
      <Button 
        onClick={onProceedToCheckout} 
        className="w-full bg-primary hover:bg-primary/90"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Proceed to Checkout
      </Button>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Shipping costs calculated based on order total. <br />
        Free shipping on orders over $500.
      </p>
    </Card>
  );
}