import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center">
              <span className="font-sora font-bold text-2xl">Pro<span className="text-[#39FF14]">Jersey</span></span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 max-w-md">
              Design your dream sports kit with AI-powered precision. From concept to delivery, we make custom sportswear simple, high-quality, and accessible.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <i className="fab fa-youtube text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-800 tracking-wider uppercase">Products</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">Soccer Kits</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">Basketball Uniforms</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">Cricket Kits</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">Rugby Jerseys</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">Esports Jerseys</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-800 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">About</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">Careers</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">Contact</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">Pricing</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-800">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} ProJersey. All rights reserved.
          </p>
          <p className="mt-4 md:mt-0 text-sm text-gray-500">
            Powered by AI design technology.
          </p>
        </div>
      </div>
    </footer>
  );
}
