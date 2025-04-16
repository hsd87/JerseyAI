import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PackageOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface PackageSelectionProps {
  selectedPackage: string;
  onSelectPackage: (packageId: string) => void;
}

const packageOptions: PackageOption[] = [
  {
    id: "jersey-only",
    name: "Jersey Only",
    price: 59.99,
    description: "Custom jersey with your design"
  },
  {
    id: "jersey-shorts",
    name: "Jersey + Shorts",
    price: 89.99,
    description: "Custom jersey with matching shorts"
  },
  {
    id: "full-kit",
    name: "Full Kit",
    price: 119.99,
    description: "Jersey, shorts & personalized accessories"
  }
];

export default function PackageSelection({ selectedPackage, onSelectPackage }: PackageSelectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {packageOptions.map((pkg) => (
        <Card 
          key={pkg.id}
          className={cn(
            "p-4 cursor-pointer border transition-all hover:border-primary/50",
            selectedPackage === pkg.id ? "border-primary border-2" : "border-gray-200"
          )}
          onClick={() => onSelectPackage(pkg.id)}
        >
          <h3 className="font-medium text-lg">{pkg.name}</h3>
          <p className="text-2xl font-bold text-primary">${pkg.price.toFixed(2)}</p>
          <p className="text-gray-500 text-sm mt-1">{pkg.description}</p>
        </Card>
      ))}
    </div>
  );
}