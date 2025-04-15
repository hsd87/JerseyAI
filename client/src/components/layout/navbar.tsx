import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { CrownIcon, Menu, Moon, User, UserCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription-store";

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
    <nav className={`bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 ${scrolled ? 'shadow-sm' : ''} transition-shadow duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <span className="font-sora font-semibold text-xl">Pro<span className="text-primary">Jersey</span></span>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-7">
              <Link href="/" className={`text-sm font-medium ${location === '/' ? 'text-primary' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Home
              </Link>
              <Link href="/designer" className={`text-sm font-medium ${location === '/designer' ? 'text-primary' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                AI Designer
              </Link>
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Gallery
              </button>
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </button>
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                How It Works
              </button>
              <Link href="/partner" className={`text-sm font-medium ${location === '/partner' ? 'text-primary' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Partner With Us
              </Link>
              
              {user ? (
                <>
                  {subscription.isSubscribed ? (
                    <Badge className="bg-primary/10 text-primary border-primary flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>Pro</span>
                    </Badge>
                  ) : (
                    <Link href="/subscribe" className="text-primary border border-primary/30 bg-primary/5 px-3 py-1 rounded-full text-sm font-medium hover:bg-primary/10 transition-colors flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>Upgrade</span>
                    </Link>
                  )}
                  <Link href="/dashboard" className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                    Dashboard
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors">
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/auth" className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
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
            <button className="p-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors">
              <span className="sr-only">Dark mode</span>
              <Moon className="h-5 w-5" />
            </button>
            
            {user && (
              <div className="relative">
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors relative"
                  aria-label="User account and settings"
                >
                  <span className="sr-only">Logout</span>
                  <UserCircle className="h-5 w-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary transform translate-x-1 -translate-y-1"></span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Basic Mobile menu dropdown */}
      <div className={`md:hidden bg-white border-t border-gray-200 ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/' ? 'text-primary' : 'text-gray-700'}`}>
            Home
          </Link>
          <Link href="/designer" className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/designer' ? 'text-primary' : 'text-gray-700'}`}>
            AI Designer
          </Link>
          <Link href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700">
            Gallery
          </Link>
          <Link href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700">
            Pricing
          </Link>
          <Link href="/partner" className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/partner' ? 'text-primary' : 'text-gray-700'}`}>
            Partner With Us
          </Link>
          
          {user ? (
            <>
              <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-primary">
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium bg-gray-800 text-white">
                  Admin Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}