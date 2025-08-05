import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, DollarSign, Camera, Check, Star, Sparkles, Eye, Grid, List } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { usePackageMatching } from '../../hooks/usePackageMatching';

export const PackageQuestionnaire: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const {
    step,
    filters,
    availablePackages,
    recommendedPackage,
    loading,
    error,
    selectedServices: matchingSelectedServices,
    currentServiceIndex,
    selectedPackages,
    completedServices,
    initializeServices,
    getCurrentService,
    areAllServicesCompleted,
    moveToNextService,
    setEventType,
    setServiceType,
    setPreferenceType,
    setHours,
    setCoverage,
    setPriceRange,
    selectRecommendedPackage
  } = usePackageMatching();

  // Get the search data from navigation state
  const selectedServices = searchParams.get('services')?.split(',') || [];
  const eventTypeFromUrl = searchParams.get('eventType') || 'Wedding';
  
  // Initialize services when component mounts
  React.useEffect(() => {
    if (selectedServices.length > 0 && matchingSelectedServices.length === 0) {
      initializeServices(selectedServices);
    }
  }, [selectedServices, matchingSelectedServices.length, initializeServices]);

  const currentService = getCurrentService() || selectedServices[0];
  const isMultipleServices = selectedServices.length > 1;

  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{min: number, max: number} | null>(null);

  const coverageOptions = [
    { id: 'Full Getting Ready', name: 'Getting Ready', description: 'Preparation and behind-the-scenes moments' },
    { id: 'First Look', name: 'First Look', description: 'Private moment before the ceremony' },
    { id: 'Ceremony', name: 'Ceremony', description: 'The main event and vows' },
    { id: 'Cocktail Hour', name: 'Cocktail Hour', description: 'Mingling and celebration' },
    { id: 'Introduction', name: 'Introduction', description: 'Grand entrance' },
    { id: 'First Dance', name: 'First Dance', description: 'Your special first dance' },
    { id: 'Speeches', name: 'Speeches', description: 'Toasts and speeches' },
    { id: 'Parent Dances', name: 'Parent Dances', description: 'Father-daughter, mother-son dances' },
    { id: 'Cake Cutting', name: 'Cake Cutting', description: 'Special cake moment' },
    { id: 'Dance Floor', name: 'Dance Floor', description: 'Reception dancing and celebration' },
    { id: 'Last Dance', name: 'Last Dance', description: 'Final dance of the evening' }
  ];

  const hourOptions = [
    { value: 3, label: '3 hours', description: 'Perfect for intimate ceremonies' },
    { value: 4, label: '4 hours', description: 'Perfect for intimate ceremonies' },
    { value: 5, label: '5 hours', description: 'Ceremony + cocktail hour' },
    { value: 6, label: '6 hours', description: 'Ceremony + reception coverage' },
    { value: 7, label: '7 hours', description: 'Extended ceremony coverage' },
    { value: 8, label: '8 hours', description: 'Full day coverage' },
    { value: 9, label: '9 hours', description: 'Extended day coverage' },
    { value: 10, label: '10 hours', description: 'Extended celebration coverage' },
    { value: 11, label: '11 hours', description: 'Nearly full day' },
    { value: 12, label: '12+ hours', description: 'Complete day documentation' }
  ];

  const budgetOptions = [
    { min: 0, max: 150000, label: 'Under $1,500', description: 'Budget-friendly options' },
    { min: 150000, max: 300000, label: '$1,500 - $3,000', description: 'Mid-range packages' },
    { min: 300000, max: 500000, label: '$3,000 - $5,000', description: 'Premium services' },
    { min: 500000, max: 1000000, label: '$5,000+', description: 'Luxury experiences' }
  ];

  // Initialize with event type if we haven't started yet
  React.useEffect(() => {
    if (step === 1 && eventTypeFromUrl && !filters.eventType) {
      setEventType(eventTypeFromUrl);
    }
  }, [step, eventTypeFromUrl, filters.eventType, setEventType]);

  const handleCoverageToggle = (coverageId: string) => {
    setSelectedCoverage(prev => 
      prev.includes(coverageId)
        ? prev.filter(id => id !== coverageId)
        : [...prev, coverageId]
    );
  };

  const handleServiceTypeSelect = () => {
    if (currentService) {
      setServiceType(currentService);
    }
  };

  const handleHoursSelect = (hours: number) => {
    setSelectedHours(hours);
    setHours(hours);
  };

  const handleCoverageSubmit = () => {
    if (selectedCoverage.length > 0) {
      setCoverage(selectedCoverage);
    }
  };

  const handlePriceSelect = (priceRange: {min: number, max: number}) => {
    setSelectedPriceRange(priceRange);
    setPriceRange(priceRange.min, priceRange.max);
  };

  // Helper function to get service icon
  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return Camera;
      case 'Videography': return Video;
      case 'DJ Services': return Music;
      case 'Coordination': 
      case 'Day-of Coordination': return Users;
      case 'Planning': return Calendar;
      default: return Sparkles;
    }
  };

  const handleSelectRecommended = () => {
    if (recommendedPackage) {
      selectRecommendedPackage(recommendedPackage.id);
      
      // Check if there are more services to process
      const isCompleted = moveToNextService();
      
      if (isCompleted || areAllServicesCompleted()) {
        // All services completed - go to vendor selection
        navigate('/booking/event-details', {
          state: {
            selectedPackages,
            selectedServices,
            allServicesCompleted: true
          }
        });
      } else {
        // More services to process - stay on questionnaire but reset for next service
        // The state will automatically update to show the next service
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const handleBack = () => {
    navigate(-1);
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
                Let's Find Your Perfect {currentService || 'Wedding'} Package
              </h1>
              <p className="text-gray-600 mt-1">
                Answer a few quick questions to get personalized recommendations
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${step >= stepNum 
                    ? 'bg-rose-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step > stepNum ? <Check className="w-5 h-5" /> : stepNum}
                </div>
                {stepNum < 5 && (
                  <div className={`w-20 h-1 mx-2 rounded-full transition-all ${
                    step > stepNum ? 'bg-rose-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question Steps */}
        {step === 2 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-rose-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Confirm Your Service Selection
              </h2>
              <p className="text-gray-600">
                We'll find {currentService} packages for your {filters.eventType?.toLowerCase()}
                {isMultipleServices && (
                  <span className="block mt-2 text-sm">
                    Service {currentServiceIndex + 1} of {selectedServices.length}
                  </span>
                )}
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center space-x-4 p-6 bg-white rounded-xl border-2 border-rose-200">
                <div className="text-2xl">📅</div>
                <div>
                  <div className="font-semibold text-gray-900">Event Type: {filters.eventType}</div>
                  <div className="text-gray-600">Service: {currentService}</div>
                  <div className="text-sm text-gray-500">{availablePackages.length} packages available</div>
                  {isMultipleServices && (
                    <div className="text-sm text-blue-600 mt-1">
                      Progress: {completedServices.length}/{selectedServices.length} services completed
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleServiceTypeSelect}
                disabled={loading}
                icon={ArrowRight}
              >
                {loading ? 'Loading...' : 'Continue'}
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                How would you like to choose your {currentService} package?
              </h2>
              <p className="text-gray-600">
                Choose the method that works best for you to find the perfect package
                {isMultipleServices && (
                  <span className="block mt-2 text-sm">
                    Step {currentServiceIndex + 1} of {selectedServices.length}: {currentService}
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div
                onClick={() => setPreferenceType('hours')}
                className="p-8 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-all text-center group"
              >
                <div className="w-16 h-16 bg-amber-100 group-hover:bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">I Know How Many Hours I Need</h3>
                <p className="text-gray-600 mb-4">Perfect if you have a specific timeline in mind</p>
                <div className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                  <strong>Best for:</strong> Couples who know their event schedule and want precise coverage duration
                </div>
              </div>
              
              <div
                onClick={() => setPreferenceType('coverage')}
                className="p-8 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all text-center group"
              >
                <div className="w-16 h-16 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <List className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">I Want to Choose by Moments</h3>
                <p className="text-gray-600 mb-4">Select the specific moments you want covered</p>
                <div className="text-sm text-purple-700 bg-purple-50 rounded-lg p-3">
                  <strong>Best for:</strong> Couples who want to focus on specific moments and events
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">
                💡 Don't worry - you can always discuss adjustments with your vendor later
              </p>
            </div>
          </Card>
        )}

        {step === 4 && filters.preferenceType === 'hours' && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                How many hours of coverage do you need?
              </h2>
              <p className="text-gray-600">
                Select the coverage duration that matches your {filters.eventType?.toLowerCase()} schedule
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {hourOptions.map((option) => {
                const isSelected = selectedHours === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleHoursSelect(option.value)}
                    className={`
                      relative p-6 rounded-lg border-2 cursor-pointer transition-all text-center
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
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
              <p className="text-sm text-gray-500">
                💡 We'll find packages with coverage close to your selected hours
              </p>
            </div>
          </Card>
        )}

        {step === 4 && filters.preferenceType === 'coverage' && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <List className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                What moments would you like covered?
              </h2>
              <p className="text-gray-600">
                Choose the specific moments that are most important to you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {coverageOptions.map((option) => {
                const isSelected = selectedCoverage.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => handleCoverageToggle(option.id)}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
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
                onClick={handleCoverageSubmit}
                disabled={selectedCoverage.length === 0}
                icon={ArrowRight}
              >
                Continue
              </Button>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  💡 We'll find packages that include all your selected moments
                </p>
              </div>
            </div>
          </Card>
        )}

        {step === 5 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                What's your budget for {currentService?.toLowerCase()}?
              </h2>
              <p className="text-gray-600">
                Select a budget range that works for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {budgetOptions.map((option) => {
                const isSelected = selectedPriceRange?.min === option.min && selectedPriceRange?.max === option.max;
                return (
                  <div
                    key={`${option.min}-${option.max}`}
                    onClick={() => handlePriceSelect({ min: option.min, max: option.max })}
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
          </Card>
        )}

        {/* Recommendation Step */}
        {step === 6 && (
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
                          <div className="text-rose-100 mb-6">Perfect match for your needs</div>
                          
                          <div className="space-y-3">
                            <Button
                              variant="secondary"
                              size="lg"
                              className="w-full bg-white text-black hover:bg-gray-50"
                              style={{ color: 'black' }}
                              onClick={handleSelectRecommended}
                            >
                              {isMultipleServices && !areAllServicesCompleted() 
                                ? `Select & Continue to ${selectedServices[currentServiceIndex + 1] || 'Next Service'}`
                                : 'Select This Package'
                              }
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full border-white text-white hover:bg-white hover:text-rose-600"
                              icon={Eye}
                              onClick={() => navigate('/booking/packages', {
                                state: {
                                  selectedServices,
                                  eventType: filters.eventType,
                                  availablePackages,
                                  currentServiceIndex,
                                  selectedPackages
                                }
                              })}
                            >
                              View Other Options
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Progress Indicator for Multiple Services */}
                {isMultipleServices && (
                  <Card className="p-6 bg-blue-50 border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">
                      Your Wedding Services Progress
                    </h3>
                    <div className="flex items-center justify-center space-x-4">
                      {selectedServices.map((service, index) => {
                        const isCompleted = completedServices.includes(service);
                        const isCurrent = index === currentServiceIndex;
                        const ServiceIcon = getServiceIcon(service);
                        
                        return (
                          <div key={service} className="flex items-center">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center transition-all
                              ${isCompleted 
                                ? 'bg-green-500 text-white' 
                                : isCurrent 
                                  ? 'bg-rose-500 text-white' 
                                  : 'bg-gray-200 text-gray-600'
                              }
                            `}>
                              {isCompleted ? <Check className="w-5 h-5" /> : <ServiceIcon className="w-5 h-5" />}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${
                              isCompleted ? 'text-green-600' : isCurrent ? 'text-rose-600' : 'text-gray-500'
                            }`}>
                              {service}
                            </span>
                            {index < selectedServices.length - 1 && (
                              <div className={`w-8 h-1 mx-4 rounded-full ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {completedServices.length > 0 && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-blue-800">
                          ✅ Completed: {completedServices.join(', ')}
                        </p>
                      </div>
                    )}
                  </Card>
                )}

                {/* Why This Package */}
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    Why we recommend this {currentService} package for you:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-blue-900">Perfect Match</div>
                        <div className="text-sm text-blue-700">Matches your preferences</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-blue-900">Best Value</div>
                        <div className="text-sm text-blue-700">Highest quality in your budget</div>
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
                  No packages match your criteria
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your preferences or contact us for custom options.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/booking/packages', {
                    state: {
                      selectedServices,
                      eventType: filters.eventType,
                      availablePackages
                    }
                  })}
                >
                  View All Available Packages
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="p-4 mt-8 bg-gray-100">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <div className="text-sm space-y-1">
              <div>Step: {step}</div>
              <div>Event Type: {filters.eventType}</div>
              <div>Service Type: {filters.serviceType}</div>
              <div>Preference Type: {filters.preferenceType}</div>
              <div>Available Packages: {availablePackages.length}</div>
              <div>Recommended: {recommendedPackage?.name || 'None'}</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};