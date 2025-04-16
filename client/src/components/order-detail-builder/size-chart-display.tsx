import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrderStore } from "@/hooks/use-order-store";
import { OrderItem } from '@/hooks/use-order-types';
import { Plus, Minus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Size chart data - unisex adult sizes
const ADULT_SIZES = [
  { size: 'S', chest: '35-37"', waist: '29-31"', height: '5\'4"-5\'7"', metric: { chest: '89-94cm', waist: '74-79cm', height: '163-170cm' } },
  { size: 'M', chest: '38-40"', waist: '32-34"', height: '5\'8"-5\'11"', metric: { chest: '97-102cm', waist: '81-86cm', height: '173-180cm' } },
  { size: 'L', chest: '41-43"', waist: '35-37"', height: '5\'11"-6\'2"', metric: { chest: '104-109cm', waist: '89-94cm', height: '180-188cm' } },
  { size: 'XL', chest: '44-46"', waist: '38-40"', height: '6\'2"-6\'5"', metric: { chest: '112-117cm', waist: '97-102cm', height: '188-196cm' } },
  { size: '2XL', chest: '47-49"', waist: '41-43"', height: '6\'4"-6\'6"', metric: { chest: '119-124cm', waist: '104-109cm', height: '193-198cm' } },
];

// Size chart data - women's sizes
const WOMENS_SIZES = [
  { size: 'S', chest: '33-35"', waist: '25-27"', height: '5\'2"-5\'4"', metric: { chest: '84-89cm', waist: '64-69cm', height: '157-163cm' } },
  { size: 'M', chest: '36-38"', waist: '28-30"', height: '5\'4"-5\'6"', metric: { chest: '91-97cm', waist: '71-76cm', height: '163-168cm' } },
  { size: 'L', chest: '39-41"', waist: '31-33"', height: '5\'6"-5\'8"', metric: { chest: '99-104cm', waist: '79-84cm', height: '168-173cm' } },
  { size: 'XL', chest: '42-44"', waist: '34-36"', height: '5\'7"-5\'9"', metric: { chest: '107-112cm', waist: '86-91cm', height: '170-175cm' } },
  { size: '2XL', chest: '45-47"', waist: '37-39"', height: '5\'8"-5\'10"', metric: { chest: '114-119cm', waist: '94-99cm', height: '173-178cm' } },
];

// Size chart data - youth sizes
const YOUTH_SIZES = [
  { size: 'Youth S', chest: '26-28"', waist: '22-24"', height: '4\'0"-4\'3"', age: '6-8', metric: { chest: '66-71cm', waist: '56-61cm', height: '122-130cm' } },
  { size: 'Youth M', chest: '29-31"', waist: '25-26"', height: '4\'4"-4\'7"', age: '8-10', metric: { chest: '74-79cm', waist: '64-66cm', height: '132-140cm' } },
  { size: 'Youth L', chest: '32-34"', waist: '27-29"', height: '4\'8"-4\'11"', age: '10-12', metric: { chest: '81-86cm', waist: '69-74cm', height: '142-150cm' } },
  { size: 'Youth XL', chest: '35-37"', waist: '30-32"', height: '5\'0"-5\'3"', age: '12-14', metric: { chest: '89-94cm', waist: '76-81cm', height: '152-160cm' } },
];

export default function SizeChartDisplay() {
  const { items, addItem, updateItem } = useOrderStore();
  const [activeTab, setActiveTab] = useState('men');
  const [measurementUnit, setMeasurementUnit] = useState<'imperial' | 'metric'>('imperial');
  const [jerseyQuantity, setJerseyQuantity] = useState(1);
  const [jerseySize, setJerseySize] = useState('M');
  
  // Handle adding jersey to cart
  const addJerseyToCart = () => {
    const jersey: OrderItem = {
      id: crypto.randomUUID(),
      type: 'jersey',
      name: 'Team Jersey',
      size: jerseySize,
      gender: activeTab,
      quantity: jerseyQuantity,
      price: 69.99, // Base price
    };
    
    addItem(jersey);
    
    // Reset quantity
    setJerseyQuantity(1);
  };
  
  // Handle quantity changes
  const incrementQuantity = () => setJerseyQuantity(prev => prev + 1);
  const decrementQuantity = () => setJerseyQuantity(prev => Math.max(1, prev - 1));
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setJerseyQuantity(value);
    }
  };
  
  // Handle updating cart item
  const handleUpdateCartItem = (item: OrderItem, newSize: string, newQuantity: number) => {
    const updatedItem = {
      ...item,
      size: newSize,
      quantity: newQuantity
    };
    
    updateItem(item.id, updatedItem);
  };
  
  // Get the current size data based on the active tab
  const getSizeData = () => {
    switch (activeTab) {
      case 'men':
        return ADULT_SIZES;
      case 'women':
        return WOMENS_SIZES;
      case 'youth':
        return YOUTH_SIZES;
      default:
        return ADULT_SIZES;
    }
  };
  
  // Get already added jerseys for the current gender
  const currentGenderJerseys = items.filter(item => 
    item.type === 'jersey' && item.gender === activeTab
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Size Selection</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Measurements:</span>
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={measurementUnit === 'imperial' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setMeasurementUnit('imperial')}
              >
                Imperial
              </Button>
              <Button
                variant={measurementUnit === 'metric' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setMeasurementUnit('metric')}
              >
                Metric
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="men">Men's</TabsTrigger>
            <TabsTrigger value="women">Women's</TabsTrigger>
            <TabsTrigger value="youth">Youth</TabsTrigger>
          </TabsList>
          
          <TabsContent value="men" className="mt-4">
            <SizeChart 
              sizeData={ADULT_SIZES} 
              measurementUnit={measurementUnit} 
              showAge={false}
            />
          </TabsContent>
          
          <TabsContent value="women" className="mt-4">
            <SizeChart 
              sizeData={WOMENS_SIZES} 
              measurementUnit={measurementUnit}
              showAge={false} 
            />
          </TabsContent>
          
          <TabsContent value="youth" className="mt-4">
            <SizeChart 
              sizeData={YOUTH_SIZES} 
              measurementUnit={measurementUnit}
              showAge={true}
            />
          </TabsContent>
        </Tabs>
        
        <div className="border rounded-lg p-4 mt-4 space-y-4">
          <h3 className="font-medium">Add to Cart</h3>
          
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4">
              <label className="text-sm text-muted-foreground mb-1 block">Size</label>
              <Select value={jerseySize} onValueChange={setJerseySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {getSizeData().map(size => (
                    <SelectItem key={size.size} value={size.size}>
                      {size.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-3">
              <label className="text-sm text-muted-foreground mb-1 block">Quantity</label>
              <div className="flex h-10">
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  className="h-10 w-10 rounded-r-none"
                  onClick={decrementQuantity}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={jerseyQuantity}
                  onChange={handleQuantityChange}
                  min={1}
                  className="h-10 w-12 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  className="h-10 w-10 rounded-l-none"
                  onClick={incrementQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="col-span-5 flex items-end">
              <Button 
                className="w-full"
                onClick={addJerseyToCart}
              >
                Add to Cart - ${(69.99 * jerseyQuantity).toFixed(2)}
              </Button>
            </div>
          </div>
          
          {/* Display already added jerseys for this gender */}
          {currentGenderJerseys.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Already in Cart:</h4>
              <ul className="space-y-2">
                {currentGenderJerseys.map((jersey, index) => (
                  <li key={index} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <span>{activeTab === 'men' ? "Men's" : 
                              activeTab === 'women' ? "Women's" : 
                              "Youth"} Jersey - Size {jersey.size}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select 
                        value={jersey.size}
                        onValueChange={(newSize) => handleUpdateCartItem(jersey, newSize, jersey.quantity)}
                      >
                        <SelectTrigger className="h-8 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getSizeData().map(size => (
                            <SelectItem key={size.size} value={size.size}>
                              {size.size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex h-8">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-r-none"
                          onClick={() => {
                            const newQty = Math.max(1, jersey.quantity - 1);
                            handleUpdateCartItem(jersey, jersey.size, newQty);
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={jersey.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value > 0) {
                              handleUpdateCartItem(jersey, jersey.size, value);
                            }
                          }}
                          min={1}
                          className="h-8 w-10 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-l-none"
                          onClick={() => handleUpdateCartItem(jersey, jersey.size, jersey.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-sm w-16 text-right">
                        ${(jersey.price * jersey.quantity).toFixed(2)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Size chart component
interface SizeChartProps {
  sizeData: any[];
  measurementUnit: 'imperial' | 'metric';
  showAge: boolean;
}

function SizeChart({ sizeData, measurementUnit, showAge }: SizeChartProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Size</TableHead>
            <TableHead>Chest</TableHead>
            <TableHead>Waist</TableHead>
            <TableHead>Height</TableHead>
            {showAge && <TableHead>Age</TableHead>}
            <TableHead className="w-8">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      These are general sizing guidelines. For a more precise fit,
                      refer to your own measurements.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sizeData.map((size) => (
            <TableRow key={size.size}>
              <TableCell className="font-medium">{size.size}</TableCell>
              <TableCell>{measurementUnit === 'imperial' ? size.chest : size.metric.chest}</TableCell>
              <TableCell>{measurementUnit === 'imperial' ? size.waist : size.metric.waist}</TableCell>
              <TableCell>{measurementUnit === 'imperial' ? size.height : size.metric.height}</TableCell>
              {showAge && <TableCell>{size.age} yrs</TableCell>}
              <TableCell></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}