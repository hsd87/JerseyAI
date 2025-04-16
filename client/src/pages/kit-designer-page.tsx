import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useToast } from '@/hooks/use-toast';
import { useDesignStore } from '@/hooks/use-design-store';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { DynamicKitForm } from '@/components/dynamic-kit-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function KitDesignerPage() {
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedKitType, setSelectedKitType] = useState<string>('');
  const [formSchema, setFormSchema] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { setDesign, design } = useDesignStore();

  // Fetch available sports
  const { data: sports, isLoading: isSportsLoading } = useQuery({
    queryKey: ['/api/kit-config/sports'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch kit types when sport changes
  const { data: kitTypes, isLoading: isKitTypesLoading } = useQuery({
    queryKey: ['/api/kit-config/kit-types', selectedSport],
    enabled: !!selectedSport,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch form schema when both sport and kit type are selected
  const { data: schema, isLoading: isSchemaLoading } = useQuery({
    queryKey: ['/api/kit-config/schema', selectedSport, selectedKitType],
    enabled: !!selectedSport && !!selectedKitType,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onSuccess: (data) => {
      setFormSchema(data);
    },
  });

  // Reset kit type when sport changes
  useEffect(() => {
    setSelectedKitType('');
  }, [selectedSport]);

  // Handle sport selection
  const handleSportSelect = (sport: string) => {
    setSelectedSport(sport);
  };

  // Handle kit type selection
  const handleKitTypeSelect = (kitType: string) => {
    setSelectedKitType(kitType);
  };

  // Handle form submission - generate design
  const handleDesignSubmit = async (formData: any) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: selectedSport,
          kitType: selectedKitType,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate design');
      }

      const result = await response.json();
      
      // Save design data to the store
      setDesign({
        name: `${selectedSport} ${selectedKitType}`,
        sport: selectedSport,
        kitType: selectedKitType,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        sleeveStyle: formData.sleeveStyle,
        collarType: formData.collarType,
        patternStyle: formData.patternStyle,
        designNotes: formData.designNotes || '',
        frontImageUrl: result.imageUrl,
        backImageUrl: result.imageUrl, // Using same image for back in front-view-only mode
        frontImageData: result.imageData,
        backImageData: result.imageData, // Using same data for back in front-view-only mode
        kitConfigData: formData,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Design generated successfully',
        description: 'Your design has been created. You can now customize it further or proceed to order.',
      });
      
    } catch (error: any) {
      toast({
        title: 'Error generating design',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-8">
        <Container>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Design Your Custom Kit
            </h1>
            <p className="mt-4 max-w-md mx-auto text-muted-foreground">
              Create a professional sports kit with our AI-powered design tool. Choose your sport, colors, and style to get started.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4 lg:col-span-3">
              <div className="space-y-6 sticky top-20">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Select Sport</h2>
                  {isSportsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {sports?.map((sport: string) => (
                        <Button
                          key={sport}
                          variant={selectedSport === sport ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => handleSportSelect(sport)}
                        >
                          {sport}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedSport && (
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Kit Type</h2>
                    {isKitTypesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {kitTypes?.map((type: string) => (
                          <Button
                            key={type}
                            variant={selectedKitType === type ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => handleKitTypeSelect(type)}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-8 lg:col-span-9">
              {selectedSport && selectedKitType ? (
                isSchemaLoading ? (
                  <div className="flex flex-col items-center justify-center p-8 border rounded-lg shadow-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Loading customization options...</p>
                  </div>
                ) : formSchema ? (
                  <div className="border rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-muted/50 px-6 py-4 border-b">
                      <h2 className="text-xl font-semibold">
                        {selectedSport} {selectedKitType} Configuration
                      </h2>
                    </div>
                    
                    <Tabs defaultValue="design" className="p-6">
                      <TabsList className="mb-4">
                        <TabsTrigger value="design">Design</TabsTrigger>
                        <TabsTrigger value="sizing">Sizing & Quantity</TabsTrigger>
                        <TabsTrigger value="team">Team Details</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="design" className="space-y-6">
                        <DynamicKitForm 
                          schema={formSchema} 
                          onSubmit={handleDesignSubmit}
                          isSubmitting={isGenerating}
                          sport={selectedSport}
                          kitType={selectedKitType}
                        />
                      </TabsContent>
                      
                      <TabsContent value="sizing" className="p-4 border rounded-md">
                        <p className="text-center text-muted-foreground">
                          Please complete the design step first before configuring sizing and quantities.
                        </p>
                      </TabsContent>
                      
                      <TabsContent value="team" className="p-4 border rounded-md">
                        <p className="text-center text-muted-foreground">
                          Please complete the design step first before adding team details.
                        </p>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border rounded-lg shadow-sm">
                    <p className="text-muted-foreground">
                      Failed to load form schema. Please try selecting a different sport or kit type.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg shadow-sm">
                  <div className="text-center max-w-md">
                    <h3 className="text-xl font-medium mb-2">
                      Select a Sport and Kit Type
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Choose your sport and kit type from the options on the left to begin designing your custom kit.
                    </p>
                    {design && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Your Recent Design</h4>
                        {design.frontImageUrl && (
                          <div className="aspect-square relative rounded-md overflow-hidden mb-4 max-w-[200px] mx-auto">
                            <img 
                              src={design.frontImageUrl} 
                              alt="Your recent design" 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedSport(design.sport);
                            setSelectedKitType(design.kitType);
                          }}
                        >
                          Continue with Recent Design
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}