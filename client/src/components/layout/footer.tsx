import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center">
              <span className="font-sora font-semibold text-xl">Pro<span className="text-primary">Jersey</span></span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-md">
              Design your dream sports kit with AI-powered precision. From concept to delivery, we make custom sportswear simple, high-quality, and accessible.
            </p>
            <div className="mt-8 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="fab fa-facebook text-lg"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="fab fa-twitter text-lg"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="fab fa-instagram text-lg"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="fab fa-youtube text-lg"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-medium text-gray-900">Products</h3>
            <ul className="mt-6 space-y-4">
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Soccer Kits</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Basketball Uniforms</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Cricket Kits</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Rugby Jerseys</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Esports Jerseys</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xs font-medium text-gray-900">Company</h3>
            <ul className="mt-6 space-y-4">
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ProJersey. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-4 items-center">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-500 transition-colors">Privacy Policy</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-500 transition-colors">Terms of Service</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-500 transition-colors">Legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
