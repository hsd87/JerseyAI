import { useState, useEffect } from 'react';
import { useEditorStore } from './editor-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Move, AlignCenter, AlignLeft, AlignRight, Type, Image as ImageIcon } from 'lucide-react';
import { JerseyZone } from './index';

interface EditorControlsProps {
  selectedItemId: string | null;
  jerseyZones: JerseyZone[];
}

const EditorControls = ({ selectedItemId, jerseyZones }: EditorControlsProps) => {
  const { items, updateItem, deleteItem } = useEditorStore();
  
  const selectedItem = items.find(item => item.id === selectedItemId);
  
  // Local state for form fields
  const [textValue, setTextValue] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [color, setColor] = useState('#000000');
  
  // Update local state when selected item changes
  useEffect(() => {
    if (selectedItem && selectedItem.type === 'text') {
      // For text items, strip any prefix (like "BACK ")
      const cleanText = selectedItem.text?.replace(/^BACK /, '') || '';
      setTextValue(cleanText);
      setFontSize(selectedItem.fontSize || 24);
      setFontFamily(selectedItem.fontFamily || 'Arial');
      setColor(selectedItem.fill || '#000000');
    }
  }, [selectedItem]);
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
    
    // Keep any prefix (like "BACK ") if it exists
    const prefix = selectedItem?.text?.startsWith('BACK ') ? 'BACK ' : '';
    
    if (selectedItem) {
      updateItem(selectedItem.id, { 
        text: prefix + e.target.value 
      });
    }
  };
  
  // Handle font size change
  const handleFontSizeChange = (value: number[]) => {
    const newSize = value[0];
    setFontSize(newSize);
    if (selectedItem) {
      updateItem(selectedItem.id, { fontSize: newSize });
    }
  };
  
  // Handle font family change
  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
    if (selectedItem) {
      updateItem(selectedItem.id, { fontFamily: value });
    }
  };
  
  // Handle color change
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
    if (selectedItem) {
      updateItem(selectedItem.id, { fill: e.target.value });
    }
  };
  
  // Handle moving to a predefined zone
  const handleMoveToZone = (zoneId: string) => {
    const zone = jerseyZones.find(z => z.id === zoneId);
    if (zone && selectedItem) {
      updateItem(selectedItem.id, {
        x: zone.x,
        y: zone.y
      });
    }
  };
  
  // Handle deleting an item
  const handleDeleteItem = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
    }
  };

  if (!selectedItem) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Element Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Select an element on the canvas to edit its properties.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {selectedItem.type === 'text' ? (
            <>
              <Type className="w-4 h-4 mr-2" />
              Text Properties
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Image Properties
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text properties */}
        {selectedItem.type === 'text' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="text-content">Text Content</Label>
              <Input
                id="text-content"
                value={textValue}
                onChange={handleTextChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
              <Slider
                id="font-size"
                min={8}
                max={72}
                step={1}
                value={[fontSize]}
                onValueChange={handleFontSizeChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
                <SelectTrigger id="font-family">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex space-x-2">
                <div className="w-10 h-10 rounded border" style={{ backgroundColor: color }}></div>
                <Input
                  id="text-color"
                  type="color"
                  value={color}
                  onChange={handleColorChange}
                  className="w-full h-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Alignment</Label>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    // Align left (position based on your canvas)
                    if (selectedItem) {
                      updateItem(selectedItem.id, { x: 100 });
                    }
                  }}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    // Align center (position based on your canvas)
                    if (selectedItem) {
                      updateItem(selectedItem.id, { x: 240 });
                    }
                  }}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    // Align right (position based on your canvas)
                    if (selectedItem) {
                      updateItem(selectedItem.id, { x: 380 });
                    }
                  }}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
        
        {/* Common controls */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="position-zone">Position in Zone</Label>
          <Select onValueChange={handleMoveToZone}>
            <SelectTrigger id="position-zone">
              <SelectValue placeholder="Move to zone" />
            </SelectTrigger>
            <SelectContent>
              {jerseyZones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="pt-4">
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleDeleteItem}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Element
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditorControls;