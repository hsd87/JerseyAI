import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Size, Gender } from "@shared/products";

interface SizingOptionsProps {
  gender: Gender;
  size: Size;
  onSelectGender: (gender: Gender) => void;
  onSelectSize: (size: Size) => void;
}

export default function SizingOptions({
  gender,
  size,
  onSelectGender,
  onSelectSize
}: SizingOptionsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Gender</h3>
        <RadioGroup 
          value={gender} 
          onValueChange={(value) => onSelectGender(value as Gender)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male">Men's</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female">Women's</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Size</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as Size[]).map((sizeOption) => (
            <div 
              key={sizeOption}
              onClick={() => onSelectSize(sizeOption)}
              className={`
                border rounded-md py-3 px-4 text-center cursor-pointer hover:border-primary transition-colors
                ${size === sizeOption ? 'border-primary bg-primary/5 font-medium' : 'border-gray-200'}
              `}
            >
              {sizeOption}
            </div>
          ))}
        </div>
      </div>
      
      <Accordion type="single" collapsible className="mt-6">
        <AccordionItem value="size-chart">
          <AccordionTrigger className="text-sm font-medium">View Size Chart</AccordionTrigger>
          <AccordionContent>
            <div className="overflow-x-auto mt-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 border text-left">Size</th>
                    <th className="py-2 px-4 border text-left">Chest (in)</th>
                    <th className="py-2 px-4 border text-left">Waist (in)</th>
                    <th className="py-2 px-4 border text-left">Hips (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {gender === 'male' ? (
                    // Men's sizing
                    <>
                      <tr>
                        <td className="py-2 px-4 border">XS</td>
                        <td className="py-2 px-4 border">34-36</td>
                        <td className="py-2 px-4 border">28-30</td>
                        <td className="py-2 px-4 border">34-36</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">S</td>
                        <td className="py-2 px-4 border">36-38</td>
                        <td className="py-2 px-4 border">30-32</td>
                        <td className="py-2 px-4 border">36-38</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">M</td>
                        <td className="py-2 px-4 border">38-40</td>
                        <td className="py-2 px-4 border">32-34</td>
                        <td className="py-2 px-4 border">38-40</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">L</td>
                        <td className="py-2 px-4 border">40-42</td>
                        <td className="py-2 px-4 border">34-36</td>
                        <td className="py-2 px-4 border">40-42</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">XL</td>
                        <td className="py-2 px-4 border">42-44</td>
                        <td className="py-2 px-4 border">36-38</td>
                        <td className="py-2 px-4 border">42-44</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">XXL</td>
                        <td className="py-2 px-4 border">44-46</td>
                        <td className="py-2 px-4 border">38-40</td>
                        <td className="py-2 px-4 border">44-46</td>
                      </tr>
                    </>
                  ) : (
                    // Women's sizing
                    <>
                      <tr>
                        <td className="py-2 px-4 border">XS</td>
                        <td className="py-2 px-4 border">32-34</td>
                        <td className="py-2 px-4 border">24-26</td>
                        <td className="py-2 px-4 border">34-36</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">S</td>
                        <td className="py-2 px-4 border">34-36</td>
                        <td className="py-2 px-4 border">26-28</td>
                        <td className="py-2 px-4 border">36-38</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">M</td>
                        <td className="py-2 px-4 border">36-38</td>
                        <td className="py-2 px-4 border">28-30</td>
                        <td className="py-2 px-4 border">38-40</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">L</td>
                        <td className="py-2 px-4 border">38-40</td>
                        <td className="py-2 px-4 border">30-32</td>
                        <td className="py-2 px-4 border">40-42</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">XL</td>
                        <td className="py-2 px-4 border">40-42</td>
                        <td className="py-2 px-4 border">32-34</td>
                        <td className="py-2 px-4 border">42-44</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border">XXL</td>
                        <td className="py-2 px-4 border">42-44</td>
                        <td className="py-2 px-4 border">34-36</td>
                        <td className="py-2 px-4 border">44-46</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Note: Size chart is approximate. For team orders, we recommend requesting a sample first.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}