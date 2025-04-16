import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useOrderStore } from "@/hooks/use-order-store";
import { Ruler, Info } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { OrderItem } from "@/hooks/use-order-types";

export default function SizeChartDisplay() {
  const { gender, size, quantity, packageType, items, addItem } = useOrderStore();
  const [selectedGender, setSelectedGender] = useState<string>(gender || "Male");
  const [selectedSize, setSelectedSize] = useState<string>(size || "M");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(quantity || 1);
  
  // Update store when selections change
  useEffect(() => {
    useOrderStore.getState().setGender?.(selectedGender);
    useOrderStore.getState().setSize?.(selectedSize);
    useOrderStore.getState().setQuantity?.(selectedQuantity);
  }, [selectedGender, selectedSize, selectedQuantity]);
  
  // Get price for a product type
  const getPrice = (type: string): number => {
    const prices: Record<string, number> = {
      jerseyOnly: 6999,
      jerseyShorts: 8999,
      fullKit: 12999,
      default: 6999
    };
    
    return prices[type] || prices.default;
  };
  
  // Add to cart
  const handleAddToOrder = () => {
    const newItem: OrderItem = {
      type: packageType,
      size: selectedSize,
      quantity: selectedQuantity,
      gender: selectedGender,
      price: getPrice(packageType)
    };
    
    addItem(newItem);
  };
  
  return (
    <Card className="relative">
      <CardContent className="pt-6">
        {/* Gender Selection */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-2 block">Gender</Label>
          <RadioGroup
            defaultValue={selectedGender}
            value={selectedGender}
            onValueChange={setSelectedGender}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Male" id="gender-male" />
              <Label htmlFor="gender-male">Men's</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Female" id="gender-female" />
              <Label htmlFor="gender-female">Women's</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Youth" id="gender-youth" />
              <Label htmlFor="gender-youth">Youth</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Size Selection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-base font-medium">Size</Label>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-primary">
                  <Ruler className="h-4 w-4 mr-1" />
                  Size Chart
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Size Chart</DialogTitle>
                  <DialogDescription>
                    Measurements are in inches
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4">
                  <h3 className="font-medium mb-2">{selectedGender === "Youth" ? "Youth Sizes" : selectedGender === "Female" ? "Women's Sizes" : "Men's Sizes"}</h3>
                  
                  <div className="border rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="p-2 text-left">Size</th>
                          <th className="p-2 text-left">Chest</th>
                          <th className="p-2 text-left">Waist</th>
                          <th className="p-2 text-left">Hips</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGender === "Male" ? (
                          <>
                            <tr className="border-b">
                              <td className="p-2">XS</td>
                              <td className="p-2">34-36</td>
                              <td className="p-2">28-30</td>
                              <td className="p-2">34-36</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">S</td>
                              <td className="p-2">36-38</td>
                              <td className="p-2">30-32</td>
                              <td className="p-2">36-38</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">M</td>
                              <td className="p-2">38-40</td>
                              <td className="p-2">32-34</td>
                              <td className="p-2">38-40</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">L</td>
                              <td className="p-2">40-42</td>
                              <td className="p-2">34-36</td>
                              <td className="p-2">40-42</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">XL</td>
                              <td className="p-2">42-44</td>
                              <td className="p-2">36-38</td>
                              <td className="p-2">42-44</td>
                            </tr>
                            <tr>
                              <td className="p-2">XXL</td>
                              <td className="p-2">44-46</td>
                              <td className="p-2">38-40</td>
                              <td className="p-2">44-46</td>
                            </tr>
                          </>
                        ) : selectedGender === "Female" ? (
                          <>
                            <tr className="border-b">
                              <td className="p-2">XS</td>
                              <td className="p-2">32-34</td>
                              <td className="p-2">24-26</td>
                              <td className="p-2">34-36</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">S</td>
                              <td className="p-2">34-36</td>
                              <td className="p-2">26-28</td>
                              <td className="p-2">36-38</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">M</td>
                              <td className="p-2">36-38</td>
                              <td className="p-2">28-30</td>
                              <td className="p-2">38-40</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">L</td>
                              <td className="p-2">38-40</td>
                              <td className="p-2">30-32</td>
                              <td className="p-2">40-42</td>
                            </tr>
                            <tr>
                              <td className="p-2">XL</td>
                              <td className="p-2">40-42</td>
                              <td className="p-2">32-34</td>
                              <td className="p-2">42-44</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr className="border-b">
                              <td className="p-2">YS</td>
                              <td className="p-2">26-28</td>
                              <td className="p-2">22-24</td>
                              <td className="p-2">26-28</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">YM</td>
                              <td className="p-2">28-30</td>
                              <td className="p-2">24-26</td>
                              <td className="p-2">28-30</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">YL</td>
                              <td className="p-2">30-32</td>
                              <td className="p-2">26-28</td>
                              <td className="p-2">30-32</td>
                            </tr>
                            <tr>
                              <td className="p-2">YXL</td>
                              <td className="p-2">32-34</td>
                              <td className="p-2">28-30</td>
                              <td className="p-2">32-34</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Select 
            value={selectedSize} 
            onValueChange={setSelectedSize}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {selectedGender === "Youth" ? (
                <SelectGroup>
                  <SelectLabel>Youth Sizes</SelectLabel>
                  <SelectItem value="YS">Youth Small (YS)</SelectItem>
                  <SelectItem value="YM">Youth Medium (YM)</SelectItem>
                  <SelectItem value="YL">Youth Large (YL)</SelectItem>
                  <SelectItem value="YXL">Youth XL (YXL)</SelectItem>
                </SelectGroup>
              ) : (
                <SelectGroup>
                  <SelectLabel>Adult Sizes</SelectLabel>
                  <SelectItem value="XS">Extra Small (XS)</SelectItem>
                  <SelectItem value="S">Small (S)</SelectItem>
                  <SelectItem value="M">Medium (M)</SelectItem>
                  <SelectItem value="L">Large (L)</SelectItem>
                  <SelectItem value="XL">Extra Large (XL)</SelectItem>
                  {selectedGender === "Male" && (
                    <SelectItem value="XXL">Double XL (XXL)</SelectItem>
                  )}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {/* Quantity Selection */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-2 block">Quantity</Label>
          <div className="flex items-center w-[180px]">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
              disabled={selectedQuantity <= 1}
            >
              -
            </Button>
            <Input
              type="number"
              min="1"
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
              className="h-8 rounded-none text-center w-16"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setSelectedQuantity(selectedQuantity + 1)}
            >
              +
            </Button>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Order Summary */}
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{
              packageType === 'jerseyOnly' ? 'Jersey Only' :
              packageType === 'jerseyShorts' ? 'Jersey + Shorts' :
              packageType === 'fullKit' ? 'Full Kit (Jersey + Shorts + Socks)' : 
              'Kit Package'
            }</p>
            <p className="text-sm text-gray-500">
              {selectedGender === "Youth" ? "Youth" : selectedGender === "Female" ? "Women's" : "Men's"} size {selectedSize}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">${(getPrice(packageType) / 100).toFixed(2)}</p>
            <Button 
              variant="default"
              size="sm" 
              className="mt-2"
              onClick={handleAddToOrder}
            >
              Add to Order
            </Button>
          </div>
        </div>
        
        {/* Item list */}
        {items.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium mb-2">Order Items</h3>
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <div>
                    <p>{
                      item.type === 'jerseyOnly' ? 'Jersey Only' :
                      item.type === 'jerseyShorts' ? 'Jersey + Shorts' :
                      item.type === 'fullKit' ? 'Full Kit' : 
                      'Kit Package'
                    }</p>
                    <p className="text-xs text-gray-500">
                      {item.gender} size {item.size} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>${(item.price / 100).toFixed(2)}</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 text-gray-500"
                      onClick={() => useOrderStore.getState().removeItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}