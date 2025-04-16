import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrderStore } from "@/hooks/use-order-store";

// Size charts for different sports
const SIZE_CHARTS = {
  soccer: {
    men: {
      'S': { chest: '36-38"', waist: '28-30"' },
      'M': { chest: '38-40"', waist: '32-34"' },
      'L': { chest: '42-44"', waist: '36-38"' },
      'XL': { chest: '46-48"', waist: '40-42"' },
      '2XL': { chest: '50-52"', waist: '44-46"' },
    },
    women: {
      'S': { chest: '33-35"', waist: '25-27"' },
      'M': { chest: '36-38"', waist: '28-30"' },
      'L': { chest: '39-41"', waist: '31-33"' },
      'XL': { chest: '42-44"', waist: '34-36"' },
      '2XL': { chest: '45-47"', waist: '37-39"' },
    },
    youth: {
      'Youth S': { chest: '26-28"', waist: '22-24"' },
      'Youth M': { chest: '28-30"', waist: '24-26"' },
      'Youth L': { chest: '30-32"', waist: '26-28"' },
    }
  },
  basketball: {
    men: {
      'S': { chest: '36-38"', length: '27-28"' },
      'M': { chest: '40-42"', length: '29-30"' },
      'L': { chest: '44-46"', length: '31-32"' },
      'XL': { chest: '48-50"', length: '33-34"' },
      '2XL': { chest: '52-54"', length: '35-36"' },
    },
    women: {
      'S': { chest: '33-35"', length: '24-25"' },
      'M': { chest: '36-38"', length: '26-27"' },
      'L': { chest: '39-41"', length: '28-29"' },
      'XL': { chest: '42-45"', length: '30-31"' },
      '2XL': { chest: '46-49"', length: '32-33"' },
    },
    youth: {
      'Youth S': { chest: '26-28"', length: '21-22"' },
      'Youth M': { chest: '29-31"', length: '23-24"' },
      'Youth L': { chest: '32-34"', length: '25-26"' },
    }
  },
  default: {
    men: {
      'S': { chest: '36-38"' },
      'M': { chest: '40-42"' },
      'L': { chest: '44-46"' },
      'XL': { chest: '48-50"' },
      '2XL': { chest: '52-54"' },
    },
    women: {
      'S': { chest: '33-35"' },
      'M': { chest: '36-38"' },
      'L': { chest: '39-41"' },
      'XL': { chest: '42-45"' },
      '2XL': { chest: '46-49"' },
    },
    youth: {
      'Youth S': { chest: '26-28"' },
      'Youth M': { chest: '29-31"' },
      'Youth L': { chest: '32-34"' },
    }
  }
};

// Available sizes for each category
const AVAILABLE_SIZES = {
  men: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
  women: ['S', 'M', 'L', 'XL', '2XL'],
  youth: ['Youth S', 'Youth M', 'Youth L'],
};

export default function SizeChartDisplay() {
  const { addItem, items, updateItem, sport: storeSport } = useOrderStore();
  const [gender, setGender] = useState<string>('men');
  const [size, setSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [sport, setSport] = useState<string>(storeSport || 'soccer');
  
  // Get the item from the store if it exists
  const existingItem = items.find(item => 
    item.type === 'jersey' && 
    item.size === size && 
    (item as any).gender === gender
  );

  // Function to handle adding or updating item
  const handleAddToCart = () => {
    const jerseyPrice = 69.99; // Base price
    const itemId = existingItem?.id || `jersey-${gender}-${size}`;
    
    if (existingItem) {
      // Update existing item quantity
      updateItem(existingItem.id, {
        ...existingItem,
        quantity: existingItem.quantity + quantity
      });
    } else {
      // Add new item
      addItem({
        id: itemId,
        name: `${gender === 'youth' ? 'Youth ' : gender === 'women' ? 'Women\'s ' : 'Men\'s '} ${sport.charAt(0).toUpperCase() + sport.slice(1)} Jersey`,
        type: 'jersey',
        size,
        gender,
        quantity,
        price: jerseyPrice,
      });
    }
    
    // Reset quantity after adding
    setQuantity(1);
  };
  
  // Get size chart based on sport and gender
  const getSizeChart = () => {
    const sportChart = SIZE_CHARTS[sport as keyof typeof SIZE_CHARTS] || SIZE_CHARTS.default;
    return sportChart[gender as keyof typeof sportChart] || {};
  };
  
  const sizeChart = getSizeChart();
  
  return (
    <div className="space-y-6">
      {/* Sport and Gender Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sport-select">Sport</Label>
          <Select value={sport} onValueChange={(value) => setSport(value)}>
            <SelectTrigger id="sport-select">
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soccer">Soccer</SelectItem>
              <SelectItem value="basketball">Basketball</SelectItem>
              <SelectItem value="volleyball">Volleyball</SelectItem>
              <SelectItem value="baseball">Baseball</SelectItem>
              <SelectItem value="hockey">Hockey</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="gender-select">Category</Label>
          <Select value={gender} onValueChange={(value) => {
            setGender(value);
            // Reset size to default when changing gender
            setSize(AVAILABLE_SIZES[value as keyof typeof AVAILABLE_SIZES][1]); 
          }}>
            <SelectTrigger id="gender-select">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="men">Men's</SelectItem>
              <SelectItem value="women">Women's</SelectItem>
              <SelectItem value="youth">Youth</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Size Chart Display */}
      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="sizes">
            <TabsList className="mb-4">
              <TabsTrigger value="sizes">Size Selection</TabsTrigger>
              <TabsTrigger value="chart">Size Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sizes" className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_SIZES[gender as keyof typeof AVAILABLE_SIZES].map((availableSize) => (
                  <Button
                    key={availableSize}
                    variant={availableSize === size ? "default" : "outline"}
                    onClick={() => setSize(availableSize)}
                    className="flex-1"
                  >
                    {availableSize}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-end gap-4 mt-4">
                <div className="flex-1">
                  <Label htmlFor="quantity-input">Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity-input"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <Button className="px-8" onClick={handleAddToCart}>
                  {existingItem ? 'Update Cart' : 'Add to Cart'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="chart">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Size</th>
                      {Object.keys(Object.values(sizeChart)[0] || {}).map((measurement) => (
                        <th key={measurement} className="border p-2 text-left capitalize">
                          {measurement}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sizeChart).map(([sizeName, measurements]) => (
                      <tr key={sizeName} className="hover:bg-gray-50">
                        <td className="border p-2 font-medium">{sizeName}</td>
                        {Object.values(measurements).map((value, index) => (
                          <td key={index} className="border p-2">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                Measurements are approximate. For best fit, please measure yourself and compare to the chart.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Current Selection */}
      {items.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-2">Current Selection</h3>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <span>
                  {item.name} - {item.size} ({item.quantity})
                </span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}