import React from 'react';
import { Heart, Mail, Phone, MapPin, ExternalLink, Users, FileText, Shield, HelpCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="https://eecbrvehrhrvdzuutliq.supabase.co/storage/v1/object/public/public-1//2025_IO.png" 
                alt="B. Remembered" 
                className="h-8 w-auto filter brightness-0 invert"
              />
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              The smarter way to book wedding services. Connect with verified vendors who will make your special day absolutely magical.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* For Couples */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Couples</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => navigate('/search')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Browse Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/how-it-works')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/inspiration')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Wedding Inspiration
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/my-bookings')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  My Bookings
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/support')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Support Center
                </button>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Vendors</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://app.bremembered.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  Vendor Login
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </li>
              <li>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Users}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500"
                  onClick={() => {
                    navigate('/vendor-onboarding');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Join the Team
                </Button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    navigate('/vendor-onboarding');
                    setTimeout(() => {
                      const element = document.querySelector('h2');
                      if (element && element.textContent?.includes('What is B. Remembered')) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Vendor Resources
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    navigate('/advertise-with-us');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Advertise
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal & Support</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => navigate('/terms')}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/privacy')}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/cancellation')}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Cancellation Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    navigate('/support');
                    setTimeout(() => {
                      const faqElement = Array.from(document.querySelectorAll('h2')).find(el => 
                        el.textContent?.includes('Frequently Asked Questions')
                      );
                      if (faqElement) {
                        faqElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.scrollTo({ top: document.body.scrollHeight * 0.7, behavior: 'smooth' });
                      }
                    }, 300);
                  }}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  FAQ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    navigate('/support');
                    setTimeout(() => {
                      const getInTouchElement = Array.from(document.querySelectorAll('h2')).find(el => 
                        el.textContent?.includes('Get in Touch')
                      );
                      if (getInTouchElement) {
                        getInTouchElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }
                    }, 300);
                  }}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Call Us</p>
                <p className="text-gray-300">(978) 945-3WED</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-gray-300">hello@bremembered.io</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Serving</p>
                <p className="text-gray-300">Nationwide</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Heart className="w-5 h-5 text-rose-500" />
              <p className="text-gray-300">
                © {currentYear} B. Remembered. Made with love for couples everywhere.
              </p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>🔒 Secure Payments</span>
              <span>✓ Verified Vendors</span>
              <span>📞 24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};