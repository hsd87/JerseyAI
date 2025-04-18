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
          
          <div className="flex justify-between font-medium pt-2 border-t">
            <span>Subtotal:</span>
            <span>{formatPrice(breakdown.subtotal)}</span>
          </div>
          
          {/* Removed all discounts, shipping costs, and taxes per user request */}
          
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>{formatPrice(breakdown.grandTotal)}</span>
          </div>
          
          {/* Removed shipping threshold info per user request */}
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
  
  // Removed all discounts, shipping, and taxes per user request
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <span className="font-medium">Total:</span>
        <div className="text-right">
          <span className="font-bold">
            {formatPrice(breakdown.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}