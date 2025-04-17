import React, { useState } from 'react';
import { useOrderStore } from '@/hooks/use-order-store';
import { OrderItem } from '@/hooks/use-order-types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';

interface AddToCartButtonProps {
  item: Partial<OrderItem>;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
  showIcon?: boolean;
  text?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  item,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  showIcon = true,
  text = 'Add to Cart',
}) => {
  const { addItem } = useOrderStore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Validate item properties
  const isValidItem = () => {
    if (!item.id || !item.type || !item.price) {
      console.error('Invalid item:', item);
      return false;
    }
    
    // Set defaults if missing
    if (!item.size) item.size = 'M';
    if (!item.gender) item.gender = 'unisex';
    if (!item.quantity) item.quantity = 1;
    
    return true;
  };

  const handleAddToCart = () => {
    if (!isValidItem()) {
      toast({
        title: 'Error',
        description: 'Invalid item - missing required properties',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    // Simulate a short delay for better UX
    setTimeout(() => {
      try {
        addItem(item as OrderItem);
        setIsAdded(true);
        
        toast({
          title: 'Added to Cart',
          description: `${item.name || item.type} has been added to your cart`,
        });
        
        // Reset state after a delay
        setTimeout(() => {
          setIsAdded(false);
        }, 2000);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to add item to cart',
          variant: 'destructive',
        });
      } finally {
        setIsAdding(false);
      }
    }, 500);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCart}
      disabled={isAdding}
      className={fullWidth ? 'w-full' : ''}
    >
      {isAdding ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : isAdded ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Added
        </>
      ) : (
        <>
          {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
          {text}
        </>
      )}
    </Button>
  );
};