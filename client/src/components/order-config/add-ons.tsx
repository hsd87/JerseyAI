import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AddOnsProps {
  value: string[];
  onChange: (value: string[]) => void;
}

// Mock add-on options
const addOnOptions = [
  {
    id: "name",
    title: "Name Printing",
    description: "Add your name to the back of the jersey",
    price: 15,
    image: "/assets/addon-name.jpg"
  },
  {
    id: "number",
    title: "Number Printing",
    description: "Add your number to the back of the jersey",
    price: 15,
    image: "/assets/addon-number.jpg"
  },
  {
    id: "badge",
    title: "Team Badge",
    description: "Add a custom team badge to the front of the jersey",
    price: 15,
    image: "/assets/addon-badge.jpg"
  },
  {
    id: "patch",
    title: "League Patch",
    description: "Add official league patches to the sleeves",
    price: 15,
    image: "/assets/addon-patch.jpg"
  }
];

export default function AddOns({ value, onChange }: AddOnsProps) {
  const toggleAddOn = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(item => item !== id));
    } else {
      onChange([...value, id]);
    }
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {addOnOptions.map((addon) => (
        <Card 
          key={addon.id}
          className={`cursor-pointer transition-all ${
            value.includes(addon.id) 
              ? "border-primary ring-2 ring-primary ring-opacity-50" 
              : "hover:border-primary/50"
          }`}
          onClick={() => toggleAddOn(addon.id)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              {addon.title}
              {value.includes(addon.id) && (
                <span className="bg-primary text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              ${addon.price.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-24 bg-muted flex items-center justify-center text-sm text-muted-foreground">
              {/* Placeholder for actual images */}
              {addon.title}
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-3">
            <p className="text-xs">{addon.description}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}