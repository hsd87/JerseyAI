import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrderStore } from "@/hooks/use-order-store";
import { Badge } from "@/components/ui/badge";

export default function SizeChartDisplay() {
  const [sizeView, setSizeView] = useState<"men" | "women" | "youth">("men");
  const { setGender, setSize, size, gender } = useOrderStore();
  
  // Handle size change
  const handleSizeChange = (value: string) => {
    setSize?.(value);
  };
  
  // Handle gender change via tab
  const handleGenderChange = (value: string) => {
    if (value === "men" || value === "women" || value === "youth") {
      setSizeView(value);
      
      // Map to the gender values used in the order store
      const genderMap: Record<string, string> = {
        men: "Male",
        women: "Female",
        youth: "Youth"
      };
      
      setGender?.(genderMap[value]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Size Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-4">
          {/* Size Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="size-select" className="block mb-2 text-sm font-medium">
                Your Size
              </Label>
              <Select
                value={size || "M"}
                onValueChange={handleSizeChange}
              >
                <SelectTrigger id="size-select">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid md:col-span-2">
              <Label className="block mb-2 text-sm font-medium">
                Size Chart <Badge variant="outline" className="ml-1">Reference</Badge>
              </Label>
              <Tabs value={sizeView} onValueChange={handleGenderChange} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="men">Men</TabsTrigger>
                  <TabsTrigger value="women">Women</TabsTrigger>
                  <TabsTrigger value="youth">Youth</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Size Charts */}
          <TabsContent value="men" className="mt-2 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Chest (cm)</TableHead>
                  <TableHead>Waist (cm)</TableHead>
                  <TableHead>Hips (cm)</TableHead>
                  <TableHead>Height (cm)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className={size === "XS" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">XS</TableCell>
                  <TableCell>86-91</TableCell>
                  <TableCell>71-76</TableCell>
                  <TableCell>86-91</TableCell>
                  <TableCell>170-175</TableCell>
                </TableRow>
                <TableRow className={size === "S" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">S</TableCell>
                  <TableCell>91-97</TableCell>
                  <TableCell>76-81</TableCell>
                  <TableCell>91-97</TableCell>
                  <TableCell>175-180</TableCell>
                </TableRow>
                <TableRow className={size === "M" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">M</TableCell>
                  <TableCell>97-102</TableCell>
                  <TableCell>81-86</TableCell>
                  <TableCell>97-102</TableCell>
                  <TableCell>180-185</TableCell>
                </TableRow>
                <TableRow className={size === "L" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">L</TableCell>
                  <TableCell>102-107</TableCell>
                  <TableCell>86-91</TableCell>
                  <TableCell>102-107</TableCell>
                  <TableCell>185-190</TableCell>
                </TableRow>
                <TableRow className={size === "XL" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">XL</TableCell>
                  <TableCell>107-112</TableCell>
                  <TableCell>91-97</TableCell>
                  <TableCell>107-112</TableCell>
                  <TableCell>190-195</TableCell>
                </TableRow>
                <TableRow className={size === "XXL" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">XXL</TableCell>
                  <TableCell>112-118</TableCell>
                  <TableCell>97-102</TableCell>
                  <TableCell>112-118</TableCell>
                  <TableCell>195-200</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="women" className="mt-2 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Chest (cm)</TableHead>
                  <TableHead>Waist (cm)</TableHead>
                  <TableHead>Hips (cm)</TableHead>
                  <TableHead>Height (cm)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className={size === "XS" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">XS</TableCell>
                  <TableCell>81-86</TableCell>
                  <TableCell>61-66</TableCell>
                  <TableCell>89-94</TableCell>
                  <TableCell>155-160</TableCell>
                </TableRow>
                <TableRow className={size === "S" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">S</TableCell>
                  <TableCell>86-91</TableCell>
                  <TableCell>66-71</TableCell>
                  <TableCell>94-99</TableCell>
                  <TableCell>160-165</TableCell>
                </TableRow>
                <TableRow className={size === "M" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">M</TableCell>
                  <TableCell>91-97</TableCell>
                  <TableCell>71-76</TableCell>
                  <TableCell>99-104</TableCell>
                  <TableCell>165-170</TableCell>
                </TableRow>
                <TableRow className={size === "L" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">L</TableCell>
                  <TableCell>97-102</TableCell>
                  <TableCell>76-81</TableCell>
                  <TableCell>104-109</TableCell>
                  <TableCell>170-175</TableCell>
                </TableRow>
                <TableRow className={size === "XL" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">XL</TableCell>
                  <TableCell>102-107</TableCell>
                  <TableCell>81-86</TableCell>
                  <TableCell>109-114</TableCell>
                  <TableCell>175-180</TableCell>
                </TableRow>
                <TableRow className={size === "XXL" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">XXL</TableCell>
                  <TableCell>107-112</TableCell>
                  <TableCell>86-91</TableCell>
                  <TableCell>114-119</TableCell>
                  <TableCell>180-185</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="youth" className="mt-2 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Age (years)</TableHead>
                  <TableHead>Height (cm)</TableHead>
                  <TableHead>Chest (cm)</TableHead>
                  <TableHead>Waist (cm)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className={size === "XS" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">XS</TableCell>
                  <TableCell>4-6</TableCell>
                  <TableCell>110-120</TableCell>
                  <TableCell>58-61</TableCell>
                  <TableCell>56-58</TableCell>
                </TableRow>
                <TableRow className={size === "S" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">S</TableCell>
                  <TableCell>6-8</TableCell>
                  <TableCell>120-130</TableCell>
                  <TableCell>61-64</TableCell>
                  <TableCell>58-60</TableCell>
                </TableRow>
                <TableRow className={size === "M" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">M</TableCell>
                  <TableCell>8-10</TableCell>
                  <TableCell>130-140</TableCell>
                  <TableCell>64-67</TableCell>
                  <TableCell>60-63</TableCell>
                </TableRow>
                <TableRow className={size === "L" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">L</TableCell>
                  <TableCell>10-12</TableCell>
                  <TableCell>140-150</TableCell>
                  <TableCell>67-70</TableCell>
                  <TableCell>63-66</TableCell>
                </TableRow>
                <TableRow className={size === "XL" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">XL</TableCell>
                  <TableCell>12-14</TableCell>
                  <TableCell>150-160</TableCell>
                  <TableCell>70-76</TableCell>
                  <TableCell>66-69</TableCell>
                </TableRow>
                <TableRow className={size === "XXL" ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">XXL</TableCell>
                  <TableCell>14-16</TableCell>
                  <TableCell>160-170</TableCell>
                  <TableCell>76-82</TableCell>
                  <TableCell>69-72</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </div>
      </CardContent>
    </Card>
  );
}