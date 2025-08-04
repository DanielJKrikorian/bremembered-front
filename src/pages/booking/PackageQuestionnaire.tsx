import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, DollarSign, Camera, Check, Star, Sparkles, Eye } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useBooking } from '../../context/BookingContext';
import { useServicePackages } from '../../hooks/useSupabase';

export const PackageQuestionnaire: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state } = useBooking();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    coverage: [] as string[],
    hours: '',
    budget: ''
  });

  // Get the search data from navigation state
  const selectedServices = searchParams.get('services')?.split(',') || state.selectedServices || [];
  const eventType = searchParams.get('eventType') || state.eventType || 'Wedding';
  const currentService = selectedServices[0]; // Start with first service

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

  // Get recommended package based on answers
  const { packages } = useServicePackages(currentService, eventType, {
    coverage: answers.coverage,
    minHours: answers.hours ? parseInt(answers.hours) - 1 : undefined,
    maxHours: answers.hours ? parseInt(answers.hours) + 1 : undefined,
    minPrice: answers.budget ? parseInt(answers.budget.split('-')[0]) : undefined,
    maxPrice: answers.budget ? parseInt(answers.budget.split('-')[1]) : undefined
  });

  const recommendedPackage = packages[0]; // First package is the recommended one

  const handleCoverageToggle = (coverageId: string) => {
    setAnswers(prev => ({
      ...prev,
      coverage: prev.coverage.includes(coverageId)
        ? prev.coverage.filter(id => id !== coverageId)
        : [...prev.coverage, coverageId]
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleUnsure = () => {
    // Set default answers for 6-hour standard package
    setAnswers({
      coverage: ['Ceremony', 'Cocktail Hour', 'Reception'],
      hours: '6',
      budget: '150000-300000'
    });
    setCurrentStep(4); // Go directly to recommendation
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSelectRecommended = () => {
    if (recommendedPackage) {
      navigate('/booking/packages', {
        state: {
          selectedServices,
          eventType,
          preselectedPackage: recommendedPackage,
          fromQuestionnaire: true
        }
      });
    }
  };

  const handleViewAllOptions = () => {
    navigate('/booking/packages', {
      state: {
        selectedServices,
        eventType,
        filters: {
          coverage: answers.coverage,
          hours: answers.hours,
          budget: answers.budget
        }
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const getPackageCoverage = (coverage: Record<string, any>) => {
    return Object.keys(coverage).filter(key => coverage[key] === true);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return answers.coverage.length > 0;
      case 2: return answers.hours !== '';
      case 3: return answers.budget !== '';
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={handleBack}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Let's Find Your Perfect {currentService} Package
              </h1>
              <p className="text-gray-600 mt-1">
                Answer a few quick questions to get personalized recommendations
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${currentStep >= step 
                    ? 'bg-rose-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-20 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question Steps */}
        {currentStep === 1 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-rose-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                What moments would you like covered?
              </h2>
              <p className="text-gray-600">
                Select all the moments you want captured during your {eventType.toLowerCase()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {coverageOptions.map((option) => {
                const isSelected = answers.coverage.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => handleCoverageToggle(option.id)}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-rose-500 bg-rose-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <h3 className="font-medium text-gray-900 mb-1">{option.name}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                icon={ArrowRight}
              >
                Continue
              </Button>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={handleUnsure}
                >
                  I'm not sure - show me a standard package
                </Button>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                How many hours of coverage do you need?
              </h2>
              <p className="text-gray-600">
                Choose the duration that best fits your {eventType.toLowerCase()} timeline
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {hourOptions.map((option) => {
                const isSelected = answers.hours === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => setAnswers(prev => ({ ...prev, hours: option.value }))}
                    className={`
                      relative p-6 rounded-lg border-2 cursor-pointer transition-all text-center
                      ${isSelected 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-2xl font-bold text-gray-900 mb-2">{option.label}</div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                icon={ArrowRight}
              >
                Continue
              </Button>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={handleUnsure}
                >
                  I'm not sure - show me a standard package
                </Button>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 3 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                What's your budget for {currentService.toLowerCase()}?
              </h2>
              <p className="text-gray-600">
                Select a budget range that works for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {budgetOptions.map((option) => {
                const isSelected = answers.budget === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => setAnswers(prev => ({ ...prev, budget: option.value }))}
                    className={`
                      relative p-6 rounded-lg border-2 cursor-pointer transition-all text-center
                      ${isSelected 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-xl font-bold text-gray-900 mb-2">{option.label}</div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setCurrentStep(4)}
                disabled={!canProceed()}
                icon={ArrowRight}
              >
                Get My Recommendation
              </Button>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={handleUnsure}
                >
                  I'm not sure - show me a standard package
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Recommendation Step */}
        {currentStep === 4 && (
          <div className="space-y-8">
            {recommendedPackage ? (
              <>
                {/* Recommended Package */}
                <Card className="overflow-hidden relative">
                  {/* Recommended Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-4 py-2 rounded-full shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-semibold text-sm">Recommended for You</span>
                    </div>
                  </div>

                  <div className="p-8 pt-16">
                    <div className="flex flex-col lg:flex-row gap-8">
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">{recommendedPackage.name}</h3>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">{recommendedPackage.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">What's Included</h4>
                            <div className="space-y-2">
                              {recommendedPackage.features?.slice(0, 4).map((feature, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">{feature}</span>
                                </div>
                              ))}
                              {(recommendedPackage.features?.length || 0) > 4 && (
                                <div className="text-sm text-gray-500">
                                  +{(recommendedPackage.features?.length || 0) - 4} more features
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Coverage</h4>
                            <div className="space-y-2">
                              {(recommendedPackage.coverage?.events || []).slice(0, 4).map((event: string, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">{event}</span>
                                </div>
                              ))}
                              {(recommendedPackage.coverage?.events?.length || 0) > 4 && (
                                <div className="text-sm text-gray-500">
                                  +{(recommendedPackage.coverage?.events?.length || 0) - 4} more events
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          {recommendedPackage.hour_amount && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{recommendedPackage.hour_amount} hours</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span>Top rated package</span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-1/3">
                        <div className="bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl p-6 text-white text-center">
                          <div className="text-4xl font-bold mb-2">
                            {formatPrice(recommendedPackage.price)}
                          </div>
                          <div className="text-rose-100 mb-6">Perfect for your needs</div>
                          
                          <div className="space-y-3">
                            <Button
                              variant="secondary"
                              size="lg"
                             className="w-full bg-white text-black hover:bg-gray-50 hover:text-black"
                              onClick={() => navigate('/booking/congratulations', {
                                state: {
                                  selectedPackage: recommendedPackage,
                                  selectedServices,
                                  currentServiceIndex: 0
                                }
                              })}
                            >
                              Select This Package
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                             className="w-full border-white text-white hover:bg-white hover:text-rose-600"
                              icon={Eye}
                              onClick={handleViewAllOptions}
                            >
                              View Other Options
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Why This Package */}
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    Why we recommend this package for you:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-blue-900">Perfect Coverage</div>
                        <div className="text-sm text-blue-700">Matches your selected events</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-blue-900">Right Duration</div>
                        <div className="text-sm text-blue-700">Fits your timeline needs</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-blue-900">Within Budget</div>
                        <div className="text-sm text-blue-700">Matches your price range</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Finding your perfect package...
                </h3>
                <p className="text-gray-600 mb-6">
                  We're searching for packages that match your preferences.
                </p>
                <Button
                  variant="primary"
                  onClick={handleViewAllOptions}
                >
                  View All Available Packages
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};