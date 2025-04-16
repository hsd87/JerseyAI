import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import DynamicKitForm from '@/components/dynamic-kit-form';
import { useDesignStore } from '@/hooks/use-design-store';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { LoaderCircle } from 'lucide-react';

export default function KitDesignerPage() {
  const [, navigate] = useLocation();
  const { formData, resetFormData, hasGenerated } = useDesignStore();
  
  // Check if user is authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  // Reset design state when entering this page
  useEffect(() => {
    resetFormData();
  }, [resetFormData]);

  // Handle navigation to design form
  const handleContinueToDesign = () => {
    navigate('/designer');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Container className="py-10">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                Dynamic Kit Designer
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Configure your perfect sports kit with our advanced customization system. Select your sport,
                kit type, and customize every detail before proceeding to the design stage.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <DynamicKitForm />
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-4">Design Process</h3>
                  <ol className="space-y-3 list-decimal list-inside">
                    <li className="text-primary font-medium">Select sport & kit type</li>
                    <li>Configure kit options & materials</li>
                    <li>Generate AI preview of your design</li>
                    <li>Customize with text, numbers & logos</li>
                    <li>Place your order with desired quantities</li>
                  </ol>
                </div>

                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-4">Continue to Design</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Once you've selected your sport, kit type, and customization options, 
                    click below to proceed to the design stage where you can visualize your kit
                    and add personalized elements.
                  </p>
                  <Button 
                    onClick={handleContinueToDesign}
                    disabled={!formData.sport || !formData.kitType}
                    className="w-full"
                  >
                    Proceed to Design Stage
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}