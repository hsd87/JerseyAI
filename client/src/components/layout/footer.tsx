import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-8 sm:mt-12">
      <div className="max-w-7xl mx-auto py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center">
              <span className="font-sora font-semibold text-xl">Pro<span className="text-primary">Jersey</span></span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-md">
              Design your dream sports kit with AI-powered precision. From concept to delivery, we make custom sportswear simple, high-quality, and accessible.
            </p>
            <div className="mt-6 flex space-x-5">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-gray-100">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-gray-100">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-gray-100">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-gray-100">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider">Products</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Soccer Kits</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Basketball Uniforms</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Cricket Kits</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Rugby Jerseys</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Esports Jerseys</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Contact</a></li>
              <li><Link href="/pricing" className="text-sm text-gray-500 hover:text-primary transition-colors">Pricing Calculator</Link></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 sm:mt-16 border-t border-gray-200 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ProJersey. All rights reserved.
          </p>
          <div className="mt-4 sm:mt-0 flex flex-wrap justify-center gap-4 items-center">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
