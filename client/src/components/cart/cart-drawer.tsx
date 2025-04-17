import React, { useState } from 'react';
import { useOrderStore } from '@/hooks/use-order-store';
import { CartDisplay } from './cart-display';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ShoppingCart } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { cart } = useOrderStore();
  
  // Calculate total number of items (including quantities)
  const totalItemCount = cart?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
          {totalItemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalItemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            Review your items and proceed to checkout
          </SheetDescription>
        </SheetHeader>
        <CartDisplay showTitle={false} maxHeight="calc(100vh - 180px)" />
      </SheetContent>
    </Sheet>
  );
};