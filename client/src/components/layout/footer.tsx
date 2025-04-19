import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer bg-gradient text-white mt-8 sm:mt-12">
      <div className="container-custom mx-auto py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center">
              <span className="font-heading font-semibold text-xl"><span className="text-gradient">OKDIO</span></span>
            </Link>
            <p className="mt-4 text-base text-gray-300 leading-relaxed max-w-md">
              Design your dream sports kit with AI-powered precision. From concept to delivery, we make custom sportswear simple, high-quality, and accessible.
            </p>
            <div className="mt-6 flex space-x-5">
              <a href="#" className="text-gray-300 hover:text-gradient transition-colors p-1.5 rounded-md hover:bg-gradient/10">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-gradient transition-colors p-1.5 rounded-md hover:bg-gradient/10">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-gradient transition-colors p-1.5 rounded-md hover:bg-gradient/10">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-voro-red transition-colors p-1.5 rounded-md hover:bg-voro-grey/80">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-sm font-medium text-gray-100 uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-voro-red transition-colors">About</a></li>
              <li><a href="#" className="text-gray-300 hover:text-voro-red transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-300 hover:text-voro-red transition-colors">Contact</a></li>
              <li><Link href="/partner" className="text-gray-300 hover:text-voro-red transition-colors">Partner With Us</Link></li>
              <li><Link href="/products" className="text-gray-300 hover:text-voro-red transition-colors">Shop</Link></li>
              <li><a href="#" className="text-gray-300 hover:text-voro-red transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 sm:mt-16 border-t border-gray-600 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} OKDIO. All rights reserved.
          </p>
          <div className="mt-4 sm:mt-0 flex flex-wrap justify-center gap-6 items-center">
            <a href="#" className="text-sm text-gray-400 hover:text-voro-red transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-400 hover:text-voro-red transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-gray-400 hover:text-voro-red transition-colors">Legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
