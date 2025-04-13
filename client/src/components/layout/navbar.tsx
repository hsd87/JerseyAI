import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { CrownIcon } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const subscription = useSubscription();
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
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
                  <Link href="/dashboard" className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link href="/auth" className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button className="p-1 text-gray-700 hover:text-gray-900 focus:outline-none">
                <span className="sr-only">Dark mode</span>
                <i className="fas fa-moon text-lg"></i>
              </button>
              
              {user && (
                <div className="relative ml-3">
                  <button 
                    onClick={handleLogout}
                    className="ml-3 p-1 text-gray-700 hover:text-gray-900 focus:outline-none relative"
                  >
                    <span className="sr-only">Logout</span>
                    <i className="fas fa-user-circle text-lg"></i>
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary transform translate-x-1 -translate-y-1"></span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-200">
          <div className="px-5 pt-3 pb-4 space-y-3">
            <Link href="/" className={`block py-2 text-base font-medium ${location === '/' ? 'text-primary' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              Home
            </Link>
            <Link href="/designer" className={`block py-2 text-base font-medium ${location === '/designer' ? 'text-primary' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              AI Designer
            </Link>
            <button className="block w-full text-left py-2 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Gallery
            </button>
            <button className="block w-full text-left py-2 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </button>
            <button className="block w-full text-left py-2 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </button>
            
            <div className="h-px bg-gray-200 my-2"></div>
            
            {user ? (
              <>
                {subscription.isSubscribed && (
                  <div className="py-2">
                    <Badge className="bg-primary/10 text-primary border-primary flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>Pro</span>
                    </Badge>
                  </div>
                )}
                <Link href="/dashboard" className="block py-2 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <Link href="/subscribe" className="block py-2 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  {subscription.isSubscribed ? 'Manage Subscription' : 'Upgrade to Pro'}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2">
                <Link href="/auth" className="block w-full bg-primary text-white py-2 px-4 rounded-full text-center text-base font-medium hover:bg-primary/90 transition-colors">
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
