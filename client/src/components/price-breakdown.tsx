import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Import the PriceBreakdown interface from the shared types
import { PriceBreakdown } from '@/hooks/use-order-types';

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
            <span>{formatPrice(breakdown.subtotal)}</span>
          </div>
          
          {breakdown.tierDiscountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Quantity discount {breakdown.tierDiscountApplied ? "(applied)" : ""}:</span>
              <span>-{formatPrice(breakdown.tierDiscountAmount)}</span>
            </div>
          )}
          
          {breakdown.subscriptionDiscountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Pro member discount {breakdown.subscriptionDiscountApplied ? "(applied)" : ""}:</span>
              <span>-{formatPrice(breakdown.subscriptionDiscountAmount)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-medium pt-2 border-t">
            <span>Subtotal:</span>
            <span>{formatPrice(breakdown.subtotal - breakdown.discount)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping:</span>
            <span>
              {breakdown.shipping === 0 
                ? <span className="text-green-600">FREE</span> 
                : formatPrice(breakdown.shipping)}
            </span>
          </div>
          
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>{formatPrice(breakdown.grandTotal)}</span>
          </div>
          
          {/* Shipping threshold info */}
          {breakdown.shipping > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {breakdown.subtotal < 200 ? (
                <p>Spend ${formatter.format(200 - breakdown.subtotal)} more for reduced shipping</p>
              ) : breakdown.subtotal < 500 ? (
                <p>Spend ${formatter.format(500 - breakdown.subtotal)} more for free shipping</p>
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
  const hasDiscount = breakdown.discount > 0;
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <span className="font-medium">Total:</span>
        <div className="text-right">
          {hasDiscount && (
            <span className="text-sm line-through text-muted-foreground mr-2">
              {formatPrice(breakdown.subtotal)}
            </span>
          )}
          <span className="font-bold">
            {formatPrice(breakdown.grandTotal)}
          </span>
        </div>
      </div>
      
      {hasDiscount && (
        <div className="text-sm text-green-600 text-right">
          You save {formatPrice(breakdown.discount)} ({Math.round((breakdown.discount / breakdown.subtotal) * 100)}%)
        </div>
      )}
      
      {breakdown.shipping === 0 && (
        <div className="text-sm text-green-600 text-right mt-1">
          Free shipping included
        </div>
      )}
    </div>
  );
}