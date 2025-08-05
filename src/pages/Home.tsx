import React, { useState } from 'react';
import { ArrowRight, Star, Heart, Calendar, Camera, Video, Music, Users, Package, Check, Clock, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SearchBar } from '../components/common/SearchBar';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [preferenceType, setPreferenceType] = useState<'hours' | 'coverage' | ''>('');
  const [selectedHours, setSelectedHours] = useState(0);
  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState('');

  const services = [
    { id: 'Photography', name: 'Photography', icon: Camera },
    { id: 'Videography', name: 'Videography', icon: Video },
    { id: 'DJ Services', name: 'DJ Services', icon: Music },
    { id: 'Day-of Coordination', name: 'Day-of Coordination', icon: Users },
    { id: 'Planning', name: 'Planning', icon: Calendar }
  ];

  const coverageOptions = [
    'Full Getting Ready',
    'First Look', 
    'Ceremony',
    'Cocktail Hour',
    'Introduction',
    'First Dance',
    'Speeches',
    'Parent Dances',
    'Cake Cutting',
    'Dance Floor',
    'Last Dance'
  ];

  const priceRanges = [
    { label: 'Under $1,000', value: '0-100000' },
    { label: '$1,000 - $2,500', value: '100000-250000' },
    { label: '$2,500 - $5,000', value: '250000-500000' },
    { label: '$5,000 - $10,000', value: '500000-1000000' },
    { label: 'Over $10,000', value: '1000000-5000000' }
  ];

  const handleEventTypeSelect = (type: string) => {
    setEventType(type);
    setCurrentStep(2);
  };

  const handleServiceSelect = (services: string[]) => {
    setSelectedServices(services);
    setCurrentStep(3);
  };

  const handlePreferenceTypeSelect = (type: 'hours' | 'coverage') => {
    setPreferenceType(type);
    setCurrentStep(4);
  };

  const handleHoursSelect = (hours: number) => {
    setSelectedHours(hours);
    setCurrentStep(5);
  };

  const handleCoverageSelect = (coverage: string[]) => {
    setSelectedCoverage(coverage);
    setCurrentStep(5);
  };

  const handlePriceRangeSelect = (range: string) => {
    setPriceRange(range);
    setCurrentStep(6);
  };

  const resetModal = () => {
    setCurrentStep(1);
    setEventType('');
    setSelectedServices([]);
    setPreferenceType('');
    setSelectedHours(0);
    setSelectedCoverage([]);
    setPriceRange('');
  };

  const openModal = () => {
    resetModal();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModal();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-amber-500/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Your Perfect Wedding
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
              Starts Here
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            Discover and book amazing wedding vendors in one place. From photography to coordination, 
            we'll help you create the perfect day with trusted professionals.
          </p>
          
          <div className="max-w-2xl mx-auto mb-12">
            <SearchBar />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              variant="primary" 
              size="lg" 
              icon={ArrowRight}
              onClick={openModal}
              className="px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              Start Your Booking Journey
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/how-it-works')}
              className="px-8 py-4 text-lg"
            >
              How It Works
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-500 mb-2">500+</div>
              <div className="text-gray-600">Verified Vendors</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-rose-500 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Couples</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-rose-500 mb-2">4.9</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
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
            {[
              {
                icon: Camera,
                title: 'Photography',
                description: 'Capture every precious moment',
                color: 'from-rose-500 to-pink-500'
              },
              {
                icon: Video,
                title: 'Videography',
                description: 'Cinematic wedding films',
                color: 'from-amber-500 to-orange-500'
              },
              {
                icon: Music,
                title: 'DJ Services',
                description: 'Keep the party going',
                color: 'from-emerald-500 to-teal-500'
              },
              {
                icon: Users,
                title: 'Coordination',
                description: 'Stress-free planning',
                color: 'from-purple-500 to-indigo-500'
              }
            ].map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-xl transition-all group cursor-pointer" onClick={() => navigate('/search')}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${service.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Booking Journey Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Find Your Perfect Wedding Package
                  </h2>
                  <p className="text-gray-600 mt-1">Step {currentStep} of 6</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-center space-x-2 mb-8">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentStep >= step ? 'bg-rose-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Step 1: Event Type */}
              {currentStep === 1 && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    What type of event are you planning?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Wedding', 'Proposal'].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleEventTypeSelect(type)}
                        className="p-6 border-2 border-gray-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all text-center group"
                      >
                        <div className="text-4xl mb-3">
                          {type === 'Wedding' ? '💒' : '💍'}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 group-hover:text-rose-600">
                          {type}
                        </h4>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 2 && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    What services do you need?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {services.map((service) => {
                      const Icon = service.icon;
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => {
                            const newServices = isSelected
                              ? selectedServices.filter(s => s !== service.id)
                              : [...selectedServices, service.id];
                            setSelectedServices(newServices);
                          }}
                          className={`p-4 border-2 rounded-xl transition-all text-left ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-rose-500' : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{service.name}</h4>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-rose-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => handleServiceSelect(selectedServices)}
                    disabled={selectedServices.length === 0}
                    icon={ArrowRight}
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Step 3: Hours vs Coverage Preference */}
              {currentStep === 3 && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    How would you like to choose your package?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={() => handlePreferenceTypeSelect('hours')}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all text-center group"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">By Hours</h4>
                      <p className="text-gray-600 text-sm">Choose based on coverage duration</p>
                    </button>
                    <button
                      onClick={() => handlePreferenceTypeSelect('coverage')}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all text-center group"
                    >
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
                        <Heart className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">By Coverage</h4>
                      <p className="text-gray-600 text-sm">Choose based on specific moments</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4a: Hours Selection */}
              {currentStep === 4 && preferenceType === 'hours' && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    How many hours do you need?
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[2, 4, 6, 8, 10, 12].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => handleHoursSelect(hours)}
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all text-center"
                      >
                        <div className="text-2xl font-bold text-gray-900 mb-1">{hours}</div>
                        <div className="text-sm text-gray-600">hours</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4b: Coverage Selection */}
              {currentStep === 4 && preferenceType === 'coverage' && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    What moments would you like covered?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                    {coverageOptions.map((coverage) => {
                      const isSelected = selectedCoverage.includes(coverage);
                      return (
                        <button
                          key={coverage}
                          onClick={() => {
                            const newCoverage = isSelected
                              ? selectedCoverage.filter(c => c !== coverage)
                              : [...selectedCoverage, coverage];
                            setSelectedCoverage(newCoverage);
                          }}
                          className={`p-3 border-2 rounded-lg transition-all text-left ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'border-rose-500 bg-rose-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{coverage}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => handleCoverageSelect(selectedCoverage)}
                    disabled={selectedCoverage.length === 0}
                    icon={ArrowRight}
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Step 5: Price Range */}
              {currentStep === 5 && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    What's your budget?
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {priceRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => handlePriceRangeSelect(range.value)}
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all text-center"
                      >
                        <div className="text-lg font-semibold text-gray-900">{range.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6: Package Recommendation */}
              {currentStep === 6 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Perfect! We found your ideal package
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Based on your preferences, here's our top recommendation
                  </p>
                  
                  <div className="space-y-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => {
                        closeModal();
                        navigate('/booking/event-details');
                      }}
                      icon={ArrowRight}
                      className="w-full"
                    >
                      Continue to Event Details
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={closeModal}
                    >
                      Browse All Options
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* How It Works Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your perfect wedding in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Search', description: 'Browse verified vendors', icon: Search },
              { step: '02', title: 'Compare', description: 'Read reviews & compare', icon: Star },
              { step: '03', title: 'Book', description: 'Secure your date', icon: Calendar },
              { step: '04', title: 'Celebrate', description: 'Enjoy your perfect day', icon: Heart }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-rose-600" />
                  </div>
                  <div className="text-sm font-bold text-rose-500 mb-2">{item.step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-500 to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Plan Your Dream Wedding?
          </h2>
          <p className="text-xl text-white mb-8 opacity-90">
            Join thousands of couples who found their perfect wedding team through B. Remembered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white text-rose-600 hover:bg-gray-50"
              onClick={openModal}
            >
              Start Planning Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-rose-600"
              onClick={() => navigate('/how-it-works')}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};