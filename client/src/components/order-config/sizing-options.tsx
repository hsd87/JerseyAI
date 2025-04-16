import React from "react";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SizeData {
  size: string;
  chest: string;
  waist: string;
  hips: string;
}

interface SizingOptionsProps {
  gender: string;
  size: string;
  onSelectGender: (gender: string) => void;
  onSelectSize: (size: string) => void;
}

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const maleSizeChart: SizeData[] = [
  { size: "XS", chest: "34-36", waist: "28-30", hips: "34-36" },
  { size: "S", chest: "36-38", waist: "30-32", hips: "36-38" },
  { size: "M", chest: "38-40", waist: "32-34", hips: "38-40" },
  { size: "L", chest: "40-42", waist: "34-36", hips: "40-42" },
  { size: "XL", chest: "42-44", waist: "36-38", hips: "42-44" },
  { size: "XXL", chest: "44-46", waist: "38-40", hips: "44-46" },
];

const femaleSizeChart: SizeData[] = [
  { size: "XS", chest: "30-32", waist: "24-26", hips: "33-35" },
  { size: "S", chest: "33-35", waist: "27-29", hips: "36-38" },
  { size: "M", chest: "36-38", waist: "30-32", hips: "39-41" },
  { size: "L", chest: "39-41", waist: "33-35", hips: "42-44" },
  { size: "XL", chest: "42-44", waist: "36-38", hips: "45-47" },
  { size: "XXL", chest: "45-47", waist: "39-41", hips: "48-50" },
];

const youthSizeChart: SizeData[] = [
  { size: "XS", chest: "26-28", waist: "22-24", hips: "26-28" },
  { size: "S", chest: "28-30", waist: "24-26", hips: "28-30" },
  { size: "M", chest: "30-32", waist: "26-28", hips: "30-32" },
  { size: "L", chest: "32-34", waist: "28-30", hips: "32-34" },
  { size: "XL", chest: "34-36", waist: "30-32", hips: "34-36" },
  { size: "XXL", chest: "36-38", waist: "32-34", hips: "36-38" },
];

export default function SizingOptions({ gender, size, onSelectGender, onSelectSize }: SizingOptionsProps) {
  const sizeChart = gender === "mens" 
    ? maleSizeChart 
    : gender === "womens" 
      ? femaleSizeChart 
      : youthSizeChart;
      
  const chartTitle = gender === "mens" 
    ? "Size Chart (Male)" 
    : gender === "womens" 
      ? "Size Chart (Female)" 
      : "Size Chart (Youth)";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Select Gender</h3>
        <RadioGroup 
          value={gender} 
          onValueChange={onSelectGender} 
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mens" id="mens" />
            <Label htmlFor="mens">Men's</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="womens" id="womens" />
            <Label htmlFor="womens">Women's</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="youth" id="youth" />
            <Label htmlFor="youth">Youth</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Select Size</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {sizes.map((sizeOption) => (
            <div
              key={sizeOption}
              className={cn(
                "flex items-center justify-center h-12 border rounded-md cursor-pointer transition-all hover:border-primary/50",
                size === sizeOption ? "border-primary border-2 bg-primary/5" : "border-gray-200"
              )}
              onClick={() => onSelectSize(sizeOption)}
            >
              {sizeOption}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-1">{chartTitle}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 text-left border border-gray-200">Size</th>
                <th className="p-3 text-left border border-gray-200">Chest (in)</th>
                <th className="p-3 text-left border border-gray-200">Waist (in)</th>
                <th className="p-3 text-left border border-gray-200">Hips (in)</th>
              </tr>
            </thead>
            <tbody>
              {sizeChart.map((row) => (
                <tr 
                  key={row.size} 
                  className={cn(
                    "border-b hover:bg-gray-50", 
                    size === row.size ? "bg-primary/5" : ""
                  )}
                >
                  <td className="p-3 border border-gray-200">{row.size}</td>
                  <td className="p-3 border border-gray-200">{row.chest}</td>
                  <td className="p-3 border border-gray-200">{row.waist}</td>
                  <td className="p-3 border border-gray-200">{row.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}