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
import { ColorPicker } from '@/components/ui/color-picker';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface EditorSidebarProps {
  onExport: () => void;
  currentView: 'front' | 'back';
  onToggleView: () => void;
}

const EditorSidebar = ({ onExport, currentView, onToggleView }: EditorSidebarProps) => {
  const [textInput, setTextInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [fontOutline, setFontOutline] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState(1);
  const [outlineColor, setOutlineColor] = useState('#000000');
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
        {/* Back view toggle removed as requested - all views now in one generated image */}
      </div>
      
      <Tabs defaultValue="text">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-1">
            <Type className="h-4 w-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            Logos
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
              <Label htmlFor="font-family">Font Style</Label>
              <Select 
                defaultValue="Arial"
                onValueChange={(value) => {
                  // Font family will be applied when text is added
                }}
              >
                <SelectTrigger id="font-family">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Tahoma">Tahoma</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Impact">Impact</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                  <SelectItem value="Arial Black">Arial Black</SelectItem>
                  <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                  <SelectItem value="Lucida Sans">Lucida Sans</SelectItem>
                  <SelectItem value="Palatino Linotype">Palatino Linotype</SelectItem>
                  <SelectItem value="Book Antiqua">Book Antiqua</SelectItem>
                  <SelectItem value="Garamond">Garamond</SelectItem>
                  <SelectItem value="Lucida Console">Lucida Console</SelectItem>
                  <SelectItem value="Franklin Gothic Medium">Franklin Gothic</SelectItem>
                  <SelectItem value="Century Gothic">Century Gothic</SelectItem>
                  <SelectItem value="Copperplate">Copperplate</SelectItem>
                  <SelectItem value="Optima">Optima</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
              <Slider
                id="font-size"
                value={[fontSize]}
                max={72}
                min={10}
                step={1}
                onValueChange={handleFontSizeChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text-color">Text Color</Label>
              <ColorPicker 
                color="#000000" 
                onChange={(color) => {
                  // Text color will be applied when text is added
                }}
              />
            </div>
            
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-outline">Text Outline</Label>
                <Switch 
                  id="font-outline"
                  checked={fontOutline}
                  onCheckedChange={setFontOutline}
                />
              </div>
              
              {fontOutline && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="outline-color">Outline Color</Label>
                    <ColorPicker 
                      color={outlineColor}
                      onChange={setOutlineColor}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="outline-width">Outline Width: {outlineWidth}px</Label>
                    <Slider
                      id="outline-width"
                      value={[outlineWidth]}
                      max={5}
                      min={0.5}
                      step={0.5}
                      onValueChange={(value) => setOutlineWidth(value[0])}
                    />
                  </div>
                </>
              )}
            </div>
            
            <Button type="submit" className="w-full mt-2">Add Text</Button>
          </form>
        </TabsContent>
        
        <TabsContent value="image">
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="image-input">Upload Logo</Label>
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