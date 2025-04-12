import { useState } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [currentColor, setCurrentColor] = useState(color);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCurrentColor(newColor);
    onChange(newColor);
  };
  
  const predefinedColors = [
    "#000000", // Black
    "#FFFFFF", // White
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FF8000", // Orange
    "#8000FF", // Purple
  ];
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-md border border-gray-300"
          style={{ backgroundColor: currentColor }}
        />
        <Input
          type="color"
          value={currentColor}
          onChange={handleChange}
          className="h-8 w-16 p-0"
        />
        <Input
          type="text"
          value={currentColor}
          onChange={handleChange}
          className="h-8"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {predefinedColors.map((presetColor) => (
          <button
            key={presetColor}
            type="button"
            className={cn(
              "h-6 w-6 rounded-md border transition-all",
              presetColor === currentColor 
                ? "ring-2 ring-black" 
                : "border-gray-300 hover:scale-110"
            )}
            style={{ backgroundColor: presetColor }}
            onClick={() => {
              setCurrentColor(presetColor);
              onChange(presetColor);
            }}
          />
        ))}
      </div>
    </div>
  );
}