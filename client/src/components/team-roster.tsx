import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrderStore, TeamMember } from '@/hooks/use-order-store';
import { PlusCircle, Trash2, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeamRoster() {
  const { 
    isTeamOrder,
    teamName, 
    setTeamName,
    teamMembers,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    gender,
    size,
  } = useOrderStore();
  
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [playerSize, setPlayerSize] = useState(size);
  const [playerQuantity, setPlayerQuantity] = useState(1);
  
  const handleAddPlayer = () => {
    if (!playerName || !playerNumber) return;
    
    // Add new team member
    addTeamMember({
      id: uuidv4(),
      name: playerName,
      number: playerNumber,
      size: playerSize,
      quantity: playerQuantity,
    });
    
    // Reset form
    setPlayerName('');
    setPlayerNumber('');
    setPlayerSize(size);
    setPlayerQuantity(1);
  };
  
  // Only show if team order is selected
  if (!isTeamOrder) {
    return null;
  }
  
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      const lines = csvData.split('\n');
      
      // Skip header row if present
      const startIndex = lines[0].includes('Name,Number,Size') ? 1 : 0;
      
      // Process each line
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [name, number, size = 'M', quantity = '1'] = line.split(',');
        
        if (name && number) {
          addTeamMember({
            id: uuidv4(),
            name: name.trim(),
            number: number.trim(),
            size: size.trim() as any || 'M',
            quantity: parseInt(quantity.trim()) || 1,
          });
        }
      }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset the input
  };
  
  const downloadCSVTemplate = () => {
    const header = 'Name,Number,Size,Quantity\n';
    const sampleData = 'Player 1,10,M,1\nPlayer 2,11,L,1\n';
    const csvContent = header + sampleData;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'team_roster_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Team Roster</CardTitle>
        <CardDescription>
          Add your team members and their jersey details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Team Name */}
          <div className="grid gap-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>
          
          {/* CSV Upload/Download */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between">
            <div>
              <h3 className="text-sm font-medium mb-1">Bulk Upload</h3>
              <div className="flex gap-2">
                <div>
                  <input 
                    type="file" 
                    accept=".csv" 
                    id="csv-upload"
                    className="sr-only"
                    onChange={handleCSVUpload}
                  />
                  <label 
                    htmlFor="csv-upload"
                    className="inline-flex items-center px-3 py-1.5 text-sm border rounded cursor-pointer hover:bg-gray-50"
                  >
                    Upload CSV
                  </label>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadCSVTemplate}
                  className="text-xs h-8"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Template
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-1 sm:mt-0">
              CSV format: Name, Number, Size, Quantity
            </div>
          </div>
          
          {/* Player Add Form */}
          <div className="grid gap-4 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <Label htmlFor="player-name">Player Name</Label>
              <Input
                id="player-name"
                placeholder="Enter name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="player-number">Number</Label>
              <Input
                id="player-number"
                placeholder="#"
                value={playerNumber}
                onChange={(e) => setPlayerNumber(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="player-size">Size</Label>
              <Select
                value={playerSize}
                onValueChange={(value) => setPlayerSize(value as any)}
              >
                <SelectTrigger id="player-size">
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
              <Label htmlFor="player-quantity">Qty</Label>
              <Input
                id="player-quantity"
                type="number"
                min="1"
                value={playerQuantity}
                onChange={(e) => setPlayerQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAddPlayer}
            disabled={!playerName || !playerNumber}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Player
          </Button>
          
          {/* Team Roster Table */}
          {teamMembers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">
                Team Roster ({teamMembers.length} {teamMembers.length === 1 ? 'player' : 'players'})
              </h3>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <Input
                            value={player.name}
                            onChange={(e) => updateTeamMember(player.id, { name: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={player.number}
                            onChange={(e) => updateTeamMember(player.id, { number: e.target.value })}
                            className="h-8 w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={player.size}
                            onValueChange={(value) => updateTeamMember(player.id, { size: value as any })}
                          >
                            <SelectTrigger className="h-8 w-16">
                              <SelectValue />
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
                            min="1"
                            value={player.quantity}
                            onChange={(e) => updateTeamMember(player.id, { quantity: parseInt(e.target.value) || 1 })}
                            className="h-8 w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTeamMember(player.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}