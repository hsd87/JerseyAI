import React from 'react';
import { Link } from 'wouter';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { ArrowRight } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="w-full py-20 bg-white">
          <div className="container max-w-3xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-voro-black">
              About VORO
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              VORO is a performancewear design platform that merges AI with speed, simplicity, and identity. 
              We're redefining how athletes and teams create gear.
            </p>
          </div>
        </section>

        {/* Two-Column Story Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-6 md:px-20">
              {/* Left Column: Image */}
              <div className="flex items-center justify-center">
                <div className="bg-voro-black rounded-xl h-[300px] w-full max-w-md flex items-center justify-center overflow-hidden">
                  <div className="text-white text-3xl font-bold">VORO</div>
                </div>
              </div>

              {/* Right Column: Brand Story */}
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">Our Story</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    We started VORO with a simple observation: designing quality teamwear shouldn't require professional designers, weeks of back-and-forth, or compromise on quality.
                  </p>
                  <p>
                    Our founder, who managed a local football club, spent countless hours trying to coordinate jersey designs with suppliers, experiencing frustrating delays, communication issues, and limited options for customization.
                  </p>
                  <p>
                    VORO was built to solve this problem by combining the latest in AI technology with deep knowledge of sportswear production. The result is a platform where anyone can design professional-quality custom kits in minutes, not days.
                  </p>
                  <p>
                    Our name represents our values: <span className="font-medium text-voro-red">Velocity, Originality, Resilience, and Ownership</span> — the same qualities that define great athletes and teams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission + Vision Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Mission Card */}
                <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
                  <h3 className="text-2xl font-heading font-bold mb-4">Our Mission</h3>
                  <p className="text-gray-700">
                    To enable anyone — from solo players to entire clubs — to create elite teamwear effortlessly using intelligent systems.
                  </p>
                </div>

                {/* Vision Card */}
                <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
                  <h3 className="text-2xl font-heading font-bold mb-4">Our Vision</h3>
                  <p className="text-gray-700">
                    To be the world's most accessible and advanced custom kit platform.
                  </p>
                </div>
              </div>

              {/* Values Section */}
              <div className="mt-16">
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 text-center">Our Core Values</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-voro-red/10 flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-voro-red">V</span>
                    </div>
                    <h4 className="text-xl font-heading font-bold mb-2">Velocity</h4>
                    <p className="text-gray-700">
                      We move quickly and efficiently, understanding that time is valuable for our customers.
                    </p>
                  </div>
                  
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-voro-red/10 flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-voro-red">O</span>
                    </div>
                    <h4 className="text-xl font-heading font-bold mb-2">Originality</h4>
                    <p className="text-gray-700">
                      We embrace uniqueness and creativity, helping teams express their distinct identity.
                    </p>
                  </div>
                  
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-voro-red/10 flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-voro-red">R</span>
                    </div>
                    <h4 className="text-xl font-heading font-bold mb-2">Resilience</h4>
                    <p className="text-gray-700">
                      We build durable products and relationships, standing by our work for the long run.
                    </p>
                  </div>
                  
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-voro-red/10 flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-voro-red">O</span>
                    </div>
                    <h4 className="text-xl font-heading font-bold mb-2">Ownership</h4>
                    <p className="text-gray-700">
                      We take responsibility for our platform, giving users total control over their designs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section (Optional) */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-12">Who We Are</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-600 mb-12">
              VORO brings together experts in AI technology, sports apparel manufacturing, and digital design. 
              We're a small but passionate team of athletes, designers, and technologists committed to revolutionizing 
              how sports teams present themselves to the world.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-6">
              Explore how VORO works and start designing your kit today.
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-8">
              <Link 
                href="/how-it-works" 
                className="px-8 py-3 rounded-xl bg-gray-100 text-voro-black border border-gray-200 hover:bg-gray-200 transition-colors font-medium"
              >
                How It Works
              </Link>
              <Link 
                href="/designer" 
                className="px-8 py-3 rounded-xl bg-voro-red text-white hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                Start Designing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;