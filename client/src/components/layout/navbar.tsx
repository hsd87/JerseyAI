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
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <span className="font-sora font-bold text-2xl">Pro<span className="text-[#39FF14]">Jersey</span></span>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/' ? 'bg-gray-100' : 'hover:bg-gray-100'} transition-colors`}>
                Home
              </Link>
              <Link href="/jersey-editor" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/jersey-editor' ? 'bg-gray-100' : 'hover:bg-gray-100'} transition-colors`}>
                Jersey Editor
              </Link>
              <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                Gallery
              </button>
              <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                Pricing
              </button>
              <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                How It Works
              </button>
              
              {user ? (
                <>
                  {subscription.isSubscribed ? (
                    <Badge variant="outline" className="bg-[#39FF14]/10 text-black border-[#39FF14] flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>Pro</span>
                    </Badge>
                  ) : (
                    <Link href="/subscribe" className="text-black border border-[#39FF14] bg-[#39FF14]/10 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-[#39FF14]/20 transition-colors flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>Upgrade</span>
                    </Link>
                  )}
                  <Link href="/dashboard" className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link href="/auth" className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button className="p-1 rounded-full text-gray-700 hover:text-gray-900 focus:outline-none">
                <span className="sr-only">Dark mode</span>
                <i className="fas fa-moon text-xl"></i>
              </button>
              
              {user && (
                <div className="relative ml-3">
                  <button 
                    onClick={handleLogout}
                    className="ml-3 p-1 rounded-full text-gray-700 hover:text-gray-900 focus:outline-none relative"
                  >
                    <span className="sr-only">Logout</span>
                    <i className="fas fa-user-circle text-xl"></i>
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#39FF14] transform translate-x-1 -translate-y-1"></span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              Home
            </Link>
            <Link href="/jersey-editor" className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/jersey-editor' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              Jersey Editor
            </Link>
            <button className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              Gallery
            </button>
            <button className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              Pricing
            </button>
            <button className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              How It Works
            </button>
            
            {user ? (
              <>
                {subscription.isSubscribed && (
                  <div className="px-3 py-2">
                    <Badge variant="outline" className="bg-[#39FF14]/10 text-black border-[#39FF14] flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>Pro</span>
                    </Badge>
                  </div>
                )}
                <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/subscribe" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  {subscription.isSubscribed ? 'Manage Subscription' : 'Upgrade to Pro'}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
