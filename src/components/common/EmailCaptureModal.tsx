import React, { useState } from 'react';
import { X, Mail, Save, Heart, Clock, DollarSign, Camera, Video, Music, Users, Calendar, Check, Star, Sparkles, Eye, Grid, List, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { usePackageMatching } from '../../hooks/usePackageMatching';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (email: string) => void;
  onSkip: () => void;
  selectedServices?: string[];
  eventType?: string;
}

export const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSkip,
  selectedServices = [],
  eventType = 'Wedding'
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const {
    step,
    filters,
    availablePackages,
    recommendedPackage,
    loading: matchingLoading,
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

  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{min: number, max: number} | null>(null);

  // Initialize services when modal opens
  React.useEffect(() => {
    if (isOpen && selectedServices.length > 0 && matchingSelectedServices.length === 0) {
      initializeServices(selectedServices);
      if (eventType) {
        setEventType(eventType);
      }
    }
  }, [isOpen, selectedServices, eventType, matchingSelectedServices.length, initializeServices, setEventType]);

  const currentService = getCurrentService() || selectedServices[0];
  const isMultipleServices = selectedServices.length > 1;

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

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      await onSave(email);
      onClose();
    } catch (error) {
      console.error('Error saving email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

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

  const handleSelectRecommended = () => {
    if (recommendedPackage) {
      selectRecommendedPackage(recommendedPackage.id);
      
      // Check if there are more services to process
      const isCompleted = moveToNextService();
      
      if (isCompleted || areAllServicesCompleted()) {
        // All services completed - show email capture
        setShowEmailCapture(true);
      } else {
        // More services to process - reset selections for next service
        setSelectedCoverage([]);
        setSelectedHours(null);
        setSelectedPriceRange(null);
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

  // Show email capture after all services are completed
  if (showEmailCapture) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <Card className="w-full max-w-md p-8 relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Perfect! Your Wedding Packages Are Ready
            </h3>
            <p className="text-gray-600">
              Save your progress and we'll connect you with the perfect vendors for each service.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              icon={Mail}
              required
            />
            
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSave}
                disabled={!email || loading}
                loading={loading}
                icon={Save}
              >
                Save & Find My Vendors
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleSkip}
              >
                Continue Without Saving
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Your Selected Packages:</h4>
            <div className="space-y-1">
              {Object.entries(selectedPackages).map(([service, packageData]) => (
                <div key={service} className="text-sm text-blue-800 flex items-center">
                  <Check className="w-3 h-3 mr-2 text-green-600" />
                  {service}: {packageData.selected ? 'Package Selected' : 'Recommended Package'}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </Card>
      </div>
    );
  }

  // Main questionnaire modal
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Let's Find Your Perfect {currentService || 'Wedding'} Package
          </h1>
          <p className="text-gray-600">
            Answer a few quick questions to get personalized recommendations
          </p>
          
          {/* Progress for Multiple Services */}
          {isMultipleServices && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Service {currentServiceIndex + 1} of {selectedServices.length}: {currentService}
              </h3>
              <div className="flex items-center space-x-2">
                {selectedServices.map((service, index) => {
                  const isCompleted = completedServices.includes(service);
                  const isCurrent = index === currentServiceIndex;
                  const ServiceIcon = getServiceIcon(service);
                  
                  return (
                    <div key={service} className="flex items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-all
                        ${isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }
                      `}>
                        {isCompleted ? <Check className="w-4 h-4" /> : <ServiceIcon className="w-4 h-4" />}
                      </div>
                      <span className={`ml-1 text-xs font-medium ${
                        isCompleted ? 'text-green-600' : isCurrent ? 'text-rose-600' : 'text-gray-500'
                      }`}>
                        {service}
                      </span>
                      {index < selectedServices.length - 1 && (
                        <div className={`w-4 h-0.5 mx-2 rounded-full ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Service Type Confirmation */}
        {step === 2 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Finding {currentService} packages for your {filters.eventType?.toLowerCase()}
            </h2>
            <p className="text-gray-600 mb-8">
              We found {availablePackages.length} packages available for you
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={handleServiceTypeSelect}
              disabled={matchingLoading}
              icon={ArrowRight}
            >
              {matchingLoading ? 'Loading...' : 'Continue'}
            </Button>
          </div>
        )}

        {/* Step 3: Choose Hours or Coverage */}
        {step === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Would you like to be matched based on the number of hours on site or coverage of events on the day?
            </h2>
            <p className="text-gray-600 mb-8">
              Choose how you'd like to find your perfect {currentService} package
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div
                onClick={() => setPreferenceType('hours')}
                className="p-8 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-all text-center group"
              >
                <div className="w-16 h-16 bg-amber-100 group-hover:bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Hours</h3>
                <p className="text-gray-600 mb-4">I know how many hours of coverage I need</p>
                <div className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                  <strong>Best for:</strong> Couples who have a specific timeline in mind
                </div>
              </div>
              
              <div
                onClick={() => setPreferenceType('coverage')}
                className="p-8 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all text-center group"
              >
                <div className="w-16 h-16 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <List className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Coverage</h3>
                <p className="text-gray-600 mb-4">I want to choose by specific moments/events</p>
                <div className="text-sm text-purple-700 bg-purple-50 rounded-lg p-3">
                  <strong>Best for:</strong> Couples who want to focus on specific events during the day
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <p className="text-sm text-gray-500">
                💡 Don't worry - you can always discuss adjustments with your vendor later
              </p>
            </div>
          </div>
        )}

        {/* Step 4a: Hours Selection */}
        {step === 4 && filters.preferenceType === 'hours' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How many hours of coverage do you need?
            </h2>
            <p className="text-gray-600 mb-8">
              Select the coverage duration that matches your {filters.eventType?.toLowerCase()} schedule
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {hourOptions.map((option) => {
                const isSelected = selectedHours === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleHoursSelect(option.value)}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-xl font-bold text-gray-900 mb-1">{option.label}</div>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8">
              <p className="text-sm text-gray-500">
                💡 We'll find packages with coverage close to your selected hours
              </p>
            </div>
          </div>
        )}

        {/* Step 4b: Coverage Selection */}
        {step === 4 && filters.preferenceType === 'coverage' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <List className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What moments would you like covered?
            </h2>
            <p className="text-gray-600 mb-8">
              Choose the specific moments that are most important to you
            </p>

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
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
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
          </div>
        )}

        {/* Step 5: Price Selection */}
        {step === 5 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What's your budget for {currentService?.toLowerCase()}?
            </h2>
            <p className="text-gray-600 mb-8">
              Select a budget range that works for you
            </p>

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
          </div>
        )}

        {/* Step 6: Package Recommendation */}
        {step === 6 && (
          <div className="space-y-6">
            {recommendedPackage ? (
              <>
                {/* Recommended Package */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Perfect Match Found!
                  </h2>
                  <p className="text-gray-600">
                    Based on your preferences, here's our top {currentService} recommendation
                  </p>
                </div>

                <Card className="p-6 border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-2xl font-bold text-gray-900">{recommendedPackage.name}</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-500 text-white">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Recommended
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatPrice(recommendedPackage.price)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">{recommendedPackage.description}</p>
                  
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
                      <h4 className="font-semibold text-gray-900 mb-3">Coverage Details</h4>
                      <div className="space-y-2">
                        {recommendedPackage.hour_amount && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700">{recommendedPackage.hour_amount} hours coverage</span>
                          </div>
                        )}
                        {(recommendedPackage.coverage?.events || []).slice(0, 3).map((event: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{event}</span>
                          </div>
                        ))}
                        {(recommendedPackage.coverage?.events?.length || 0) > 3 && (
                          <div className="text-sm text-gray-500">
                            +{(recommendedPackage.coverage?.events?.length || 0) - 3} more events
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSelectRecommended}
                      className="mr-4"
                    >
                      {isMultipleServices && !areAllServicesCompleted() 
                        ? `Select & Continue to ${selectedServices[currentServiceIndex + 1] || 'Next Service'}`
                        : 'Select This Package'
                      }
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                    >
                      View Other Options
                    </Button>
                  </div>
                </Card>

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
            ) : step === 6 && (
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
                  onClick={() => {
                    // Reset to step 3 to try again
                    setState(prev => ({ ...prev, step: 3 }));
                  }}
                >
                  Try Different Preferences
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Loading State */}
        {matchingLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Finding your perfect packages...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center bg-red-50 border-red-200">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Card>
        )}
      </Card>
    </div>
  );
};