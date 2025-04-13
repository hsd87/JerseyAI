import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { CrownIcon, Menu, Moon, User, UserCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription-store";

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
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black bg-opacity-25" onClick={toggleMenu}></div>
          <div className="fixed inset-y-0 right-0 z-50 w-3/4 bg-white overflow-y-auto pb-12 shadow-xl">
            <div className="px-5 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="font-sora font-semibold text-lg">Menu</div>
                <button
                  onClick={toggleMenu}
                  className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="space-y-4 mt-6">
                <Link href="/" className={`block py-3 text-base font-medium ${location === '/' ? 'text-primary' : 'text-gray-600'} transition-colors`}>
                  Home
                </Link>
                <Link href="/designer" className={`block py-3 text-base font-medium ${location === '/designer' ? 'text-primary' : 'text-gray-600'} transition-colors`}>
                  AI Designer
                </Link>
                <button className="block w-full text-left py-3 text-base font-medium text-gray-600 transition-colors">
                  Gallery
                </button>
                <button className="block w-full text-left py-3 text-base font-medium text-gray-600 transition-colors">
                  Pricing
                </button>
                <button className="block w-full text-left py-3 text-base font-medium text-gray-600 transition-colors">
                  How It Works
                </button>
                
                <div className="h-px bg-gray-200 my-4"></div>
                
                {user ? (
                  <>
                    {subscription.isSubscribed && (
                      <div className="py-2">
                        <Badge className="bg-primary/10 text-primary border-primary flex items-center gap-1 px-3 py-1">
                          <CrownIcon className="h-4 w-4" />
                          <span className="text-sm">Pro Member</span>
                        </Badge>
                      </div>
                    )}
                    <Link href="/dashboard" className="flex items-center py-3 text-base font-medium text-gray-600">
                      <User className="h-5 w-5 mr-2" />
                      Dashboard
                    </Link>
                    <Link href="/subscribe" className="flex items-center py-3 text-base font-medium text-gray-600">
                      <CrownIcon className="h-5 w-5 mr-2" />
                      {subscription.isSubscribed ? 'Manage Subscription' : 'Upgrade to Pro'}
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full text-left py-3 text-base font-medium text-gray-600"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="pt-2">
                    <Link 
                      href="/auth" 
                      className="block w-full bg-primary text-white py-3 px-4 rounded-full text-center text-base font-medium hover:bg-primary/90 transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}