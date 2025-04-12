import { useState, useRef } from 'react';
import { useEditorStore } from './editor-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EditorSidebarProps {
  onExport: () => void;
  currentView: 'front' | 'back';
  onToggleView: () => void;
}

const EditorSidebar = ({ onExport, currentView, onToggleView }: EditorSidebarProps) => {
  const { addTextItem, addImageItem } = useEditorStore();
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add text to the canvas
  const handleAddText = () => {
    if (!textInput.trim()) return;
    
    // Add to a reasonable position in the center of the canvas
    const x = 240;
    const y = 240;
    
    // If we're on the back view, include "BACK" in the text ID to help with filtering
    const textWithPrefix = currentView === 'back' ? `BACK ${textInput}` : textInput;
    
    addTextItem(textInput, x, y, {
      text: textWithPrefix,
      // Set text in the center
      x: x - (textInput.length * 5),  // Rough estimate of half the text width
      y: y
    });
    
    setTextInput(''); // Clear the input
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a data URL for the image
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageUrl = event.target.result.toString();
        
        // Add the image to the canvas
        addImageItem(imageUrl, 240, 240, {
          // Set in the center
          x: 200,
          y: 200
        });
      }
    };
    reader.readAsDataURL(file);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Jersey Editor Tools</CardTitle>
        <CardDescription>Add and edit elements on your jersey</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Add Elements</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="space-y-4">
            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="text-input">Add Text</Label>
              <div className="flex space-x-2">
                <Input
                  id="text-input"
                  placeholder="Enter text..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddText();
                  }}
                />
                <Button onClick={handleAddText}>Add</Button>
              </div>
              <p className="text-xs text-gray-500">
                {currentView === 'front' ? 'Adding to front' : 'Adding to back'}
              </p>
            </div>
            
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image-upload">Upload Logo or Image</Label>
              <div className="flex space-x-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Supports PNG, JPG, SVG (max 2MB)
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onToggleView}
              >
                Switch to {currentView === 'front' ? 'Back' : 'Front'} View
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2">
              <Label>Export Options</Label>
              <Button 
                onClick={onExport}
                className="w-full"
              >
                Export as PNG
              </Button>
              <p className="text-xs text-gray-500 pt-2">
                Exports the current {currentView} view as a PNG image.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EditorSidebar;