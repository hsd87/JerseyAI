import React from 'react';
import { Link } from 'wouter';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { InfoPill } from '@/components/ui/info-pill';
import { 
  ArrowRight,
  Shirt,
  Palette,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';

const HowItWorksPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 bg-white">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4 text-voro-black">
              How It Works
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              From concept to jersey in minutes — powered by AI.
            </p>
          </div>
        </section>

        {/* Process Steps Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="rounded-xl p-8 bg-white shadow-md hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-voro-red/10 rounded-full flex items-center justify-center mb-6">
                  <Shirt className="h-6 w-6 text-voro-red" />
                </div>
                <div className="font-heading text-sm text-voro-red font-medium mb-2">Step 1</div>
                <h3 className="text-xl font-heading font-bold mb-3">Select Your Sport</h3>
                <p className="text-gray-600">
                  Pick your sport and base kit style to begin your design journey.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl p-8 bg-white shadow-md hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-voro-red/10 rounded-full flex items-center justify-center mb-6">
                  <Palette className="h-6 w-6 text-voro-red" />
                </div>
                <div className="font-heading text-sm text-voro-red font-medium mb-2">Step 2</div>
                <h3 className="text-xl font-heading font-bold mb-3">Customize with AI</h3>
                <p className="text-gray-600">
                  Choose your colors, patterns, sleeve and collar — then let our AI create unique visuals instantly.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl p-8 bg-white shadow-md hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-voro-red/10 rounded-full flex items-center justify-center mb-6">
                  <ShoppingBag className="h-6 w-6 text-voro-red" />
                </div>
                <div className="font-heading text-sm text-voro-red font-medium mb-2">Step 3</div>
                <h3 className="text-xl font-heading font-bold mb-3">Add Matching Gear</h3>
                <p className="text-gray-600">
                  Add shorts, socks, or accessories in one click — everything auto-matched to your design.
                </p>
              </div>

              {/* Step 4 */}
              <div className="rounded-xl p-8 bg-white shadow-md hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-voro-red/10 rounded-full flex items-center justify-center mb-6">
                  <PackageCheck className="h-6 w-6 text-voro-red" />
                </div>
                <div className="font-heading text-sm text-voro-red font-medium mb-2">Step 4</div>
                <h3 className="text-xl font-heading font-bold mb-3">Confirm & Order</h3>
                <p className="text-gray-600">
                  Review your kit, set quantity, and download your design summary or place your order.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Flow Illustration */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-12">
                The VORO Design Experience
              </h2>
              
              <div className="relative">
                {/* Desktop Process Flow Line */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                
                {/* Process Steps */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-white border-2 border-voro-red text-voro-red rounded-full flex items-center justify-center mb-4 font-heading font-bold text-xl">
                      1
                    </div>
                    <h3 className="font-heading font-medium mb-2">Choose Sport</h3>
                    <p className="text-sm text-gray-600">Soccer, basketball, football, and more</p>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-white border-2 border-voro-red text-voro-red rounded-full flex items-center justify-center mb-4 font-heading font-bold text-xl">
                      2
                    </div>
                    <h3 className="font-heading font-medium mb-2">Set Design Preferences</h3>
                    <p className="text-sm text-gray-600">Colors, patterns, and style options</p>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-white border-2 border-voro-red text-voro-red rounded-full flex items-center justify-center mb-4 font-heading font-bold text-xl">
                      3
                    </div>
                    <h3 className="font-heading font-medium mb-2">AI Generation</h3>
                    <p className="text-sm text-gray-600">Instant custom design mockups</p>
                  </div>
                  
                  {/* Step 4 */}
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-white border-2 border-voro-red text-voro-red rounded-full flex items-center justify-center mb-4 font-heading font-bold text-xl">
                      4
                    </div>
                    <h3 className="font-heading font-medium mb-2">Complete Order</h3>
                    <p className="text-sm text-gray-600">Review, customize, and checkout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How the AI Works Section with InfoPill */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-8">
              How the AI Works
            </h2>
            
            <div className="max-w-4xl mx-auto">
              <InfoPill 
                title="The VORO AI Design Process" 
                icon={<Sparkles className="text-voro-red" />}
              >
                <ol className="list-decimal pl-5 space-y-3">
                  <li><strong>Input Collection:</strong> You provide your preferences for sport type, colors, style elements, and optional custom text.</li>
                  <li><strong>AI Processing:</strong> Our advanced neural networks analyze thousands of professional designs to understand sport-specific styling.</li>
                  <li><strong>Design Generation:</strong> The AI creates multiple custom jersey designs based on your inputs, each with front and back views.</li>
                  <li><strong>Refinement:</strong> You can adjust specific elements or regenerate entirely new designs until you're satisfied.</li>
                  <li><strong>Production:</strong> Once approved, your design is prepared for high-quality manufacturing with premium materials.</li>
                </ol>
              </InfoPill>
              
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoPill 
                  title="Design Technology" 
                  icon={<Info className="text-blue-500" />}
                  className="h-full"
                >
                  <p className="mb-3">VORO uses a proprietary AI model specifically trained on professional sportswear design principles.</p>
                  <p>Our technology understands the unique requirements of each sport, ensuring designs are not just beautiful but also practical for actual gameplay.</p>
                </InfoPill>
                
                <InfoPill 
                  title="Quality Assurance" 
                  icon={<ShieldCheck className="text-green-500" />}
                  className="h-full"
                >
                  <p className="mb-3">Every generated design is analyzed to ensure it meets our quality standards before being presented.</p>
                  <p>Our AI performs multiple validation checks to ensure designs are appropriate, properly balanced, and technically feasible to manufacture.</p>
                </InfoPill>
              </div>
            </div>
          </div>
        </section>
        
        {/* Key Benefits Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-12">
              Why Choose VORO AI Design
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <div className="mx-auto bg-voro-red/10 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-voro-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">Minutes, Not Days</h3>
                <p className="text-gray-600">
                  Generate professional jersey designs in minutes instead of waiting days for a graphic designer.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <div className="mx-auto bg-voro-red/10 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-voro-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">Endless Variations</h3>
                <p className="text-gray-600">
                  Try unlimited design combinations until you find the perfect look for your team.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <div className="mx-auto bg-voro-red/10 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-voro-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">Cost Effective</h3>
                <p className="text-gray-600">
                  Premium designs without premium prices. Free tier available for casual users.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
              Ready to design your kit?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of teams who have revolutionized their uniform design process with VORO.
            </p>
            <Link href="/designer" className="inline-flex items-center justify-center bg-voro-red hover:bg-voro-red/90 text-white py-4 px-8 rounded-xl text-lg font-medium transition-colors">
              Start Designing Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default HowItWorksPage;