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
  addonOptions,
  SportType,
  KitType
} from "@shared/schema";
import { getFormConfig } from "@shared/form-config";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Copy, RotateCw, Loader2, HelpCircle } from "lucide-react";
import React, { useState, useEffect, useRef, useMemo } from "react";

interface DesignFormProps {
  remainingDesigns?: number;
}

export default function DesignForm({ remainingDesigns = 6 }: DesignFormProps) {
  const { user } = useAuth();
  const { 
    formData, 
    updateFormData, 
    resetFormDataForSport
  } = useDesignStore();
  const { generateDesign, isGenerating } = useReplicate();
  const subscription = useSubscription();
  const { toast } = useToast();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [formPayloadHash, setFormPayloadHash] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Default form values with soccer selected initially
  const defaultValues: Partial<DesignFormValues> = {
    sport: formData.sport || "soccer",
    kitType: formData.kitType || "jersey",
    primaryColor: formData.primaryColor || "#0071e3",
    secondaryColor: formData.secondaryColor || "#ffffff",
    accentColor1: formData.accentColor1 || "#dddddd",
    accentColor2: formData.accentColor2 || "#333333",
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

  // No longer need away kit toggle functionality

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
  
  // Get form configuration based on selected sport and kit type
  const formConfig = useMemo(() => {
    if (!selectedSport || !selectedKitType) {
      return null;
    }
    return getFormConfig(selectedSport as SportType, selectedKitType as KitType);
  }, [selectedSport, selectedKitType]);
  
  // Filter collar types based on selected sport using useMemo for optimization
  const availableCollarTypes = useMemo(() => {
    // First try to get from form config if available
    if (formConfig && formConfig.collarStyle) {
      // Map the collar style strings to our enum values
      const configStyles = formConfig.collarStyle.map(style => {
        // Map CSV values to our schema enum values
        switch(style.toLowerCase()) {
          case 'v-neck': return 'v';
          case 'crew neck': return 'crew';
          case 'polo collar': return 'polo';
          case 'polo collar without button': return 'polo-no-button';
          case 'full zip': return 'full-zip';
          case 'half zip': return 'half-zip';
          case 'scoop neck': return 'scoop';
          case 'deep neck': return 'deep';
          default: return style.toLowerCase();
        }
      });
      // Filter to ensure only valid enum values are included
      return configStyles.filter(style => collarOptions.includes(style as any));
    }
    // Fall back to schema mapping if config not available
    return selectedSport ? sportCollarMapping[selectedSport] || [] : [];
  }, [selectedSport, formConfig]);
  
  // Determine sleeve options based on sport and kit type
  const availableSleeveOptions = useMemo(() => {
    if (formConfig && formConfig.sleeveLength) {
      // Map CSV values to our schema enum values
      const sleeveTypes = formConfig.sleeveLength.map(length => {
        if (length.includes('/')) {
          // Handle combined options like "sleeveless/short/long"
          return length;
        }
        return length.toLowerCase();
      });
      
      // Filter to ensure only valid enum values are included
      return sleeveTypes.filter(length => 
        sleeveOptions.includes(length as any) || 
        length.split('/').every(part => sleeveOptions.includes(part as any))
      );
    }
    // Default to all sleeve options if not specified in config
    return sleeveOptions;
  }, [formConfig]);
  
  // Filter pattern styles based on selected sport and kit using useMemo
  const availablePatternStyles = useMemo(() => {
    if (formConfig && formConfig.patternStyle) {
      // Map the pattern style strings to our enum values
      const configStyles = formConfig.patternStyle.map(style => {
        // Convert to lowercase and normalize
        const normalized = style.toLowerCase()
          .replace(/\s+/g, '-') // Replace spaces with dashes
          .replace(/\s+plus\s+/g, '-'); // Handle "plus" in names
        
        return normalized;
      });
      
      // Filter to ensure only valid enum values are included
      return configStyles.filter(style => patternOptions.includes(style as any));
    }
    // Fall back to schema mapping
    return selectedSport ? sportPatternMapping[selectedSport] || [] : [];
  }, [selectedSport, formConfig]);

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

  // State for diagnostic modal
  const [showDiagnosticInfo, setShowDiagnosticInfo] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  
  const handleRetry = async () => {
    // Don't automatically retry - just track the attempt and show proper diagnostics
    setRetryAttempt(prevAttempt => prevAttempt + 1);
    setShowRetryDialog(false);
    
    // Get the current form values
    const data = form.getValues();
    
    // Collect and log diagnostic info for troubleshooting
    const diagnosticInfo = {
      retryAttempt: retryAttempt + 1,
      formData: { ...data },
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    console.info("Design generation retry diagnostic info:", diagnosticInfo);
    setDiagnosticData(diagnosticInfo);
    
    // Show a message to the user that they need to manually try again
    toast({
      title: "Ready to try again",
      description: "Please click 'Generate Design' to retry the process.",
    });
  };
  
  const onSubmit = async (data: DesignFormValues) => {
    try {
      // Reset error states
      setGenerationError(null);
      setShowRetryDialog(false);
      
      // Validate all required fields are present
      const requiredFields = ['sport', 'kitType', 'primaryColor', 'secondaryColor', 'collarType', 'patternStyle'];
      
      // Add accent colors if they are configured for this sport/kit combination
      if (formConfig?.colors?.includes('accent1')) {
        requiredFields.push('accentColor1');
      }
      if (formConfig?.colors?.includes('accent2')) {
        requiredFields.push('accentColor2');
      }
      
      const missingFields = requiredFields.filter(field => !data[field as keyof DesignFormValues]);
      
      if (missingFields.length > 0) {
        console.error(`Missing required fields: ${missingFields.join(', ')}`);
        // Mark fields as touched to show validation errors
        missingFields.forEach(field => {
          form.setError(field as any, {
            type: 'required',
            message: 'This field is required'
          });
        });
        return;
      }
      
      // Add pfsportskit token to the designNotes
      const dataWithToken = {
        ...data,
        designNotes: `${data.designNotes || ""} [pfsportskit]`.trim()
      };
      
      // Track submission data
      const trackingData = {
        sport_type: data.sport,
        product_type_selected: data.kitType,
        form_payload_hash: formPayloadHash
      };
      
      console.log("Submitting design with tracking data:", trackingData);
      
      // Reset retry attempt counter for new submissions
      setRetryAttempt(0);
      
      // Generate design using the data (passing the complete form data)
      const result = await generateDesign();
      if (result) {
        // Extract the image URL from the result if needed
        if (typeof result === 'string') {
          setGeneratedImage(result);
        } else if (result.frontImageUrl) {
          setGeneratedImage(result.frontImageUrl);
        }
      } else {
        // No result but no error - could be an empty response
        setShowRetryDialog(true);
      }
    } catch (error) {
      console.error("Error generating design:", error);
      
      // Set form error to display to user
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      setGenerationError(errorMessage);
      
      // Show retry dialog
      setShowRetryDialog(true);
      
      // Also set form error for immediate visibility
      form.setError('root', {
        type: 'server',
        message: 'An error occurred while generating the design. Please try again.'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
      <h2 className="font-sora font-medium text-xl mb-4 sm:mb-6 text-gray-800">Design Your Kit</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Errors Display */}
          {form.formState.errors.root && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
              <p className="text-sm">{form.formState.errors.root.message}</p>
            </div>
          )}
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
                      
                      // Update form values while maintaining color values
                      // These are preserved to avoid UI flicker when switching sports
                      const currentPrimaryColor = form.getValues('primaryColor');
                      const currentSecondaryColor = form.getValues('secondaryColor');
                      const currentAccentColor1 = form.getValues('accentColor1');
                      const currentAccentColor2 = form.getValues('accentColor2');
                      
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
                      
                      if (currentAccentColor1 !== newFormData.accentColor1) {
                        form.setValue('accentColor1', newFormData.accentColor1);
                      }
                      
                      if (currentAccentColor2 !== newFormData.accentColor2) {
                        form.setValue('accentColor2', newFormData.accentColor2);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
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
          
          {/* Accent Colors - Only shown when formConfig specifies colors includes accent options */}
          {(!formConfig || formConfig.colors?.includes('accent1') || formConfig.colors?.includes('accent2')) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 mt-4">
              {(!formConfig || formConfig.colors?.includes('accent1')) && (
                <FormField
                  control={form.control}
                  name="accentColor1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Accent Color 1</FormLabel>
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
              )}
              {(!formConfig || formConfig.colors?.includes('accent2')) && (
                <FormField
                  control={form.control}
                  name="accentColor2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Accent Color 2</FormLabel>
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
              )}
            </div>
          )}
          
          {/* Dynamic Sport-Specific Options */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Only show sleeve style if included in form config */}
              {(!formConfig || formConfig.showFields.includes('sleeveLength')) && (
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
                          {availableSleeveOptions.map((sleeve) => (
                            <SelectItem key={sleeve} value={sleeve}>
                              {sleeve.includes('/') 
                                ? sleeve.split('/').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('/')
                                : sleeve.charAt(0).toUpperCase() + sleeve.slice(1)} 
                              {!sleeve.includes('/') && sleeve !== "sleeveless" ? " Sleeves" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {/* Only show collar type if included in form config */}
              {(!formConfig || formConfig.showFields.includes('collarType')) && (
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
              )}
            </div>
            
            <div className="mt-4">
              {/* Only show pattern style if included in form config */}
              {(!formConfig || formConfig.showFields.includes('patternStyle')) && (
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
                              {pattern.charAt(0).toUpperCase() + pattern.slice(1).replace(/-/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
              className="w-full bg-[#E34234] text-white py-3 px-4 rounded-full font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E34234]"
              disabled={isGenerating || !user || (!subscription.isSubscribed && subscription.remainingDesigns <= 0)}
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span className="animate-pulse">AI Generating Design...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                  Generate Kit Design
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
                <Link href="/auth" className="text-black hover:text-[#E34234]">
                  Sign in
                </Link> to use the design generator
              </p>
            )}
          </div>
          
          {/* Generation Error Message */}
          {generationError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mt-6 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Design Generation Error</h4>
                <p className="text-xs mt-1">{generationError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 rounded-full"
                  onClick={() => setShowRetryDialog(true)}
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {/* Subscription Upsell */}
          {user && !subscription.isSubscribed && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-5 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <div className="flex-shrink-0 mb-3 sm:mb-0">
                  <div className="w-8 h-8 rounded-full bg-[#E34234]/10 flex items-center justify-center text-[#E34234]">
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
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#E34234] hover:bg-opacity-80 rounded-full transition-colors"
                    >
                      $9/month - Subscribe <i className="fas fa-arrow-right ml-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
        
        {/* Retry Dialog */}
        <AlertDialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Design Generation Failed</AlertDialogTitle>
              <AlertDialogDescription>
                {retryAttempt < 2 ? (
                  <>
                    We encountered an issue while generating your jersey design. 
                    This may be due to temporary server load or connection issues.
                  </>
                ) : (
                  <>
                    Multiple attempts to generate your design have failed. This could be due to 
                    a server issue or problem with the design parameters.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRetry} className="bg-[#E34234] hover:bg-opacity-80 rounded-full">
                <RotateCw className="mr-2 h-4 w-4" />
                Retry Generation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Diagnostic Modal for Errors - Only shown to admins for troubleshooting */}
        {user?.role === 'admin' && (
          <Dialog open={showDiagnosticInfo} onOpenChange={setShowDiagnosticInfo}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Technical Diagnostic Information</DialogTitle>
                <DialogDescription>
                  This information can help our team troubleshoot design generation issues.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                <div className="text-xs font-mono bg-gray-100 p-4 rounded-md">
                  {diagnosticData && (
                    <pre>{JSON.stringify(diagnosticData, null, 2)}</pre>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowDiagnosticInfo(false)} className="bg-[#E34234] hover:bg-opacity-80">Close</Button>
                {diagnosticData && (
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => {
                      // Copy to clipboard
                      navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2))
                        .then(() => {
                          toast({
                            title: "Copied to clipboard",
                            description: "Diagnostic data has been copied to clipboard"
                          });
                        });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" /> Copy JSON
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Form>
    </div>
  );
}
