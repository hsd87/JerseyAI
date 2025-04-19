import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useOrderStore } from '@/hooks/use-order-store';
import { OrderItem } from '@/hooks/use-order-types';
import { AddToCartButton } from './add-to-cart-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Package } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    type: string;
    availableSizes?: string[];
    availableGenders?: string[];
  };
  className?: string;
  showDetails?: boolean;
  detailsLink?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
  showDetails = true,
  detailsLink,
}) => {
  const [location, setLocation] = useLocation();
  const [size, setSize] = useState('M');
  const [gender, setGender] = useState('unisex');
  const [quantity, setQuantity] = useState(1);
  
  const availableSizes = product.availableSizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const availableGenders = product.availableGenders || ['mens', 'womens', 'unisex', 'youth'];
  
  const getOrderItem = (): Partial<OrderItem> => {
    return {
      id: product.id,
      type: product.type,
      name: product.name,
      price: product.price,
      size: size,
      gender: gender,
      quantity: quantity,
    };
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };
  
  const handleDetailsClick = () => {
    if (detailsLink) {
      setLocation(detailsLink);
    }
  };

  return (
    <Card className={`${className} overflow-hidden flex flex-col`}>
      <div className="relative aspect-square">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {product.description || `${product.type} for sports and casual wear`}
            </CardDescription>
          </div>
          <Badge className="text-sm bg-gradient text-white">
            ${product.price.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`size-${product.id}`}>Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger id={`size-${product.id}`}>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {availableSizes.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor={`gender-${product.id}`}>Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id={`gender-${product.id}`}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {availableGenders.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor={`qty-${product.id}`}>Quantity</Label>
          <Input
            id={`qty-${product.id}`}
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <AddToCartButton
          item={getOrderItem()}
          fullWidth={!showDetails}
        />
        
        {showDetails && detailsLink && (
          <Button variant="outline" onClick={handleDetailsClick}>
            <Eye className="h-4 w-4 mr-2" />
            Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};