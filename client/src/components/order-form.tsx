import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription-store';
import { Design } from '@shared/schema';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Package,
  ShoppingCart,
  Users,
  CheckCircle2,
  Info,
} from 'lucide-react';

// Sports specific package options
const packageOptions = {
  soccer: [
    { id: 'jersey', label: 'Jersey only', price: 45 },
    { id: 'jerseyShorts', label: 'Jersey + Shorts', price: 65 },
    { id: 'fullKit', label: 'Full kit (Jersey + Shorts + Socks)', price: 75 },
    { id: 'completeKit', label: 'Complete kit (Full kit + Headwear)', price: 85 },
  ],
  basketball: [
    { id: 'jersey', label: 'Jersey only', price: 50 },
    { id: 'jerseyShorts', label: 'Jersey + Shorts', price: 75 },
    { id: 'fullKit', label: 'Full kit (Jersey + Shorts + Socks)', price: 85 },
  ],
  rugby: [
    { id: 'jersey', label: 'Jersey only', price: 55 },
    { id: 'jerseyShorts', label: 'Jersey + Shorts', price: 80 },
    { id: 'fullKit', label: 'Full kit (Jersey + Shorts + Socks)', price: 90 },
    { id: 'completeKit', label: 'Complete kit (Full kit + Headwear)', price: 100 },
  ],
  cricket: [
    { id: 'jersey', label: 'Jersey only', price: 50 },
    { id: 'jerseyShorts', label: 'Jersey + Shorts', price: 75 },
    { id: 'fullKit', label: 'Full kit (Jersey + Shorts + Socks)', price: 85 },
    { id: 'completeKit', label: 'Complete kit (Full kit + Headwear)', price: 95 },
  ],
  esports: [
    { id: 'jersey', label: 'Jersey only', price: 60 },
    { id: 'fullKit', label: 'Full kit (Jersey + Gaming sleeves)', price: 85 },
  ],
};

// Add-on options
const addonOptions = [
  { id: 'namePrinting', label: 'Name Printing', price: 5 },
  { id: 'numberPrinting', label: 'Number Printing', price: 5 },
  { id: 'captainArmband', label: 'Captain Armband', price: 8 },
  { id: 'teamPatch', label: 'Team Patch', price: 10 },
];

// Size options by gender
const sizeOptions = {
  male: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  female: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  youth: ['YXS', 'YS', 'YM', 'YL', 'YXL'],
};

// Schema for order form
const orderFormSchema = z.object({
  sport: z.string().min(1, { message: 'Please select a sport' }),
  packageType: z.string().min(1, { message: 'Please select a package type' }),
  isTeamOrder: z.boolean().default(false),
  teamName: z.string().optional(),
  gender: z.enum(['male', 'female', 'youth']),
  sizes: z.array(
    z.object({
      size: z.string(),
      quantity: z.number().min(1).max(100),
    })
  ).min(1, { message: 'At least one size is required' }),
  addons: z.array(z.string()).optional(),
  shippingAddress: z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    street: z.string().min(1, { message: 'Street address is required' }),
    city: z.string().min(1, { message: 'City is required' }),
    state: z.string().min(1, { message: 'State is required' }),
    zip: z.string().min(1, { message: 'ZIP/Postal code is required' }),
    country: z.string().min(1, { message: 'Country is required' }),
    phone: z.string().min(1, { message: 'Phone number is required' }),
  }),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  design: Design;
  onSuccess?: () => void;
}

