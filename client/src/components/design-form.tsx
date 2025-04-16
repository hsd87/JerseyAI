import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useReplicate } from "@/hooks/use-replicate";
import { useDesignStore } from "@/hooks/use-design-store";
import { useSubscription } from "@/hooks/use-subscription-store";
import { Link } from "wouter";
import {
  DesignFormValues,
  designFormSchema,
  sportOptions,
  kitTypeOptions,
  sleeveOptions,
  collarOptions,
  patternOptions,
  sportKitTypeMapping,
  sportCollarMapping,
  sportPatternMapping,
  addonOptions
} from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent 
} from "@/components/ui/tooltip";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { HelpCircle, RotateCw } from "lucide-react";
import React, { useState, useEffect, useRef, useMemo } from "react";

interface DesignFormProps {
  remainingDesigns?: number;
}

export default function DesignForm({ remainingDesigns = 6 }: DesignFormProps) {
  const { user } = useAuth();
  const { 
    formData, 
    updateFormData, 
    resetFormDataForSport, 
    toggleAwayKit, 
    isAwayKit: storeAwayKit 
  } = useDesignStore();
  const { generateDesign, isGenerating } = useReplicate();
  const subscription = useSubscription();
  
  const [awayKit, setAwayKit] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [formPayloadHash, setFormPayloadHash] = useState<string>('');

  // Default form values with soccer selected initially
  const defaultValues: Partial<DesignFormValues> = {
    sport: formData.sport || "soccer",
    kitType: formData.kitType || "jersey",
    primaryColor: formData.primaryColor || "#0071e3",
    secondaryColor: formData.secondaryColor || "#ffffff",
    sleeveStyle: formData.sleeveStyle || "short",
    collarType: formData.collarType || "crew",
    patternStyle: formData.patternStyle || "solid",
    designNotes: formData.designNotes || ""
  };

  // Initialize the form with values from the store
  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues,
  });

  // Watch for sport changes to reset and update form fields appropriately
  const selectedSport = form.watch("sport");
  const selectedKitType = form.watch("kitType");
  const primaryColor = form.watch("primaryColor");
  const secondaryColor = form.watch("secondaryColor");

  // Reset kit type when sport changes
  useEffect(() => {
    // Set default kit type for the selected sport
    if (selectedSport && sportKitTypeMapping[selectedSport]?.length > 0) {
      // Cast to ensure type safety
      const defaultKitType = sportKitTypeMapping[selectedSport][0] as any;
      form.setValue("kitType", defaultKitType);
    }
    
    // Reset sleeve style, collar type, and pattern style based on sport defaults
    if (sleeveOptions.length > 0) {
      const defaultSleeveStyle = sleeveOptions[0];
      form.setValue("sleeveStyle", defaultSleeveStyle);
    }
    
    if (selectedSport && sportCollarMapping[selectedSport]?.length > 0) {
      // Cast to ensure type safety
      const defaultCollarType = sportCollarMapping[selectedSport][0] as any;
      form.setValue("collarType", defaultCollarType);
    }
    
    if (selectedSport && sportPatternMapping[selectedSport]?.length > 0) {
      // Cast to ensure type safety
      const defaultPatternStyle = sportPatternMapping[selectedSport][0] as any;
      form.setValue("patternStyle", defaultPatternStyle);
    }
  }, [selectedSport, form]);

  // Handle away kit toggle - invert primary and secondary colors
  useEffect(() => {
    if (awayKit) {
      const temp = primaryColor;
      form.setValue("primaryColor", secondaryColor);
      form.setValue("secondaryColor", temp);
    }
  }, [awayKit]);

  // Generate form payload hash for tracking
  useEffect(() => {
    const formValues = form.getValues();
    const hashString = JSON.stringify(formValues);
    // Simple hash for tracking changes
    const hash = hashString
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(16);
    setFormPayloadHash(hash);
  }, [form.watch()]);

  // Update the store when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateFormData(value as Partial<DesignFormValues>);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, updateFormData]);

  // Filter kit types based on selected sport using useMemo for optimization
  const availableKitTypes = useMemo(() => {
    return selectedSport ? sportKitTypeMapping[selectedSport] || [] : [];
  }, [selectedSport]);
  
  // Filter collar types based on selected sport using useMemo for optimization
  const availableCollarTypes = useMemo(() => {
    return selectedSport ? sportCollarMapping[selectedSport] || [] : [];
  }, [selectedSport]);
  
  // Filter pattern styles based on selected sport using useMemo for optimization
  const availablePatternStyles = useMemo(() => {
    return selectedSport ? sportPatternMapping[selectedSport] || [] : [];
  }, [selectedSport]);

  const formatKitTypeLabel = (kitType: string): string => {
    switch (kitType) {
      case "jersey": return "Jersey Only";
      case "jerseyShorts": return "Jersey + Shorts";
      case "jerseyTrousers": return "Jersey + Trousers";
      case "tracksuit": return "Track Suit";
      case "trackjacket": return "Track Jacket";
      case "trackhoodie": return "Track Hoodie";
      case "trackjackethzip": return "Track Jacket Half Zip";
      case "esportsjacket": return "Esports Jacket";
      case "esportshoodie": return "Esports Hoodie";
      default: return kitType.charAt(0).toUpperCase() + kitType.slice(1).replace(/([A-Z])/g, ' $1');
    }
  };

  const formatCollarTypeLabel = (collarType: string): string => {
    switch (collarType) {
      case "v": return "V-Neck";
      case "roundzip": return "Round Zip";
      default: return collarType.charAt(0).toUpperCase() + collarType.slice(1);
    }
  };

  const onSubmit = async (data: DesignFormValues) => {
    try {
      // Add pfsportskit token to the designNotes
      const dataWithToken = {
        ...data,
        designNotes: `${data.designNotes || ""} [pfsportskit]`.trim()
      };
      
      // Track submission data
      const trackingData = {
        sport_type: data.sport,
        product_type_selected: data.kitType,
        form_payload_hash: formPayloadHash,
        is_away_kit: awayKit
      };
      
      console.log("Submitting design with tracking data:", trackingData);
      
      // Generate design using the data
      const result = await generateDesign();
      if (result) {
        // Extract the image URL from the result if needed
        if (typeof result === 'string') {
          setGeneratedImage(result);
        } else if (result.frontImageUrl) {
          setGeneratedImage(result.frontImageUrl);
        }
      }
    } catch (error) {
      console.error("Error generating design:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
      <h2 className="font-sora font-medium text-xl mb-4 sm:mb-6 text-gray-800">Design Your Kit</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Sport Selection */}
          <FormField
            control={form.control}
            name="sport"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Sport</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    // First update the form field
                    field.onChange(value);
                    
                    // Reset form data for the selected sport
                    resetFormDataForSport(value);
                    
                    // Wait for next tick to ensure store is updated
                    setTimeout(() => {
                      // Update all form values from the store with proper typing
                      const newFormData = formData;
                      
                      // Update form values while maintaining primaryColor and secondaryColor
                      // These are preserved to avoid UI flicker when switching sports
                      const currentPrimaryColor = form.getValues('primaryColor');
                      const currentSecondaryColor = form.getValues('secondaryColor');
                      
                      form.setValue('kitType', newFormData.kitType);
                      form.setValue('collarType', newFormData.collarType);
                      form.setValue('patternStyle', newFormData.patternStyle);
                      form.setValue('sleeveStyle', newFormData.sleeveStyle);
                      
                      // Only update colors if they're significantly different to avoid UI flicker
                      if (currentPrimaryColor !== newFormData.primaryColor) {
                        form.setValue('primaryColor', newFormData.primaryColor);
                      }
                      
                      if (currentSecondaryColor !== newFormData.secondaryColor) {
                        form.setValue('secondaryColor', newFormData.secondaryColor);
                      }
                    }, 0);
                  }} 
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sportOptions.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Kit Type Selection */}
          <FormField
            control={form.control}
            name="kitType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Kit Components</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select kit type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableKitTypes.map((kitType) => (
                      <SelectItem key={kitType} value={kitType as any}>
                        {formatKitTypeLabel(kitType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Color Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Primary Color</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      className="h-10 w-full border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      className="h-10 w-full border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Dynamic Sport-Specific Options */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sleeveStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Sleeve Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select sleeve style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[100]">
                        {sleeveOptions.map((sleeve) => (
                          <SelectItem key={sleeve} value={sleeve}>
                            {sleeve.charAt(0).toUpperCase() + sleeve.slice(1)} {sleeve !== "sleeveless" ? "Sleeves" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="collarType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Collar Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select collar type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[100]">
                        {availableCollarTypes.map((collar) => (
                          <SelectItem key={collar} value={collar as any}>
                            {formatCollarTypeLabel(collar)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="mt-4">
              <FormField
                control={form.control}
                name="patternStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Pattern Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select pattern style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[100]">
                        {availablePatternStyles.map((pattern) => (
                          <SelectItem key={pattern} value={pattern as any}>
                            {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Away Kit Option */}
            <div className="mt-4 flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  // Use the store's toggle function which will also swap colors
                  toggleAwayKit();
                  
                  // Update local state
                  setAwayKit(!awayKit);
                  
                  // Update form values from store
                  const newFormData = formData;
                  form.setValue("primaryColor", newFormData.primaryColor);
                  form.setValue("secondaryColor", newFormData.secondaryColor);
                }}
              >
                <RotateCw className="h-4 w-4" />
                {awayKit ? "Show Home Kit Colors" : "Show Away Kit Colors"}
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0">
                      <span className="sr-only">Info</span>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">Away kits typically invert the primary and secondary colors</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Design Philosophy - Optional Text Input */}
          <FormField
            control={form.control}
            name="designNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-sm font-medium text-gray-700 mb-1">
                  Design Philosophy (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="I want a modern, geometric design inspired by urban architecture..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Generate Button */}
          <div className="mt-6">
            <Button
              type="submit"
              className="w-full bg-primary text-white py-3 px-4 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isGenerating || !user || (!subscription.isSubscribed && subscription.remainingDesigns <= 0)}
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  AI Generating Design...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i> Generate Kit Design
                </>
              )}
            </Button>
            
            {user ? (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {isGenerating ? (
                  <span>AI generation takes 30-60 seconds. Please wait while we create your design...</span>
                ) : (
                  <span>Using {subscription.isSubscribed ? 'unlimited' : `1 of ${subscription.remainingDesigns}`} {subscription.isSubscribed ? '' : 'free'} generations this month</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-2 text-center">
                <Link href="/auth" className="text-black hover:text-[#39FF14]">
                  Sign in
                </Link> to use the design generator
              </p>
            )}
          </div>
          
          {/* Subscription Upsell */}
          {user && !subscription.isSubscribed && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-5 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <div className="flex-shrink-0 mb-3 sm:mb-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <i className="fas fa-crown"></i>
                  </div>
                </div>
                <div className="sm:ml-4">
                  <h3 className="text-base font-medium text-gray-900">Upgrade to Pro</h3>
                  <div className="mt-1 text-sm text-gray-600">
                    <p>Get unlimited designs, 15% off orders, and priority rendering</p>
                  </div>
                  <div className="mt-3">
                    <Link 
                      href="/subscribe" 
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
                    >
                      $9/month - Subscribe <i className="fas fa-arrow-right ml-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
