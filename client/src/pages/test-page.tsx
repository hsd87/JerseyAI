import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sportOptions, kitTypeOptions, sleeveOptions, collarOptions, patternOptions } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sport: "soccer",
    kitType: "jersey+shorts",
    primaryColor: "#0062ff",
    secondaryColor: "#ffffff",
    sleeveStyle: "short-sleeved",
    collarType: "crew",
    patternStyle: "geometric",
    designNotes: "A modern, sleek kit with dynamic geometric patterns. The design should feel technical and forward-looking."
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Submitting request to /api/generate-image:', formData);
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json();
      console.log('API response:', data);
      
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Test Direct Image Generation</CardTitle>
              <CardDescription>
                This page tests the enhanced prompt-to-image pipeline with the structured template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport</Label>
                  <Select 
                    value={formData.sport} 
                    onValueChange={(value) => handleChange('sport', value)}
                  >
                    <SelectTrigger id="sport">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportOptions.map((sport) => (
                        <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kitType">Kit Type</Label>
                  <Select 
                    value={formData.kitType} 
                    onValueChange={(value) => handleChange('kitType', value)}
                  >
                    <SelectTrigger id="kitType">
                      <SelectValue placeholder="Select kit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {kitTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="color" 
                        id="primaryColor" 
                        value={formData.primaryColor} 
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input 
                        type="text" 
                        value={formData.primaryColor} 
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="color" 
                        id="secondaryColor" 
                        value={formData.secondaryColor} 
                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input 
                        type="text" 
                        value={formData.secondaryColor} 
                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleeveStyle">Sleeve Style</Label>
                  <Select 
                    value={formData.sleeveStyle} 
                    onValueChange={(value) => handleChange('sleeveStyle', value)}
                  >
                    <SelectTrigger id="sleeveStyle">
                      <SelectValue placeholder="Select sleeve style" />
                    </SelectTrigger>
                    <SelectContent>
                      {sleeveOptions.map((style) => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collarType">Collar Type</Label>
                  <Select 
                    value={formData.collarType} 
                    onValueChange={(value) => handleChange('collarType', value)}
                  >
                    <SelectTrigger id="collarType">
                      <SelectValue placeholder="Select collar type" />
                    </SelectTrigger>
                    <SelectContent>
                      {collarOptions.map((collar) => (
                        <SelectItem key={collar} value={collar}>{collar}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patternStyle">Pattern Style</Label>
                  <Select 
                    value={formData.patternStyle} 
                    onValueChange={(value) => handleChange('patternStyle', value)}
                  >
                    <SelectTrigger id="patternStyle">
                      <SelectValue placeholder="Select pattern style" />
                    </SelectTrigger>
                    <SelectContent>
                      {patternOptions.map((pattern) => (
                        <SelectItem key={pattern} value={pattern}>{pattern}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designNotes">Design Notes</Label>
                  <Textarea 
                    id="designNotes" 
                    value={formData.designNotes} 
                    onChange={(e) => handleChange('designNotes', e.target.value)}
                    placeholder="Add any specific design notes..."
                    rows={4}
                  />
                </div>
              
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Image'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-1/2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generated Image</CardTitle>
              <CardDescription>
                The result will display here after generation
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Generating image... This may take up to 30 seconds.
                  </p>
                </div>
              ) : error ? (
                <div className="text-center p-6 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 font-medium">Error</p>
                  <p className="text-sm text-red-500 mt-1">{error}</p>
                </div>
              ) : imageUrl ? (
                <div className="flex flex-col items-center">
                  <img
                    src={imageUrl}
                    alt="Generated jersey design"
                    className="max-w-full max-h-[400px] object-contain border border-border rounded-md shadow-sm"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {imageUrl}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-10">
                  Fill out the form and click "Generate Image" to see the result
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                Uses the new structured prompt format with "pfsportskit" token
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}