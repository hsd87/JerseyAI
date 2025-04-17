import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

// List of top 50 countries (abbreviated)
const countries = [
  "United States", "China", "Japan", "Germany", "United Kingdom", 
  "France", "India", "Italy", "Brazil", "Canada", 
  "South Korea", "Australia", "Spain", "Mexico", "Indonesia", 
  "Netherlands", "Saudi Arabia", "Turkey", "Switzerland", "Poland", 
  "Sweden", "Belgium", "Nigeria", "Austria", "Norway", 
  "United Arab Emirates", "Israel", "Ireland", "South Africa", "Singapore", 
  "Hong Kong", "Denmark", "Philippines", "Malaysia", "Thailand", 
  "Colombia", "Finland", "Chile", "Bangladesh", "Egypt", 
  "Vietnam", "Portugal", "Romania", "New Zealand", "Pakistan", 
  "Peru", "Czech Republic", "Qatar", "Algeria", "Greece"
];

// Form schema
const partnerFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  company: z.string().min(2, "Company/Organization is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  partnershipType: z.enum(["Reseller", "Retailer", "Event Organizer", "Tender Buyer", "White Label"]),
  orderSize: z.enum(["50–100", "100–500", "500–1000", "1000+"]),
  needsCustomBranding: z.boolean(),
  logoUrl: z.any().optional(), // File upload field
  notes: z.string().optional(),
  preferredContactMethod: z.enum(["Email", "WhatsApp", "Phone"]),
  bestTimeToReach: z.enum(["Morning", "Afternoon", "Evening"]),
});

type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export default function PartnerPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [whatsAppLink, setWhatsAppLink] = useState('');
  
  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      fullName: '',
      company: '',
      email: '',
      phone: '',
      country: '',
      notes: '',
      needsCustomBranding: false,
      preferredContactMethod: 'Email',
      bestTimeToReach: 'Morning',
    },
  });
  
  const onSubmit = async (data: PartnerFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all text fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'logoUrl' && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      // Add file if it exists
      const logoFile = form.getValues('logoUrl');
      if (logoFile && logoFile[0]) {
        formData.append('logo', logoFile[0]);
      }
      
      // Submit the form
      const response = await fetch('/api/partner', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Submission Successful",
          description: "Thank you! Our team will contact you within 24 hours.",
          variant: "default",
        });
        
        // If WhatsApp was selected as preferred contact method and phone is provided
        if (data.preferredContactMethod === 'WhatsApp' && data.phone) {
          const cleanPhone = data.phone.replace(/[^0-9+]/g, '');
          const message = encodeURIComponent(`Hello! I just submitted a partner inquiry on ProJersey. I'm interested in ${data.partnershipType} partnership. Looking forward to discussing further!`);
          setWhatsAppLink(`https://wa.me/${cleanPhone}?text=${message}`);
        }
      } else {
        throw new Error(result.message || 'Failed to submit the form');
      }
    } catch (error) {
      console.error('Error submitting partner form:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {!isSuccess ? (
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column - Information */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Let's Build Your Custom Jersey Brand at Scale
                </h1>
                <p className="mt-4 text-xl text-muted-foreground">
                  Bulk orders. AI-designed gear. Fast global production.
                </p>
              </div>
              
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-3">Why Partner With Us?</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>AI-powered design process reduces turnaround time by 70%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>White label options available with your own branding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Global production network with 7-day shipping to major markets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Premium quality materials with customizable technical features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Volume discounts starting at just 50 units</span>
                    </li>
                  </ul>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-3">Partnership Types</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Reseller</h4>
                      <p className="text-sm text-muted-foreground">Sell our products through your channels with competitive margins</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Retailer</h4>
                      <p className="text-sm text-muted-foreground">Stock our premium jersey collections in your physical or online store</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Event Organizer</h4>
                      <p className="text-sm text-muted-foreground">Custom kits for tournaments, marathons, and sporting events</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Tender Buyer</h4>
                      <p className="text-sm text-muted-foreground">Specialized bulk manufacturing for institutional contracts</p>
                    </div>
                    <div>
                      <h4 className="font-medium">White Label</h4>
                      <p className="text-sm text-muted-foreground">Our technology and production under your brand identity</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Right Column - Form */}
            <div>
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Partner With Us</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company/Organization *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp or Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormDescription>
                              Include country code
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country / Region *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="partnershipType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type of Partnership *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select partnership type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Reseller">Reseller</SelectItem>
                                <SelectItem value="Retailer">Retailer</SelectItem>
                                <SelectItem value="Event Organizer">Event Organizer</SelectItem>
                                <SelectItem value="Tender Buyer">Tender Buyer</SelectItem>
                                <SelectItem value="White Label">White Label</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="orderSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Order Size *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select order size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="50–100">50–100 units</SelectItem>
                                <SelectItem value="100–500">100–500 units</SelectItem>
                                <SelectItem value="500–1000">500–1000 units</SelectItem>
                                <SelectItem value="1000+">1000+ units</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="needsCustomBranding"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 mt-1"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Do you need custom branding?</FormLabel>
                            <FormDescription>
                              Select this if you need your own logo and custom design elements
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Upload Logo (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => onChange(e.target.files)}
                              {...fieldProps}
                            />
                          </FormControl>
                          <FormDescription>
                            JPEG, PNG or SVG, max 5MB
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tell Us More</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional details about your partnership needs..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="preferredContactMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Preferred Contact Method *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="Email" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Email
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="WhatsApp" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  WhatsApp
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="Phone" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Phone Call
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bestTimeToReach"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Best Time to Reach You *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select preferred time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Morning">Morning</SelectItem>
                              <SelectItem value="Afternoon">Afternoon</SelectItem>
                              <SelectItem value="Evening">Evening</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Partnership Inquiry"}
                    </Button>
                  </form>
                </Form>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-semibold">Thank You For Your Interest!</h2>
            
            <p className="text-muted-foreground">
              We've received your partnership inquiry. Our team will review your information and contact you within 24 hours.
            </p>
            
            {whatsAppLink && (
              <div className="pt-4">
                <p className="mb-3">You selected WhatsApp as your preferred contact method:</p>
                <Button variant="outline" className="gap-2" asChild>
                  <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
                    Continue on WhatsApp
                  </a>
                </Button>
              </div>
            )}
            
            <div className="pt-6">
              <Button variant="outline" onClick={() => window.location.href = "/"}>
                Return to Home
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}