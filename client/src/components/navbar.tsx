import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ShirtIcon, LogOut, User, ShoppingCart, PanelLeft, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8 lg:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <ShirtIcon className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ProJersey</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/designer" className="text-sm font-medium transition-colors hover:text-primary">
              Design
            </Link>
            <Link href="/kit-designer" className="text-sm font-medium transition-colors hover:text-primary">
              Kit Designer
            </Link>
            <Link href="/partner" className="text-sm font-medium transition-colors hover:text-primary">
              Partner
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/checkout">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Cart</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <PanelLeft className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            )}
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0">
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="flex w-full items-center py-3 border-b">
                  Home
                </Link>
                <Link href="/designer" className="flex w-full items-center py-3 border-b">
                  Design
                </Link>
                <Link href="/kit-designer" className="flex w-full items-center py-3 border-b">
                  Kit Designer
                </Link>
                <Link href="/partner" className="flex w-full items-center py-3 border-b">
                  Partner
                </Link>
                {user ? (
                  <>
                    <Link href="/dashboard" className="flex w-full items-center py-3 border-b">
                      Dashboard
                    </Link>
                    <Link href="/checkout" className="flex w-full items-center py-3 border-b">
                      Cart
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="flex w-full items-center py-3 border-b">
                        Admin
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center py-3 border-b text-left text-red-500"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <Link href="/auth" className="flex w-full items-center py-3 border-b text-primary">
                    Sign In
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}