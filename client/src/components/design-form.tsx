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
import { useState, useEffect, useRef } from "react";
import { createHash } from "crypto-browserify";

interface DesignFormProps {
  remainingDesigns?: number;
}

export default function DesignForm({ remainingDesigns = 6 }: DesignFormProps) {
  const { user } = useAuth();
  const { formData, updateFormData } = useDesignStore();
  const { generateDesign, isGenerating } = useReplicate();
  const subscription = useSubscription();

  // Initialize the form with values from the store
  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: formData,
  });

  // Update the store when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateFormData(value as Partial<DesignFormValues>);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, updateFormData]);

  const onSubmit = async (data: DesignFormValues) => {
    try {
      await generateDesign();
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <SelectItem value="jersey">Jersey Only</SelectItem>
                    <SelectItem value="jerseyShorts">Jersey + Shorts</SelectItem>
                    <SelectItem value="fullKit">Full Kit (incl. Socks)</SelectItem>
                    <SelectItem value="completeKit">Complete Kit (incl. Headwear)</SelectItem>
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
          
          {/* Dynamic Options Based on Sport - Soccer is default */}
          {form.watch("sport") === "soccer" && (
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
                              {sleeve.charAt(0).toUpperCase() + sleeve.slice(1)} Sleeves
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
                          {collarOptions.map((collar) => (
                            <SelectItem key={collar} value={collar}>
                              {collar === "v" ? "V-Neck" : collar.charAt(0).toUpperCase() + collar.slice(1)} {collar !== "v" ? "Collar" : ""}
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
                          {patternOptions.map((pattern) => (
                            <SelectItem key={pattern} value={pattern}>
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
            </div>
          )}
          
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
