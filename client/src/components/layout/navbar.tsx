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
    <nav className={`bg-black sticky top-0 z-50 ${scrolled ? 'shadow-sm' : ''} transition-shadow duration-300`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex justify-between items-center h-[70px]">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <img src={voroLogoWhite} alt="VORO Logo" className="h-8 md:h-10" />
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-6">
              <Link href="/" className={`nav-item ${location === '/' ? 'text-[#E34234]' : 'text-white'}`}>
                HOME
              </Link>
              <Link href="/designer" className={`nav-item ${location === '/designer' ? 'text-[#E34234]' : 'text-white'}`}>
                AI DESIGNER
              </Link>
              <Link href="/how-it-works" className={`nav-item ${location === '/how-it-works' ? 'text-[#E34234]' : 'text-white'}`}>
                HOW IT WORKS
              </Link>
              <Link href="/about" className={`nav-item ${location === '/about' ? 'text-[#E34234]' : 'text-white'}`}>
                ABOUT VORO
              </Link>
              <Link href="/faq" className={`nav-item ${location === '/faq' ? 'text-[#E34234]' : 'text-white'}`}>
                FAQS & HELP
              </Link>
              <Link href="/partner" className={`nav-item ${location === '/partner' ? 'text-[#E34234]' : 'text-white'}`}>
                PARTNER WITH US
              </Link>
              
              {user ? (
                <>
                  {subscription.isSubscribed ? (
                    <Badge className="bg-[#E34234]/10 text-[#E34234] border-[#E34234] rounded-full flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>PRO</span>
                    </Badge>
                  ) : (
                    <Link href="/subscribe" className="text-[#E34234] border border-[#E34234]/30 bg-[#E34234]/5 px-4 py-1.5 rounded-full text-xs font-medium hover:bg-[#E34234]/10 transition-colors flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>UPGRADE</span>
                    </Link>
                  )}
                  <Link href="/dashboard" className="bg-[#E34234] text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-[#E34234]/90 transition-colors">
                    DASHBOARD
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-gray-700 transition-colors">
                      ADMIN
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/auth" className="bg-[#E34234] text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-[#E34234]/90 transition-colors">
                  SIGN IN
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <div className="relative">
              <CartDrawer />
            </div>
            
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-1.5 rounded-full text-white hover:text-[#E34234] focus:outline-none transition-colors"
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
          
          <div className="hidden md:flex items-center space-x-5">
            <button className="p-1.5 rounded-full text-white hover:text-[#E34234] focus:outline-none transition-colors">
              <span className="sr-only">Dark mode</span>
              <Moon className="h-4 w-4" />
            </button>
            
            <div className="relative">
              <CartDrawer />
            </div>
            
            {user && (
              <div className="relative">
                <button 
                  onClick={handleLogout}
                  className="p-1.5 rounded-full text-white hover:text-[#E34234] focus:outline-none transition-colors relative"
                  aria-label="User account and settings"
                >
                  <span className="sr-only">Logout</span>
                  <UserCircle className="h-4 w-4" />
                  <span className="absolute top-0 right-0 block h-1.5 w-1.5 rounded-full bg-[#E34234] transform translate-x-1 -translate-y-1"></span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Basic Mobile menu dropdown */}
      <div className={`md:hidden bg-black border-t border-gray-800 ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-6 pt-3 pb-4 space-y-2">
          <Link href="/" className={`block px-4 py-2 rounded-full text-base font-medium ${location === '/' ? 'text-[#E34234]' : 'text-white'}`}>
            HOME
          </Link>
          <Link href="/designer" className={`block px-4 py-2 rounded-full text-base font-medium ${location === '/designer' ? 'text-[#E34234]' : 'text-white'}`}>
            AI DESIGNER
          </Link>
          <Link href="/how-it-works" className={`block px-4 py-2 rounded-full text-base font-medium ${location === '/how-it-works' ? 'text-[#E34234]' : 'text-white'}`}>
            HOW IT WORKS
          </Link>
          <Link href="/about" className={`block px-4 py-2 rounded-full text-base font-medium ${location === '/about' ? 'text-[#E34234]' : 'text-white'}`}>
            ABOUT VORO
          </Link>
          <Link href="/faq" className={`block px-4 py-2 rounded-full text-base font-medium ${location === '/faq' ? 'text-[#E34234]' : 'text-white'}`}>
            FAQS & HELP
          </Link>
          <Link href="/partner" className={`block px-4 py-2 rounded-full text-base font-medium ${location === '/partner' ? 'text-[#E34234]' : 'text-white'}`}>
            PARTNER WITH US
          </Link>
          
          {user ? (
            <>
              <Link href="/dashboard" className="block px-4 py-2 rounded-full text-base font-semibold text-white bg-[#E34234] mt-4">
                DASHBOARD
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="block px-4 py-2 rounded-full text-base font-semibold bg-gray-800 text-white">
                  ADMIN DASHBOARD
                </Link>
              )}
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 rounded-full text-base font-medium text-white hover:text-[#E34234]">
                SIGN OUT
              </button>
            </>
          ) : (
            <Link href="/auth" className="block px-4 py-2 rounded-full text-base font-semibold text-white bg-[#E34234] mt-4">
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}