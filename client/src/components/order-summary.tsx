import { useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDesignStore } from '@/hooks/use-design-store';
import { useOrderStore } from '@/hooks/use-order-store';
import { useAuth } from '@/hooks/use-auth';
import { ShoppingCart, Download } from 'lucide-react';

// Package type prices
const PACKAGE_PRICES = {
  jerseyOnly: 59.99,
  jerseyShorts: 89.99,
  fullKit: 119.99,
};

const PACKAGE_NAMES = {
  jerseyOnly: 'Jersey Only',
  jerseyShorts: 'Jersey + Shorts',
  fullKit: 'Full Kit',
};

interface OrderSummaryProps {
  showCheckoutButton: boolean;
}

export default function OrderSummary({ showCheckoutButton }: OrderSummaryProps) {
  const { frontImage, backImage, formData } = useDesignStore();
  const { 
    packageType, 
    gender, 
    size, 
    quantity,
    isTeamOrder,
    teamName,
    teamMembers,
    addons,
    basePrice,
    addonsTotal,
    subtotal,
    discount,
    total,
    calculatePrices
  } = useOrderStore();
  const { user } = useAuth();
  
  // Calculate the total prices whenever relevant values change
  useEffect(() => {
    calculatePrices();
  }, [
    packageType, 
    quantity, 
    isTeamOrder, 
    teamMembers, 
    addons, 
    calculatePrices
  ]);
  
  // Calculate total items
  const totalItems = isTeamOrder 
    ? teamMembers.reduce((sum, member) => sum + member.quantity, 0) 
    : quantity;
  
  // Check if user has a subscription for discount
  const hasDiscount = user?.subscriptionTier === 'pro';
  const discountPercentage = hasDiscount ? 15 : 0;
  
  // Calculate the total with any subscription discount
  const finalDiscount = hasDiscount ? (subtotal * 0.15) : 0;
  const finalTotal = subtotal - finalDiscount;
  
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Design Preview */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Your Design</h3>
          <div className="grid grid-cols-2 gap-2">
            {frontImage && (
              <div className="aspect-[3/4] relative rounded-md overflow-hidden border">
                <img 
                  src={frontImage} 
                  alt="Front view" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
                  Front
                </div>
              </div>
            )}
            
            {backImage && (
              <div className="aspect-[3/4] relative rounded-md overflow-hidden border">
                <img 
                  src={backImage} 
                  alt="Back view" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
                  Back
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Design Details */}
        <div>
          <h3 className="font-medium text-sm mb-2">Design Details</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Sport:</span>
              <span className="font-medium">{formData.sport}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Package:</span>
              <span className="font-medium">{PACKAGE_NAMES[packageType]}</span>
            </div>
            {isTeamOrder ? (
              <div className="flex justify-between">
                <span className="text-gray-600">Team:</span>
                <span className="font-medium">{teamName || 'Team Order'}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{size} ({gender})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{quantity}</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Team Roster Summary */}
        {isTeamOrder && teamMembers.length > 0 && (
          <div>
            <h3 className="font-medium text-sm mb-2">Team Roster</h3>
            <p className="text-sm text-gray-600">{teamMembers.length} players ({totalItems} {totalItems === 1 ? 'item' : 'items'})</p>
          </div>
        )}
        
        {/* Add-ons Summary */}
        {addons.some(addon => addon.quantity > 0) && (
          <div>
            <h3 className="font-medium text-sm mb-2">Add-ons</h3>
            <div className="text-sm space-y-1">
              {addons.filter(addon => addon.quantity > 0).map(addon => (
                <div key={addon.id} className="flex justify-between">
                  <span className="text-gray-600">{addon.name}:</span>
                  <span className="font-medium">{addon.quantity} × ${addon.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Price Breakdown */}
        <div className="border-t pt-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Price:</span>
              <span>${PACKAGE_PRICES[packageType].toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              <span>× {totalItems}</span>
            </div>
            
            {addonsTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Add-ons:</span>
                <span>${addonsTotal.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-medium">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {hasDiscount && (
              <div className="flex justify-between text-green-600">
                <span>Pro Discount ({discountPercentage}%):</span>
                <span>-${finalDiscount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {showCheckoutButton && (
          <Button className="w-full" size="lg">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Proceed to Payment
          </Button>
        )}
        
        <Button variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download PDF Summary
        </Button>
      </CardFooter>
    </Card>
  );
}