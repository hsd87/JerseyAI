import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
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
              <Link href="/">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/' ? 'bg-gray-100' : 'hover:bg-gray-100'} transition-colors`}>
                  Home
                </a>
              </Link>
              <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                Gallery
              </a>
              <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                Pricing
              </a>
              <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                How It Works
              </a>
              
              {user ? (
                <Link href="/dashboard">
                  <a className={`bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors`}>
                    Dashboard
                  </a>
                </Link>
              ) : (
                <Link href="/auth">
                  <a className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                    Sign In
                  </a>
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
            <Link href="/">
              <a className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
                Home
              </a>
            </Link>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              Gallery
            </a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              Pricing
            </a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              How It Works
            </a>
            
            {user ? (
              <>
                <Link href="/dashboard">
                  <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                    Dashboard
                  </a>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  Sign In
                </a>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
