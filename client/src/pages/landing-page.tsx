import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, ArrowDown, PlayCircle, Users, Building, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { apiRequest } from "@/lib/queryClient";

// Feature cards for the "How It Works" section
const processSteps = [
  {
    title: "Choose Your Gear",
    description: "Pick a sport and jersey style from our catalog",
    icon: <div className="w-12 h-12 rounded-full bg-[#E34234]/10 flex items-center justify-center">
      <span className="text-xl font-bold text-[#E34234]">1</span>
    </div>
  },
  {
    title: "AI Generates Designs",
    description: "Get instant designs to choose from",
    icon: <div className="w-12 h-12 rounded-full bg-[#E34234]/10 flex items-center justify-center">
      <span className="text-xl font-bold text-[#E34234]">2</span>
    </div>
  },
  {
    title: "Customize Details",
    description: "Add names, numbers, logos easily",
    icon: <div className="w-12 h-12 rounded-full bg-[#E34234]/10 flex items-center justify-center">
      <span className="text-xl font-bold text-[#E34234]">3</span>
    </div>
  },
  {
    title: "Order & Fulfillment",
    description: "We produce and ship to your door",
    icon: <div className="w-12 h-12 rounded-full bg-[#E34234]/10 flex items-center justify-center">
      <span className="text-xl font-bold text-[#E34234]">4</span>
    </div>
  }
];

// Key features highlighted in bullet points
const keyFeatures = [
  "No Minimum Order – order 1 or 100",
  "Professional Quality Fabric & Printing",
  "Ships in 7 days",
  "100% Satisfaction Guarantee",
  "Free design revisions"
];

// Comparison table data
const comparisonData = [
  { metric: "Design Time", proJersey: "Minutes with AI", traditional: "Days with a designer" },
  { metric: "Order Size", proJersey: "No minimums", traditional: "10+ minimum" },
  { metric: "Turnaround", proJersey: "1 week", traditional: "3-4 weeks" },
  { metric: "Customization", proJersey: "Unlimited options", traditional: "Limited templates" }
];

