import { useState, ChangeEvent } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  RotateCw, 
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useEditorStore } from './editor-store';

interface EditorSidebarProps {
  onExport: () => void;
  currentView: 'front' | 'back';
  onToggleView: () => void;
}

const EditorSidebar = ({ onExport, currentView, onToggleView }: EditorSidebarProps) => {
  const [textInput, setTextInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const { addTextItem, addImageItem } = useEditorStore();
  
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      // Add text at the center of the canvas
      addTextItem(textInput, 240, 200, { fontSize });
      setTextInput('');
    }
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      // Add image at the center of the canvas
      addImageItem(imageUrl, 240, 200);
      setImageUrl('');
    }
  };

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          addImageItem(dataUrl, 240, 200);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-80">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">Editor Tools</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggleView} 
          className="flex items-center gap-1"
        >
          <RotateCw className="h-4 w-4" />
          {currentView === 'front' ? 'View Back' : 'View Front'}
        </Button>
      </div>
      
      <Tabs defaultValue="text">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-1">
            <Type className="h-4 w-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            Images
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="text">
          <form onSubmit={handleTextSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text-input">Text</Label>
              <Input
                id="text-input"
                placeholder="Enter text to add..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
              <Slider
                id="font-size"
                defaultValue={[fontSize]}
                max={72}
                min={10}
                step={1}
                onValueChange={handleFontSizeChange}
              />
            </div>
            
            <Button type="submit" className="w-full">Add Text</Button>
          </form>
        </TabsContent>
        
        <TabsContent value="image">
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="image-input">Upload Image</Label>
              <Input
                id="image-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>
            
            <div className="text-center text-sm text-gray-500">
              - or -
            </div>
            
            <form onSubmit={handleImageSubmit} className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="Enter image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button type="submit" className="w-full">Add Image</Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="border-t border-gray-200 mt-4 pt-4">
        <Button 
          onClick={onExport} 
          variant="secondary" 
          className="w-full flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Design
        </Button>
      </div>
    </div>
  );
};

export default EditorSidebar;