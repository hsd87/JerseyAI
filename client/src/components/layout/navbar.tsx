import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { CrownIcon, Menu, Moon, ShoppingCart, User, UserCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription-store";
import { CartDrawer } from "@/components/cart/cart-drawer";
import voroLogoWhite from "../../assets/voro-logo-clean.png";

// Simple navbar with basic mobile menu
export default function Navbar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logoutMutation } = useAuth();
  const subscription = useSubscription();

  // Add scroll detection for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Simple toggle function
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className={`bg-voro-black sticky top-0 z-50 ${scrolled ? 'shadow-md' : ''} transition-shadow duration-300`}>
      <div className="container-custom mx-auto">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <img src={voroLogoWhite} alt="VORO Logo" className="h-8 md:h-10" />
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-7">
              <Link href="/" className={`nav-item ${location === '/' ? 'text-voro-red' : ''}`}>
                Home
              </Link>
              <Link href="/designer" className={`nav-item ${location === '/designer' ? 'text-voro-red' : ''}`}>
                AI Designer
              </Link>
              <Link href="/how-it-works" className={`nav-item ${location === '/how-it-works' ? 'text-voro-red' : ''}`}>
                How It Works
              </Link>
              <Link href="/partner" className={`nav-item ${location === '/partner' ? 'text-voro-red' : ''}`}>
                Partner With Us
              </Link>
              
              {user ? (
                <>
                  {subscription.isSubscribed ? (
                    <Badge className="bg-voro-red/10 text-voro-red border-voro-red flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>Pro</span>
                    </Badge>
                  ) : (
                    <Link href="/subscribe" className="text-voro-red border border-voro-red/30 bg-voro-red/5 px-3 py-1 rounded-xl text-sm font-medium hover:bg-voro-red/10 transition-colors flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>Upgrade</span>
                    </Link>
                  )}
                  <Link href="/dashboard" className="btn-primary py-1.5 px-4 text-sm">
                    Dashboard
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="bg-voro-grey text-voro-white px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors">
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/auth" className="btn-primary py-1.5 px-4 text-sm">
                  Sign In
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="relative">
              <CartDrawer />
            </div>
            
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-voro-white hover:text-voro-red focus:outline-none transition-colors"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 rounded-md text-voro-white hover:text-voro-red focus:outline-none transition-colors">
              <span className="sr-only">Dark mode</span>
              <Moon className="h-5 w-5" />
            </button>
            
            <div className="relative">
              <CartDrawer />
            </div>
            
            {user && (
              <div className="relative">
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-md text-voro-white hover:text-voro-red focus:outline-none transition-colors relative"
                  aria-label="User account and settings"
                >
                  <span className="sr-only">Logout</span>
                  <UserCircle className="h-5 w-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-voro-red transform translate-x-1 -translate-y-1"></span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Basic Mobile menu dropdown */}
      <div className={`md:hidden bg-voro-black border-t border-voro-grey/20 ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-4 pt-2 pb-3 space-y-1">
          <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/' ? 'text-voro-red' : 'text-voro-white'}`}>
            Home
          </Link>
          <Link href="/designer" className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/designer' ? 'text-voro-red' : 'text-voro-white'}`}>
            AI Designer
          </Link>
          <Link href="/how-it-works" className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/how-it-works' ? 'text-voro-red' : 'text-voro-white'}`}>
            How It Works
          </Link>
          <Link href="/partner" className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/partner' ? 'text-voro-red' : 'text-voro-white'}`}>
            Partner With Us
          </Link>
          
          {user ? (
            <>
              <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-voro-red">
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium bg-voro-grey text-voro-white">
                  Admin Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-voro-white">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-voro-red">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}