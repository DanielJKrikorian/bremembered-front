import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, Clock, Search, HelpCircle, BookOpen, Users, Shield, Star, Send, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const Support: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showChatBot, setShowChatBot] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'normal'
  });

  const supportCategories = [
    { key: 'all', label: 'All Topics', icon: HelpCircle },
    { key: 'booking', label: 'Booking & Payments', icon: BookOpen },
    { key: 'vendors', label: 'Working with Vendors', icon: Users },
    { key: 'account', label: 'Account & Profile', icon: Shield },
    { key: 'technical', label: 'Technical Issues', icon: Star }
  ];

  const faqs = [
    {
      category: 'booking',
      question: 'How do I book a wedding service?',
      answer: 'To book a service, browse our vendors, select your preferred package, choose your date, and complete the secure checkout process. You\'ll receive confirmation within minutes.'
    },
    {
      category: 'booking',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover) through our secure Stripe payment system. All transactions are encrypted and protected.'
    },
    {
      category: 'booking',
      question: 'Can I cancel or modify my booking?',
      answer: 'Cancellation and modification policies vary by vendor, and you should review each vendor\'s specific terms before booking. Here are the key points: **Rescheduling:** Requests to reschedule are subject to vendor availability and approval. Our service fee remains non-refundable in the event of rescheduling. **B. Remembered Service Fee:** All B. Remembered service fees and platform percentage fees collected at checkout are non-refundable under all circumstances. These fees cover platform use, payment processing, and administrative costs, and remain due regardless of whether the event is canceled, rescheduled, or disputed. **Vendor Payments:** Refunds for vendor services (outside of our non-refundable service fees) are determined by the vendor\'s individual cancellation policy. Any disputes, changes, or refund requests must be resolved directly with the vendor. B. Remembered is not responsible for vendor decisions regarding cancellations or refunds. **Booking Insurance (Optional):** If you purchase booking insurance (when available), you may be eligible for a refund of your down payment in the event of a covered cancellation. The insurance fee itself and our service fee remain non-refundable. Coverage and eligibility are determined by the terms of the insurance provider.'
    },
    {
      category: 'vendors',
      question: 'How are vendors verified?',
      answer: 'All vendors undergo a thorough verification process including background checks, portfolio reviews, insurance verification, and reference checks from previous clients.'
    },
    {
      category: 'vendors',
      question: 'What if I have issues with a vendor?',
      answer: 'Our support team is here to help resolve any issues. We work directly with vendors to ensure your satisfaction and can provide mediation if needed.'
    },
    {
      category: 'vendors',
      question: 'Can I communicate directly with vendors?',
      answer: 'Yes! Once you book a service, you can message vendors directly through our platform to discuss details, share your vision, and coordinate your event.'
    },
    {
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click "Sign Up" in the top right corner, enter your email and create a password. You can also sign up during the booking process.'
    },
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email, and we\'ll send you a secure link to reset your password.'
    },
    {
      category: 'technical',
      question: 'The website is loading slowly. What should I do?',
      answer: 'Try refreshing the page, clearing your browser cache, or using a different browser. If issues persist, contact our technical support team.'
    },
    {
      category: 'technical',
      question: 'I can\'t upload photos to my profile.',
      answer: 'Ensure your photos are under 5MB and in JPG, PNG, or GIF format. Try using a different browser or device if the issue continues.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock submission for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSubmitSuccess(true);
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: '',
          priority: 'normal'
        });
        setTimeout(() => setSubmitSuccess(false), 5000);
        return;
      }

      const inquiryData = {
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
        priority: contactForm.priority,
        user_id: isAuthenticated ? user?.id : null
      };

      const { error } = await supabase
        .from('support_inquiries')
        .insert([inquiryData]);

      if (error) throw error;

      setSubmitSuccess(true);
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'normal'
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const handleStartChat = () => {
    // Trigger the chat bot to open
    const chatBotEvent = new CustomEvent('openChatBot');
    window.dispatchEvent(chatBotEvent);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            How Can We Help?
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Get the support you need to plan your perfect wedding. Our team is here to help every step of the way.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, and guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 focus:outline-none focus:ring-4 focus:ring-white/30 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Options */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Live Chat</h3>
              <p className="text-gray-600 mb-6">Get instant help from our support team</p>
              <div className="text-sm text-gray-500 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Available 24/7</span>
                </div>
              </div>
              <Button 
                variant="primary" 
                className="w-full"
                onClick={handleStartChat}
              >
                Start Chat
              </Button>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Phone Support</h3>
              <p className="text-gray-600 mb-6">Speak directly with our wedding experts</p>
              <div className="text-sm text-gray-500 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Mon-Fri 8AM-8PM PST</span>
                </div>
              </div>
              <Button variant="primary" className="w-full">
                Call (978) 945-3WED
              </Button>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Support</h3>
              <p className="text-gray-600 mb-6">Send us a detailed message</p>
              <div className="text-sm text-gray-500 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Response within 2 hours</span>
                </div>
              </div>
              <Button variant="primary" className="w-full">
                Send Email
              </Button>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
              <div className="text-gray-600">
                {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              {supportCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                      selectedCategory === category.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
              {filteredFaqs.length === 0 ? (
                <Card className="p-8 text-center">
                  <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or category filter.</p>
                  <Button variant="primary" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
                    Clear Filters
                  </Button>
                </Card>
              ) : (
                filteredFaqs.map((faq, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start">
                      <HelpCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed ml-7">{faq.answer}</p>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="p-6 sticky top-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Still Need Help?</h3>
              
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Inquiry submitted successfully!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    We'll respond within 2 hours during business hours.
                  </p>
                </div>
              )}
              
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
              
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <Input
                  label="Name"
                  value={contactForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={submitting}
                  required
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={submitting}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={contactForm.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={submitting}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <Input
                  label="Subject"
                  value={contactForm.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  disabled={submitting}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    disabled={submitting}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Please describe your issue or question in detail..."
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  icon={Send} 
                  className="w-full"
                  loading={submitting}
                  disabled={submitting}
                >
                  Submit Inquiry
                </Button>
              </form>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Quick Response Guarantee</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  We typically respond to all inquiries within 2 hours during business hours.
                </p>
              </div>
            </Card>

            {/* Help Resources */}
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Helpful Resources</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center space-x-3 text-blue-600 hover:text-blue-700 transition-colors">
                  <BookOpen className="w-4 h-4" />
                  <span>Wedding Planning Guide</span>
                </a>
                <a href="#" className="flex items-center space-x-3 text-blue-600 hover:text-blue-700 transition-colors">
                  <Users className="w-4 h-4" />
                  <span>Working with Vendors</span>
                </a>
                <a href="#" className="flex items-center space-x-3 text-blue-600 hover:text-blue-700 transition-colors">
                  <Shield className="w-4 h-4" />
                  <span>Payment & Security</span>
                </a>
                <a href="#" className="flex items-center space-x-3 text-blue-600 hover:text-blue-700 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Community Forum</span>
                </a>
              </div>
            </Card>
          </div>
        </div>

        {/* Status Page */}
        <section className="mt-16">
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">System Status</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">All Systems Operational</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">{'< 2s'}</div>
                <div className="text-gray-600">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-gray-600">Monitoring</div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};