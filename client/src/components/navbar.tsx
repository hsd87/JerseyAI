import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Menu, ShoppingCart, User } from 'lucide-react';

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold">ProJersey</span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
                Home
              </Link>
              <Link to="/kit-designer" className="text-sm font-medium transition-colors hover:text-primary">
                Design Kit
              </Link>
              <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                My Designs
              </Link>
              <Link to="/custom-teams" className="text-sm font-medium transition-colors hover:text-primary">
                Team Orders
              </Link>
              <Link to="/partner" className="text-sm font-medium transition-colors hover:text-primary">
                Partner With Us
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      0
                    </span>
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link to="/dashboard">
                      <DropdownMenuItem>Dashboard</DropdownMenuItem>
                    </Link>
                    <Link to="/orders">
                      <DropdownMenuItem>Orders</DropdownMenuItem>
                    </Link>
                    <Link to="/subscription">
                      <DropdownMenuItem>Subscription</DropdownMenuItem>
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin">
                        <DropdownMenuItem>Admin</DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                    >
                      {logoutMutation.isPending ? (
                        'Signing out...'
                      ) : (
                        <div className="flex items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </div>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default">Sign In</Button>
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link to="/">
                  <DropdownMenuItem>Home</DropdownMenuItem>
                </Link>
                <Link to="/kit-designer">
                  <DropdownMenuItem>Design Kit</DropdownMenuItem>
                </Link>
                <Link to="/dashboard">
                  <DropdownMenuItem>My Designs</DropdownMenuItem>
                </Link>
                <Link to="/custom-teams">
                  <DropdownMenuItem>Team Orders</DropdownMenuItem>
                </Link>
                <Link to="/partner">
                  <DropdownMenuItem>Partner With Us</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Container>
    </div>
  );
}