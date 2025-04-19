import React from 'react';
import { useLocation } from 'wouter';
import { useOrderStore } from '@/hooks/use-order-store';
import { OrderItem } from '@/hooks/use-order-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Package,
  AlertCircle,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CartDisplayProps {
  showCheckoutButton?: boolean;
  compact?: boolean;
  showTitle?: boolean;
  maxHeight?: string;
}

export const CartDisplay: React.FC<CartDisplayProps> = ({
  showCheckoutButton = true,
  compact = false,
  showTitle = true,
  maxHeight,
}) => {
  const [location, setLocation] = useLocation();
  const orderStore = useOrderStore();
  const { cart, priceBreakdown } = orderStore;
  
  const handleQuantityChange = (item: OrderItem, change: number) => {
    if (item.quantity + change <= 0) {
      // Remove item if quantity is zero or less
      orderStore.removeItem(item.id);
    } else {
      // Update quantity
      orderStore.updateItem(item.id, {
        ...item,
        quantity: item.quantity + change,
      });
    }
  };
  
  const handleRemoveItem = (item: OrderItem) => {
    orderStore.removeItem(item.id);
  };
  
  const handleCheckout = () => {
    setLocation('/checkout');
  };
  
  if (!cart || cart.length === 0) {
    return (
      <Card className="w-full">
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Your Cart
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-3 text-muted-foreground/50" />
            <p>Your cart is empty</p>
            <Button 
              className="mt-2 bg-gradient hover:opacity-90 text-white"
              onClick={() => setLocation('/designer')}
            >
              Start designing
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Your Cart
            </CardTitle>
            <Badge className="bg-gradient text-white">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={`pt-0 ${maxHeight ? `max-h-[${maxHeight}] overflow-auto` : ''}`}>
        <div className="space-y-4">
          {cart.map((item, index) => (
            <div 
              key={index} 
              className={`flex ${
                compact ? 'items-center' : 'items-start'
              } justify-between pb-3 ${
                index < cart.length - 1 ? 'border-b' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="bg-muted w-12 h-12 rounded-sm flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">{item.name || item.type}</h4>
                  {!compact && (
                    <p className="text-sm text-muted-foreground">
                      {item.gender} / {item.size}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleQuantityChange(item, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleQuantityChange(item, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    {!compact && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-2 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gradient">${(item.price * item.quantity).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                {compact && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive mt-1"
                    onClick={() => handleRemoveItem(item)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {priceBreakdown && (
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${priceBreakdown.subtotal.toFixed(2)}</span>
            </div>
            
            {priceBreakdown.discountPercentage > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({priceBreakdown.discountPercentage}%)</span>
                <span>-${priceBreakdown.discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>
                {priceBreakdown.shippingFreeThresholdApplied ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  `$${priceBreakdown.shipping.toFixed(2)}`
                )}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${priceBreakdown.tax.toFixed(2)}</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between font-medium text-base">
              <span>Total</span>
              <span className="text-gradient font-bold">${priceBreakdown.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
        
        {!priceBreakdown && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Price calculation not available.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      {showCheckoutButton && (
        <CardFooter className="pt-2">
          <Button
            className="w-full bg-gradient hover:opacity-90 text-white"
            onClick={handleCheckout}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Proceed to Checkout
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};