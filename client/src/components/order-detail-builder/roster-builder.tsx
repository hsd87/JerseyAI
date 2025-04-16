import { useEffect, useState } from "react";
import { PlusCircle, Trash2, Save, Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOrderStore, TeamMember } from "@/hooks/use-order-store";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { v4 as uuidv4 } from "uuid";

export default function RosterBuilder() {
  const { toast } = useToast();
  const { teamMembers, addTeamMember, updateTeamMember, removeTeamMember, setTeamName, teamName } = useOrderStore();
  const [newRow, setNewRow] = useState<Partial<TeamMember>>({
    name: "",
    number: "",
    size: "M",
    quantity: 1
  });
  
  // Total roster count
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  
  // Calculate total quantity whenever team members change
  useEffect(() => {
    const total = teamMembers.reduce((sum, member) => sum + member.quantity, 0);
    setTotalQuantity(total);
  }, [teamMembers]);
  
  // Handle adding a new member
  const handleAddMember = () => {
    if (!newRow.name || !newRow.number) {
      toast({
        title: "Missing information",
        description: "Name and number are required",
        variant: "destructive"
      });
      return;
    }
    
    addTeamMember({
      id: uuidv4(),
      name: newRow.name || "",
      number: newRow.number || "",
      size: newRow.size || "M",
      quantity: newRow.quantity || 1
    });
    
    // Reset form
    setNewRow({
      name: "",
      number: "",
      size: "M",
      quantity: 1
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Team Order Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Name Input */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="team-name" className="text-sm font-medium">
            Team Name
          </label>
          <Input
            id="team-name"
            placeholder="Enter team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>
        
        {/* Roster Table */}
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Player Name</TableHead>
                <TableHead className="w-[80px]">Number</TableHead>
                <TableHead className="w-[100px]">Size</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* New Member Row */}
              <TableRow>
                <TableCell>
                  <Input
                    placeholder="Enter name"
                    value={newRow.name}
                    onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="#"
                    value={newRow.number}
                    onChange={(e) => setNewRow({ ...newRow, number: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newRow.size || "M"}
                    onValueChange={(value) => setNewRow({ ...newRow, size: value })}
                  >
                    <SelectTrigger className="w-full">
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
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={newRow.quantity || 1}
                    onChange={(e) => setNewRow({ ...newRow, quantity: parseInt(e.target.value) || 1 })}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={handleAddMember}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              
              {/* Existing Members */}
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.number}</TableCell>
                  <TableCell>
                    <Select
                      value={member.size}
                      onValueChange={(value) => updateTeamMember(member.id, { size: value })}
                    >
                      <SelectTrigger className="w-full">
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
                    <Input
                      type="number"
                      min={1}
                      value={member.quantity}
                      onChange={(e) => 
                        updateTeamMember(member.id, { quantity: parseInt(e.target.value) || 1 })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeTeamMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-gray-600">
          Total Items: <span className="font-medium">{totalQuantity}</span>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            <Upload className="h-4 w-4 mr-1" /> 
            Import CSV
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Save className="h-4 w-4 mr-1" /> 
            Save Roster
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}