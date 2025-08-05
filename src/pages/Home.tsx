import React, { useState } from 'react';
import { Heart, Star, Camera, Video, Music, Users, ArrowRight, Shield, Clock, Award, Calendar, Sparkles, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ServiceCard } from '../components/booking/ServiceCard';
import { mockBundles } from '../lib/mockData';
import { useBooking } from '../context/BookingContext';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedServices, setEventType } = useBooking();
  const [showModal, setShowModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [localSelectedServices, setLocalSelectedServices] = useState<string[]>([]);
  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');

  const eventTypes = [
    { id: 'Wedding', name: 'Wedding', emoji: '🎉' },
    { id: 'Proposal', name: 'Proposal', emoji: '💍' }
  ];

  const serviceTypes = [
    { id: 'Photography', name: 'Photography', icon: Camera, emoji: '📸' },
    { id: 'Videography', name: 'Videography', icon: Video, emoji: '🎥' },
    { id: 'DJ Services', name: 'DJ Services', icon: Music, emoji: '🎵' },
    { id: 'Coordination', name: 'Day-of Coordination', icon: Users, emoji: '👰' },
    { id: 'Planning', name: 'Planning', icon: Calendar, emoji: '📅' }
  ];

  const coverageOptions = [
    { id: 'Getting Ready', name: 'Getting Ready', description: 'Preparation and behind-the-scenes moments' },
    { id: 'First Look', name: 'First Look', description: 'Private moment before the ceremony' },
    { id: 'Ceremony', name: 'Ceremony', description: 'The main event and vows' },
    { id: 'Cocktail Hour', name: 'Cocktail Hour', description: 'Mingling and celebration' },
    { id: 'Reception', name: 'Reception', description: 'Dinner, dancing, and festivities' },
    { id: 'Bridal Party', name: 'Bridal Party', description: 'Group photos with wedding party' },
    { id: 'Family Photos', name: 'Family Photos', description: 'Formal family portraits' },
    { id: 'Sunset Photos', name: 'Sunset Photos', description: 'Golden hour couple portraits' },
    { id: 'Dancing', name: 'Dancing', description: 'Reception dancing and celebration' },
    { id: 'Cake Cutting', name: 'Cake Cutting', description: 'Special cake moment' },
    { id: 'Send Off', name: 'Send Off', description: 'Grand exit celebration' }
  ];

  const hourOptions = [
    { value: '4', label: '4 hours', description: 'Perfect for intimate ceremonies' },
    { value: '6', label: '6 hours', description: 'Ceremony + reception coverage' },
    { value: '8', label: '8 hours', description: 'Full day coverage' },
    { value: '10', label: '10 hours', description: 'Extended celebration coverage' },
    { value: '12', label: '12+ hours', description: 'Complete day documentation' }
  ];

  const budgetOptions = [
    { value: '0-150000', label: 'Under $1,500', description: 'Budget-friendly options' },
    { value: '150000-300000', label: '$1,500 - $3,000', description: 'Mid-range packages' },
    { value: '300000-500000', label: '$3,000 - $5,000', description: 'Premium services' },
    { value: '500000-1000000', label: '$5,000+', description: 'Luxury experiences' }
  ];

  const handleStartBooking = () => {
    setShowModal(true);
    setCurrentQuestion(1);
    setSelectedEventType('');
    setLocalSelectedServices([]);
    setSelectedCoverage([]);
    setSelectedHours('');
    setSelectedBudget('');
  };

  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    setCurrentQuestion(2);
  };

  const handleServiceToggle = (serviceId: string) => {
    setLocalSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCoverageToggle = (coverageId: string) => {
    setSelectedCoverage(prev => 
      prev.includes(coverageId)
        ? prev.filter(id => id !== coverageId)
        : [...prev, coverageId]
    );
  };

  const handleNextQuestion = () => {
    if (currentQuestion < 5) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleContinue = () => {
    // Final step - navigate to packages with all collected data
    setSelectedServices(localSelectedServices);
    setEventType(selectedEventType);
    setShowModal(false);
    navigate('/booking/packages', {
      state: {
        selectedServices: localSelectedServices,
        eventType: selectedEventType,
        preferences: {
          coverage: selectedCoverage,
          hours: selectedHours,
          budget: selectedBudget
        }
      }
    });
  };

  const handleSkipToPackages = () => {
    // Skip questionnaire and go directly to packages
    if (localSelectedServices.length > 0) {
      setSelectedServices(localSelectedServices);
      setEventType(selectedEventType);
      setShowModal(false);
      navigate('/booking/packages', {
        state: {
          selectedServices: localSelectedServices,
          eventType: selectedEventType
        }
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentQuestion(1);
    setSelectedEventType('');
    setLocalSelectedServices([]);
    setSelectedCoverage([]);
    setSelectedHours('');
    setSelectedBudget('');
  };

  const canProceedQuestion = () => {
    switch (currentQuestion) {
      case 1: return selectedEventType !== '';
      case 2: return localSelectedServices.length > 0;
      case 3: return selectedCoverage.length > 0;
      case 4: return selectedHours !== '';
      case 5: return selectedBudget !== '';
      default: return false;
    }
  };

  const getQuestionTitle = () => {
    switch (currentQuestion) {
      case 1: return 'What type of event?';
      case 2: return 'What services do you need?';
      case 3: return 'What moments to capture?';
      case 4: return 'How many hours?';
      case 5: return 'What\'s your budget?';
      default: return '';
    }
  };

  const handleSearch = (filters: any) => {
    console.log('Search filters:', filters);
    
    // Set the booking context with search data
    if (filters.selectedServices && filters.selectedServices.length > 0) {
      setSelectedServices(filters.selectedServices);
    }
    if (filters.eventType) {
      setEventType(filters.eventType);
    }
    
    // Always go to booking flow when services are selected
    if (filters.selectedServices && filters.selectedServices.length > 0) {
      navigate('/booking/questionnaire', { 
        state: { 
          selectedServices: filters.selectedServices,
          eventType: filters.eventType,
        } 
      });
    } else {
      navigate('/search', { state: { filters } });
    }
  };

  const featuredBundles = mockBundles.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      {/* Hero Section */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-8">
        {/* Social Proof Banner */}
        <div className="text-center mb-8 px-4">
          <div className="inline-flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-full shadow-xl">
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="font-bold text-sm sm:text-lg">Over 500 couples found their perfect team this month!</span>
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Hero Content with Photo and Search */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Beautiful Wedding Photo */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Beautiful wedding ceremony"
                  className="w-full h-64 sm:h-80 lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 text-white">
                  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-2 sm:mb-4 leading-tight">
                    The Smarter Way to
                    <br />
                    <span className="text-rose-300">Book Weddings</span>
                  </h1>
                  <p className="text-sm sm:text-lg text-white/90 max-w-md">
                    Connect with verified vendors who will make your wedding day absolutely magical ✨
                  </p>
                </div>
              </div>
              
              {/* Floating elements for visual interest */}
              <div className="hidden lg:block absolute -top-4 -right-4 w-16 h-16 bg-rose-200 rounded-full opacity-60"></div>
              <div className="hidden lg:block absolute -bottom-6 -left-6 w-20 h-20 bg-amber-200 rounded-full opacity-40"></div>
            </div>

            {/* Right Side - Search Bar */}
            <div className="space-y-6 lg:space-y-8">
              <div className="text-center lg:text-left">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">
                  Ready to find your dream team? 💍
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mb-6 lg:mb-8">
                  Tell us what you need and we'll find the perfect vendors who will make your day unforgettable!
                </p>
              </div>
              
              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartBooking}
                  className="px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  Start Your Booking Journey ✨
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Just 2 quick questions to get started
                </p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center mt-12 sm:mt-16 lg:mt-20">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-rose-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-500 mb-1 sm:mb-2">100%</div>
              <div className="text-sm sm:text-base text-gray-600">Verified Vendors</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-500 mb-1 sm:mb-2">24/7</div>
              <div className="text-sm sm:text-base text-gray-600">Support Team</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-500 mb-1 sm:mb-2">4.9</div>
              <div className="text-sm sm:text-base text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything You Need for Your Perfect Day
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From capturing precious moments to coordinating every detail, our curated vendors bring your vision to life.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Camera, 
                title: 'Photography', 
                description: 'Capture every precious moment with artistic flair', 
                color: 'bg-rose-100 text-rose-600',
                features: ['Engagement shoots', 'Wedding day coverage', 'Digital galleries']
              },
              { 
                icon: Video, 
                title: 'Videography', 
                description: 'Cinematic wedding films that tell your story', 
                color: 'bg-amber-100 text-amber-600',
                features: ['Highlight reels', 'Full ceremony', 'Drone footage']
              },
              { 
                icon: Music, 
                title: 'DJ Services', 
                description: 'Keep the celebration alive with perfect music', 
                color: 'bg-emerald-100 text-emerald-600',
                features: ['Sound systems', 'Lighting', 'MC services']
              },
              { 
                icon: Users, 
                title: 'Coordination', 
                description: 'Stress-free planning from start to finish', 
                color: 'bg-purple-100 text-purple-600',
                features: ['Timeline planning', 'Vendor management', 'Day-of coordination']
              }
            ].map((service, index) => (
              <Card key={index} hover className="text-center p-6 group">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="text-sm text-gray-500 mb-6 space-y-1">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/booking/services')}
                >
                  Browse <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Bundles */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Wedding Packages
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Curated bundles from our top-rated vendors, designed to make your special day unforgettable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBundles.map((bundle) => (
              <ServiceCard
                key={bundle.id}
                bundle={bundle}
                onClick={() => navigate(`/bundle/${bundle.id}`)}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/booking/services')}
            >
              View All Packages
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How B. Remembered Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to your perfect wedding day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search & Discover',
                description: 'Browse our curated selection of wedding vendors and packages tailored to your location and style.',
                icon: '🔍'
              },
              {
                step: '02',
                title: 'Compare & Book',
                description: 'Compare packages, read reviews, and book your perfect wedding team with secure payment processing.',
                icon: '💝'
              },
              {
                step: '03',
                title: 'Celebrate & Remember',
                description: 'Work with your vendors to create unforgettable moments that will be remembered for a lifetime.',
                icon: '🎉'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-rose-600">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Love Stories from Real Couples
            </h2>
            <p className="text-xl text-gray-600">
              See what couples are saying about their B. Remembered experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah & Michael',
                location: 'Los Angeles, CA',
                review: 'B. Remembered made our wedding planning so much easier. We found our perfect photographer and DJ in one place, and the booking process was seamless.',
                rating: 5,
                image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400'
              },
              {
                name: 'Emily & James',
                location: 'San Francisco, CA',
                review: 'The quality of vendors on this platform is incredible. Our videographer captured our day perfectly, and the coordination service was flawless.',
                rating: 5,
                image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400'
              },
              {
                name: 'Jessica & David',
                location: 'San Diego, CA',
                review: 'From booking to our wedding day, everything was perfect. The vendors were professional, and the platform made everything so organized.',
                rating: 5,
                image: 'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=400'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.review}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Couples</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">500+</div>
              <div className="text-gray-600">Verified Vendors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">50+</div>
              <div className="text-gray-600">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">99%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
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
            Join thousands of couples who found their perfect wedding team through B. Remembered
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white border-white text-rose-600 hover:bg-gray-50 hover:text-rose-700"
              onClick={() => navigate('/booking/services')}
            >
              Browse Services
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-rose-600"
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {getQuestionTitle()}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Question {currentQuestion} of 5
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {currentQuestion === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">
                      What type of event are you planning?
                    </h4>
                    <p className="text-gray-600">
                      Choose the type of celebration you're planning
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {eventTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleEventTypeSelect(type.id)}
                        className="p-6 rounded-xl border-2 border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-center group"
                      >
                        <div className="text-4xl mb-3">{type.emoji}</div>
                        <h5 className="text-lg font-semibold text-gray-900 group-hover:text-rose-600">
                          {type.name}
                        </h5>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">
                      What services do you need?
                    </h4>
                    <p className="text-gray-600">
                      Select all the services you'd like to book (you can choose multiple)
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {serviceTypes.map((service) => {
                      const isSelected = localSelectedServices.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => handleServiceToggle(service.id)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected 
                              ? 'border-rose-500 bg-rose-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{service.emoji}</div>
                            <div>
                              <h5 className="font-semibold text-gray-900">{service.name}</h5>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleNextQuestion}
                      disabled={!canProceedQuestion()}
                      icon={ArrowRight}
                      className="px-8"
                    >
                      Continue
                    </Button>
                  </div>
                  
                  <div className="text-center pt-2">
                    <button
                      onClick={handleSkipToPackages}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                      disabled={localSelectedServices.length === 0}
                    >
                      Skip questions and go to packages
                    </button>
                  </div>
                </div>
              )}

              {currentQuestion === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">
                      What moments would you like covered?
                    </h4>
                    <p className="text-gray-600">
                      Select all the moments you want captured during your {selectedEventType.toLowerCase()}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {coverageOptions.map((option) => {
                      const isSelected = selectedCoverage.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleCoverageToggle(option.id)}
                          className={`
                            relative p-3 rounded-lg border-2 transition-all text-left
                            ${isSelected 
                              ? 'border-rose-500 bg-rose-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <h5 className="font-medium text-gray-900 text-sm">{option.name}</h5>
                          <p className="text-xs text-gray-600">{option.description}</p>
                        </button>
                      );
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleNextQuestion}
                      disabled={!canProceedQuestion()}
                      icon={ArrowRight}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {currentQuestion === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">
                      How many hours of coverage do you need?
                    </h4>
                    <p className="text-gray-600">
                      Choose the duration that best fits your {selectedEventType.toLowerCase()} timeline
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hourOptions.map((option) => {
                      const isSelected = selectedHours === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSelectedHours(option.value)}
                          className={`
                            relative p-4 rounded-lg border-2 transition-all text-center
                            ${isSelected 
                              ? 'border-amber-500 bg-amber-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="text-lg font-bold text-gray-900 mb-1">{option.label}</div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>
                    })}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleNextQuestion}
                      disabled={!canProceedQuestion()}
                      icon={ArrowRight}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {currentQuestion === 5 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">
                      What's your budget for {localSelectedServices[0]?.toLowerCase()}?
                    </h4>
                    <p className="text-gray-600">
                      Select a budget range that works for you
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {budgetOptions.map((option) => {
                      const isSelected = selectedBudget === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSelectedBudget(option.value)}
                          className={`
                            relative p-4 rounded-lg border-2 transition-all text-center
                            ${isSelected 
                              ? 'border-emerald-500 bg-emerald-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="text-lg font-bold text-gray-900 mb-1">{option.label}</div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleContinue}
                      disabled={!canProceedQuestion()}
                      icon={ArrowRight}
                      className="px-8"
                    >
                      Find My Perfect Packages
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};