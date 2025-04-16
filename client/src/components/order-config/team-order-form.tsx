import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, Size, Gender } from '@shared/products';
import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  number: string;
  size: Size;
  gender: Gender;
}

interface TeamOrderFormProps {
  products: Product[];
  baseSize: Size;
  baseGender: Gender;
}

export default function TeamOrderForm({ products, baseSize, baseGender }: TeamOrderFormProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: '', number: '', size: baseSize, gender: baseGender }
  ]);
  
  const addTeamMember = () => {
    const newId = `member-${Date.now()}`;
    setTeamMembers([
      ...teamMembers,
      { id: newId, name: '', number: '', size: baseSize, gender: baseGender }
    ]);
  };
  
  const removeTeamMember = (id: string) => {
    if (teamMembers.length <= 1) return;
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };
  
  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers(
      teamMembers.map(member => 
        member.id === id 
          ? { ...member, [field]: value } 
          : member
      )
    );
  };
  
  const handleBulkSizeChange = (size: Size) => {
    setTeamMembers(members => 
      members.map(member => ({ ...member, size }))
    );
  };
  
  const handleBulkGenderChange = (gender: Gender) => {
    setTeamMembers(members => 
      members.map(member => ({ ...member, gender }))
    );
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Team Roster</h3>
        <p className="text-gray-600 mb-6">
          Add details for each team member's custom jersey
        </p>
        
        <Card className="p-4 mb-4 bg-gray-50">
          <h4 className="font-medium mb-3">Bulk Update</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bulk-size">Size for All</Label>
              <Select onValueChange={(value) => handleBulkSizeChange(value as Size)}>
                <SelectTrigger id="bulk-size">
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
            
            <div>
              <Label htmlFor="bulk-gender">Gender for All</Label>
              <Select onValueChange={(value) => handleBulkGenderChange(value as Gender)}>
                <SelectTrigger id="bulk-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Men's</SelectItem>
                  <SelectItem value="female">Women's</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Input
                    value={member.name}
                    onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                    placeholder="Player name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={member.number}
                    onChange={(e) => updateTeamMember(member.id, 'number', e.target.value)}
                    placeholder="#"
                    maxLength={3}
                    className="w-16"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={member.size} 
                    onValueChange={(value) => updateTeamMember(member.id, 'size', value as Size)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Size" />
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
                </TableCell>
                <TableCell>
                  <Select 
                    value={member.gender} 
                    onValueChange={(value) => updateTeamMember(member.id, 'gender', value as Gender)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Men's</SelectItem>
                      <SelectItem value="female">Women's</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTeamMember(member.id)}
                    disabled={teamMembers.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={addTeamMember}
          className="flex items-center"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Team Order Summary</h4>
        <p className="text-sm text-gray-600">
          Adding {teamMembers.length} player {teamMembers.length === 1 ? 'jersey' : 'jerseys'} to your order.
        </p>
      </div>
    </div>
  );
}