// Testimonial data
const testimonials = [
  {
    quote: "As a solo athlete, I designed my own jersey for fun – it turned out amazing! The AI gave me ideas I'd never think of.",
    author: "Jamal R.",
    title: "Weekend Basketball Player" 
  },
  {
    quote: "Our club got 25 jerseys designed and delivered in under two weeks. The team was thrilled with the quality!",
    author: "Sarah K.",
    title: "Soccer Coach"
  },
  {
    quote: "We expanded our sports shop's offerings by partnering with ProJersey. The custom jersey line is now one of our best-sellers.",
    author: "Mark D.",
    title: "Retail Buyer"
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  
  // Define the design interface
  interface Design {
    id: string;
    urls: {
      front: string;
      back?: string;
    };
    createdAt?: string;
  }
  
  // State for designs and navigation
  const [designs, setDesigns] = useState<Design[]>([]);
  const [currentDesignIndex, setCurrentDesignIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch previously generated designs
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setIsLoading(true);
        const res = await apiRequest('GET', '/api/designs/recent');
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setDesigns(data as Design[]);
        } else {
          // Fallback to sample data if no designs are available
          const sampleDesigns: Design[] = [
            {
              id: "sample-1",
              urls: {
                front: "https://via.placeholder.com/300x400/f8f9fa/e6e6e6?text=Jersey+Preview"
              }
            },
            {
              id: "sample-2",
              urls: {
                front: "https://via.placeholder.com/300x400/f8f9fa/e6e6e6?text=Jersey+Preview+2"
              }
            }
          ];
          setDesigns(sampleDesigns);
        }
      } catch (error) {
        console.error('Error fetching designs:', error);
        // Fallback to sample designs on error
        const sampleDesigns: Design[] = [
          {
            id: "sample-1",
            urls: {
              front: "https://via.placeholder.com/300x400/f8f9fa/e6e6e6?text=Jersey+Preview"
            }
          },
          {
            id: "sample-2",
            urls: {
              front: "https://via.placeholder.com/300x400/f8f9fa/e6e6e6?text=Jersey+Preview+2"
            }
          }
        ];
        setDesigns(sampleDesigns);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDesigns();
  }, []);
  
  // Navigation functions
  const showNextDesign = () => {
    if (designs.length === 0) return;
    setCurrentDesignIndex((prev) => (prev === designs.length - 1 ? 0 : prev + 1));
  };
  
  const showPreviousDesign = () => {
    if (designs.length === 0) return;
    setCurrentDesignIndex((prev) => (prev === 0 ? designs.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-[#FAFAFA] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 flex flex-col md:flex-row items-center justify-between">
          <div className="w-full md:w-3/5 space-y-8 mb-12 md:mb-0">
            <h1 className="font-sora text-4xl md:text-6xl font-bold leading-tight text-[#0F0F0F]">
              Design Custom Teamwear <span className="text-[#E34234]">in Seconds</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-md">
              AI-powered kit builder. No design skills needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/designer">
                <Button size="lg" className="bg-[#E34234] hover:bg-opacity-80 text-white px-8 py-3 rounded-2xl text-lg font-semibold transition-all flex items-center gap-2 h-auto">
                  Start Designing <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#team-solutions">
                <Button variant="outline" size="lg" className="border-[#0F0F0F] text-[#0F0F0F] hover:bg-gray-50 px-8 py-3 rounded-2xl text-lg font-semibold transition-all h-auto">
                  Request Bulk Quote
                </Button>
              </Link>
            </div>
          </div>
          <div className="w-full md:w-2/5">
            <div className="text-sm text-gray-500 uppercase mb-2">Your Kit Preview</div>
            <div className="rounded-xl shadow-sm border border-gray-300 bg-white p-6">
              <div className="text-center mb-4">
                <span className="font-heading font-bold text-xl">Pro<span className="text-[#E34234]">Jersey</span> Designer</span>
              </div>
              <div className="relative bg-gray-50 h-64 rounded-lg mb-6 flex items-center justify-center overflow-hidden border border-gray-200">
                {designs.length > 0 ? (
                  <img 
                    src={designs[currentDesignIndex]?.urls?.front || ''} 
                    alt="Jersey preview" 
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400">Jersey preview</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={showPreviousDesign}
                  disabled={designs.length === 0}
                  className="text-[#0F0F0F] border-gray-300"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  {designs.length > 0 ? `${currentDesignIndex + 1}/${designs.length}` : '0/0'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={showNextDesign}
                  disabled={designs.length === 0}
                  className="text-[#0F0F0F] border-gray-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ArrowDown className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </section>

      {/* AI Designer Demo Section */}
      <section className="py-16 md:py-24 bg-white" id="ai-designer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-sora text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet the AI Jersey Designer</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simply tell our AI your team name and colors, and it will generate dozens of custom jersey designs for you. 
              Pick your favorite and tweak it – no design skills needed!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-medium text-lg mb-2">How the AI Works:</h3>
                  <ol className="space-y-4 ml-6 list-decimal">
                    <li className="text-gray-700">Input your sport type, colors, and preferences</li>
                    <li className="text-gray-700">Our AI crafts custom designs based on your input</li>
                    <li className="text-gray-700">View multiple design options in seconds</li>
                    <li className="text-gray-700">Fine-tune and customize with our editor</li>
                  </ol>
                </div>
                
                <div className="flex justify-center">
                  <Link href="/designer">
                    <Button className="bg-black text-white hover:bg-gray-800 px-6 py-2 flex items-center gap-2">
                      Try It Now <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 relative">
              <div className="aspect-video bg-gray-100 rounded-lg shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="h-16 w-16 text-[#E34234] cursor-pointer hover:scale-110 transition-transform" />
                </div>
                {/* This would be a video or interactive element in reality */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 to-gray-700/20"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Configuration & Features Section */}
      <section className="py-16 md:py-24 bg-gray-50" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-sora text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From design to delivery, we've made the process simple, fast, and hassle-free
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {processSteps.map((step, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">{step.icon}</div>
                <h3 className="font-sora font-bold text-xl mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Features and Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Features */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="font-sora font-bold text-2xl mb-6">Key Benefits</h3>
              <ul className="space-y-4">
                {keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#E34234] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="font-sora font-bold text-2xl mb-6">ProJersey vs. Traditional Printing</h3>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ProJersey</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traditional</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparisonData.map((row, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.metric}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.proJersey}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.traditional}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/designer">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-6 rounded-lg text-lg font-medium transition-all flex items-center gap-2 h-auto mx-auto">
                Design Your Jersey Now <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Team & B2B Solutions Section */}
      <section className="py-16 md:py-24 bg-white" id="team-solutions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-sora text-3xl md:text-4xl font-bold text-gray-900 mb-4">Solutions for Every Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're an individual, team manager, or business owner, we have the right solution for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Teams & Organizations Section */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-8 w-8 text-[#E34234]" />
                <h3 className="font-sora font-bold text-2xl">Built for Teams of All Sizes</h3>
              </div>
              <p className="text-gray-700 mb-6">
                Coaches and team managers love ProJersey – coordinate your entire team's kit in one go.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#E34234] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Bulk edit player names/numbers</span>
                    <p className="text-sm text-gray-600">Upload a spreadsheet or enter names manually</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#E34234] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Multiple sizes in one order</span>
                    <p className="text-sm text-gray-600">Youth and adult sizes together</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#E34234] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Team Order Discounts</span>
                    <p className="text-sm text-gray-600">Automatically applied for 10+ jerseys</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#E34234] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Reorder Anytime</span>
                    <p className="text-sm text-gray-600">Save designs for future seasons</p>
                  </div>
                </li>
              </ul>
              <Link href="/designer">
                <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-lg py-2.5">
                  Team Order: Start Designing
                </Button>
              </Link>
            </div>

            {/* B2B & Resellers Section */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Building className="h-8 w-8 text-[#E34234]" />
                <h3 className="font-sora font-bold text-2xl">Partner with ProJersey</h3>
              </div>
              <p className="text-gray-700 mb-6">
                Need 50+ jerseys or want to resell custom kits? We've got you covered with scalable fulfillment.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#E34234] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Wholesale Pricing</span>
                    <p className="text-sm text-gray-600">Tiered discounts for large volumes</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#E34234] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">White-Label Options</span>
                    <p className="text-sm text-gray-600">Ship with your branding or integrate via API</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#E34234] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Dedicated Account Manager</span>
                    <p className="text-sm text-gray-600">Personalized support for large clients</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#E34234] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">On-time Global Fulfillment</span>
                    <p className="text-sm text-gray-600">Reliable delivery for event organizers</p>
                  </div>
                </li>
              </ul>
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg py-2.5">
                Get Bulk Quote
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials & Social Proof Section */}
      <section className="py-16 md:py-24 bg-gray-50" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-sora text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied customers who've transformed their team's look with ProJersey
            </p>
            <div className="mt-6 flex justify-center items-center gap-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-700 font-medium">4.8/5 average from 500+ customers</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="inline-block h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-4">"{testimonial.quote}"</blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <div className="text-center">
              <h3 className="text-gray-500 uppercase text-sm font-medium tracking-wide mb-4">Trusted by teams and organizations</h3>
              <div className="flex flex-wrap justify-center gap-8 grayscale opacity-60">
                {/* This would contain actual client logos */}
                {[1, 2, 3, 4, 5].map((logo) => (
                  <div key={logo} className="h-12 w-24 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Logo {logo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-sora text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Team's Look?</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Start designing your dream jersey in seconds with our AI-powered platform.
            No design skills required!
          </p>
          <Link href="/designer">
            <Button size="lg" className="bg-[#E34234] hover:bg-[#E34234]/90 text-white px-8 py-3 rounded-lg text-lg font-medium transition-all">
              Start Designing Now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}