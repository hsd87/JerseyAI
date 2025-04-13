import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Design, InsertOrder, OrderDetails, ShippingAddress } from '@shared/schema';

// Form schema for the order
const orderFormSchema = z.object({
  // Package details
  packageType: z.enum(['jerseyOnly', 'jerseyShorts', 'fullKit'], {
    required_error: 'Please select a package type',
  }),
  
  // Size and quantity
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'], {
    required_error: 'Please select a size',
  }),
  quantity: z.number().min(1).default(1),
  
  // Team order details
  isTeamOrder: z.boolean().default(false),
  teamName: z.string().optional(),
  teamSize: z.number().optional(),
  
  // Gender
  gender: z.enum(['Male', 'Female', 'Youth'], {
    required_error: 'Please select a gender',
  }),
  
  // Add-ons
  addOns: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
      quantity: z.number().min(0).default(0),
    })
  ).default([]),
  
  // Shipping details
  shippingAddress: z.object({
    name: z.string().min(1, 'Name is required'),
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    zip: z.string().min(1, 'ZIP/Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().min(1, 'Phone number is required'),
  }),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

// Pricing constants
const PACKAGE_PRICES = {
  jerseyOnly: 59.99,
  jerseyShorts: 89.99,
  fullKit: 119.99,
};

const ADDON_OPTIONS = [
  { name: 'Socks', price: 12.99 },
  { name: 'Training Jersey', price: 39.99 },
  { name: 'Tracksuit', price: 79.99 },
  { name: 'Captain\'s Armband', price: 9.99 },
  { name: 'Compression Layer', price: 29.99 },
];

interface OrderFormProps {
  design: Design;
  onSuccess?: () => void;
}

export default function OrderForm({ design, onSuccess }: OrderFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      packageType: 'jerseyOnly',
      size: 'M',
      quantity: 1,
      isTeamOrder: false,
      gender: 'Male',
      addOns: ADDON_OPTIONS.map(addon => ({ 
        ...addon, 
        quantity: 0 
      })),
      shippingAddress: {
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
      },
    },
  });
  
  // Watch form values for calculations
  const packageType = form.watch('packageType');
  const quantity = form.watch('quantity');
  const isTeamOrder = form.watch('isTeamOrder');
  const addOns = form.watch('addOns');
  
  // Calculate price based on form values
  const basePrice = PACKAGE_PRICES[packageType];
  const addOnTotal = addOns.reduce((total, addon) => {
    return total + (addon.price * addon.quantity);
  }, 0);
  const teamSize = form.watch('teamSize') || 1;
  const totalQuantity = isTeamOrder ? teamSize : quantity || 1;
  const subtotal = (basePrice * totalQuantity) + addOnTotal;
  
  // Apply discount for subscribers
  const discount = user?.subscriptionTier === 'pro' ? subtotal * 0.15 : 0;
  const total = subtotal - discount;
  
  const orderMutation = useMutation({
    mutationFn: async (values: OrderFormValues) => {
      // Construct the OrderDetails object
      const orderDetails: OrderDetails = {
        items: [
          {
            type: packageType,
            size: values.size,
            quantity: totalQuantity,
            gender: values.gender,
            price: basePrice,
          },
        ],
        addOns: values.addOns.filter(addon => addon.quantity > 0),
        packageType: values.packageType,
        discount: discount,
        isTeamOrder: values.isTeamOrder,
        teamName: values.teamName,
        deliveryTimeline: '2-3 weeks',
      };
      
      // Prepare the shipping address
      const shippingAddress: ShippingAddress = values.shippingAddress;
      
      // Create order data
      const orderData: InsertOrder = {
        userId: user!.id,
        designId: design.id,
        sport: design.sport,
        prompt: '',
        designUrls: {
          front: design.frontImageUrl || '',
          back: design.backImageUrl || '',
        },
        totalAmount: Math.round(total * 100), // Convert to cents for storage
        orderDetails,
        shippingAddress,
      };
      
      // Send the order to the API
      const response = await apiRequest('POST', '/api/orders', orderData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Order Placed Successfully',
        description: 'Your order has been placed! You will receive an email confirmation shortly.',
        variant: 'default',
      });
      
      // Invalidate orders cache
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      // Navigate or trigger callback
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Place Order',
        description: error.message || 'There was an error placing your order. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (values: OrderFormValues) => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    // On the final step, submit the order
    orderMutation.mutate(values);
  };
  
  // Go back to previous step
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Progress Tracker */}
      <div className="w-full bg-gray-100 p-4">
        <div className="flex justify-between items-center">
          <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span>Package Details</span>
          </div>
          <div className="h-1 w-12 bg-gray-300 mx-2" />
          <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span>Shipping Address</span>
          </div>
          <div className="h-1 w-12 bg-gray-300 mx-2" />
          <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span>Review & Pay</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
        {/* Step 1: Package Details */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Choose Your Package</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${packageType === 'jerseyOnly' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                onClick={() => form.setValue('packageType', 'jerseyOnly')}
              >
                <h3 className="font-semibold">Jersey Only</h3>
                <p className="text-lg font-bold">${PACKAGE_PRICES.jerseyOnly}</p>
                <p className="text-sm text-gray-500">Custom jersey with your design</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${packageType === 'jerseyShorts' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                onClick={() => form.setValue('packageType', 'jerseyShorts')}
              >
                <h3 className="font-semibold">Jersey + Shorts</h3>
                <p className="text-lg font-bold">${PACKAGE_PRICES.jerseyShorts}</p>
                <p className="text-sm text-gray-500">Custom jersey with matching shorts</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${packageType === 'fullKit' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                onClick={() => form.setValue('packageType', 'fullKit')}
              >
                <h3 className="font-semibold">Full Kit</h3>
                <p className="text-lg font-bold">${PACKAGE_PRICES.fullKit}</p>
                <p className="text-sm text-gray-500">Jersey, shorts & personalized accessories</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Size</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...form.register('size')}
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
                {form.formState.errors.size && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.size.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...form.register('gender')}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Youth">Youth</option>
                </select>
                {form.formState.errors.gender && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.gender.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input 
                  type="checkbox" 
                  id="isTeamOrder"
                  checked={isTeamOrder}
                  onChange={(e) => form.setValue('isTeamOrder', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isTeamOrder" className="font-medium">This is a team order</label>
              </div>
              
              {isTeamOrder && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Team Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      {...form.register('teamName')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Players</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      {...form.register('teamSize', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              )}
              
              {!isTeamOrder && (
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    {...form.register('quantity', { valueAsNumber: true })}
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.quantity.message}</p>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Add-ons</h3>
              <div className="space-y-3">
                {form.getValues('addOns').map((addon, index) => (
                  <div key={addon.name} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{addon.name}</p>
                      <p className="text-sm text-gray-600">${addon.price}</p>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center border rounded-l"
                        onClick={() => {
                          const newAddOns = [...form.getValues('addOns')];
                          newAddOns[index].quantity = Math.max(0, newAddOns[index].quantity - 1);
                          form.setValue('addOns', newAddOns);
                        }}
                      >
                        -
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center border-t border-b">
                        {addon.quantity}
                      </span>
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center border rounded-r"
                        onClick={() => {
                          const newAddOns = [...form.getValues('addOns')];
                          newAddOns[index].quantity = newAddOns[index].quantity + 1;
                          form.setValue('addOns', newAddOns);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Shipping Address */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Shipping Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...form.register('shippingAddress.name')}
                />
                {form.formState.errors.shippingAddress?.name && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.shippingAddress.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...form.register('shippingAddress.phone')}
                />
                {form.formState.errors.shippingAddress?.phone && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.shippingAddress.phone.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-md"
                {...form.register('shippingAddress.street')}
              />
              {form.formState.errors.shippingAddress?.street && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.shippingAddress.street.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...form.register('shippingAddress.city')}
                />
                {form.formState.errors.shippingAddress?.city && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.shippingAddress.city.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">State/Province</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...form.register('shippingAddress.state')}
                />
                {form.formState.errors.shippingAddress?.state && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.shippingAddress.state.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">ZIP/Postal Code</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...form.register('shippingAddress.zip')}
                />
                {form.formState.errors.shippingAddress?.zip && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.shippingAddress.zip.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-md"
                {...form.register('shippingAddress.country')}
              />
              {form.formState.errors.shippingAddress?.country && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.shippingAddress.country.message}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Step 3: Review & Pay */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Review Your Order</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-2">Design</h3>
                <div className="grid grid-cols-2 gap-4">
                  {design.frontImageUrl && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Front</p>
                      <img 
                        src={design.frontImageUrl} 
                        alt="Front design" 
                        className="w-full h-auto rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                  
                  {design.backImageUrl && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Back</p>
                      <img 
                        src={design.backImageUrl} 
                        alt="Back design" 
                        className="w-full h-auto rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold mt-4 mb-2">Package Details</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p><strong>Package:</strong> {packageType === 'jerseyOnly' ? 'Jersey Only' : 
                     packageType === 'jerseyShorts' ? 'Jersey + Shorts' : 'Full Kit'}</p>
                  <p><strong>Size:</strong> {form.getValues('size')}</p>
                  <p><strong>Gender:</strong> {form.getValues('gender')}</p>
                  <p><strong>Quantity:</strong> {totalQuantity}</p>
                  {isTeamOrder && form.getValues('teamName') && (
                    <p><strong>Team Name:</strong> {form.getValues('teamName')}</p>
                  )}
                </div>
                
                {addOns.some(addon => addon.quantity > 0) && (
                  <>
                    <h3 className="font-semibold mt-4 mb-2">Add-ons</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {addOns.filter(addon => addon.quantity > 0).map(addon => (
                        <p key={addon.name}>{addon.name} (×{addon.quantity}) - ${(addon.price * addon.quantity).toFixed(2)}</p>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p>{form.getValues('shippingAddress.name')}</p>
                  <p>{form.getValues('shippingAddress.street')}</p>
                  <p>
                    {form.getValues('shippingAddress.city')}, {form.getValues('shippingAddress.state')} {form.getValues('shippingAddress.zip')}
                  </p>
                  <p>{form.getValues('shippingAddress.country')}</p>
                  <p>Phone: {form.getValues('shippingAddress.phone')}</p>
                </div>
                
                <h3 className="font-semibold mt-4 mb-2">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between py-2">
                    <span>Base Price (×{totalQuantity}):</span>
                    <span>${(basePrice * totalQuantity).toFixed(2)}</span>
                  </div>
                  
                  {addOnTotal > 0 && (
                    <div className="flex justify-between py-2 border-t">
                      <span>Add-ons:</span>
                      <span>${addOnTotal.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {discount > 0 && (
                    <div className="flex justify-between py-2 border-t text-green-600">
                      <span>Pro Discount (15%):</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-2 border-t border-b font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">
                    By clicking "Place Order", you agree to our Terms of Service and Privacy Policy. Your order will be processed and you will receive a confirmation email with details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Back
            </button>
          ) : (
            <div></div> // Empty div to maintain layout
          )}
          
          <button
            type="submit"
            disabled={orderMutation.isPending}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {orderMutation.isPending ? 'Processing...' : 
             step === 3 ? 'Place Order' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}