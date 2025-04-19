import React, { useState } from 'react';
import { Link } from 'wouter';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { InfoPill } from '@/components/ui/info-pill';
import { ChevronDown, ChevronUp, Mail, HelpCircle, MessageCircle, FileQuestion } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggleOpen }) => {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 mb-4 hover:border-voro-red/30">
      <button 
        onClick={toggleOpen}
        className={`w-full p-6 flex justify-between items-center text-left font-heading font-medium text-lg ${isOpen ? 'text-voro-red' : 'text-voro-black'}`}
        aria-expanded={isOpen}
      >
        {question}
        {isOpen ? 
          <ChevronUp className="h-5 w-5 flex-shrink-0" /> : 
          <ChevronDown className="h-5 w-5 flex-shrink-0" />
        }
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
        <p className="text-gray-600">{answer}</p>
      </div>
    </div>
  );
};

const FAQPage: React.FC = () => {
  // Define FAQs data
  const faqData = [
    {
      question: "How long does it take to receive my order?",
      answer: "Most orders are delivered within 12–18 days depending on your location and order size."
    },
    {
      question: "Can I change my kit design after generating it?",
      answer: "You can edit your design and re-generate it as many times as you like before placing your order."
    },
    {
      question: "Is there a minimum quantity for team orders?",
      answer: "No. We support single orders and bulk orders with quantity-based pricing."
    },
    {
      question: "What sports do you support?",
      answer: "Currently: Soccer, Rugby, Basketball, Cricket, Esports, American Football. More coming soon."
    },
    {
      question: "Do you offer refunds or revisions?",
      answer: "Once your kit is confirmed and manufactured, we cannot refund. However, you can regenerate your design before confirming your order."
    },
    {
      question: "How customizable are the designs?",
      answer: "Our AI engine allows you to customize colors, patterns, logos, numbers, names, and more. You can provide detailed descriptions to create exactly what you're looking for."
    },
    {
      question: "What is the subscription pricing model?",
      answer: "We offer a free tier allowing 6 designs per month. Our Pro subscription ($9/month) provides unlimited designs, priority generation, and exclusive design templates."
    },
    {
      question: "Can I order matching gear beyond jerseys?",
      answer: "Yes! You can order complete kits including shorts, socks, training gear, and accessories that match your design theme."
    }
  ];

  // State to track which FAQ items are open
  const [openItems, setOpenItems] = useState<{[key: number]: boolean}>({0: true});

  // Toggle function for opening/closing FAQ items
  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="w-full py-16 bg-gray-50">
          <div className="container max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-voro-black">
              FAQs & Help
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Got questions? We've got answers. Find everything you need to confidently design and order your custom kit.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container max-w-3xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <FAQItem 
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={!!openItems[index]}
                  toggleOpen={() => toggleItem(index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Additional FAQs Categories (Optional) */}
        <section className="py-12 bg-gray-50">
          <div className="container max-w-4xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 text-center">
              Browse by Topic
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                <h3 className="text-xl font-heading font-bold mb-3">Ordering</h3>
                <p className="text-gray-600 mb-3">Order process, shipping, delivery times</p>
                <span className="text-voro-red text-sm">5 articles</span>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                <h3 className="text-xl font-heading font-bold mb-3">Design Help</h3>
                <p className="text-gray-600 mb-3">AI Designer tips, customization options</p>
                <span className="text-voro-red text-sm">8 articles</span>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                <h3 className="text-xl font-heading font-bold mb-3">Team Orders</h3>
                <p className="text-gray-600 mb-3">Bulk ordering, team management, pricing</p>
                <span className="text-voro-red text-sm">4 articles</span>
              </div>
            </div>
          </div>
        </section>

        {/* Help Contact Section with InfoPill */}
        <section className="py-16 bg-white">
          <div className="container max-w-3xl mx-auto px-6">
            <div className="space-y-8">
              <InfoPill 
                title="Still Need Help?" 
                icon={<HelpCircle className="text-voro-red" />}
              >
                <p className="mb-4">
                  Reach out to our team at <a href="mailto:help@vorosport.ai" className="text-voro-red hover:underline font-medium">help@vorosport.ai</a> for any questions not covered in our FAQs.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Link href="/contact" className="px-6 py-2 rounded-full bg-voro-red text-white hover:bg-opacity-90 transition-colors text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Support
                  </Link>
                </div>
              </InfoPill>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoPill 
                  title="Live Chat Support" 
                  icon={<MessageCircle className="text-blue-500" />}
                  className="h-full"
                >
                  <p className="mb-3">Our support team is available via live chat Monday through Friday, 9am-5pm EST.</p>
                  <p>Average response time: <span className="font-medium">Under 10 minutes</span></p>
                </InfoPill>
                
                <InfoPill 
                  title="Documentation" 
                  icon={<FileQuestion className="text-green-500" />}
                  className="h-full"
                >
                  <p className="mb-3">Check out our detailed documentation for step-by-step guides on using the VORO platform.</p>
                  <Link href="/docs" className="text-voro-red hover:underline font-medium">View Documentation →</Link>
                </InfoPill>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default FAQPage;