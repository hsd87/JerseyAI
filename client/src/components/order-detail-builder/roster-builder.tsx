import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrderStore } from "@/hooks/use-order-store";
import { PlusCircle, Trash2, FileDown, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type TeamMember = {
  id: string;
  name: string;
  number: string;
  size: string;
  gender: string;
};

export default function RosterBuilder() {
  const { setTeamOrder, teamMembers, setTeamMembers } = useOrderStore();
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    number: '',
    size: 'M',
    gender: 'men',
  });
  
  // Add a new team member
  const addTeamMember = () => {
    if (!newMember.name || !newMember.number) {
      toast({
        title: "Missing information",
        description: "Name and number are required",
        variant: "destructive",
      });
      return;
    }
    
    // Create new member with unique ID
    const member: TeamMember = {
      id: Date.now().toString(),
      name: newMember.name || '',
      number: newMember.number || '',
      size: newMember.size || 'M',
      gender: newMember.gender || 'men',
    };
    
    // Add to the team
    setTeamMembers([...teamMembers, member]);
    
    // Activate team order mode
    if (teamMembers.length === 0) {
      setTeamOrder(true);
    }
    
    // Reset form
    setNewMember({
      name: '',
      number: '',
      size: 'M',
      gender: 'men',
    });
  };
  
  // Remove a team member
  const removeTeamMember = (id: string) => {
    const updatedMembers = teamMembers.filter(member => member.id !== id);
    setTeamMembers(updatedMembers);
    
    // If we removed all members, deactivate team order mode
    if (updatedMembers.length === 0) {
      setTeamOrder(false);
    }
  };
  
  // Handle CSV upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const rows = csvText.split('\n');
        
        // Skip header row if it exists
        const startRow = rows[0].includes('name') || rows[0].includes('Name') ? 1 : 0;
        
        const newMembers: TeamMember[] = [];
        
        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;
          
          const columns = row.split(',');
          if (columns.length < 2) continue;
          
          // Extract data (expecting Name, Number, Size, Gender)
          const name = columns[0].trim();
          const number = columns[1].trim();
          const size = columns[2]?.trim() || 'M';
          const gender = columns[3]?.trim()?.toLowerCase() || 'men';
          
          if (name && number) {
            newMembers.push({
              id: `${Date.now()}-${i}`,
              name,
              number,
              size,
              gender: gender === 'women' || gender === 'female' ? 'women' :
                     gender === 'youth' || gender === 'child' || gender === 'kid' ? 'youth' : 'men',
            });
          }
        }
        
        if (newMembers.length > 0) {
          // Add to existing members
          setTeamMembers([...teamMembers, ...newMembers]);
          setTeamOrder(true);
          
          toast({
            title: "Roster imported",
            description: `Successfully imported ${newMembers.length} team members`,
          });
        } else {
          toast({
            title: "Import failed",
            description: "No valid team members found in the file",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast({
          title: "Import failed",
          description: "There was an error processing your file",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input so the same file can be uploaded again
    event.target.value = '';
  };
  
  // Generate CSV template
  const downloadTemplate = () => {
    const template = "Name,Number,Size,Gender\nJohn Smith,10,M,men\nSarah Johnson,7,S,women\nMike Davis,23,L,men\nAlex Kim,14,Youth M,youth";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_roster_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Team Roster</span>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadTemplate}
              title="Download template CSV"
            >
              <FileDown className="h-4 w-4 mr-1" />
              Template
            </Button>
            
            <div className="relative">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                title="Upload roster CSV"
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Player Form */}
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4">
            <Label htmlFor="name-input">Player Name</Label>
            <Input 
              id="name-input"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="e.g. John Smith"
            />
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="number-input">#</Label>
            <Input 
              id="number-input"
              value={newMember.number}
              onChange={(e) => setNewMember({ ...newMember, number: e.target.value })}
              placeholder="e.g. 10"
            />
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="size-select">Size</Label>
            <Select 
              value={newMember.size} 
              onValueChange={(value) => setNewMember({ ...newMember, size: value })}
            >
              <SelectTrigger id="size-select">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">S</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="XL">XL</SelectItem>
                <SelectItem value="2XL">2XL</SelectItem>
                <SelectItem value="Youth S">Youth S</SelectItem>
                <SelectItem value="Youth M">Youth M</SelectItem>
                <SelectItem value="Youth L">Youth L</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-3">
            <Label htmlFor="gender-select">Category</Label>
            <Select 
              value={newMember.gender} 
              onValueChange={(value) => setNewMember({ ...newMember, gender: value })}
            >
              <SelectTrigger id="gender-select">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="men">Men's</SelectItem>
                <SelectItem value="women">Women's</SelectItem>
                <SelectItem value="youth">Youth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <Button 
              onClick={addTeamMember} 
              className="w-full"
              variant="default"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Team Members Table */}
        {teamMembers.length > 0 ? (
          <div className="border rounded-md">
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-16 text-center">#</TableHead>
                    <TableHead className="w-24">Size</TableHead>
                    <TableHead className="w-32">Category</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell className="text-center">{member.number}</TableCell>
                      <TableCell>{member.size}</TableCell>
                      <TableCell>
                        {member.gender === 'men' ? 'Men\'s' : 
                         member.gender === 'women' ? 'Women\'s' : 'Youth'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeTeamMember(member.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        ) : (
          <div className="border rounded-md p-6 text-center text-muted-foreground">
            <p>No team members added yet.</p>
            <p className="text-sm mt-1">Add players individually or import a roster CSV file.</p>
          </div>
        )}
        
        {/* Team Order Summary */}
        {teamMembers.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm">
              <strong>Total Players:</strong> {teamMembers.length}
              {teamMembers.length >= 10 && (
                <span className="text-green-600 ml-2">
                  Team discount eligible! ({teamMembers.length >= 20 ? '10%' : '5%'} off)
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}