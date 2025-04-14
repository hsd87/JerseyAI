import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Define the PriceBreakdown interface locally for now
interface PriceBreakdown {
  baseTotal: number;
  tierDiscountApplied: string;
  tierDiscountAmount: number;
  subscriptionDiscountApplied: string;
  subscriptionDiscountAmount: number;
  subtotalAfterDiscounts: number;
  shippingCost: number;
  grandTotal: number;
}

interface PriceBreakdownProps {
  breakdown: PriceBreakdown;
  className?: string;
}

/**
 * Component that displays a detailed price breakdown
 * Shows base total, applied discounts, shipping costs, and final total
 */
export function PriceBreakdownCard({ breakdown, className }: PriceBreakdownProps) {
  // Format currency values
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  
  // Format cents to dollars
  const formatPrice = (cents: number) => formatter.format(cents / 100);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Price Breakdown</CardTitle>
        <CardDescription>Detailed breakdown of your order pricing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base total:</span>
            <span>{formatPrice(breakdown.baseTotal)}</span>
          </div>
          
          {breakdown.tierDiscountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Quantity discount ({breakdown.tierDiscountApplied}):</span>
              <span>-{formatPrice(breakdown.tierDiscountAmount)}</span>
            </div>
          )}
          
          {breakdown.subscriptionDiscountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Pro member discount ({breakdown.subscriptionDiscountApplied}):</span>
              <span>-{formatPrice(breakdown.subscriptionDiscountAmount)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-medium pt-2 border-t">
            <span>Subtotal:</span>
            <span>{formatPrice(breakdown.subtotalAfterDiscounts)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping:</span>
            <span>
              {breakdown.shippingCost === 0 
                ? <span className="text-green-600">FREE</span> 
                : formatPrice(breakdown.shippingCost)}
            </span>
          </div>
          
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>{formatPrice(breakdown.grandTotal)}</span>
          </div>
          
          {/* Shipping threshold info */}
          {breakdown.shippingCost > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {breakdown.subtotalAfterDiscounts < 20000 ? (
                <p>Spend ${formatter.format(500 - breakdown.subtotalAfterDiscounts / 100)} more for free shipping</p>
              ) : breakdown.subtotalAfterDiscounts < 50000 ? (
                <p>Spend ${formatter.format(500 - breakdown.subtotalAfterDiscounts / 100)} more for free shipping</p>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simpler component that just shows the final price with any applicable discounts
 */
export function SimplePriceSummary({ breakdown, className }: PriceBreakdownProps) {
  // Format currency values
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  
  // Format cents to dollars
  const formatPrice = (cents: number) => formatter.format(cents / 100);
  
  // Calculate if there's any discount
  const hasDiscount = breakdown.tierDiscountAmount > 0 || breakdown.subscriptionDiscountAmount > 0;
  const totalDiscount = breakdown.tierDiscountAmount + breakdown.subscriptionDiscountAmount;
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <span className="font-medium">Total:</span>
        <div className="text-right">
          {hasDiscount && (
            <span className="text-sm line-through text-muted-foreground mr-2">
              {formatPrice(breakdown.baseTotal)}
            </span>
          )}
          <span className="font-bold">
            {formatPrice(breakdown.grandTotal)}
          </span>
        </div>
      </div>
      
      {hasDiscount && (
        <div className="text-sm text-green-600 text-right">
          You save {formatPrice(totalDiscount)} ({Math.round((totalDiscount / breakdown.baseTotal) * 100)}%)
        </div>
      )}
      
      {breakdown.shippingCost === 0 && (
        <div className="text-sm text-green-600 text-right mt-1">
          Free shipping included
        </div>
      )}
    </div>
  );
}