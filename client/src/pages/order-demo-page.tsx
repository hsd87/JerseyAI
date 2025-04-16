import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderDetailBuilder from "@/components/order-detail-builder";
import { Button } from "@/components/ui/button";

export default function OrderDemoPage() {
  const [designId] = useState<number>(1);
  const [sport, setSport] = useState<string>("soccer");
  const [kitType, setKitType] = useState<string>("jersey");
  
  // Mock design images for demo purposes
  const designUrls = {
    front: "https://placehold.co/600x800/0071e3/ffffff.png?text=Front",
    back: "https://placehold.co/600x800/0071e3/ffffff.png?text=Back"
  };
  
  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Order Demo - ProJersey</title>
      </Helmet>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Order Demo</CardTitle>
            <CardDescription>
              Preview and test the order configuration components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {/* Sport Selection */}
              <div>
                <h3 className="text-lg font-medium mb-2">Sport</h3>
                <Tabs 
                  value={sport} 
                  onValueChange={setSport} 
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="soccer">Soccer</TabsTrigger>
                    <TabsTrigger value="basketball">Basketball</TabsTrigger>
                    <TabsTrigger value="rugby">Rugby</TabsTrigger>
                    <TabsTrigger value="cricket">Cricket</TabsTrigger>
                    <TabsTrigger value="esports">Esports</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Kit Type Selection */}
              <div>
                <h3 className="text-lg font-medium mb-2">Kit Type</h3>
                <Tabs 
                  value={kitType} 
                  onValueChange={setKitType} 
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="jersey">Jersey Only</TabsTrigger>
                    <TabsTrigger value="jerseyShorts">Jersey + Shorts</TabsTrigger>
                    <TabsTrigger value="tracksuit">Tracksuit</TabsTrigger>
                    <TabsTrigger value="trackjacket">Track Jacket</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Design Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Front View</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img 
                src={designUrls.front} 
                alt="Jersey front view" 
                className="max-h-[400px] object-contain border border-gray-200 rounded" 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Back View</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img 
                src={designUrls.back} 
                alt="Jersey back view" 
                className="max-h-[400px] object-contain border border-gray-200 rounded" 
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Order Detail Builder */}
        <OrderDetailBuilder 
          designId={designId}
          designUrls={designUrls}
          sport={sport}
          kitType={kitType}
        />
        
        <div className="flex justify-end">
          <Button onClick={() => window.history.back()}>
            Return to Design Page
          </Button>
        </div>
      </div>
    </div>
  );
}