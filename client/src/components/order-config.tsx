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
    addOns = []
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
    
    // Get functions from store
    const { addAddOn, removeAddOn } = useOrderStore.getState();
    
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
      <CardContent className="p-6">
        <p className="text-center text-gray-500">Order configuration has been simplified.</p>
      </CardContent>
    </Card>
  );
}