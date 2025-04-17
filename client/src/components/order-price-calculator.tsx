import React, { useEffect, useState } from 'react';
import {
  PRODUCTS,
  PACKAGE_ITEMS,
  getProductBySku,
  calculateQuantityDiscount
} from '@shared/product-configs';
import { useOrderStore } from '@/hooks/use-order-store';
import { PackageItem, OrderAddon } from '@/hooks/use-order-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Truck } from 'lucide-react';

interface OrderPriceCalculatorProps {
  className?: string;
}

export function OrderPriceCalculator({ className }: OrderPriceCalculatorProps) {
  const {
    packageType,
    packageItems,
    addOns,
    isTeamOrder,
    teamMembers
  } = useOrderStore();

  const [subtotal, setSubtotal] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shipping, setShipping] = useState(15); // Default shipping cost
  const [total, setTotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Calculate the total number of items and prices
  useEffect(() => {
    try {
      let itemCount = 0;
      let itemSubtotal = 0;

      // Calculate package items price
      packageItems.forEach((item: PackageItem) => {
        const totalQuantity = item.sizes.reduce((sum, size) => sum + size.quantity, 0);
        itemCount += totalQuantity;
        itemSubtotal += item.price * totalQuantity;
      });

      // Calculate add-ons price
      addOns.forEach((addon: OrderAddon) => {
        itemCount += addon.quantity;
        const product = getProductBySku(addon.id);
        if (product) {
          itemSubtotal += product.basePrice * addon.quantity;
        }
      });

      // If it's a team order, use the team members to calculate jerseys
      if (isTeamOrder && teamMembers.length > 0) {
        // For team orders, we replace the normal jersey counts with team member counts
        // This is because each team member gets their own customized jersey
        const jerseyItem = packageItems.find(item => item.type === 'jersey');
        if (jerseyItem) {
          // Remove the jersey quantity from the previous count
          const jerseyQuantity = jerseyItem.sizes.reduce((sum, size) => sum + size.quantity, 0);
          itemCount = itemCount - jerseyQuantity + teamMembers.length;
          itemSubtotal = itemSubtotal - (jerseyItem.price * jerseyQuantity) + (jerseyItem.price * teamMembers.length);
        }
      }

      // Calculate discount based on quantity
      const discount = calculateQuantityDiscount(itemCount);
      const discountAmt = itemSubtotal * discount;

      // Free shipping for orders over $200
      const shippingCost = itemSubtotal > 200 ? 0 : 15;

      setTotalItems(itemCount);
      setSubtotal(itemSubtotal);
      setDiscountPercent(discount);
      setDiscountAmount(discountAmt);
      setShipping(shippingCost);
      setTotal(itemSubtotal - discountAmt + shippingCost);
    } catch (err) {
      console.error("Failed to update price breakdown:", err);
    }
  }, [packageItems, addOns, isTeamOrder, teamMembers, packageType]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {discountPercent > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Quantity Discount ({(discountPercent * 100).toFixed(0)}%)
              </span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="flex items-center">
              <Truck className="mr-2 h-4 w-4" /> Shipping
              {shipping === 0 && (
                <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                  FREE
                </Badge>
              )}
            </span>
            <span>{shipping > 0 ? `$${shipping.toFixed(2)}` : 'FREE'}</span>
          </div>

          <div className="border-t pt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="pt-2 text-sm text-muted-foreground">
            <p>All prices in USD. Tax will be calculated at checkout.</p>
            {isTeamOrder && (
              <p className="mt-2 text-green-600">
                Team orders with 10+ items receive a {(calculateQuantityDiscount(10) * 100).toFixed(0)}% discount!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}