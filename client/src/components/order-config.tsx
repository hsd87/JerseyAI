import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrderStore } from '@/hooks/use-order-store';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, MinusCircle, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PACKAGE_PRICES, ADDON_OPTIONS } from '@/lib/constants';

// Form schema
const orderConfigSchema = z.object({
  packageType: z.enum(['jerseyOnly', 'jerseyShorts', 'fullKit'], {
    required_error: 'Please select a package type',
  }),
  gender: z.enum(['Male', 'Female', 'Youth'], {
    required_error: 'Please select a gender',
  }),
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'], {
    required_error: 'Please select a size',
  }),
  quantity: z.number().min(1).default(1),
  isTeamOrder: z.boolean().default(false),
});

type OrderConfigValues = z.infer<typeof orderConfigSchema>;

export default function OrderConfig() {
  const { user } = useAuth();
  const { 
    packageType,
    setPackageType,
    isTeamOrder,
    setTeamOrder,
    addOns = [], 
    // Assuming these functions are available in the store, if not they need to be added
    addAddOn = () => {},
    removeAddOn = () => {}
  } = useOrderStore();
  
  // Local state for form values if not in global store
  const [gender, setGender] = useState('Male');
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  const form = useForm<OrderConfigValues>({
    resolver: zodResolver(orderConfigSchema),
    defaultValues: {
      packageType: packageType as 'jerseyOnly' | 'jerseyShorts' | 'fullKit',
      gender: gender as 'Male' | 'Female' | 'Youth',
      size: size as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
      quantity,
      isTeamOrder,
    },
  });

  // Watch form values
  const watchedPackageType = form.watch('packageType');
  const watchedGender = form.watch('gender');

  // Update store when form values change
  const handlePackageTypeChange = (value: 'jerseyOnly' | 'jerseyShorts' | 'fullKit') => {
    form.setValue('packageType', value);
    setPackageType(value);
  };

  const handleGenderChange = (value: 'Male' | 'Female' | 'Youth') => {
    form.setValue('gender', value);
    setGender(value);
  };

  const handleSizeChange = (value: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL') => {
    form.setValue('size', value);
    setSize(value);
  };

  const handleTeamOrderChange = (checked: boolean) => {
    form.setValue('isTeamOrder', checked);
    setTeamOrder(checked);
  };

  const handleQuantityChange = (newQty: number) => {
    const qty = Math.max(1, newQty);
    form.setValue('quantity', qty);
    setQuantity(qty);
  };

  const handleAddonQuantityChange = (id: string, change: number) => {
    const currentAddon = addOns.find(addon => addon.id === id);
    const currentQty = currentAddon?.quantity || 0;
    const newQty = Math.max(0, currentQty + change);
    
    if (newQty === 0 && currentQty > 0) {
      // Find the index of the add-on to remove it
      const index = addOns.findIndex(addon => addon.id === id);
      if (index !== -1) {
        removeAddOn(index);
      }
    } else if (newQty > 0) {
      // Add or update add-on
      addAddOn({
        id,
        name: ADDON_OPTIONS.find(a => a.id === id)?.name || '',
        price: ADDON_OPTIONS.find(a => a.id === id)?.price || 0,
        quantity: newQty
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configure Your Order</CardTitle>
        <CardDescription>
          Choose your package type, size and add-ons
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Package Selection section */}
          <div className="space-y-4">
            <h2 className="text-xl font-medium mb-4">Package</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${watchedPackageType === 'jerseyOnly' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                onClick={() => handlePackageTypeChange('jerseyOnly')}
              >
                <h3 className="font-semibold">Jersey Only</h3>
                <p className="text-lg font-bold">${PACKAGE_PRICES.jerseyOnly}</p>
                <p className="text-sm text-gray-500">Custom jersey with your design</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${watchedPackageType === 'jerseyShorts' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                onClick={() => handlePackageTypeChange('jerseyShorts')}
              >
                <h3 className="font-semibold">Jersey + Shorts</h3>
                <p className="text-lg font-bold">${PACKAGE_PRICES.jerseyShorts}</p>
                <p className="text-sm text-gray-500">Custom jersey with matching shorts</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${watchedPackageType === 'fullKit' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                onClick={() => handlePackageTypeChange('fullKit')}
              >
                <h3 className="font-semibold">Full Kit</h3>
                <p className="text-lg font-bold">${PACKAGE_PRICES.fullKit}</p>
                <p className="text-sm text-gray-500">Jersey, shorts & personalized accessories</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Switch 
                id="team-order" 
                checked={isTeamOrder}
                onCheckedChange={handleTeamOrderChange}
              />
              <Label htmlFor="team-order" className="cursor-pointer">This is a team order</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Team orders allow you to add multiple players with different sizes and numbers</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {!isTeamOrder && (
              <div className="flex items-center space-x-4 mt-4">
                <Label>Quantity:</Label>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="mx-4">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity + 1)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Add-Ons section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-medium mb-4">Add-Ons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ADDON_OPTIONS.map((addon) => {
                const currentAddon = addOns.find(a => a.id === addon.id);
                const currentQty = currentAddon?.quantity || 0;
                
                return (
                  <div 
                    key={addon.id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium">{addon.name}</h3>
                      <p className="text-sm font-bold">${addon.price}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleAddonQuantityChange(addon.id, -1)}
                        disabled={currentQty === 0}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center">{currentQty}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleAddonQuantityChange(addon.id, 1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Sizing Section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-medium mb-4">Sizing</h2>
            <div>
              <h3 className="text-lg font-medium mb-2">Select Gender</h3>
              <RadioGroup 
                defaultValue={gender} 
                onValueChange={(value) => handleGenderChange(value as 'Male' | 'Female' | 'Youth')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Men's</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Women's</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Youth" id="youth" />
                  <Label htmlFor="youth">Youth</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Select Size</h3>
              
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sizeOption) => (
                  <div
                    key={sizeOption}
                    className={`border rounded-md p-3 text-center cursor-pointer transition-colors ${
                      size === sizeOption 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSizeChange(sizeOption as any)}
                  >
                    {sizeOption}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 rounded-md border p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Size Chart ({watchedGender})</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 text-sm">
                  <thead>
                    <tr className="divide-x divide-gray-200">
                      <th className="px-3 py-2 bg-gray-100">Size</th>
                      <th className="px-3 py-2 bg-gray-100">Chest (in)</th>
                      <th className="px-3 py-2 bg-gray-100">Waist (in)</th>
                      <th className="px-3 py-2 bg-gray-100">Hips (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {watchedGender === 'Male' && (
                      <>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">XS</td>
                          <td className="px-3 py-2">33-35</td>
                          <td className="px-3 py-2">27-29</td>
                          <td className="px-3 py-2">33-35</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">S</td>
                          <td className="px-3 py-2">36-38</td>
                          <td className="px-3 py-2">30-32</td>
                          <td className="px-3 py-2">36-38</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">M</td>
                          <td className="px-3 py-2">39-41</td>
                          <td className="px-3 py-2">33-35</td>
                          <td className="px-3 py-2">39-41</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">L</td>
                          <td className="px-3 py-2">42-44</td>
                          <td className="px-3 py-2">36-38</td>
                          <td className="px-3 py-2">42-44</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">XL</td>
                          <td className="px-3 py-2">45-47</td>
                          <td className="px-3 py-2">39-41</td>
                          <td className="px-3 py-2">45-47</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">XXL</td>
                          <td className="px-3 py-2">48-50</td>
                          <td className="px-3 py-2">42-44</td>
                          <td className="px-3 py-2">48-50</td>
                        </tr>
                      </>
                    )}
                    
                    {watchedGender === 'Female' && (
                      <>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">XS</td>
                          <td className="px-3 py-2">30-32</td>
                          <td className="px-3 py-2">24-26</td>
                          <td className="px-3 py-2">33-35</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">S</td>
                          <td className="px-3 py-2">33-35</td>
                          <td className="px-3 py-2">27-29</td>
                          <td className="px-3 py-2">36-38</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">M</td>
                          <td className="px-3 py-2">36-38</td>
                          <td className="px-3 py-2">30-32</td>
                          <td className="px-3 py-2">39-41</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">L</td>
                          <td className="px-3 py-2">39-41</td>
                          <td className="px-3 py-2">33-35</td>
                          <td className="px-3 py-2">42-44</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">XL</td>
                          <td className="px-3 py-2">42-44</td>
                          <td className="px-3 py-2">36-38</td>
                          <td className="px-3 py-2">45-47</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">XXL</td>
                          <td className="px-3 py-2">45-47</td>
                          <td className="px-3 py-2">39-41</td>
                          <td className="px-3 py-2">48-50</td>
                        </tr>
                      </>
                    )}
                    
                    {watchedGender === 'Youth' && (
                      <>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">XS (6-7)</td>
                          <td className="px-3 py-2">24-26</td>
                          <td className="px-3 py-2">22-24</td>
                          <td className="px-3 py-2">24-26</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">S (8-9)</td>
                          <td className="px-3 py-2">26-28</td>
                          <td className="px-3 py-2">24-25</td>
                          <td className="px-3 py-2">26-28</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">M (10-11)</td>
                          <td className="px-3 py-2">28-30</td>
                          <td className="px-3 py-2">25-26</td>
                          <td className="px-3 py-2">28-30</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">L (12-13)</td>
                          <td className="px-3 py-2">30-32</td>
                          <td className="px-3 py-2">26-27</td>
                          <td className="px-3 py-2">30-32</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">XL (14-15)</td>
                          <td className="px-3 py-2">32-34</td>
                          <td className="px-3 py-2">27-29</td>
                          <td className="px-3 py-2">32-34</td>
                        </tr>
                        <tr className="divide-x divide-gray-200">
                          <td className="px-3 py-2 font-medium">XXL (16)</td>
                          <td className="px-3 py-2">34-36</td>
                          <td className="px-3 py-2">29-31</td>
                          <td className="px-3 py-2">34-36</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Action buttons section */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Back
              </Button>
              <Button type="submit">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}