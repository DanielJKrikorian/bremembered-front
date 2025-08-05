import React, { useState } from 'react';
import { ArrowRight, Star, Heart, Shield, Award, Users, Calendar, Camera, Video, Music, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SearchBar } from '../components/common/SearchBar';
import { EmailCaptureModal } from '../components/common/EmailCaptureModal';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<{
    selectedServices: string[];
    eventType: string;
  }>({ selectedServices: [], eventType: 'Wedding' });

  const handleSearch = (filters: any) => {
    if (filters.showQuestionnaire) {
      setQuestionnaireData({
        selectedServices: filters.selectedServices,
        eventType: filters.eventType
      });
      setShowQuestionnaire(true);
    } else {
      navigate('/search', { state: { filters } });
    }
  };

  const handleQuestionnaireSave = async (email: string) => {
    // Save email and proceed to vendor selection
    console.log('Saving email and proceeding to vendor selection:', email);
    setShowQuestionnaire(false);
    // Navigate to vendor selection or event details
    navigate('/booking/event-details', {
      state: {
        email,
        ...questionnaireData
      }
    });
  };

  const handleQuestionnaireSkip = () => {
    setShowQuestionnaire(false);
    // Navigate to vendor selection without email
    navigate('/booking/event-details', {
      state: questionnaireData
    });
  };

  const features = [
    {
      icon: Shield,
      title: 'Verified Vendors',
      description: 'Every vendor is thoroughly vetted for quality and reliability',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Award,
      title: 'Best Prices',
      description: 'Competitive pricing and exclusive package deals',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: '24/7 customer support throughout your wedding journey',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Heart,
      title: 'Perfect Matches',
      description: 'AI-powered matching to find your ideal wedding team',
      color: 'from-rose-500 to-pink-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah & Michael',
      location: 'Los Angeles, CA',
      image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
      quote: 'B. Remembered made our wedding planning so much easier. We found our perfect team all in one place!',
      rating: 5
    },
    {
      name: 'Emily & James',
      location: 'San Francisco, CA',
      image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400',
      quote: 'The quality of vendors on this platform is incredible. Our wedding day was absolutely perfect!',
      rating: 5
    },
    {
      name: 'Jessica & David',
      location: 'San Diego, CA',
      image: 'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=400',
      quote: 'From booking to our wedding day, everything was flawless. Highly recommend B. Remembered!',
      rating: 5
    }
  ];

  const serviceCategories = [
    {
      name: 'Photography',
      description: 'Capture every precious moment',
      icon: Camera,
      color: 'from-rose-500 to-pink-500',
      count: '150+ vendors'
    },
    {
      name: 'Videography',
      description: 'Cinematic wedding films',
      icon: Video,
      color: 'from-amber-500 to-orange-500',
      count: '80+ vendors'
    },
    {
      name: 'DJ Services',
      description: 'Professional entertainment',
      icon: Music,
      color: 'from-emerald-500 to-teal-500',
      count: '120+ vendors'
    },
    {
      name: 'Coordination',
      description: 'Expert wedding planning',
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      count: '60+ vendors'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Your Perfect Wedding
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover and book amazing wedding vendors with our intelligent matching system. 
              From photography to coordination, we'll help you find your dream team.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mt-16">
            <div className="flex flex-col items-center text-white">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-white/80">Verified Vendors</div>
            </div>
            <div className="flex flex-col items-center text-white">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-white/80">Happy Couples</div>
            </div>
            <div className="flex flex-col items-center text-white">
              <div className="text-4xl font-bold mb-2">25%</div>
              <div className="text-white/80">Average Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose B. Remembered?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make wedding planning simple, secure, and stress-free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-8 text-center hover:shadow-xl transition-all duration-300 group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Wedding Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for your perfect day, all in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {serviceCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div className={`h-32 bg-gradient-to-br ${category.color} relative overflow-hidden`}>
                    <Icon className="absolute top-4 right-4 w-12 h-12 text-white/30" />
                    <div className="absolute bottom-4 left-4">
                      <Icon className="w-8 h-8 text-white mb-2" />
                      <h3 className="text-xl font-bold text-white">{category.name}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{category.count}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/search', { 
                          state: { 
                            filters: { serviceType: category.name.toLowerCase() } 
                          } 
                        })}
                      >
                        Browse
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your perfect wedding in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Tell Us Your Needs',
                description: 'Answer a few questions about your wedding vision and preferences',
                icon: Heart
              },
              {
                step: '02',
                title: 'Get Matched',
                description: 'Our AI finds the perfect vendors and packages for your style and budget',
                icon: Star
              },
              {
                step: '03',
                title: 'Book Securely',
                description: 'Reserve your date with our secure booking system and contract management',
                icon: Shield
              },
              {
                step: '04',
                title: 'Enjoy Your Day',
                description: 'Relax knowing every detail is handled by your professional wedding team',
                icon: CheckCircle
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">{step.step}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="primary" 
              size="lg" 
              icon={ArrowRight}
              onClick={() => navigate('/how-it-works')}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Stories from Real Couples
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how B. Remembered helped make their dream weddings come true
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-gray-600 mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-500 to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Planning Your Dream Wedding?
          </h2>
          <p className="text-xl text-white mb-8 opacity-90">
            Join thousands of couples who found their perfect wedding team through B. Remembered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white text-rose-600 hover:bg-gray-50"
              onClick={() => navigate('/search')}
            >
              Start Planning Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-rose-600"
              onClick={() => navigate('/how-it-works')}
            >
              Learn How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Questionnaire Modal */}
      <EmailCaptureModal
        isOpen={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
        onSave={handleQuestionnaireSave}
        onSkip={handleQuestionnaireSkip}
        selectedServices={questionnaireData.selectedServices}
        eventType={questionnaireData.eventType}
      />
    </div>
  );
};