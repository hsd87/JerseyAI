import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrderStore } from "@/hooks/use-order-store";
import { TeamMember } from "@/hooks/use-order-types";
import { v4 as uuidv4 } from "uuid";
import { PlusCircle, Trash2, Edit, Save, X } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function RosterBuilder() {
  const { teamName, setTeamName, teamMembers, addTeamMember, updateTeamMember, removeTeamMember } = useOrderStore();
  
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newSize, setNewSize] = useState("M");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<TeamMember>>({});
  
  // Add a new team member
  const handleAddMember = () => {
    if (!newName || !newNumber) return;
    
    addTeamMember({
      id: uuidv4(),
      name: newName,
      number: newNumber,
      size: newSize,
      quantity: 1
    });
    
    // Reset form
    setNewName("");
    setNewNumber("");
    setNewSize("M");
  };
  
  // Start editing a team member
  const handleEdit = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setEditValues({
      name: member.name,
      number: member.number,
      size: member.size,
      quantity: member.quantity
    });
  };
  
  // Save edits
  const handleSaveEdit = (id: string) => {
    updateTeamMember(id, editValues);
    setEditingMemberId(null);
    setEditValues({});
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditValues({});
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
              className="mt-1"
            />
          </div>
          
          <div className="border-t pt-4 mt-6">
            <h3 className="font-medium mb-3">Team Members</h3>
            
            {teamMembers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      {editingMemberId === member.id ? (
                        // Editing row
                        <>
                          <TableCell>
                            <Input 
                              value={editValues.name || ""}
                              onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={editValues.number || ""}
                              onChange={(e) => setEditValues({...editValues, number: e.target.value})}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={editValues.size || member.size}
                              onValueChange={(val) => setEditValues({...editValues, size: val})}
                            >
                              <SelectTrigger className="w-[80px]">
                                <SelectValue placeholder="Size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="XS">XS</SelectItem>
                                  <SelectItem value="S">S</SelectItem>
                                  <SelectItem value="M">M</SelectItem>
                                  <SelectItem value="L">L</SelectItem>
                                  <SelectItem value="XL">XL</SelectItem>
                                  <SelectItem value="XXL">XXL</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              min="1"
                              value={editValues.quantity || 1}
                              onChange={(e) => setEditValues({
                                ...editValues, 
                                quantity: parseInt(e.target.value) || 1
                              })}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleSaveEdit(member.id)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        // Display row
                        <>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.number}</TableCell>
                          <TableCell>{member.size}</TableCell>
                          <TableCell>{member.quantity}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeTeamMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 border rounded-md text-gray-500">
                No team members added yet
              </div>
            )}
            
            {/* Add new member form */}
            <div className="grid grid-cols-12 gap-2 mt-4">
              <div className="col-span-4">
                <Input 
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Input 
                  placeholder="Number"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <Select value={newSize} onValueChange={setNewSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Button 
                  className="w-full"
                  onClick={handleAddMember}
                  disabled={!newName || !newNumber}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}