import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { CrownIcon, Menu, Moon, ShoppingCart, User, UserCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription-store";
import { CartDrawer } from "@/components/cart/cart-drawer";
import voroLogoWhite from "../../assets/voro-logo-clean.png";

// Nike-inspired navbar with clean design
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

  // Nike-inspired styling - clean, minimal, and focused
  return (
    <nav className={`bg-[var(--nike-black)] sticky top-0 z-50 ${scrolled ? 'shadow-nike' : ''} transition-all duration-300`}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <img src={voroLogoWhite} alt="VORO Logo" className="h-6 md:h-8" />
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-8 flex items-center space-x-8">
              <Link href="/" className={`nav-item-nike ${location === '/' ? 'nav-item-nike-active' : ''}`}>
                <span className={location === '/' ? 'text-gradient' : 'text-white hover:text-gradient'}>Men</span>
              </Link>
              <Link href="/designer" className={`nav-item-nike ${location === '/designer' ? 'nav-item-nike-active' : ''}`}>
                <span className={location === '/designer' ? 'text-gradient' : 'text-white hover:text-gradient'}>Design</span>
              </Link>
              <Link href="/how-it-works" className={`nav-item-nike ${location === '/how-it-works' ? 'nav-item-nike-active' : ''}`}>
                <span className={location === '/how-it-works' ? 'text-gradient' : 'text-white hover:text-gradient'}>How It Works</span>
              </Link>
              <Link href="/partner" className={`nav-item-nike ${location === '/partner' ? 'nav-item-nike-active' : ''}`}>
                <span className={location === '/partner' ? 'text-gradient' : 'text-white hover:text-gradient'}>Teams</span>
              </Link>
              
              {user ? (
                <>
                  {subscription.isSubscribed ? (
                    <Badge className="bg-white rounded-none px-2 py-0.5 text-xs flex items-center gap-1 h-5">
                      <CrownIcon className="h-3 w-3 text-gradient" />
                      <span className="text-gradient font-bold">PRO</span>
                    </Badge>
                  ) : (
                    <Link href="/subscribe" className="px-3 py-1 text-sm font-medium hover:underline transition-all flex items-center gap-1">
                      <CrownIcon className="h-3 w-3 text-gradient" />
                      <span className="text-gradient">Upgrade</span>
                    </Link>
                  )}
                  <Link href="/dashboard" className="bg-white text-[var(--nike-black)] px-4 py-2 h-9 text-sm font-medium hover:bg-[#E5E5E5] transition-colors flex items-center">
                    <span className="text-gradient">Dashboard</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="bg-[var(--nike-gray-dark)] text-white px-4 py-2 h-9 text-sm font-medium hover:bg-[#656565] transition-colors flex items-center">
                      <span className="text-gradient">Admin</span>
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/auth" className="bg-white text-[var(--nike-black)] px-4 py-2 h-9 text-sm font-medium hover:bg-[#E5E5E5] transition-colors flex items-center">
                  <span className="text-gradient">Join Us</span>
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <div className="relative">
              <CartDrawer />
            </div>
            
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 text-white hover:text-[var(--nike-gray-medium)] focus:outline-none transition-colors"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {isMenuOpen ? (
                <X className="block h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="block h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="relative">
              <CartDrawer />
            </div>
            
            {user ? (
              <div className="relative">
                <button 
                  onClick={handleLogout}
                  className="p-2 text-white hover:text-[var(--nike-gray-medium)] focus:outline-none transition-colors relative"
                  aria-label="User account and settings"
                >
                  <span className="sr-only">Logout</span>
                  <User className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link 
                href="/auth"
                className="p-2 text-white hover:text-[var(--nike-gray-medium)] focus:outline-none transition-colors"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Nike-style mobile menu - clean, minimal */}
      <div 
        className={`md:hidden bg-[var(--nike-black)] border-t border-[rgba(255,255,255,0.1)] ${isMenuOpen ? 'animate-slide-up opacity-100' : 'opacity-0 pointer-events-none'} transition-all duration-300`}
        style={{ height: isMenuOpen ? 'auto' : 0 }}
      >
        <div className="px-6 py-6 space-y-4">
          <Link href="/" className={`block py-2 text-base font-normal ${location === '/' ? 'font-medium' : ''}`}>
            <span className={location === '/' ? 'text-gradient' : 'text-[var(--nike-gray-medium)] hover:text-white'}>Men</span>
          </Link>
          <Link href="/designer" className={`block py-2 text-base font-normal ${location === '/designer' ? 'font-medium' : ''}`}>
            <span className={location === '/designer' ? 'text-gradient' : 'text-[var(--nike-gray-medium)] hover:text-white'}>Design</span>
          </Link>
          <Link href="/how-it-works" className={`block py-2 text-base font-normal ${location === '/how-it-works' ? 'font-medium' : ''}`}>
            <span className={location === '/how-it-works' ? 'text-gradient' : 'text-[var(--nike-gray-medium)] hover:text-white'}>How It Works</span>
          </Link>
          <Link href="/about" className={`block py-2 text-base font-normal ${location === '/about' ? 'font-medium' : ''}`}>
            <span className={location === '/about' ? 'text-gradient' : 'text-[var(--nike-gray-medium)] hover:text-white'}>About Us</span>
          </Link>
          <Link href="/faq" className={`block py-2 text-base font-normal ${location === '/faq' ? 'font-medium' : ''}`}>
            <span className={location === '/faq' ? 'text-gradient' : 'text-[var(--nike-gray-medium)] hover:text-white'}>Help</span>
          </Link>
          <Link href="/partner" className={`block py-2 text-base font-normal ${location === '/partner' ? 'font-medium' : ''}`}>
            <span className={location === '/partner' ? 'text-gradient' : 'text-[var(--nike-gray-medium)] hover:text-white'}>Team Orders</span>
          </Link>
          
          <div className="border-t border-[rgba(255,255,255,0.1)] pt-4 mt-4">
            {user ? (
              <>
                <Link href="/dashboard" className="block py-2 font-medium">
                  <span className="text-gradient">Your Account</span>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="block py-2 font-medium">
                    <span className="text-gradient">Admin Dashboard</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="block w-full text-left py-2 text-[var(--nike-gray-medium)] hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth" className="block py-2 font-medium">
                <span className="text-gradient">Join Us</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}