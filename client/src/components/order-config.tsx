import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrderStore } from '@/hooks/use-order-store';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, 
  MinusCircle, 
  Info, 
  Shirt, 
  ShoppingBag, 
  Users, 
  Trash2, 
  Plus,
  Minus,
  CheckCircle,
  ChevronRight,
  Ruler,
  Package,
  ClipboardList
} from 'lucide-react';
import { ADDON_OPTIONS, PACKAGE_ITEMS, getProductBySku, calculatePackageBasePrice, PRODUCTS, Product } from '@shared/product-configs';
import { TeamMember, AddOn, OrderItem } from '@/hooks/use-order-types';

// Form schema
const orderConfigSchema = z.object({
  packageType: z.enum(['jerseyOnly', 'jerseyShorts', 'fullKit', 'custom'], {
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
  teamName: z.string().optional(),
});

type OrderConfigValues = z.infer<typeof orderConfigSchema>;

// Package item interface used for individual orders
interface PackageItem {
  id: string;
  name: string;
  type: string;
  sizes: { size: string; quantity: number }[];
  price: number;
  gender: string;
  sku?: string; // Added for product identification
}

export default function OrderConfig() {
  const { user } = useAuth();
  const { 
    packageType = 'jerseyOnly',
    setPackageType,
    isTeamOrder = false,
    setTeamOrder,
    addOns = [],
    designId,
    designUrls,
    items,
    setPriceBreakdown,
    setTeamMembers: setStoreTeamMembers,
    addItem,
    updateItem,
    removeItem,
    clearItems
  } = useOrderStore();
  
  // Local state for form values if not in global store
  const [gender, setGender] = useState('Male');
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  // Use packageItems from the store
  const { packageItems, setPackageItems } = useOrderStore();
  const [totalPrice, setTotalPrice] = useState(0);

  const form = useForm<OrderConfigValues>({
    resolver: zodResolver(orderConfigSchema),
    defaultValues: {
      packageType: packageType as 'jerseyOnly' | 'jerseyShorts' | 'fullKit' | 'custom',
      gender: gender as 'Male' | 'Female' | 'Youth',
      size: size as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
      quantity,
      isTeamOrder,
      teamName: '',
    },
  });

  // Step titles for progress indicator
  const stepTitles = [
    "Selected Kit",
    "Package Options",
    "Create Package",
    "Order Type",
    "Order Details",
    "Pricing",
    "Summary"
  ];

  // Kit type display names
  const kitTypeDisplayNames: Record<string, string> = {
    jerseyOnly: 'Jersey Only',
    jerseyShorts: 'Jersey + Shorts',
    fullKit: 'Full Kit',
    custom: 'Custom Package'
  };

  // Add-on functions
  const addAddOn = (addon: AddOn) => {
    // Function to add an add-on to the order store
    const { addAddOn: storeAddAddOn } = useOrderStore.getState();
    if (storeAddAddOn) {
      storeAddAddOn(addon);
    }
  };

  const removeAddOn = (index: number) => {
    // Function to remove an add-on from the order store
    const { removeAddOn: storeRemoveAddOn } = useOrderStore.getState();
    if (storeRemoveAddOn) {
      storeRemoveAddOn(index);
    }
  };

  // Watch form values
  const watchedPackageType = form.watch('packageType');
  const watchedGender = form.watch('gender');
  const watchedSize = form.watch('size');
  const watchedQuantity = form.watch('quantity');
  const watchedIsTeamOrder = form.watch('isTeamOrder');

  // Initialize package items based on package type
  useEffect(() => {
    if (watchedPackageType) {
      let newItems: PackageItem[] = [
        {
          id: 'jersey',
          name: 'Custom Jersey',
          type: 'jersey',
          sizes: [{ size: watchedSize, quantity: watchedQuantity }],
          price: 59.99,
          gender: watchedGender
        }
      ];

      if (watchedPackageType === 'jerseyShorts' || watchedPackageType === 'fullKit') {
        newItems.push({
          id: 'shorts',
          name: 'Matching Shorts',
          type: 'shorts',
          sizes: [{ size: watchedSize, quantity: watchedQuantity }],
          price: 29.99,
          gender: watchedGender
        });
      }

      if (watchedPackageType === 'fullKit') {
        newItems.push({
          id: 'socks',
          name: 'Team Socks',
          type: 'socks',
          sizes: [{ size: 'One Size', quantity: watchedQuantity }],
          price: 12.99,
          gender: 'Unisex'
        });
      }

      setPackageItems(newItems);
    }
  }, [watchedPackageType, watchedSize, watchedQuantity, watchedGender]);

  // Calculate total price
  useEffect(() => {
    try {
      let price = 0;
      
      // Add up package items
      if (watchedIsTeamOrder) {
        const teamTotalQty = teamMembers.reduce((total, member) => total + 1, 0);
        price = calculatePackageBasePrice(watchedPackageType || 'jerseyOnly') * Math.max(1, teamTotalQty);
      } else {
        // Individual order
        if (packageItems && packageItems.length > 0) {
          packageItems.forEach(item => {
            if (item && item.sizes && item.sizes.length > 0) {
              const itemTotal = (item.price || 0) * item.sizes.reduce((total, size) => total + (size?.quantity || 0), 0);
              price += itemTotal;
            }
          });
        } else if (watchedPackageType) {
          // Fallback to base price if no items
          price = calculatePackageBasePrice(watchedPackageType);
        }
      }
      
      // Add add-ons
      if (addOns && addOns.length > 0) {
        addOns.forEach(addon => {
          if (addon) {
            price += (addon.price || 0) * (addon.quantity || 0);
          }
        });
      }
      
      // Apply quantity-based discounts
      const totalQuantity = watchedIsTeamOrder 
        ? Math.max(1, teamMembers.length)
        : Math.max(1, watchedQuantity || 1);
      
      let discount = 0;
      if (totalQuantity >= 50) {
        discount = 0.15; // 15% off
      } else if (totalQuantity >= 20) {
        discount = 0.10; // 10% off
      } else if (totalQuantity >= 10) {
        discount = 0.05; // 5% off
      }
      
      const discountedPrice = discount > 0 ? price * (1 - discount) : price;
      
      setTotalPrice(discountedPrice);
      
      // Update price breakdown in store
      if (setPriceBreakdown) {
        try {
          const baseTotal = discount > 0 ? price : discountedPrice;
          const discountAmount = discount > 0 ? discount * price : 0;
          const shipping = 9.99;
          const tax = discountedPrice * 0.07; // Assuming 7% tax rate
          
          setPriceBreakdown({
            subtotal: discountedPrice,
            discount: discountAmount,
            discountPercentage: discount * 100,
            shipping: shipping,
            tax: tax,
            grandTotal: discountedPrice * 1.07 + shipping, // Tax + shipping
            itemCount: totalQuantity,
            baseTotal: baseTotal,
            tierDiscountApplied: discount > 0,
            tierDiscountAmount: discountAmount,
            subscriptionDiscountApplied: false,
            subscriptionDiscountAmount: 0,
            shippingFreeThresholdApplied: false,
            priceBeforeTax: discountedPrice
          });
        } catch (err) {
          console.error("Error setting price breakdown:", err);
        }
      }
    } catch (err) {
      console.error("Error calculating price:", err);
      setTotalPrice(0);
    }
  }, [packageItems, teamMembers, watchedPackageType, watchedQuantity, watchedIsTeamOrder, addOns, setPriceBreakdown]);

  // Handle package selection
  const handlePackageTypeChange = (value: 'jerseyOnly' | 'jerseyShorts' | 'fullKit' | 'custom') => {
    form.setValue('packageType', value);
    setPackageType(value);
  };

  // Handle gender selection 
  const handleGenderChange = (value: 'Male' | 'Female' | 'Youth') => {
    form.setValue('gender', value);
    setGender(value);
    
    // Update all package items with new gender
    // Make sure we're handling an array, or use an empty array as fallback
    const updatedItems = packageItems?.map(item => ({
      ...item,
      gender: value
    })) || [];
    
    setPackageItems(updatedItems);
  };

  // Handle size change for individual order
  const handleSizeChange = (value: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL') => {
    form.setValue('size', value);
    setSize(value);
    
    // Update all package items with new default size
    // Use safe mapping on packageItems to handle if it's undefined
    const updatedItems = packageItems?.map(item => {
      if (item.type !== 'socks') {
        return {
          ...item,
          sizes: [{ size: value, quantity: watchedQuantity }]
        };
      }
      return item;
    }) || [];
    
    setPackageItems(updatedItems);
  };

  // Handle team order toggle
  const handleTeamOrderChange = (checked: boolean) => {
    form.setValue('isTeamOrder', checked);
    setTeamOrder(checked);
  };

  // Handle quantity change for individual orders
  const handleQuantityChange = (newQty: number) => {
    const qty = Math.max(1, newQty);
    form.setValue('quantity', qty);
    setQuantity(qty);
    
    // Update all package items with new quantity
    // Safely update packageItems with null checks
    const updatedItems = packageItems?.map(item => ({
      ...item,
      sizes: item.sizes?.map(s => ({ ...s, quantity: qty })) || []
    })) || [];
    
    setPackageItems(updatedItems);
  };

  // Handle product selection for custom package
  const handleProductSelect = (product: Product) => {
    // Check if the product is already in the package
    // Always handle as an array, even if packageItems is undefined
    const currentItems = packageItems || [];
    const isSelected = currentItems.some(item => item.sku === product.sku);
    
    if (isSelected) {
      // Remove the product from the package
      const updatedItems = currentItems.filter(item => item.sku !== product.sku);
      setPackageItems(updatedItems);
    } else {
      // Add the product to the package
      const newItem: PackageItem = {
        id: product.sku,
        name: product.name,
        type: product.productType.toLowerCase(),
        sizes: [{ size: watchedSize, quantity: 1 }],
        price: product.basePrice,
        gender: watchedGender,
        sku: product.sku
      };
      
      setPackageItems([...currentItems, newItem]);
    }
  };

  // Handle package item quantity change
  const handlePackageItemQuantityChange = (itemId: string, size: string, change: number) => {
    // Make a safe copy of the current items and ensure we have a valid array
    const currentItems = packageItems || [];
    
    const updatedItems = currentItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          sizes: (item.sizes || []).map(s => {
            if (s.size === size) {
              return { ...s, quantity: Math.max(0, s.quantity + change) };
            }
            return s;
          })
        };
      }
      return item;
    });
    
    setPackageItems(updatedItems);
  };

  // Handle add-on quantity changes
  const handleAddonQuantityChange = (id: string, change: number) => {
    const currentAddon = addOns.find(addon => addon.id === id);
    const currentQty = currentAddon?.quantity || 0;
    const newQty = Math.max(0, currentQty + change);
    
    if (newQty === 0 && currentQty > 0) {
      // Find the index to remove it
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
        quantity: newQty,
        type: id,
        size: 'One Size',
        gender: 'Unisex'
      });
    }
  };

  // Add team member
  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: `team-member-${Date.now()}`,
      name: '',
      number: '',
      size: watchedSize,
      gender: watchedGender
    };
    
    const updatedMembers = [...teamMembers, newMember];
    setTeamMembers(updatedMembers);
    
    // Sync with the store
    if (setStoreTeamMembers) {
      setStoreTeamMembers(updatedMembers);
    }
  };

  // Remove team member
  const removeTeamMember = (id: string) => {
    const updatedMembers = teamMembers.filter(member => member.id !== id);
    setTeamMembers(updatedMembers);
    
    // Sync with the store
    if (setStoreTeamMembers) {
      setStoreTeamMembers(updatedMembers);
    }
  };

  // Update team member field
  const updateTeamMember = (id: string, field: keyof TeamMember, value: any) => {
    const updatedMembers = teamMembers.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    );
    
    setTeamMembers(updatedMembers);
    
    // Sync with the store
    if (setStoreTeamMembers) {
      setStoreTeamMembers(updatedMembers);
    }
  };

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Finalize order for checkout
  const finalizeOrderForCheckout = () => {
    // Clear any existing items first
    clearItems();
    
    if (watchedIsTeamOrder) {
      // Process team order
      teamMembers.forEach(member => {
        // Add jersey for each team member
        addItem({
          id: `jersey-${member.id}`,
          type: 'jersey',
          name: 'Custom Jersey',
          size: member.size,
          quantity: 1,
          gender: member.gender,
          price: calculatePackageBasePrice('jerseyOnly'),
          customValue: member.number
        });
        
        // Add shorts if applicable
        if (watchedPackageType === 'jerseyShorts' || watchedPackageType === 'fullKit') {
          addItem({
            id: `shorts-${member.id}`,
            type: 'shorts',
            name: 'Matching Shorts',
            size: member.size,
            quantity: 1,
            gender: member.gender,
            price: 29.99
          });
        }
        
        // Add socks if full kit
        if (watchedPackageType === 'fullKit') {
          addItem({
            id: `socks-${member.id}`,
            type: 'socks',
            name: 'Team Socks',
            size: 'One Size',
            quantity: 1,
            gender: 'Unisex',
            price: 12.99
          });
        }
      });
    } else {
      // Process individual order
      packageItems.forEach(item => {
        item.sizes.forEach(sizeInfo => {
          if (sizeInfo.quantity > 0) {
            addItem({
              id: `${item.type}-${sizeInfo.size}`,
              type: item.type,
              name: item.name,
              size: sizeInfo.size,
              quantity: sizeInfo.quantity,
              gender: item.gender,
              price: item.price
            });
          }
        });
      });
    }
    
    // Navigate to checkout or next step
    // This would typically redirect to a checkout page or show a confirmation
    // For now, we'll just log a message
    console.log('Order finalized and ready for checkout');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configure Your Order</CardTitle>
        <CardDescription>
          {stepTitles[currentStep - 1]}
        </CardDescription>
        
        {/* Progress indicator */}
        <div className="mt-4">
          <Progress value={(currentStep / 7) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Step {currentStep} of 7</span>
            <span>{stepTitles[currentStep - 1]}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Step 1: Selected Kit */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-lg border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {designUrls && (
                  <div className="w-full md:w-1/3">
                    <div className="aspect-square bg-white rounded-md overflow-hidden border">
                      <img 
                        src={designUrls.front} 
                        alt="Jersey Front" 
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="mt-2 text-center text-sm text-gray-500">
                      Your Custom Design
                    </div>
                  </div>
                )}
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-4">
                    <Shirt className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">Selected Kit Type</h3>
                      <p className="text-gray-600">{kitTypeDisplayNames[watchedPackageType]}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium">Base Price</h4>
                    <div className="flex justify-between mt-2">
                      <span>{kitTypeDisplayNames[watchedPackageType]}</span>
                      <span className="font-semibold">${calculatePackageBasePrice(watchedPackageType)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      This is the base price per unit. Final pricing will depend on your package options and quantity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={goToNextStep}>
                Continue to Package Options <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Product Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-md border mb-4">
              <h3 className="font-medium">Create Your Custom Package</h3>
              <p className="text-sm text-gray-600 mt-1">Select the items you want to include in your order. You can add as many items as you need.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRODUCTS.filter(product => 
                product.allowedInAiDesigner || 
                product.productType === 'JERSEY' || 
                product.productType === 'SHORTS' || 
                product.productType === 'TROUSER' || 
                product.productType === 'SOCKS'
              ).map((product) => {
                // Safely handle packageItems which might be undefined/null 
                const safePackageItems = packageItems || [];
                const isSelected = safePackageItems.some(item => item.sku === product.sku);
                const currentItem = safePackageItems.find(item => item.sku === product.sku);
                const currentQty = currentItem?.sizes[0]?.quantity || 0;
                
                return (
                  <div 
                    key={product.sku}
                    className={`border rounded-lg p-4 hover:border-primary transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                  >
                    <div className="flex justify-between mb-2">
                      {product.productType === 'JERSEY' && <Shirt className="h-6 w-6 text-primary" />}
                      {product.productType === 'SHORTS' && <Shirt className="h-6 w-6 text-primary" />}
                      {product.productType === 'TROUSER' && <Shirt className="h-6 w-6 text-primary" />}
                      {product.productType === 'SOCKS' && <Shirt className="h-6 w-6 text-primary" />}
                      {product.productType === 'KITBAG' && <Package className="h-6 w-6 text-primary" />}
                      {product.productType === 'BAGPACK' && <Package className="h-6 w-6 text-primary" />}
                      {product.productType === 'BEANIE' && <Shirt className="h-6 w-6 text-primary" />}
                    </div>
                    
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-base font-semibold">${product.basePrice}</p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            // Set package type to custom if it's not already
                            if (watchedPackageType !== 'custom') {
                              setPackageType('custom');
                              form.setValue('packageType', 'custom');
                            }
                              
                            if (currentQty === 0) {
                              // Use the handleProductSelect function to add the product
                              handleProductSelect(product);
                            } else if (currentQty === 1) {
                              // Remove item from package - safely handle packageItems
                              const safeItems = packageItems || [];
                              setPackageItems(safeItems.filter(item => item.sku !== product.sku));
                            } else {
                              // Decrease quantity
                              handlePackageItemQuantityChange(
                                currentItem?.id || '',
                                currentItem?.sizes[0]?.size || 'M',
                                -1
                              );
                            }
                          }}
                        >
                          {currentQty === 0 ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        </Button>
                        
                        {currentQty > 0 && (
                          <>
                            <span className="w-5 text-center text-sm">{currentQty}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                // Set package type to custom if it's not already
                                if (watchedPackageType !== 'custom') {
                                  setPackageType('custom');
                                  form.setValue('packageType', 'custom');
                                }
                                
                                // Increase quantity
                                handlePackageItemQuantityChange(
                                  currentItem?.id || '',
                                  currentItem?.sizes[0]?.size || 'M',
                                  1
                                );
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {product.productType === 'JERSEY' && (
                        <>
                          <p>• Premium breathable fabric</p>
                          <p>• Custom design as shown</p>
                        </>
                      )}
                      {product.productType === 'SHORTS' && (
                        <>
                          <p>• Matching design</p>
                          <p>• Comfortable fit</p>
                        </>
                      )}
                      {product.productType === 'TROUSER' && (
                        <>
                          <p>• Training trouser</p>
                          <p>• With pockets</p>
                        </>
                      )}
                      {product.productType === 'SOCKS' && (
                        <>
                          <p>• Team socks</p>
                          <p>• Cushioned sole</p>
                        </>
                      )}
                      {(product.productType === 'KITBAG' || product.productType === 'BAGPACK') && (
                        <>
                          <p>• Durable material</p>
                          <p>• Team logo printed</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {packageItems.length > 0 && (
              <div className="border rounded-lg p-4 bg-slate-50 mt-4">
                <h3 className="font-medium mb-2">Your Selected Items</h3>
                <div className="space-y-2">
                  {packageItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.sizes[0]?.quantity || 0}</span>
                      <span className="font-medium">${(item.price * (item.sizes[0]?.quantity || 0)).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 font-medium flex justify-between">
                    <span>Subtotal:</span>
                    <span>${packageItems.reduce((total, item) => 
                      total + (item.price * (item.sizes[0]?.quantity || 0)), 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button 
                onClick={goToNextStep}
                disabled={packageItems.length === 0}
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Create Package */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-md border mb-6">
              <h3 className="font-medium mb-2">Selected Package: {kitTypeDisplayNames[watchedPackageType]}</h3>
              <p className="text-sm text-gray-600">Customize the items in your package by adjusting sizes and quantities below.</p>
            </div>
            
            <div className="space-y-6">
              {packageItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-4 flex items-center">
                    {item.type === 'jersey' && <Shirt className="h-5 w-5 mr-2 text-primary" />}
                    {item.type === 'shorts' && <Shirt className="h-5 w-5 mr-2 text-primary" />}
                    {item.type === 'socks' && <Shirt className="h-5 w-5 mr-2 text-primary" />}
                    {item.name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${item.id}-gender`}>Gender</Label>
                      <Select
                        value={item.gender}
                        onValueChange={(value) => {
                          setPackageItems(items => items.map(i => {
                            if (i.id === item.id) {
                              return { ...i, gender: value };
                            }
                            return i;
                          }));
                        }}
                      >
                        <SelectTrigger id={`${item.id}-gender`} className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Men's</SelectItem>
                          <SelectItem value="Female">Women's</SelectItem>
                          <SelectItem value="Youth">Youth</SelectItem>
                          <SelectItem value="Unisex">Unisex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {item.type !== 'socks' && (
                      <div>
                        <Label htmlFor={`${item.id}-size`}>Size</Label>
                        <Select
                          value={item.sizes[0]?.size || 'M'}
                          onValueChange={(value) => {
                            setPackageItems(items => items.map(i => {
                              if (i.id === item.id) {
                                return { 
                                  ...i, 
                                  sizes: [{ size: value, quantity: i.sizes[0]?.quantity || 1 }]
                                };
                              }
                              return i;
                            }));
                          }}
                        >
                          <SelectTrigger id={`${item.id}-size`} className="mt-1">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XS">XS</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="XL">XL</SelectItem>
                            <SelectItem value="XXL">XXL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="md:col-span-2">
                      <Label>Quantity</Label>
                      <div className="flex items-center mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handlePackageItemQuantityChange(
                            item.id,
                            item.sizes[0]?.size || 'M',
                            -1
                          )}
                          disabled={item.sizes[0]?.quantity <= 1}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="mx-4">{item.sizes[0]?.quantity || 1}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handlePackageItemQuantityChange(
                            item.id,
                            item.sizes[0]?.size || 'M',
                            1
                          )}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                        <div className="ml-6">
                          <span className="text-sm font-medium">Item Total: </span>
                          <span className="text-sm font-semibold">
                            ${(item.price * (item.sizes[0]?.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add-ons section */}
            <div>
              <h3 className="font-medium text-lg mb-4">Add-Ons</h3>
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
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button onClick={goToNextStep}>
                Continue to Order Type <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Order Type */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className={`border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors ${!watchedIsTeamOrder ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                onClick={() => handleTeamOrderChange(false)}
              >
                <div className="flex items-center justify-between mb-4">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                  {!watchedIsTeamOrder && <CheckCircle className="h-5 w-5 text-green-500" />}
                </div>
                <h3 className="font-semibold text-lg mb-2">Individual Order</h3>
                <p className="text-gray-600 mb-4">
                  Order for yourself or a single person
                </p>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/10">
                  Simplest option
                </Badge>
              </div>
              
              <div 
                className={`border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors ${watchedIsTeamOrder ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                onClick={() => handleTeamOrderChange(true)}
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-primary" />
                  {watchedIsTeamOrder && <CheckCircle className="h-5 w-5 text-green-500" />}
                </div>
                <h3 className="font-semibold text-lg mb-2">Team Order</h3>
                <p className="text-gray-600 mb-4">
                  Order for a team with custom names and numbers
                </p>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/10">
                  Quantity discounts available
                </Badge>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-slate-50 mt-6">
              <h3 className="font-medium">Order Type Details</h3>
              <div className="mt-2">
                {watchedIsTeamOrder ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      Team orders allow you to create a roster with each player's name, number, and size.
                      This makes it easy to manage orders for sports teams, clubs, or group events.
                    </p>
                    <p className="text-sm font-medium">Benefits:</p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" /> 
                        Manage all players in one order
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" /> 
                        Each player can have a custom name and number
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" /> 
                        Quantity discounts for teams of 10+ players
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      Individual orders are perfect for personal use or when ordering for a single person.
                      You can still order multiple quantities of the same item.
                    </p>
                    <p className="text-sm font-medium">Benefits:</p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" /> 
                        Simplest ordering process
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" /> 
                        Quick checkout experience
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" /> 
                        Option to add multiple quantities of the same size
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button onClick={goToNextStep}>
                Continue to {watchedIsTeamOrder ? 'Team Roster' : 'Order Details'} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Order Details (Team Roster or Individual Details) */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {watchedIsTeamOrder ? (
              // Team order roster
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-lg">Team Roster</h3>
                  <Button 
                    size="sm" 
                    onClick={addTeamMember}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Player
                  </Button>
                </div>
                
                <div className="mb-6">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input 
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="mt-2"
                  />
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player Name</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                            No players added yet. Click "Add Player" to start building your roster.
                          </TableCell>
                        </TableRow>
                      ) : (
                        teamMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <Input 
                                value={member.name}
                                onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                                placeholder="Player name"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                value={member.number}
                                onChange={(e) => updateTeamMember(member.id, 'number', e.target.value)}
                                placeholder="#"
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={member.size}
                                onValueChange={(value) => updateTeamMember(member.id, 'size', value)}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue placeholder="Size" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="XS">XS</SelectItem>
                                  <SelectItem value="S">S</SelectItem>
                                  <SelectItem value="M">M</SelectItem>
                                  <SelectItem value="L">L</SelectItem>
                                  <SelectItem value="XL">XL</SelectItem>
                                  <SelectItem value="XXL">XXL</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={member.gender}
                                onValueChange={(value) => updateTeamMember(member.id, 'gender', value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Men's</SelectItem>
                                  <SelectItem value="Female">Women's</SelectItem>
                                  <SelectItem value="Youth">Youth</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTeamMember(member.id)}
                                className="text-gray-500 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {teamMembers.length === 0 && (
                  <div className="text-center py-6">
                    <Button onClick={addTeamMember}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Player
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Individual order details
              <div className="space-y-6">
                <div className="bg-slate-50 border rounded-lg p-4 mb-4">
                  <h3 className="font-medium mb-2">Individual Order Details</h3>
                  <p className="text-sm text-gray-600">Confirm your sizing and quantity preferences below.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="genderSelect">Gender</Label>
                    <RadioGroup 
                      id="genderSelect"
                      defaultValue={watchedGender} 
                      value={watchedGender}
                      onValueChange={(value) => handleGenderChange(value as 'Male' | 'Female' | 'Youth')}
                      className="flex space-x-4 mt-2"
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
                    <Label htmlFor="quantityInput">Default Quantity</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(watchedQuantity - 1)}
                        disabled={watchedQuantity <= 1}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="mx-4 w-6 text-center">{watchedQuantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(watchedQuantity + 1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Order Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packageItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.gender}</TableCell>
                          <TableCell>{item.sizes[0]?.size || 'One Size'}</TableCell>
                          <TableCell>{item.sizes[0]?.quantity || 0}</TableCell>
                          <TableCell className="text-right">
                            ${(item.price * (item.sizes[0]?.quantity || 1)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {addOns.map((addon) => (
                        <TableRow key={addon.id}>
                          <TableCell className="font-medium">{addon.name}</TableCell>
                          <TableCell>Unisex</TableCell>
                          <TableCell>One Size</TableCell>
                          <TableCell>{addon.quantity}</TableCell>
                          <TableCell className="text-right">
                            ${(addon.price * addon.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="rounded-md border p-4 bg-gray-50">
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
            )}
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button 
                onClick={goToNextStep}
                disabled={watchedIsTeamOrder && teamMembers.length === 0}
              >
                Continue to Pricing <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Pricing */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="bg-slate-50 border rounded-lg p-6">
              <h3 className="font-medium text-lg mb-4">Order Price Breakdown</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Package Type:</span>
                  <span>{kitTypeDisplayNames[watchedPackageType]}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Base Price Per Unit:</span>
                  <span>${calculatePackageBasePrice(watchedPackageType)}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Order Type:</span>
                  <span>{watchedIsTeamOrder ? 'Team Order' : 'Individual Order'}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Total Units:</span>
                  <span>{watchedIsTeamOrder ? teamMembers.length : watchedQuantity}</span>
                </div>
                
                {addOns.length > 0 && (
                  <div className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Add-ons:</span>
                      <span></span>
                    </div>
                    {addOns.map(addon => (
                      <div key={addon.id} className="flex justify-between pl-4 text-sm mt-1">
                        <span>{addon.name} (x{addon.quantity})</span>
                        <span>${(addon.price * addon.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {(watchedIsTeamOrder ? teamMembers.length : watchedQuantity) >= 10 && (
                  <div className="flex justify-between border-b pb-2 text-green-600">
                    <span className="font-medium">Quantity Discount:</span>
                    <span>
                      {(watchedIsTeamOrder ? teamMembers.length : watchedQuantity) >= 50 ? '15%' : 
                       (watchedIsTeamOrder ? teamMembers.length : watchedQuantity) >= 20 ? '10%' : '5%'}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between pt-2 text-lg font-bold">
                  <span>Total Price:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  Taxes and shipping will be calculated at checkout.
                </p>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button onClick={goToNextStep}>
                Continue to Summary <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 7: Order Summary */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="bg-primary/5 border-primary/10 border rounded-lg p-4 mb-6">
              <h3 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Order Configuration Complete
              </h3>
              <p className="text-sm mt-1">
                Review your complete order summary below before proceeding to checkout.
              </p>
            </div>
            
            {/* Order summary tabs */}
            <Tabs defaultValue="order" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="order">Order Details</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>
              
              {/* Order details tab */}
              <TabsContent value="order" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500">Package Type</h4>
                    <p>{kitTypeDisplayNames[watchedPackageType]}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-500">Order Type</h4>
                    <p>{watchedIsTeamOrder ? 'Team Order' : 'Individual Order'}</p>
                  </div>
                </div>
                
                {watchedIsTeamOrder ? (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Team: {teamName || 'Unnamed Team'}</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player Name</TableHead>
                            <TableHead>Number</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Gender</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>{member.name || 'Unnamed Player'}</TableCell>
                              <TableCell>{member.number || 'N/A'}</TableCell>
                              <TableCell>{member.size}</TableCell>
                              <TableCell>{member.gender}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Total team members: {teamMembers.length}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Order Items</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Quantity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {packageItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.sizes[0]?.size || 'One Size'}</TableCell>
                              <TableCell>{item.gender}</TableCell>
                              <TableCell>{item.sizes[0]?.quantity || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                {addOns.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Add-Ons</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {addOns.map((addon) => (
                            <TableRow key={addon.id}>
                              <TableCell>{addon.name}</TableCell>
                              <TableCell>${addon.price.toFixed(2)}</TableCell>
                              <TableCell>{addon.quantity}</TableCell>
                              <TableCell>${(addon.price * addon.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Design tab */}
              <TabsContent value="design" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {designUrls ? (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-medium">Front View</h4>
                        <div className="aspect-square border rounded-md overflow-hidden">
                          <img 
                            src={designUrls.front} 
                            alt="Jersey Front Design" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Back View</h4>
                        <div className="aspect-square border rounded-md overflow-hidden">
                          <img 
                            src={designUrls.back} 
                            alt="Jersey Back Design" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      <Shirt className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No design images available</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 text-sm text-gray-500">
                  <p>Design ID: {designId || 'Not available'}</p>
                </div>
              </TabsContent>
              
              {/* Pricing tab */}
              <TabsContent value="pricing" className="pt-4">
                <div className="bg-slate-50 border rounded-lg p-6">
                  <h4 className="font-medium mb-4">Price Breakdown</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span>Base Package Price:</span>
                      <span>${calculatePackageBasePrice(watchedPackageType)}</span>
                    </div>
                    
                    <div className="flex justify-between border-b pb-2">
                      <span>Quantity:</span>
                      <span>{watchedIsTeamOrder ? teamMembers.length : watchedQuantity}</span>
                    </div>
                    
                    {addOns.length > 0 && (
                      <div className="border-b pb-2">
                        <div className="flex justify-between">
                          <span>Add-ons:</span>
                          <span></span>
                        </div>
                        {addOns.map(addon => (
                          <div key={addon.id} className="flex justify-between pl-4 text-sm mt-1">
                            <span>{addon.name} (x{addon.quantity})</span>
                            <span>${(addon.price * addon.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(watchedIsTeamOrder ? teamMembers.length : watchedQuantity) >= 10 && (
                      <div className="flex justify-between border-b pb-2 text-green-600">
                        <span>Quantity Discount:</span>
                        <span>
                          {(watchedIsTeamOrder ? teamMembers.length : watchedQuantity) >= 50 ? '15% off' : 
                           (watchedIsTeamOrder ? teamMembers.length : watchedQuantity) >= 20 ? '10% off' : '5% off'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between border-b pb-2">
                      <span>Subtotal:</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between border-b pb-2 text-gray-500">
                      <span>Estimated Tax:</span>
                      <span>${(totalPrice * 0.07).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between border-b pb-2 text-gray-500">
                      <span>Shipping:</span>
                      <span>$9.99</span>
                    </div>
                    
                    <div className="flex justify-between pt-2 text-lg font-bold">
                      <span>Total:</span>
                      <span>${(totalPrice * 1.07 + 9.99).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button 
                onClick={finalizeOrderForCheckout}
                className="bg-green-600 hover:bg-green-700"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}