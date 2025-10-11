import React, { useEffect, useRef } from 'react';
import { Search, Heart, Calendar, CheckCircle, MessageCircle, Star, Shield, Clock, Award, ArrowRight, Users, Camera, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { trackPageView } from '../utils/analytics'; // Import trackPageView
import { useLatestReviews } from '../hooks/useSupabase';

export const HowItWorks: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // Add loading
  const { reviews, loading: reviewsLoading } = useLatestReviews(3);
  const analyticsTracked = useRef(false); // Add ref to prevent duplicate calls

  // Track analytics only once on mount
  useEffect(() => {
    if (!loading && !analyticsTracked.current) {
      console.log('Tracking analytics for how-it-works:', new Date().toISOString());
      trackPageView('how-it-works', 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [loading, user?.id]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const steps = [
    {
      number: '01',
      title: 'Search & Discover',
      description: 'Browse our curated selection of wedding vendors and packages tailored to your location, date, and style preferences.',
      icon: Search,
      color: 'from-rose-500 to-pink-500',
      features: [
        'Advanced search filters',
        'Location-based results',
        'Real-time availability',
        'Verified vendor profiles'
      ]
    },
    {
      number: '02',
      title: 'Compare & Connect',
      description: 'Compare packages, read authentic reviews, and connect directly with vendors to discuss your vision.',
      icon: Heart,
      color: 'from-amber-500 to-orange-500',
      features: [
        'Side-by-side comparisons',
        'Verified customer reviews',
        'Direct messaging',
        'Portfolio galleries'
      ]
    },
    {
      number: '03',
      title: 'Book & Plan',
      description: 'Secure your date with our safe booking system and work with your vendors to plan every detail.',
      icon: Calendar,
      color: 'from-emerald-500 to-teal-500',
      features: [
        'Secure payment processing',
        'Contract management',
        'Timeline coordination',
        'Progress tracking'
      ]
    },
    {
      number: '04',
      title: 'Celebrate & Remember',
      description: 'Enjoy your perfect wedding day knowing every detail is handled, then cherish the memories forever.',
      icon: CheckCircle,
      color: 'from-purple-500 to-indigo-500',
      features: [
        'Day-of coordination',
        'Quality guarantee',
        'Memory preservation',
        'Post-wedding support'
      ]
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Verified Vendors',
      description: 'Every vendor is thoroughly vetted for quality, reliability, and professionalism.',
      stats: '100% Verified'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Find and book multiple wedding services in one place instead of searching everywhere.',
      stats: '10x Faster'
    },
    {
      icon: Award,
      title: 'Quality Guarantee',
      description: 'We stand behind every booking with our satisfaction guarantee and support team.',
      stats: '99% Satisfaction'
    },
    {
      icon: Star,
      title: 'Best Prices',
      description: 'Get competitive pricing and exclusive package deals you won\'t find elsewhere.',
      stats: 'Up to 30% Savings'
    }
  ];

  const faqs = [
    {
      question: 'How do I know the vendors are reliable?',
      answer: 'All vendors on our platform go through a rigorous verification process including background checks, portfolio reviews, and reference verification. We also monitor ongoing performance through customer reviews and feedback.'
    },
    {
      question: 'What if I need to cancel or reschedule?',
      answer: 'Each booking comes with clear cancellation policies. Most vendors offer free cancellation up to 30 days before your event. For changes within the cancellation window, we work with vendors to find flexible solutions.'
    },
    {
      question: 'How does payment work?',
      answer: 'We use secure payment processing through Stripe. You can pay with credit cards, and payments are protected. Typically, you pay a deposit to secure your booking, with the balance due closer to your event date.'
    },
    {
      question: 'Can I customize packages?',
      answer: 'Absolutely! While we offer pre-designed packages for convenience, most vendors are happy to customize services to match your specific needs and vision. You can discuss modifications directly with vendors.'
    },
    {
      question: 'What support do you provide?',
      answer: 'Our customer support team is available 24/7 to help with any questions or issues. We also provide planning resources, timeline templates, and coordination support to ensure your day goes smoothly.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-7xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            How B. Remembered Works
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-6 sm:mb-8">
            Your journey to the perfect wedding starts here. Discover how thousands of couples have found and booked their dream wedding team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-white border-white text-rose-600 hover:bg-gray-50 hover:text-rose-700 px-6 py-3 sm:px-8 sm:py-4 min-w-[44px] min-h-[44px]"
              onClick={() => navigate('/search')}
              aria-label="Start Planning Now"
            >
              Start Planning Now
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Your Perfect Wedding in 4 Simple Steps
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              We've streamlined the wedding planning process to make finding and booking your dream team effortless.
            </p>
          </div>

          <div className="space-y-12 sm:space-y-16 md:space-y-20">
            {steps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <div key={step.number} className="flex flex-col items-center gap-8 sm:gap-10 md:gap-12">
                  <div className="w-full sm:w-3/4 md:w-1/2">
                    <div className="relative">
                      <div className={`w-full h-64 sm:h-72 md:h-96 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center relative overflow-hidden`}>
                        <Icon className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 text-white/20 absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8" />
                        <div className="text-center text-white">
                          <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 opacity-90">{step.number}</div>
                          <Icon className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 mx-auto" />
                        </div>
                      </div>
                      <div className="absolute -bottom-4 sm:-bottom-5 md:-bottom-6 -right-4 sm:-right-5 md:-right-6 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{step.number}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-3/4 md:w-1/2">
                    <div className="max-w-lg mx-auto">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{step.title}</h3>
                      <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">{step.description}</p>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {step.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-600" />
                            </div>
                            <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 sm:mt-8">
                        <Button 
                          variant="primary" 
                          icon={ArrowRight}
                          className="px-6 py-3 sm:px-8 sm:py-4 min-w-[44px] min-h-[44px]"
                          onClick={() => navigate('/search')}
                          aria-label="Get Started"
                        >
                          Get Started
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose B. Remembered?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              We're more than just a booking platform - we're your wedding planning partner.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="p-6 sm:p-8 text-center hover:shadow-xl transition-shadow">
                  <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Icon className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-rose-600" />
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-rose-500 mb-2 sm:mb-3">{benefit.stats}</div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{benefit.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Complete Wedding Services
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for your perfect day, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: Camera,
                title: 'Photography',
                description: 'Professional wedding photographers to capture every precious moment',
                features: ['Engagement shoots', 'Wedding day coverage', 'Digital galleries', 'Print packages']
              },
              {
                icon: Users,
                title: 'Videography',
                description: 'Cinematic wedding films that tell your unique love story',
                features: ['Highlight reels', 'Full ceremony', 'Drone footage', 'Same-day edits']
              },
              {
                icon: Music,
                title: 'DJ & Music',
                description: 'Professional DJs and musicians to keep your celebration alive',
                features: ['Sound systems', 'Lighting', 'MC services', 'Custom playlists']
              },
              {
                icon: Calendar,
                title: 'Coordination',
                description: 'Expert planners to handle every detail of your special day',
                features: ['Timeline planning', 'Vendor management', 'Day-of coordination', 'Emergency support']
              }
            ].map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="p-5 sm:p-6 hover:shadow-xl transition-shadow group">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-rose-500 transition-colors">
                    <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-rose-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{service.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{service.description}</p>
                  <ul className="space-y-1 sm:space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-xs sm:text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Real Stories from Real Couples
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              See how B. Remembered helped make their dream weddings come true.
            </p>
          </div>

          {reviewsLoading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin w-6 sm:w-8 h-6 sm:h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Loading real couple reviews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {reviews.map((review, index) => {
                // Use couple's profile photo or fallback to generated images
                const fallbackImages = [
                  'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
                  'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400',
                  'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=400',
                  'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=400',
                  'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400'
                ];
                const imageIndex = index % fallbackImages.length;
                const coupleImage = review.couple?.profile_photo || fallbackImages[imageIndex];
                
                return (
                  <Card key={review.id} className="p-5 sm:p-6">
                    <div className="flex items-center mb-3 sm:mb-4">
                      {[...Array(review.overall_rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3 sm:w-4 h-3 sm:h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="mb-2 sm:mb-3">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                        {review.vendor?.name || 'B. Remembered'} {review.service_type && <span className="text-gray-500 font-normal">({review.service_type})</span>}
                      </h4>
                    </div>
                    <blockquote className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 italic truncate">{review.feedback}</blockquote>
                    <div className="flex items-center">
                      <img
                        src={coupleImage}
                        alt={review.couple?.name || 'Happy Couple'}
                        className="w-10 sm:w-12 h-10 sm:h-12 rounded-full object-cover mr-2 sm:mr-3"
                      />
                      <div>
                        <div className="text-sm sm:text-base font-semibold text-gray-900">{review.couple?.name || 'Happy Couple'}</div>
                        {review.couple?.wedding_date && (
                          <div className="text-xs text-gray-400">
                            {new Date(review.couple.wedding_date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">
              Everything you need to know about planning your wedding with B. Remembered.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-5 sm:p-6">
                <h3 className="text-base sm:text-lg md:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{faq.question}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-500 to-amber-500">
        <div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Start Planning Your Dream Wedding?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-8 opacity-90">
            Join thousands of couples who found their perfect wedding team through B. Remembered.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-rose-600 px-6 py-3 sm:px-8 sm:py-4 min-w-[44px] min-h-[44px]"
              onClick={() => navigate('/search')}
              aria-label="Start Planning Now"
            >
              Start Planning Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-rose-600 px-6 py-3 sm:px-8 sm:py-4 min-w-[44px] min-h-[44px]"
              aria-label="Talk to an Expert"
            >
              Talk to an Expert
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;