import React from 'react';
import { Link } from 'wouter';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { InfoPill } from '@/components/ui/info-pill';
import { ArrowRight, Target, Lightbulb } from 'lucide-react';

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
                {/* Mission InfoPill */}
                <InfoPill 
                  title="Our Mission" 
                  icon={<Target className="text-voro-red" />}
                  className="h-full"
                >
                  <p className="text-gray-700">
                    To enable anyone — from solo players to entire clubs — to create elite teamwear effortlessly using intelligent systems.
                  </p>
                </InfoPill>

                {/* Vision InfoPill */}
                <InfoPill 
                  title="Our Vision" 
                  icon={<Lightbulb className="text-voro-red" />}
                  className="h-full"
                >
                  <p className="text-gray-700">
                    To be the world's most accessible and advanced custom kit platform.
                  </p>
                </InfoPill>
              </div>

              {/* Values Section */}
              <div className="mt-16">
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 text-center">Our Core Values</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoPill
                    title="Velocity & Originality"
                    className="h-full"
                  >
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-voro-red/10 text-voro-red font-bold text-sm mr-2 flex-shrink-0">V</span>
                        <div>
                          <strong className="font-medium">Velocity:</strong> We move quickly and efficiently, understanding that time is valuable for our customers.
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-voro-red/10 text-voro-red font-bold text-sm mr-2 flex-shrink-0">O</span>
                        <div>
                          <strong className="font-medium">Originality:</strong> We embrace uniqueness and creativity, helping teams express their distinct identity.
                        </div>
                      </li>
                    </ul>
                  </InfoPill>
                  
                  <InfoPill
                    title="Resilience & Ownership"
                    className="h-full"
                  >
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-voro-red/10 text-voro-red font-bold text-sm mr-2 flex-shrink-0">R</span>
                        <div>
                          <strong className="font-medium">Resilience:</strong> We build durable products and relationships, standing by our work for the long run.
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-voro-red/10 text-voro-red font-bold text-sm mr-2 flex-shrink-0">O</span>
                        <div>
                          <strong className="font-medium">Ownership:</strong> We take responsibility for our platform, giving users total control over their designs.
                        </div>
                      </li>
                    </ul>
                  </InfoPill>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section (Optional) */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 text-center">Who We Are</h2>
            
            <div className="max-w-3xl mx-auto">
              <InfoPill
                title="Our Team"
                className="text-center"
              >
                <p className="text-lg text-gray-600 mb-4">
                  VORO brings together experts in AI technology, sports apparel manufacturing, and digital design. 
                  We're a small but passionate team of athletes, designers, and technologists committed to revolutionizing 
                  how sports teams present themselves to the world.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-voro-red/10 text-voro-red mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div className="font-medium">Athletes</div>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-voro-red/10 text-voro-red mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </div>
                    <div className="font-medium">Designers</div>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-voro-red/10 text-voro-red mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </div>
                    <div className="font-medium">Tech Experts</div>
                  </div>
                </div>
              </InfoPill>
            </div>
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