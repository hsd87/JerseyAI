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
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-sora font-semibold text-xl">
              Pro<span className="text-primary">Jersey</span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <Link href="/" className={`px-3 py-2 text-sm font-medium ${location === '/' ? 'text-primary' : 'text-gray-600'}`}>
              Home
            </Link>
            <Link href="/designer" className={`px-3 py-2 text-sm font-medium ${location === '/designer' ? 'text-primary' : 'text-gray-600'}`}>
              AI Designer
            </Link>
            <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-600">
              Gallery
            </Link>
            <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-600">
              Pricing
            </Link>
            
            {user ? (
              <>
                {subscription.isSubscribed ? (
                  <Badge className="bg-primary/10 text-primary border-primary flex items-center gap-1">
                    <CrownIcon className="h-3 w-3" />
                    <span>Pro</span>
                  </Badge>
                ) : (
                  <Link href="/subscribe" className="px-3 py-2 text-sm font-medium text-primary">
                    Upgrade
                  </Link>
                )}
                <Link href="/dashboard" className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium text-gray-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth" className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/" className={`block px-3 py-2 text-base font-medium ${location === '/' ? 'text-primary' : 'text-gray-600'}`}>
              Home
            </Link>
            <Link href="/designer" className={`block px-3 py-2 text-base font-medium ${location === '/designer' ? 'text-primary' : 'text-gray-600'}`}>
              AI Designer
            </Link>
            <Link href="/" className="block px-3 py-2 text-base font-medium text-gray-600">
              Gallery
            </Link>
            <Link href="/" className="block px-3 py-2 text-base font-medium text-gray-600">
              Pricing
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="flex flex-col space-y-2 px-4">
                {subscription.isSubscribed && (
                  <Badge className="w-fit bg-primary/10 text-primary border-primary flex items-center gap-1 px-2 py-1">
                    <CrownIcon className="h-4 w-4" />
                    <span className="text-sm">Pro</span>
                  </Badge>
                )}
                <Link href="/dashboard" className="block px-3 py-2 text-base font-medium text-gray-600">
                  Dashboard
                </Link>
                <Link href="/subscribe" className="block px-3 py-2 text-base font-medium text-gray-600">
                  {subscription.isSubscribed ? 'Manage Subscription' : 'Upgrade to Pro'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block px-3 py-2 text-base font-medium text-gray-600 text-left"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="px-4">
                <Link href="/auth" className="block w-full bg-primary text-white px-4 py-2 rounded-full text-center text-base font-medium">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}