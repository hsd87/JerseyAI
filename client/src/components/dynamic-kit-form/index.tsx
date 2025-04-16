import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { useDesignStore } from '@/hooks/use-design-store';
import { DesignFormValues } from '@shared/schema';
import { SportType, KitType, CollarType, PatternType } from '@shared/schema';

// Types for kit configuration
interface KitOption {
  name: string;
  value: string;
}

interface KitSchema {
  formOptions: string[];
  skus: string[];
  sleeveLength: string[];
  collarStyle: string[];
  fabric: string[];
  fitType: string[];
  style: string[];
  basePrice: number;
  commonOptions: {
    gender: string[];
    colors: string[];
    patternStyles: string[];
    designInspiration: string[];
  };
}

interface KitConfig {
  sport: string;
  kitType: string;
  quantity: number;
  options: {
    sleeve?: string;
    collar?: string;
    pattern?: string;
    fabric?: string;
    fit?: string;
    gender?: string;
    colors?: string[];
  };
  selectedAddons?: string[];
}

interface PricingResult {
  matchedSkus: string[];
  itemPrices: Record<string, number>;
  addonPrices: Record<string, number>;
  quantityDiscount: number;
  discountedPercentage: number;
  totalPrice: number;
  currency: string;
}

export default function DynamicKitForm() {
  const { toast } = useToast();
  const { updateFormData, formData } = useDesignStore();
  
  const [sport, setSport] = useState<string>('');
  const [kitType, setKitType] = useState<string>('');
  const [kitConfig, setKitConfig] = useState<KitConfig>({
    sport: '',
    kitType: '',
    quantity: 1,
    options: {}
  });
  const [tab, setTab] = useState('design');
  const [pricing, setPricing] = useState<PricingResult | null>(null);

  // Load available sports
  const { 
    data: sports,
    isLoading: sportsLoading,
    error: sportsError 
  } = useQuery({
    queryKey: ['/api/kit-config/sports'],
    enabled: true
  });

  // Load available kit types for selected sport
  const { 
    data: kitTypes,
    isLoading: kitTypesLoading,
    error: kitTypesError 
  } = useQuery({
    queryKey: ['/api/kit-config/kit-types', sport],
    enabled: !!sport
  });

  // Load schema for selected sport and kit type
  const { 
    data: kitSchema,
    isLoading: schemaLoading,
    error: schemaError 
  } = useQuery<KitSchema>({
    queryKey: ['/api/kit-config/schema', sport, kitType],
    enabled: !!sport && !!kitType
  });

  // Calculate pricing when kit configuration changes
  const {
    data: pricingData,
    isLoading: pricingLoading,
    error: pricingError,
    refetch: calculatePricing
  } = useQuery<PricingResult>({
    queryKey: ['/api/kit-config/configure', kitConfig],
    enabled: false // We'll manually trigger this
  });

  // Update pricing data when it's fetched
  useEffect(() => {
    if (pricingData) {
      setPricing(pricingData);
    }
  }, [pricingData]);

  // When sport changes, reset kit type
  useEffect(() => {
    if (sport) {
      setKitType('');
      setKitConfig(prev => ({
        ...prev,
        sport,
        kitType: '',
        options: {}
      }));
    }
  }, [sport]);

  // When kit type changes, update config
  useEffect(() => {
    if (kitType) {
      setKitConfig(prev => ({
        ...prev,
        kitType
      }));
    }
  }, [kitType]);

  // Update design form values when sport and kit type change
  useEffect(() => {
    if (sport && kitType) {
      const newDesignValues: Partial<DesignFormValues> = {
        sport: sport as SportType,
        kitType: kitType as KitType
      };
      updateFormData(newDesignValues);
    }
  }, [sport, kitType, updateFormData]);

  // Handle option changes
  const handleOptionChange = (optionType: string, value: string) => {
    setKitConfig(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [optionType]: value
      }
    }));

    // Update design form values
    if (optionType === 'sleeve') {
      updateFormData({ sleeveStyle: value as any });
    } else if (optionType === 'collar') {
      updateFormData({ collarType: value as any });
    } else if (optionType === 'pattern') {
      updateFormData({ patternStyle: value as any });
    }
  };

  // Handle quantity changes
  const handleQuantityChange = (value: number) => {
    setKitConfig(prev => ({
      ...prev,
      quantity: value
    }));
  };

  // Generate the form based on schema
  const renderFormFields = () => {
    if (!kitSchema) return null;

    return (
      <div className="space-y-6">
        {/* Gender Selection */}
        {kitSchema.commonOptions.gender && kitSchema.commonOptions.gender.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={kitConfig.options.gender || ''}
              onValueChange={(value) => handleOptionChange('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {kitSchema.commonOptions.gender.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sleeve Length */}
        {kitSchema.sleeveLength && kitSchema.sleeveLength.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="sleeve">Sleeve Length</Label>
            <Select
              value={kitConfig.options.sleeve || ''}
              onValueChange={(value) => handleOptionChange('sleeve', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sleeve length" />
              </SelectTrigger>
              <SelectContent>
                {kitSchema.sleeveLength.map((sleeve) => (
                  <SelectItem key={sleeve} value={sleeve}>
                    {sleeve}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Collar Type */}
        {kitSchema.collarStyle && kitSchema.collarStyle.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="collar">Collar Type</Label>
            <Select
              value={kitConfig.options.collar || ''}
              onValueChange={(value) => handleOptionChange('collar', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select collar type" />
              </SelectTrigger>
              <SelectContent>
                {kitSchema.collarStyle.map((collar) => (
                  <SelectItem key={collar} value={collar}>
                    {collar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pattern Style */}
        {kitSchema.commonOptions.patternStyles && kitSchema.commonOptions.patternStyles.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="pattern">Pattern Style</Label>
            <Select
              value={kitConfig.options.pattern || ''}
              onValueChange={(value) => handleOptionChange('pattern', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pattern style" />
              </SelectTrigger>
              <SelectContent>
                {kitSchema.commonOptions.patternStyles.map((pattern) => (
                  <SelectItem key={pattern} value={pattern}>
                    {pattern}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Fabric Type */}
        {kitSchema.fabric && kitSchema.fabric.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="fabric">Fabric</Label>
            <Select
              value={kitConfig.options.fabric || ''}
              onValueChange={(value) => handleOptionChange('fabric', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fabric type" />
              </SelectTrigger>
              <SelectContent>
                {kitSchema.fabric.map((fabric) => (
                  <SelectItem key={fabric} value={fabric}>
                    {fabric}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Fit Type */}
        {kitSchema.fitType && kitSchema.fitType.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="fit">Fit Type</Label>
            <Select
              value={kitConfig.options.fit || ''}
              onValueChange={(value) => handleOptionChange('fit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fit type" />
              </SelectTrigger>
              <SelectContent>
                {kitSchema.fitType.map((fit) => (
                  <SelectItem key={fit} value={fit}>
                    {fit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  // Calculate pricing
  const handleCalculatePricing = () => {
    if (!sport || !kitType) {
      toast({
        title: 'Missing information',
        description: 'Please select a sport and kit type.',
        variant: 'destructive'
      });
      return;
    }

    calculatePricing();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Design Your Kit</CardTitle>
        <CardDescription>
          Configure your perfect sports kit with our dynamic form system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="design">Design Options</TabsTrigger>
            <TabsTrigger value="order">Order &amp; Pricing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="design" className="space-y-4">
            {/* Step 1: Select Sport */}
            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              {sportsLoading ? (
                <div className="flex items-center justify-center h-10">
                  <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select
                  value={sport}
                  onValueChange={setSport}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(sports) && sports.map((sport: string) => (
                      <SelectItem key={sport} value={sport}>
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Step 2: Select Kit Type */}
            {sport && (
              <div className="space-y-2">
                <Label htmlFor="kitType">Kit Type</Label>
                {kitTypesLoading ? (
                  <div className="flex items-center justify-center h-10">
                    <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Select
                    value={kitType}
                    onValueChange={setKitType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a kit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(kitTypes) && kitTypes.map((type: string) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Step 3: Dynamic Form Fields */}
            {sport && kitType && (
              <div className="mt-4">
                <Separator className="my-4" />
                <h3 className="text-lg font-medium mb-4">Kit Options</h3>
                {schemaLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  renderFormFields()
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="order" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={kitConfig.quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    (10+ for 5% off, 20+ for 10% off, 50+ for 15% off)
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCalculatePricing}
                disabled={!sport || !kitType || pricingLoading}
                className="w-full"
              >
                {pricingLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Calculate Pricing
              </Button>

              {pricing && (
                <div className="mt-6 space-y-4 border rounded-md p-4">
                  <h3 className="text-lg font-medium">Price Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(pricing.itemPrices).map(([sku, price]) => (
                      <div key={sku} className="flex justify-between text-sm">
                        <span>Item {sku}</span>
                        <span>${price.toFixed(2)}</span>
                      </div>
                    ))}
                    
                    {Object.keys(pricing.addonPrices).length > 0 && (
                      <>
                        <Separator />
                        <h4 className="text-md font-medium">Add-ons</h4>
                        {Object.entries(pricing.addonPrices).map(([addon, price]) => (
                          <div key={addon} className="flex justify-between text-sm">
                            <span>{addon}</span>
                            <span>${price.toFixed(2)}</span>
                          </div>
                        ))}
                      </>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-sm">
                      <span>Quantity</span>
                      <span>{kitConfig.quantity}</span>
                    </div>
                    
                    {pricing.quantityDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Quantity Discount ({pricing.discountedPercentage}%)</span>
                        <span>-${pricing.quantityDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${pricing.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}