export default function OrderForm({ design, onSuccess }: OrderFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [currentPackageOptions, setCurrentPackageOptions] = useState(packageOptions.soccer);

  // Form definition
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      sport: design.sport || 'soccer',
      packageType: 'jersey',
      isTeamOrder: false,
      gender: 'male',
      sizes: [{ size: 'M', quantity: 1 }],
      addons: [],
      shippingAddress: {
        name: user?.username || '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
      },
    },
  });

  // Watch for changes to recalculate price
  const watchSport = form.watch('sport');
  const watchPackageType = form.watch('packageType');
  const watchIsTeamOrder = form.watch('isTeamOrder');
  const watchSizes = form.watch('sizes');
  const watchAddons = form.watch('addons');

  // Update package options when sport changes
  useEffect(() => {
    const sport = watchSport as keyof typeof packageOptions;
    if (packageOptions[sport]) {
      setCurrentPackageOptions(packageOptions[sport]);
      // Reset package type if not available in new sport
      const packageExists = packageOptions[sport].some(p => p.id === watchPackageType);
      if (!packageExists) {
        form.setValue('packageType', packageOptions[sport][0].id);
      }
    }
  }, [watchSport, form, watchPackageType]);

  // Calculate total price whenever relevant values change
  useEffect(() => {
    const sport = watchSport as keyof typeof packageOptions;
    const packageOption = packageOptions[sport]?.find(p => p.id === watchPackageType);
    
    if (!packageOption) return;
    
    let basePrice = packageOption.price;
    
    // Calculate quantity
    let totalQuantity = watchSizes.reduce((sum, item) => sum + item.quantity, 0);
    
    // Add addon prices
    let addonPrice = 0;
    if (watchAddons && watchAddons.length > 0) {
      addonPrice = watchAddons.reduce((sum, addonId) => {
        const addon = addonOptions.find(a => a.id === addonId);
        return sum + (addon ? addon.price : 0);
      }, 0);
    }
    
    // Calculate total
    let subtotal = (basePrice + addonPrice) * totalQuantity;
    
    // Apply discount for subscribers
    let discount = 0;
    if (isSubscribed) {
      discount = subtotal * 0.15; // 15% discount
      setDiscountAmount(discount);
    } else {
      setDiscountAmount(0);
    }
    
    setTotalPrice(subtotal - discount);
  }, [watchSport, watchPackageType, watchSizes, watchAddons, isSubscribed]);

  // Add a new size row
  const addSizeRow = () => {
    const currentSizes = form.getValues('sizes') || [];
    form.setValue('sizes', [...currentSizes, { size: 'M', quantity: 1 }]);
  };

  // Remove a size row
  const removeSizeRow = (index: number) => {
    const currentSizes = form.getValues('sizes') || [];
    if (currentSizes.length > 1) {
      form.setValue(
        'sizes',
        currentSizes.filter((_, i) => i !== index)
      );
    }
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (values: OrderFormValues) => {
      const sport = values.sport as keyof typeof packageOptions;
      const packageOption = packageOptions[sport]?.find(p => p.id === values.packageType);
      
      if (!packageOption) throw new Error('Invalid package selected');
      
      // Calculate total amount in cents for Stripe
      const totalAmountCents = Math.round(totalPrice * 100);
      
      // Prepare selected addons with prices
      const selectedAddons = values.addons
        ? values.addons.map(addonId => {
            const addon = addonOptions.find(a => a.id === addonId);
            return {
              name: addon?.label || '',
              price: addon?.price || 0,
              quantity: 1
            };
          })
        : [];
      
      // Map sizes to the expected order items format
      const items = values.sizes.map(size => ({
        type: packageOption.id,
        size: size.size,
        quantity: size.quantity,
        gender: values.gender,
        price: packageOption.price
      }));
      
      // Create order details object
      const orderDetails = {
        items,
        addOns: selectedAddons,
        packageType: packageOption.label,
        discount: discountAmount > 0 ? discountAmount : undefined,
        isTeamOrder: values.isTeamOrder,
        teamName: values.isTeamOrder ? values.teamName : undefined,
        deliveryTimeline: '2-3 weeks'
      };
      
      // Submit order to the backend
      const orderData = {
        userId: user?.id,
        designId: design.id,
        uuid: crypto.randomUUID(),
        prompt: design.designNotes || '',
        designUrls: {
          front: design.frontImageUrl || '',
          back: design.backImageUrl || ''
        },
        sport: values.sport,
        totalAmount: totalAmountCents,
        orderDetails,
        shippingAddress: values.shippingAddress
      };
      
      const response = await apiRequest('POST', '/api/orders', orderData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Order created successfully!',
        description: 'Your jersey order has been placed.',
        variant: 'default',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: OrderFormValues) => {
    createOrderMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Configuration
            </CardTitle>
            <CardDescription>
              Configure your jersey order with the options below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sport Selection */}
            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={true} // Disabled because we use the sport from the design
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="soccer">Soccer</SelectItem>
                        <SelectItem value="basketball">Basketball</SelectItem>
                        <SelectItem value="rugby">Rugby</SelectItem>
                        <SelectItem value="cricket">Cricket</SelectItem>
                        <SelectItem value="esports">Esports</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The sport determines available package options.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Package Type */}
            <FormField
              control={form.control}
              name="packageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select package" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {currentPackageOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label} (${option.price})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the package that fits your needs.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Order Toggle */}
            <FormField
              control={form.control}
              name="isTeamOrder"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Order
                    </FormLabel>
                    <FormDescription>
                      Select if you're ordering for a team.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Team Name (only if team order) */}
            {watchIsTeamOrder && (
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter team name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Gender Selection */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="youth">Youth</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This determines the size chart.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Size Chart - Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="size-chart">
                <AccordionTrigger>View Size Chart</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm">
                    <h4 className="font-medium mb-2">
                      {form.watch('gender') === 'male'
                        ? 'Men\'s Sizes'
                        : form.watch('gender') === 'female'
                        ? 'Women\'s Sizes'
                        : 'Youth Sizes'}
                    </h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border px-2 py-1 text-left">Size</th>
                          <th className="border px-2 py-1 text-left">Chest (in)</th>
                          <th className="border px-2 py-1 text-left">Waist (in)</th>
                          <th className="border px-2 py-1 text-left">Height (in)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.watch('gender') === 'male' && (
                          <>
                            <tr><td className="border px-2 py-1">XS</td><td className="border px-2 py-1">33-35</td><td className="border px-2 py-1">27-29</td><td className="border px-2 py-1">65-67</td></tr>
                            <tr><td className="border px-2 py-1">S</td><td className="border px-2 py-1">36-38</td><td className="border px-2 py-1">30-32</td><td className="border px-2 py-1">67-69</td></tr>
                            <tr><td className="border px-2 py-1">M</td><td className="border px-2 py-1">39-41</td><td className="border px-2 py-1">33-35</td><td className="border px-2 py-1">69-71</td></tr>
                            <tr><td className="border px-2 py-1">L</td><td className="border px-2 py-1">42-44</td><td className="border px-2 py-1">36-38</td><td className="border px-2 py-1">71-73</td></tr>
                            <tr><td className="border px-2 py-1">XL</td><td className="border px-2 py-1">45-47</td><td className="border px-2 py-1">39-41</td><td className="border px-2 py-1">73-75</td></tr>
                            <tr><td className="border px-2 py-1">XXL</td><td className="border px-2 py-1">48-50</td><td className="border px-2 py-1">42-44</td><td className="border px-2 py-1">75-77</td></tr>
                            <tr><td className="border px-2 py-1">XXXL</td><td className="border px-2 py-1">51-53</td><td className="border px-2 py-1">45-47</td><td className="border px-2 py-1">77-79</td></tr>
                          </>
                        )}
                        {form.watch('gender') === 'female' && (
                          <>
                            <tr><td className="border px-2 py-1">XS</td><td className="border px-2 py-1">31-33</td><td className="border px-2 py-1">24-26</td><td className="border px-2 py-1">62-64</td></tr>
                            <tr><td className="border px-2 py-1">S</td><td className="border px-2 py-1">33-35</td><td className="border px-2 py-1">26-28</td><td className="border px-2 py-1">64-66</td></tr>
                            <tr><td className="border px-2 py-1">M</td><td className="border px-2 py-1">36-38</td><td className="border px-2 py-1">29-31</td><td className="border px-2 py-1">66-68</td></tr>
                            <tr><td className="border px-2 py-1">L</td><td className="border px-2 py-1">39-41</td><td className="border px-2 py-1">32-34</td><td className="border px-2 py-1">68-70</td></tr>
                            <tr><td className="border px-2 py-1">XL</td><td className="border px-2 py-1">42-44</td><td className="border px-2 py-1">35-37</td><td className="border px-2 py-1">70-72</td></tr>
                            <tr><td className="border px-2 py-1">XXL</td><td className="border px-2 py-1">45-47</td><td className="border px-2 py-1">38-40</td><td className="border px-2 py-1">72-74</td></tr>
                          </>
                        )}
                        {form.watch('gender') === 'youth' && (
                          <>
                            <tr><td className="border px-2 py-1">YXS</td><td className="border px-2 py-1">25-27</td><td className="border px-2 py-1">22-24</td><td className="border px-2 py-1">45-48</td></tr>
                            <tr><td className="border px-2 py-1">YS</td><td className="border px-2 py-1">28-30</td><td className="border px-2 py-1">24-25</td><td className="border px-2 py-1">49-52</td></tr>
                            <tr><td className="border px-2 py-1">YM</td><td className="border px-2 py-1">31-33</td><td className="border px-2 py-1">26-27</td><td className="border px-2 py-1">53-56</td></tr>
                            <tr><td className="border px-2 py-1">YL</td><td className="border px-2 py-1">34-36</td><td className="border px-2 py-1">28-29</td><td className="border px-2 py-1">57-60</td></tr>
                            <tr><td className="border px-2 py-1">YXL</td><td className="border px-2 py-1">37-39</td><td className="border px-2 py-1">30-31</td><td className="border px-2 py-1">61-64</td></tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Size and Quantity Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Sizes and Quantities</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSizeRow}
                >
                  Add Size
                </Button>
              </div>
              
              {watchSizes.map((_, index) => (
                <div key={index} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`sizes.${index}.size`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={index !== 0 ? 'sr-only' : ''}>
                          Size
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              {sizeOptions[form.watch('gender') as keyof typeof sizeOptions].map(
                                (size) => (
                                  <SelectItem key={size} value={size}>
                                    {size}
                                  </SelectItem>
                                )
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`sizes.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={index !== 0 ? 'sr-only' : ''}>
                          Quantity
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                            min={1}
                            max={100}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchSizes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSizeRow(index)}
                      className="mb-2"
                    >
                      &times;
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add-ons */}
            <div className="space-y-4">
              <FormLabel>Add-ons (Optional)</FormLabel>
              {addonOptions.map((addon) => (
                <FormField
                  key={addon.id}
                  control={form.control}
                  name="addons"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{addon.label}</FormLabel>
                        <FormDescription>
                          ${addon.price.toFixed(2)} per jersey
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(addon.id)}
                          onCheckedChange={(checked) => {
                            const currentValues = field.value || [];
                            if (checked) {
                              field.onChange([...currentValues, addon.id]);
                            } else {
                              field.onChange(
                                currentValues.filter((value) => value !== addon.id)
                              );
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Shipping Address */}
            <div className="space-y-4 pt-4 border-t">
              <FormLabel>Shipping Address</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shippingAddress.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.street"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP/Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items:</span>
                  <span>
                    {watchSizes.reduce((sum, item) => sum + item.quantity, 0)} ×{' '}
                    {currentPackageOptions.find(p => p.id === watchPackageType)?.label || ''}
                  </span>
                </div>
                
                {watchAddons && watchAddons.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Add-ons:</span>
                    <span>
                      {watchAddons.map(addonId => 
                        addonOptions.find(a => a.id === addonId)?.label
                      ).join(', ')}
                    </span>
                  </div>
                )}
                
                {isSubscribed && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Subscriber Discount (15%):
                    </span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Estimated Delivery:
                  </span>
                  <span>2-3 weeks</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Place Order
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}