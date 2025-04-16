import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, FileText } from "lucide-react";
import { useOrderStore } from "@/hooks/use-order-store";

// Size options for different sports
const SIZE_OPTIONS = {
  soccer: ['Youth S', 'Youth M', 'Youth L', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  basketball: ['Youth S', 'Youth M', 'Youth L', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
  default: ['S', 'M', 'L', 'XL', '2XL']
};

interface TeamMember {
  id: string;
  name: string;
  number: string;
  size: string;
  gender: 'male' | 'female' | 'unisex';
}

export default function RosterBuilder() {
  const { teamMembers, updateTeamMembers } = useOrderStore();
  const [teamName, setTeamName] = useState<string>('');
  const [members, setMembers] = useState<TeamMember[]>(teamMembers || []);
  const [sport, setSport] = useState<string>('soccer');
  
  // Generate a random ID for new members
  const generateId = () => `member-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  // Add a new team member with default values
  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: generateId(),
      name: '',
      number: '',
      size: 'M',
      gender: 'unisex',
    };
    
    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    updateTeamMembers(updatedMembers);
  };
  
  // Update a specific team member's data
  const updateMember = (id: string, field: keyof TeamMember, value: string) => {
    const updatedMembers = members.map(member => {
      if (member.id === id) {
        return { 
          ...member, 
          [field]: field === 'gender' 
            ? (value as 'male' | 'female' | 'unisex') 
            : value 
        };
      }
      return member;
    });
    
    setMembers(updatedMembers);
    updateTeamMembers(updatedMembers);
  };
  
  // Remove a team member from the roster
  const removeMember = (id: string) => {
    const updatedMembers = members.filter(member => member.id !== id);
    setMembers(updatedMembers);
    updateTeamMembers(updatedMembers);
  };
  
  // Get the appropriate size options based on selected sport
  const getSizeOptions = () => {
    return SIZE_OPTIONS[sport as keyof typeof SIZE_OPTIONS] || SIZE_OPTIONS.default;
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="sport-select">Sport</Label>
              <Select 
                value={sport} 
                onValueChange={(value) => setSport(value)}
              >
                <SelectTrigger id="sport-select">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soccer">Soccer</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="volleyball">Volleyball</SelectItem>
                  <SelectItem value="baseball">Baseball</SelectItem>
                  <SelectItem value="hockey">Hockey</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Team Roster</h3>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addTeamMember}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Player
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Create a CSV download of roster
                const header = "Name,Number,Size,Gender\\n";
                const csvContent = members.reduce((acc, member) => {
                  return acc + `${member.name},${member.number},${member.size},${member.gender}\\n`;
                }, header);
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${teamName || 'team'}-roster.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed">
            <p className="text-gray-500">No team members added yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={addTeamMember}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add First Player
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member, index) => (
              <Card key={member.id} className="p-4">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">{index + 1}</span>
                  </div>
                  
                  <div className="col-span-3">
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="Player name"
                      value={member.name}
                      onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Number</Label>
                    <Input
                      placeholder="#"
                      value={member.number}
                      onChange={(e) => updateMember(member.id, 'number', e.target.value)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Size</Label>
                    <Select
                      value={member.size}
                      onValueChange={(value) => updateMember(member.id, 'size', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSizeOptions().map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-3">
                    <Label className="text-xs">Gender</Label>
                    <Select
                      value={member.gender}
                      onValueChange={(value) => updateMember(member.id, 'gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Men's</SelectItem>
                        <SelectItem value="female">Women's</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}