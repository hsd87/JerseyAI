import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useFormatPrice } from '@/hooks/use-format-price';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrderStore } from '@/hooks/use-order-store';
import { PackageItem, OrderDetails, TeamMember, AddOn, OrderItem } from '@/hooks/use-order-types'; // Import from the correct location
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
  Check as CheckIcon,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Package,
  Ruler,
  ClipboardList,
  Calculator,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { ADDON_OPTIONS, PACKAGE_ITEMS, getProductBySku, calculatePackageBasePrice, PRODUCTS, Product } from '@shared/product-configs';
import { TeamMemberItem } from '@/hooks/use-order-types';

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

// PackageItem is now imported from @/hooks/use-order-types

interface OrderConfigProps {
  designId?: number;
  designUrls?: {
    front: string;
    back: string;
  };
  sport?: string;
  kitType?: string;
  onBackToCustomization?: () => void;
}

export default function OrderConfig({ 
  designId: propsDesignId, 
  designUrls: propsDesignUrls, 
  sport, 
  kitType, 
  onBackToCustomization 
}: OrderConfigProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useFormatPrice();
  const [, navigate] = useLocation();
  const { 
    packageType = 'jerseyOnly',
    setPackageType,
    isTeamOrder = false,
    setTeamOrder,
    addOns = [],
    items,
    setPriceBreakdown,
    setTeamMembers: setStoreTeamMembers,
    addItem,
    updateItem,
    removeItem,
    clearItems,
    setOrderDetails
  } = useOrderStore();
  
  // Use design data from props if available, otherwise from store
  const designId = useOrderStore(state => state.designId) || propsDesignId;
  const designUrls = useOrderStore(state => state.designUrls) || propsDesignUrls;
  
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
  const [packageUnitPrice, setPackageUnitPrice] = useState(0);

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
      // Find the jersey product from PRODUCTS if a design was generated
      const jerseyProduct = designId 
        ? PRODUCTS.find(p => p.productType === 'JERSEY') 
        : null;
      
      let newItems: PackageItem[] = [
        {
          id: jerseyProduct?.sku || 'jersey',
          name: 'Custom Jersey',
          type: 'jersey',
          sizes: [{ size: watchedSize, quantity: watchedQuantity }],
          price: jerseyProduct?.basePrice || 59.99,
          gender: watchedGender,
          sku: jerseyProduct?.sku // Add SKU for the generated jersey
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
  }, [watchedPackageType, watchedSize, watchedQuantity, watchedGender, designId]);

  // Calculate the custom package unit price based on selected items
  const calculateCustomPackagePrice = useCallback(() => {
    if (!packageItems || packageItems.length === 0) {
      return calculatePackageBasePrice(watchedPackageType || 'jerseyOnly');
    }
    
    // Calculate the sum of all items in the package (unit price)
    let packagePrice = 0;
    packageItems.forEach(item => {
      if (item && item.price) {
        packagePrice += item.price;
      }
    });
    
    // Return package price with a minimum fallback
    return Math.max(packagePrice, 1);
  }, [packageItems, watchedPackageType]);

  // Calculate total price
  useEffect(() => {
    try {
      let price = 0;
      
      // Calculate the custom package unit price first
      const customUnitPrice = calculateCustomPackagePrice();
      setPackageUnitPrice(customUnitPrice);
      console.log('Custom package unit price:', customUnitPrice);
      
      // Add up package items
      if (watchedIsTeamOrder) {
        const teamTotalQty = teamMembers.reduce((total, member) => total + 1, 0);
        price = customUnitPrice * Math.max(1, teamTotalQty);
      } else {
        // Individual order
        if (packageItems && packageItems.length > 0) {
          // Use custom package unit price multiplied by quantity
          price = customUnitPrice * Math.max(1, watchedQuantity || 1);
        } else if (watchedPackageType) {
          // Fallback to base price if no items
          price = calculatePackageBasePrice(watchedPackageType) * Math.max(1, watchedQuantity || 1);
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
      
      // No quantity-based discounts per simplified pricing model
      const totalQuantity = watchedIsTeamOrder 
        ? Math.max(1, teamMembers.length)
        : Math.max(1, watchedQuantity || 1);
      
      // No discounts with simplified pricing model
      setTotalPrice(price);
      
      // Update price breakdown in store with simplified pricing
      if (setPriceBreakdown) {
        try {
          setPriceBreakdown({
            subtotal: price,
            grandTotal: price,
            itemCount: totalQuantity,
            baseTotal: price
          });
        } catch (err) {
          console.error("Error setting price breakdown:", err);
        }
      }
    } catch (err) {
      console.error("Error calculating price:", err);
      setTotalPrice(0);
    }
  }, [packageItems, teamMembers, watchedPackageType, watchedQuantity, watchedIsTeamOrder, addOns, setPriceBreakdown, calculateCustomPackagePrice]);

  // Handle package selection
  const handlePackageTypeChange = (value: 'jerseyOnly' | 'jerseyShorts' | 'fullKit' | 'custom') => {
    form.setValue('packageType', value);
    setPackageType(value);
  };

  // Handle gender selection (now used for the default gender and size chart only)
  const handleGenderChange = (value: 'Male' | 'Female' | 'Youth') => {
    // Update form
    form.setValue('gender', value);
    
    // Update local state
    setGender(value);
    
    // Note: We no longer update all package items with the same gender
    // Instead, gender is now set individually per item in the table
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

  // Add team member with all package items
  const addTeamMember = () => {
    // Create items array from packageItems
    // If we're using a custom package, we'll use the package unit price divided by the number of items
    // to ensure the total is correct
    const totalCustomUnitPrice = packageUnitPrice > 0 ? packageUnitPrice : calculatePackageBasePrice(watchedPackageType);
    const itemCount = packageItems.length || 1;
    const pricePerItem = totalCustomUnitPrice / itemCount;
    
    const memberItems: TeamMemberItem[] = packageItems.map(item => ({
      itemType: item.type.toLowerCase(),
      sku: item.sku || '',
      size: watchedSize,
      price: watchedPackageType === 'custom' ? pricePerItem : item.price
    }));
    
    const newMember: TeamMember = {
      id: `team-member-${Date.now()}`,
      name: '',
      number: '',
      size: watchedSize,
      gender: watchedGender,
      items: memberItems
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
    if (currentStep < 6) {
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
    // Show loading toast
    toast({
      title: "Preparing checkout",
      description: "Adding items to cart...",
    });
    
    // Clear any existing items first
    clearItems();
    
    // Prepare order details for storage
    const priceDetails = {
      basePrice: packageUnitPrice,
      subtotal: totalPrice,
      totalAmount: totalPrice,
    };
    
    // Create default items array from packageItems
    const orderItems: OrderItem[] = packageItems.map(item => ({
      id: item.id || `${item.type}-${Date.now()}`, // Ensure unique ID
      type: item.type,
      size: item.sizes[0]?.size || 'M',
      quantity: item.sizes[0]?.quantity || 1,
      gender: item.gender,
      price: item.price,
      name: item.name,
      designId: designId // Add design ID for reference
    }));
    
    // Create order details object matching the OrderDetails interface
    const orderDetailsData: OrderDetails = {
      packageType: watchedPackageType,
      isTeamOrder: watchedIsTeamOrder,
      items: orderItems,
      addOns: addOns || [],
      teamMembers: watchedIsTeamOrder ? teamMembers : [],
      priceBreakdown: {
        subtotal: totalPrice,
        grandTotal: totalPrice,
        itemCount: watchedQuantity,
        baseTotal: totalPrice
      }
    };
    
    // Save order details to store
    setOrderDetails(orderDetailsData);
    
    // First add main item based on package type (this ensures we have at least one item in cart)
    // Generate unique IDs with timestamps to avoid duplicates
    const mainItemId = `jersey-${designId}-${Date.now()}`;
    
    // Add main jersey item - this is required in all package types
    addItem({
      id: mainItemId,
      type: 'jersey',
      name: 'Custom Jersey',
      size: watchedSize,
      quantity: watchedQuantity,
      gender: watchedGender,
      price: packageUnitPrice > 0 ? packageUnitPrice : calculatePackageBasePrice(watchedPackageType),
      designId: designId
    });
    
    console.log('Added main jersey item to cart', mainItemId);
    
    // Now handle team orders
    if (watchedIsTeamOrder) {
      // Process team order using the team member items
      teamMembers.forEach(member => {
        if (member.items && member.items.length > 0) {
          // Process all items from the member.items array
          member.items.forEach(item => {
            const itemName = item.itemType === 'jersey' ? 'Custom Jersey' :
                           item.itemType === 'shorts' ? 'Matching Shorts' :
                           item.itemType === 'socks' ? 'Team Socks' : 
                           item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1);
            
            addItem({
              id: `${item.itemType}-${member.id}-${Date.now()}`,
              type: item.itemType,
              name: itemName,
              size: item.itemType === 'socks' ? 'One Size' : member.size,
              quantity: 1,
              gender: item.itemType === 'socks' ? 'Unisex' : member.gender,
              price: item.price,
              customValue: item.itemType === 'jersey' ? member.number : undefined,
              designId: designId
            });
          });
        } else {
          // Fallback to old method if no items array
          // Add jersey for each team member
          addItem({
            id: `jersey-${member.id}-${Date.now()}`,
            type: 'jersey',
            name: 'Custom Jersey',
            size: member.size,
            quantity: 1,
            gender: member.gender,
            price: calculatePackageBasePrice('jerseyOnly'),
            customValue: member.number,
            designId: designId
          });
          
          // Add shorts if applicable
          if (watchedPackageType === 'jerseyShorts' || watchedPackageType === 'fullKit') {
            addItem({
              id: `shorts-${member.id}-${Date.now()}`,
              type: 'shorts',
              name: 'Matching Shorts',
              size: member.size,
              quantity: 1,
              gender: member.gender,
              price: 29.99,
              designId: designId
            });
          }
          
          // Add socks if full kit
          if (watchedPackageType === 'fullKit') {
            addItem({
              id: `socks-${member.id}-${Date.now()}`,
              type: 'socks',
              name: 'Team Socks',
              size: 'One Size',
              quantity: 1,
              gender: 'Unisex',
              price: 12.99,
              designId: designId
            });
          }
        }
      });
    } else {
      // Process individual order - with null checking
      if (packageItems && packageItems.length > 0) {
        // For individual orders, we already added the main jersey above,
        // so we only need to add additional items for other package types
        
        // Add shorts if applicable
        if (watchedPackageType === 'jerseyShorts' || watchedPackageType === 'fullKit') {
          addItem({
            id: `shorts-${Date.now()}`,
            type: 'shorts',
            name: 'Matching Shorts',
            size: watchedSize,
            quantity: watchedQuantity,
            gender: watchedGender,
            price: 29.99,
            designId: designId
          });
        }
        
        // Add socks if full kit
        if (watchedPackageType === 'fullKit') {
          addItem({
            id: `socks-${Date.now()}`,
            type: 'socks',
            name: 'Team Socks',
            size: 'One Size',
            quantity: watchedQuantity,
            gender: 'Unisex',
            price: 12.99,
            designId: designId
          });
        }
        
        // For custom packages, add each individual item
        if (watchedPackageType === 'custom') {
          packageItems.forEach((item, index) => {
            // Skip the first item since we already added it as main jersey
            if (index === 0) return;
            
            if (item.sizes && Array.isArray(item.sizes)) {
              item.sizes.forEach(sizeInfo => {
                if (sizeInfo && sizeInfo.quantity > 0) {
                  addItem({
                    id: `${item.type}-${sizeInfo.size}-${Date.now()}`,
                    type: item.type,
                    name: item.name,
                    size: sizeInfo.size,
                    quantity: sizeInfo.quantity,
                    gender: item.gender,
                    price: item.price,
                    designId: designId
                  });
                }
              });
            }
          });
        }
      }
    }
    
    // Add any add-ons to the cart
    if (addOns && addOns.length > 0) {
      addOns.forEach(addon => {
        if (addon && addon.quantity > 0) {
          addItem({
            id: `addon-${addon.id}-${Date.now()}`,
            type: 'addon',
            name: addon.name,
            size: 'One Size',
            quantity: addon.quantity,
            gender: 'Unisex',
            price: addon.price,
            designId: designId
          });
        }
      });
    }
    
    // Log order information
    console.log('Order finalized and ready for checkout');
    
    // Navigate to checkout page with the order information
    try {
      // Save a timestamp with the order using the proper method
      const orderStore = useOrderStore.getState();
      if (orderStore.setOrderCreatedAt) {
        orderStore.setOrderCreatedAt(new Date().toISOString());
      }
      
      // Success toast
      toast({
        title: "Cart updated",
        description: "Proceeding to checkout...",
        variant: "default",
      });
      
      // Navigate to the checkout page with a slight delay to allow state updates
      setTimeout(() => {
        navigate('/checkout');
      }, 500); // Increased timeout to ensure state updates are complete
    } catch (error) {
      console.error('Error navigating to checkout:', error);
      toast({
        title: "Error",
        description: "Failed to proceed to checkout. Please try again.",
        variant: "destructive",
      });
    }
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
          <Progress value={(currentStep / 6) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Step {currentStep} of 6</span>
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
                      <span className="font-semibold">${packageUnitPrice > 0 ? packageUnitPrice.toFixed(2) : calculatePackageBasePrice(watchedPackageType).toFixed(2)}</span>
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
              {/* Show all products including add-ons for selection */}
              {PRODUCTS.map((product) => {
                // Safely handle packageItems which might be undefined/null 
                const safePackageItems = packageItems || [];
                const isSelected = safePackageItems.some(item => item.sku === product.sku);
                const currentItem = safePackageItems.find(item => item.sku === product.sku);
                
                return (
                  <div 
                    key={product.sku}
                    className={`border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                    onClick={() => {
                      // Set package type to custom if it's not already
                      if (watchedPackageType !== 'custom') {
                        setPackageType('custom');
                        form.setValue('packageType', 'custom');
                      }
                        
                      if (!isSelected) {
                        // Add the product
                        handleProductSelect(product);
                      } else {
                        // Remove the product
                        const safeItems = packageItems || [];
                        setPackageItems(safeItems.filter(item => item.sku !== product.sku));
                      }
                    }}
                  >
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        {product.productType === 'JERSEY' && 
                          <div className="bg-primary/10 p-1.5 rounded-md">
                            <Shirt className="h-5 w-5 text-primary" />
                          </div>
                        }
                        {product.productType === 'SHORTS' && 
                          <div className="bg-primary/10 p-1.5 rounded-md">
                            <Ruler className="h-5 w-5 text-primary" />
                          </div>
                        }
                        {product.productType === 'TROUSER' && 
                          <div className="bg-primary/10 p-1.5 rounded-md">
                            <Ruler className="h-5 w-5 text-primary" />
                          </div>
                        }
                        {product.productType === 'SOCKS' && 
                          <div className="bg-primary/10 p-1.5 rounded-md">
                            <Shirt className="h-5 w-5 text-primary" />
                          </div>
                        }
                        {product.productType === 'KITBAG' && 
                          <div className="bg-primary/10 p-1.5 rounded-md">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                        }
                        {product.productType === 'BAGPACK' && 
                          <div className="bg-primary/10 p-1.5 rounded-md">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                        }
                        {product.productType === 'BEANIE' && 
                          <div className="bg-primary/10 p-1.5 rounded-md">
                            <Shirt className="h-5 w-5 text-primary" />
                          </div>
                        }
                      </div>
                      {isSelected && 
                        <div className="bg-green-50 p-1 rounded-full">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      }
                    </div>
                    
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-semibold text-primary">${product.basePrice.toFixed(2)}</span>
                          <span className="text-xs text-gray-500 ml-1">per item</span>
                        </div>
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
            
            {packageItems && packageItems.length > 0 && (
              <div className="border-2 border-primary/20 rounded-lg p-5 bg-primary/5 mt-4">
                <h3 className="font-medium mb-3 flex items-center text-lg">
                  <Package className="h-5 w-5 mr-2 text-primary" />
                  Your Selected Components
                </h3>
                <div className="space-y-2">
                  {packageItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm bg-white p-2 rounded shadow-sm">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-semibold text-primary">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-primary/20 pt-3 mt-2 flex justify-between font-medium">
                    <span>Custom Package Unit Price:</span>
                    <span className="text-lg">${packageItems.reduce((total, item) => 
                      total + item.price, 0).toFixed(2)}</span>
                  </div>
                </div>
                {packageItems.length >= 2 && (
                  <div className="mt-3 text-sm text-green-600 bg-green-50 p-2 rounded-md border border-green-200">
                    <div className="flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      <span>Bundle discount of up to 15% will be applied at checkout!</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button 
                onClick={goToNextStep}
                disabled={!packageItems || packageItems.length === 0}
              >
                Continue to Order Type <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Order Type */}
        {currentStep === 3 && (
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
                Continue to Order Details <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Order Details (Combined Package Details & Team/Individual Info) */}
        {currentStep === 4 && (
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
                        <TableHead>Package Items</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-gray-500">
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
                              <div className="text-xs">
                                {member.items && member.items.length > 0 ? (
                                  <div className="space-y-1">
                                    {member.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center">
                                        <span className="text-primary">•</span>
                                        <span className="ml-1">{item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">No items</span>
                                )}
                              </div>
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
                
                <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm mt-6">
                  <h4 className="font-heading font-medium text-voro-black mb-3 text-lg">Size Chart</h4>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    {/* Men's Size Chart */}
                    <div className="mb-5">
                      <h5 className="font-medium text-voro-red mb-3">Men's Sizes</h5>
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr className="divide-x divide-gray-200">
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Size</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Chest (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Waist (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Hips (in)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XS</td>
                            <td className="px-4 py-2.5">33-35</td>
                            <td className="px-4 py-2.5">27-29</td>
                            <td className="px-4 py-2.5">33-35</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">S</td>
                            <td className="px-4 py-2.5">36-38</td>
                            <td className="px-4 py-2.5">30-32</td>
                            <td className="px-4 py-2.5">36-38</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">M</td>
                            <td className="px-4 py-2.5">39-41</td>
                            <td className="px-4 py-2.5">33-35</td>
                            <td className="px-4 py-2.5">39-41</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">L</td>
                            <td className="px-4 py-2.5">42-44</td>
                            <td className="px-4 py-2.5">36-38</td>
                            <td className="px-4 py-2.5">42-44</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XL</td>
                            <td className="px-4 py-2.5">45-47</td>
                            <td className="px-4 py-2.5">39-41</td>
                            <td className="px-4 py-2.5">45-47</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XXL</td>
                            <td className="px-4 py-2.5">48-50</td>
                            <td className="px-4 py-2.5">42-44</td>
                            <td className="px-4 py-2.5">48-50</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Women's Size Chart */}
                    <div className="mb-5">
                      <h5 className="font-medium text-voro-red mb-3">Women's Sizes</h5>
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr className="divide-x divide-gray-200">
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Size</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Chest (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Waist (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Hips (in)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XS</td>
                            <td className="px-4 py-2.5">30-32</td>
                            <td className="px-4 py-2.5">24-26</td>
                            <td className="px-4 py-2.5">33-35</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">S</td>
                            <td className="px-4 py-2.5">33-35</td>
                            <td className="px-4 py-2.5">27-29</td>
                            <td className="px-4 py-2.5">36-38</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">M</td>
                            <td className="px-4 py-2.5">36-38</td>
                            <td className="px-4 py-2.5">30-32</td>
                            <td className="px-4 py-2.5">39-41</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">L</td>
                            <td className="px-4 py-2.5">39-41</td>
                            <td className="px-4 py-2.5">33-35</td>
                            <td className="px-4 py-2.5">42-44</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XL</td>
                            <td className="px-4 py-2.5">42-44</td>
                            <td className="px-4 py-2.5">36-38</td>
                            <td className="px-4 py-2.5">45-47</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XXL</td>
                            <td className="px-4 py-2.5">45-47</td>
                            <td className="px-4 py-2.5">39-41</td>
                            <td className="px-4 py-2.5">48-50</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Youth Size Chart */}
                    <div>
                      <h5 className="font-medium text-voro-red mb-3">Youth Sizes</h5>
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr className="divide-x divide-gray-200">
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Size</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Chest (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Waist (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Hips (in)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XS (6-7)</td>
                            <td className="px-4 py-2.5">24-26</td>
                            <td className="px-4 py-2.5">22-24</td>
                            <td className="px-4 py-2.5">24-26</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">S (8-9)</td>
                            <td className="px-4 py-2.5">26-28</td>
                            <td className="px-4 py-2.5">24-25</td>
                            <td className="px-4 py-2.5">26-28</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">M (10-11)</td>
                            <td className="px-4 py-2.5">28-30</td>
                            <td className="px-4 py-2.5">25-26</td>
                            <td className="px-4 py-2.5">28-30</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">L (12-13)</td>
                            <td className="px-4 py-2.5">30-32</td>
                            <td className="px-4 py-2.5">26-27</td>
                            <td className="px-4 py-2.5">30-32</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XL (14-15)</td>
                            <td className="px-4 py-2.5">32-34</td>
                            <td className="px-4 py-2.5">27-29</td>
                            <td className="px-4 py-2.5">32-34</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XXL (16)</td>
                            <td className="px-4 py-2.5">34-36</td>
                            <td className="px-4 py-2.5">29-31</td>
                            <td className="px-4 py-2.5">34-36</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Individual order details
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
                  <h3 className="font-heading font-medium text-voro-black mb-2 text-lg">Individual Order Details</h3>
                  <p className="text-sm text-gray-600">Confirm your sizing and quantity preferences below.</p>
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
                          <TableCell>
                            <Select
                              value={item.gender}
                              onValueChange={(value) => {
                                // Update the gender for this specific item
                                const updatedItems = packageItems.map(i => {
                                  if (i.id === item.id) {
                                    return {
                                      ...i,
                                      gender: value
                                    };
                                  }
                                  return i;
                                });
                                // Update both local state and store
                                setPackageItems(updatedItems);
                                const setPackageItemsInStore = useOrderStore.getState().setPackageItems;
                                if (typeof setPackageItemsInStore === 'function') {
                                  setPackageItemsInStore(updatedItems);
                                }
                              }}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="Gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Youth">Youth</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {item.type === 'socks' ? (
                              'One Size'
                            ) : (
                              <Select
                                value={item.sizes[0]?.size || 'M'}
                                onValueChange={(value) => {
                                  const updatedItems = packageItems.map(i => {
                                    if (i.id === item.id) {
                                      return {
                                        ...i,
                                        sizes: i.sizes.map((s, idx) => idx === 0 ? { ...s, size: value } : s)
                                      };
                                    }
                                    return i;
                                  });
                                  setPackageItems(updatedItems);
                                }}
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
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handlePackageItemQuantityChange(item.id, item.sizes[0]?.size || 'M', -1)}
                                disabled={(item.sizes[0]?.quantity || 0) <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-5 text-center">{item.sizes[0]?.quantity || 0}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handlePackageItemQuantityChange(item.id, item.sizes[0]?.size || 'M', 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
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
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleAddonQuantityChange(addon.id, -1)}
                                disabled={addon.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-5 text-center">{addon.quantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleAddonQuantityChange(addon.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ${(addon.price * addon.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
                  <h4 className="font-heading font-medium text-voro-black mb-3 text-lg">Size Chart</h4>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    {/* Men's Size Chart */}
                    <div className="mb-5">
                      <h5 className="font-medium text-voro-red mb-3">Men's Sizes</h5>
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr className="divide-x divide-gray-200">
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Size</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Chest (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Waist (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Hips (in)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XS</td>
                            <td className="px-4 py-2.5">33-35</td>
                            <td className="px-4 py-2.5">27-29</td>
                            <td className="px-4 py-2.5">33-35</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">S</td>
                            <td className="px-4 py-2.5">36-38</td>
                            <td className="px-4 py-2.5">30-32</td>
                            <td className="px-4 py-2.5">36-38</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">M</td>
                            <td className="px-4 py-2.5">39-41</td>
                            <td className="px-4 py-2.5">33-35</td>
                            <td className="px-4 py-2.5">39-41</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">L</td>
                            <td className="px-4 py-2.5">42-44</td>
                            <td className="px-4 py-2.5">36-38</td>
                            <td className="px-4 py-2.5">42-44</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XL</td>
                            <td className="px-4 py-2.5">45-47</td>
                            <td className="px-4 py-2.5">39-41</td>
                            <td className="px-4 py-2.5">45-47</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XXL</td>
                            <td className="px-4 py-2.5">48-50</td>
                            <td className="px-4 py-2.5">42-44</td>
                            <td className="px-4 py-2.5">48-50</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Women's Size Chart */}
                    <div className="mb-5">
                      <h5 className="font-medium text-voro-red mb-3">Women's Sizes</h5>
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr className="divide-x divide-gray-200">
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Size</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Chest (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Waist (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Hips (in)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XS</td>
                            <td className="px-4 py-2.5">30-32</td>
                            <td className="px-4 py-2.5">24-26</td>
                            <td className="px-4 py-2.5">33-35</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">S</td>
                            <td className="px-4 py-2.5">33-35</td>
                            <td className="px-4 py-2.5">27-29</td>
                            <td className="px-4 py-2.5">36-38</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">M</td>
                            <td className="px-4 py-2.5">36-38</td>
                            <td className="px-4 py-2.5">30-32</td>
                            <td className="px-4 py-2.5">39-41</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">L</td>
                            <td className="px-4 py-2.5">39-41</td>
                            <td className="px-4 py-2.5">33-35</td>
                            <td className="px-4 py-2.5">42-44</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XL</td>
                            <td className="px-4 py-2.5">42-44</td>
                            <td className="px-4 py-2.5">36-38</td>
                            <td className="px-4 py-2.5">45-47</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XXL</td>
                            <td className="px-4 py-2.5">45-47</td>
                            <td className="px-4 py-2.5">39-41</td>
                            <td className="px-4 py-2.5">48-50</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Youth Size Chart */}
                    <div>
                      <h5 className="font-medium text-voro-red mb-3">Youth Sizes</h5>
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr className="divide-x divide-gray-200">
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Size</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Chest (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Waist (in)</th>
                            <th className="px-4 py-2.5 bg-gray-50 text-voro-black font-medium">Hips (in)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XS (6-7)</td>
                            <td className="px-4 py-2.5">24-26</td>
                            <td className="px-4 py-2.5">22-24</td>
                            <td className="px-4 py-2.5">24-26</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">S (8-9)</td>
                            <td className="px-4 py-2.5">26-28</td>
                            <td className="px-4 py-2.5">24-25</td>
                            <td className="px-4 py-2.5">26-28</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">M (10-11)</td>
                            <td className="px-4 py-2.5">28-30</td>
                            <td className="px-4 py-2.5">25-26</td>
                            <td className="px-4 py-2.5">28-30</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">L (12-13)</td>
                            <td className="px-4 py-2.5">30-32</td>
                            <td className="px-4 py-2.5">26-27</td>
                            <td className="px-4 py-2.5">30-32</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XL (14-15)</td>
                            <td className="px-4 py-2.5">32-34</td>
                            <td className="px-4 py-2.5">27-29</td>
                            <td className="px-4 py-2.5">32-34</td>
                          </tr>
                          <tr className="divide-x divide-gray-200">
                            <td className="px-4 py-2.5 font-medium">XXL (16)</td>
                            <td className="px-4 py-2.5">34-36</td>
                            <td className="px-4 py-2.5">29-31</td>
                            <td className="px-4 py-2.5">34-36</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
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

        {/* Step 5: Pricing */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-heading font-medium text-voro-black text-xl mb-5 flex items-center">
                <Calculator className="mr-3 h-5 w-5 text-voro-red" />
                Order Price Breakdown
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="font-medium text-voro-black">Package Type:</span>
                  <span className="text-gray-700">{kitTypeDisplayNames[watchedPackageType] || 'Custom'}</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="font-medium text-voro-black">Base Price Per Unit:</span>
                  <span className="font-semibold text-voro-black">${packageUnitPrice > 0 ? packageUnitPrice.toFixed(2) : calculatePackageBasePrice(watchedPackageType).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="font-medium text-voro-black">Order Type:</span>
                  <span className="text-gray-700">{watchedIsTeamOrder ? 'Team Order' : 'Individual Order'}</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="font-medium text-voro-black">Total Units:</span>
                  <span className="text-gray-700">{watchedIsTeamOrder ? teamMembers.length : watchedQuantity}</span>
                </div>
                
                {/* Items section */}
                <div className="border-b border-gray-200 pb-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-voro-black">Selected Items:</span>
                    <span></span>
                  </div>
                  {packageItems && packageItems.length > 0 ? (
                    packageItems.map(item => (
                      <div key={item.id} className="flex justify-between pl-4 text-sm mt-2">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-medium text-voro-black">${item.price.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="pl-4 text-sm mt-2 text-gray-500">No items selected</div>
                  )}
                </div>
                
                {/* Add-ons section */}
                {addOns.length > 0 && (
                  <div className="border-b border-gray-200 pb-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-voro-black">Add-ons:</span>
                      <span></span>
                    </div>
                    {addOns.map(addon => (
                      <div key={addon.id} className="flex justify-between pl-4 text-sm mt-2">
                        <span className="text-gray-700">{addon.name} (x{addon.quantity})</span>
                        <span className="font-medium text-voro-black">${(addon.price * addon.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pl-4 font-medium text-sm mt-3 pt-2 border-t border-dashed">
                      <span className="text-voro-black">Add-ons Subtotal:</span>
                      <span className="text-voro-black">${addOns.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {/* Bundle discount section */}
                {packageItems && packageItems.length >= 2 && (
                  <div className="flex justify-between border-b border-gray-200 pb-3 text-green-600">
                    <span className="font-medium">Bundle Discount:</span>
                    <span className="font-medium">
                      {packageItems.length >= 4 ? '15%' : 
                       packageItems.length >= 3 ? '10%' : '5%'}
                    </span>
                  </div>
                )}
                
                {/* Quantity discount section */}
                {(watchedIsTeamOrder ? teamMembers.length : watchedQuantity) >= 10 && (
                  <div className="flex justify-between border-b border-gray-200 pb-3 text-green-600">
                    <span className="font-medium">Quantity Discount:</span>
                    <span className="font-medium">
                      {(watchedIsTeamOrder ? teamMembers.length : watchedQuantity) >= 50 ? '15%' : 
                       (watchedIsTeamOrder ? teamMembers.length : watchedQuantity) >= 20 ? '10%' : '5%'}
                    </span>
                  </div>
                )}
                
                {/* Subtotal before discounts */}
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="font-medium text-voro-black">Subtotal (before discounts):</span>
                  <span className="font-medium text-voro-black">
                    ${
                      (
                        calculatePackageBasePrice(watchedPackageType) * (watchedIsTeamOrder ? teamMembers.length : watchedQuantity) + 
                        (packageItems ? packageItems.reduce((sum, item) => sum + item.price, 0) : 0) + 
                        addOns.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)
                      ).toFixed(2)
                    }
                  </span>
                </div>
                
                {/* Total price with discounts */}
                <div className="flex justify-between pt-3 text-xl font-bold">
                  <span className="text-voro-black">Total Price:</span>
                  <span className="text-voro-red">
                    ${typeof totalPrice === 'number' && !isNaN(totalPrice) ? 
                        totalPrice.toFixed(2) : 
                        "0.00"
                    }
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-3">
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

        {/* Step 6: Order Summary */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="bg-voro-red/5 border-voro-red/10 border rounded-2xl p-5 mb-6 shadow-sm">
              <h3 className="font-heading font-medium text-voro-black flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Order Configuration Complete
              </h3>
              <p className="text-sm mt-2 text-gray-600">
                Review your complete order summary below before proceeding to checkout.
              </p>
            </div>
            
            {/* Order summary tabs */}
            <Tabs defaultValue="order" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="order" className="font-heading text-sm">Order Details</TabsTrigger>
                <TabsTrigger value="design" className="font-heading text-sm">Design</TabsTrigger>
                <TabsTrigger value="pricing" className="font-heading text-sm">Pricing</TabsTrigger>
              </TabsList>
              
              {/* Order details tab */}
              <TabsContent value="order" className="space-y-5 pt-5">
                <div className="grid grid-cols-2 gap-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div>
                    <h4 className="font-heading text-sm text-gray-500 uppercase tracking-wide">Package Type</h4>
                    <p className="font-medium text-voro-black mt-1">{kitTypeDisplayNames[watchedPackageType]}</p>
                  </div>
                  <div>
                    <h4 className="font-heading text-sm text-gray-500 uppercase tracking-wide">Order Type</h4>
                    <p className="font-medium text-voro-black mt-1">{watchedIsTeamOrder ? 'Team Order' : 'Individual Order'}</p>
                  </div>
                </div>
                
                {watchedIsTeamOrder ? (
                  <div className="mt-6">
                    <h4 className="font-heading font-medium text-voro-black text-lg mb-3">Team: {teamName || 'Unnamed Team'}</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-heading text-voro-black">Player Name</TableHead>
                            <TableHead className="font-heading text-voro-black">Number</TableHead>
                            <TableHead className="font-heading text-voro-black">Size</TableHead>
                            <TableHead className="font-heading text-voro-black">Gender</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamMembers.map((member) => (
                            <TableRow key={member.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{member.name || 'Unnamed Player'}</TableCell>
                              <TableCell>{member.number || 'N/A'}</TableCell>
                              <TableCell>{member.size}</TableCell>
                              <TableCell>{member.gender}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      Total team members: <span className="font-medium ml-1">{teamMembers.length}</span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-6">
                    <h4 className="font-heading font-medium text-voro-black text-lg mb-3">Order Items</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-heading text-voro-black">Item</TableHead>
                            <TableHead className="font-heading text-voro-black">Size</TableHead>
                            <TableHead className="font-heading text-voro-black">Gender</TableHead>
                            <TableHead className="font-heading text-voro-black">Quantity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {packageItems.map((item) => (
                            <TableRow key={item.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{item.name}</TableCell>
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
                    <h4 className="font-heading font-medium text-voro-black text-lg mb-3">Add-Ons</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-heading text-voro-black">Item</TableHead>
                            <TableHead className="font-heading text-voro-black">Price</TableHead>
                            <TableHead className="font-heading text-voro-black">Quantity</TableHead>
                            <TableHead className="font-heading text-voro-black">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {addOns.map((addon) => (
                            <TableRow key={addon.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{addon.name}</TableCell>
                              <TableCell>${addon.price.toFixed(2)}</TableCell>
                              <TableCell>{addon.quantity}</TableCell>
                              <TableCell className="font-medium text-voro-black">${(addon.price * addon.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Design tab */}
              <TabsContent value="design" className="pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {designUrls ? (
                    <>
                      <div className="space-y-3">
                        <h4 className="font-heading font-medium text-voro-black text-sm uppercase tracking-wide">Front View</h4>
                        <div className="aspect-square border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm p-2">
                          <img 
                            src={designUrls.front} 
                            alt="Jersey Front Design" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-heading font-medium text-voro-black text-sm uppercase tracking-wide">Back View</h4>
                        <div className="aspect-square border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm p-2">
                          <img 
                            src={designUrls.back} 
                            alt="Jersey Back Design" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 text-center py-16 text-gray-500 bg-gray-50 rounded-xl">
                      <Shirt className="h-14 w-14 mx-auto mb-4 opacity-30 text-gray-400" />
                      <p className="font-medium">No design images available</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 text-sm text-gray-500 border-t border-gray-200 pt-4">
                  <p>Design ID: {designId || 'Not available'}</p>
                </div>
              </TabsContent>
              
              {/* Pricing tab */}
              <TabsContent value="pricing" className="pt-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h4 className="font-heading font-medium text-voro-black text-lg mb-5">Price Breakdown</h4>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-gray-200 pb-3">
                      <span className="font-medium text-voro-black">Base Package Price:</span>
                      <span className="text-gray-700">${packageUnitPrice > 0 ? packageUnitPrice.toFixed(2) : calculatePackageBasePrice(watchedPackageType).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between border-b border-gray-200 pb-3">
                      <span className="font-medium text-voro-black">Quantity:</span>
                      <span className="text-gray-700">{watchedIsTeamOrder ? teamMembers.length : watchedQuantity}</span>
                    </div>
                    
                    {addOns.length > 0 && (
                      <div className="border-b border-gray-200 pb-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-voro-black">Add-ons:</span>
                          <span></span>
                        </div>
                        {addOns.map(addon => (
                          <div key={addon.id} className="flex justify-between pl-4 text-sm mt-2">
                            <span className="text-gray-700">{addon.name} (x{addon.quantity})</span>
                            <span className="font-medium text-voro-black">${(addon.price * addon.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-3 text-xl font-bold">
                      <span className="text-voro-black">Total:</span>
                      <span className="text-voro-red">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
                className="border-gray-300 hover:bg-gray-100 text-voro-black font-medium px-6 rounded-xl"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={finalizeOrderForCheckout}
                className="bg-voro-red hover:bg-voro-red/90 text-white font-medium px-6 rounded-xl shadow-sm"
              >
                Continue to Shipping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}