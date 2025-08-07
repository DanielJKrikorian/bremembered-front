import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Clock, DollarSign, Calendar, Camera, Video, Music, Users, Package, Sparkles, Heart, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAnonymousLead } from '../../hooks/useAnonymousLead';
import { usePackageMatching } from '../../hooks/usePackageMatching';
import { EmailCaptureModal } from './EmailCaptureModal';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedHours, setSelectedHours] = useState('');
  const [selectedMoments, setSelectedMoments] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [recommendedPackage, setRecommendedPackage] = useState<any>(null);
  const [alternativePackages, setAlternativePackages] = useState<any[]>([]);
  
  const { lead, updateLead, saveEmail } = useAnonymousLead();

  // Use package matching hook
  const { matchedPackages, recommendedPackage: hookRecommendedPackage, loading } = usePackageMatching({
    serviceType: selectedService,
    eventType: selectedEventType,
    preferenceType: selectedService === 'Live Musician' ? 'coverage' : (selectedHours ? 'hours' : 'coverage'),
    preferenceValue: selectedService === 'Live Musician' ? selectedMoments : (selectedHours || selectedMoments),
    budgetRange: selectedBudget
  });

  // Update recommended package when hook data changes
  useEffect(() => {
    if (hookRecommendedPackage) {
      setRecommendedPackage(hookRecommendedPackage);
      // Set alternatives (other packages excluding the recommended one)
      const alternatives = matchedPackages.filter(pkg => pkg.id !== hookRecommendedPackage.id).slice(0, 3);
      setAlternativePackages(alternatives);
    }
  }, [hookRecommendedPackage, matchedPackages]);

  const services = [
    { id: 'Photography', name: 'Photography', icon: '📸', description: 'Capture every precious moment' },
    { id: 'Videography', name: 'Videography', icon: '🎥', description: 'Cinematic wedding films' },
    { id: 'DJ Services', name: 'DJ Services', icon: '🎧', description: 'Music and entertainment' },
    { id: 'Coordination', name: 'Coordination', icon: '📋', description: 'Day-of coordination' },
    { id: 'Live Musician', name: 'Live Musician', icon: '🎼', description: 'Live music for your ceremony' }
  ];

  const eventTypes = [
    { id: 'Wedding', name: 'Wedding', icon: '💒' },
    { id: 'Elopement', name: 'Elopement', icon: '💕' },
    { id: 'Engagement', name: 'Engagement Party', icon: '💍' },
    { id: 'Corporate', name: 'Corporate Event', icon: '🏢' }
  ];

  const hourOptions = [
    { value: '2', label: '2 Hours', description: 'Perfect for elopements' },
    { value: '4', label: '4 Hours', description: 'Ceremony + portraits' },
    { value: '6', label: '6 Hours', description: 'Half day coverage' },
    { value: '8', label: '8 Hours', description: 'Full day coverage' },
    { value: '10', label: '10+ Hours', description: 'Extended coverage' },
    { value: '1', label: '1 Hour', description: 'Perfect for ceremony or cocktail hour' }
  ];

  const momentOptions = [
    { id: 'ceremony', name: 'Ceremony', icon: '💒' },
    { id: 'reception', name: 'Reception', icon: '🎉' },
    { id: 'cocktail', name: 'Cocktail Hour', icon: '🍸' },
    { id: 'first-look', name: 'First Look', icon: '👀' },
    { id: 'getting-ready', name: 'Getting Ready', icon: '💄' },
    { id: 'portraits', name: 'Couple Portraits', icon: '💑' }
  ];

  const budgetRanges = [
    { value: '0-1000', label: 'Under $1,000', description: 'Musicians, photo booths, add-ons' },
    { value: '1000-1500', label: '$1,000 - $1,500', description: 'Budget-friendly packages' },
    { value: '1500-3000', label: '$1,500 - $3,000', description: 'Popular choice' },
    { value: '3000-5000', label: '$3,000 - $5,000', description: 'Premium services' },
    { value: '5000-999999', label: '$5,000+', description: 'Luxury experiences' }
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    updateLead?.({ selected_services: [serviceId], current_step: 2 });
  };

  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    updateLead?.({ event_type: eventType, current_step: 3 });
  };

  const handleHourSelect = (hours: string) => {
    setSelectedHours(hours);
    updateLead?.({ hour_preferences: hours, current_step: 4 });
  };

  const handleMomentToggle = (momentId: string) => {
    const newMoments = selectedMoments.includes(momentId)
      ? selectedMoments.filter(m => m !== momentId)
      : [...selectedMoments, momentId];
    setSelectedMoments(newMoments);
    updateLead?.({ coverage_preferences: newMoments });
  };

  const handleBudgetSelect = (budget: string) => {
    setSelectedBudget(budget);
    updateLead?.({ budget_range: budget, current_step: 5 });
  };

  const handleFinish = () => {
    setShowEmailCapture(true);
  };

  const handleEmailSave = async (email: string) => {
    await saveEmail?.(email);
    onClose();
    // Navigate to full booking flow or show success message
  };

  const handleEmailSkip = () => {
    onClose();
    // Navigate to full booking flow
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
    if (!coverage || typeof coverage !== 'object') return [];
    
    const events = [];
    if (coverage.events && Array.isArray(coverage.events)) {
      events.push(...coverage.events);
    }
    
    // Add other coverage properties if they exist
    Object.keys(coverage).forEach(key => {
      if (key !== 'events' && coverage[key] === true) {
        events.push(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    });
    
    return events;
  };

  const handleAlternativeSelect = (pkg: any) => {
    setRecommendedPackage(pkg);
    // Remove this package from alternatives and add the previous recommended package
    const newAlternatives = alternativePackages.filter(p => p.id !== pkg.id);
    if (recommendedPackage && !newAlternatives.find(p => p.id === recommendedPackage.id)) {
      newAlternatives.unshift(recommendedPackage);
    }
    setAlternativePackages(newAlternatives.slice(0, 3));
    
    // Scroll to top of modal to show the new recommendation
    const modalContent = document.querySelector('[data-modal-content]');
    if (modalContent) {
      modalContent.scrollTop = 0;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Find Your Perfect Package</h2>
              <p className="text-gray-600 mt-1">Step {currentStep} of 5</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${currentStep >= step 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 5 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]" data-modal-content>
            {/* Step 1: Service Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    What service are you looking for?
                  </h3>
                  <p className="text-gray-600">
                    Choose the main service you need for your special day
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceSelect(service.id)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${selectedService === service.id 
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{service.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                        {selectedService === service.id && (
                          <Check className="w-5 h-5 text-rose-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Event Type */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    What type of event is this?
                  </h3>
                  <p className="text-gray-600">
                    This helps us recommend the right package size and style
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {eventTypes.map((eventType) => (
                    <div
                      key={eventType.id}
                      onClick={() => handleEventTypeSelect(eventType.id)}
                      className={`
                        p-6 rounded-xl border-2 cursor-pointer transition-all text-center
                        ${selectedEventType === eventType.id 
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="text-4xl mb-3">{eventType.icon}</div>
                      <h4 className="font-semibold text-gray-900">{eventType.name}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Hours vs Moments Choice (skip for Live Musician) */}
            {currentStep === 3 && selectedService !== 'Live Musician' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    How would you like to choose your package?
                  </h3>
                  <p className="text-gray-600">
                    Select based on coverage hours or specific moments you want captured
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div
                    onClick={() => setCurrentStep(4)}
                    className="p-6 rounded-xl border-2 border-gray-200 hover:border-rose-300 bg-white cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                        <Clock className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Choose by Hours</h4>
                        <p className="text-sm text-gray-600">Select how many hours of coverage you need</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setCurrentStep(5)}
                    className="p-6 rounded-xl border-2 border-gray-200 hover:border-rose-300 bg-white cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                        <Heart className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Choose by Moments</h4>
                        <p className="text-sm text-gray-600">Select specific moments you want captured</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 for Live Musician: Auto-redirect to moments */}
            {currentStep === 3 && selectedService === 'Live Musician' && (
              <>
                {setCurrentStep(5)}
                {null}
              </>
            )}

            {/* Step 4: Hours Selection */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    How many hours do you need?
                  </h3>
                  <p className="text-gray-600">
                    Choose the coverage duration that fits your {selectedEventType.toLowerCase()}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {hourOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleHourSelect(option.value)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${selectedHours === option.value 
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{option.label}</h4>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                        {selectedHours === option.value && (
                          <Check className="w-5 h-5 text-rose-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Moments Selection */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {selectedService === 'Live Musician' 
                      ? 'Which moments need live music?'
                      : 'Which moments are most important?'
                    }
                  </h3>
                  <p className="text-gray-600">
                    {selectedService === 'Live Musician'
                      ? 'Select when you\'d like live music during your event'
                      : 'Select the key moments you want captured (choose multiple)'
                    }
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {momentOptions.map((moment) => {
                    const isSelected = selectedMoments.includes(moment.id);
                    return (
                      <div
                        key={moment.id}
                        onClick={() => handleMomentToggle(moment.id)}
                        className={`
                          p-4 rounded-xl border-2 cursor-pointer transition-all text-center
                          ${isSelected 
                            ? 'border-rose-500 bg-rose-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        <div className="text-2xl mb-2">{moment.icon}</div>
                        <h4 className="font-medium text-gray-900 text-sm">{moment.name}</h4>
                        {isSelected && (
                          <Check className="w-4 h-4 text-rose-600 mx-auto mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    {selectedService === 'Live Musician' 
                      ? `${selectedMoments.length} moment${selectedMoments.length !== 1 ? 's' : ''} selected`
                      : `${selectedMoments.length} moment${selectedMoments.length !== 1 ? 's' : ''} selected`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Budget Selection */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    What's your budget range?
                  </h3>
                  <p className="text-gray-600">
                    This helps us show you the most relevant options
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {budgetRanges.map((range) => (
                    <div
                      key={range.value}
                      onClick={() => handleBudgetSelect(range.value)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${selectedBudget === range.value 
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{range.label}</h4>
                          <p className="text-sm text-gray-600">{range.description}</p>
                        </div>
                        {selectedBudget === range.value && (
                          <Check className="w-5 h-5 text-rose-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Perfect Match */}
            {currentStep === 7 && (
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Finding your perfect match...</p>
                  </div>
                ) : recommendedPackage ? (
                  <>
                    {/* Perfect Match Header */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        🎉 We Found Your Perfect Match!
                      </h3>
                      <p className="text-gray-600">
                        Based on your preferences, here's our top recommendation
                      </p>
                    </div>

                    {/* Recommended Package */}
                    <Card className="p-6 border-2 border-rose-500 bg-gradient-to-br from-rose-50 to-amber-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-500 text-white">
                              ⭐ Recommended
                            </span>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{recommendedPackage.name}</h4>
                          <p className="text-gray-600 text-sm mb-3">{recommendedPackage.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(recommendedPackage.price)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {recommendedPackage.hour_amount && `${recommendedPackage.hour_amount} hours`}
                          </div>
                        </div>
                      </div>

                      {/* Why this is perfect for you */}
                      <div className="bg-white/70 rounded-lg p-4 mb-4">
                        <h5 className="font-semibold text-purple-900 mb-3">Why this is perfect for you:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">Perfect Coverage</div>
                              <div className="text-xs text-gray-600">
                                {selectedService === 'Live Musician' 
                                  ? `Covers your ${selectedMoments.join(', ')}`
                                  : selectedHours 
                                    ? `${selectedHours} hours coverage`
                                    : `Covers ${selectedMoments.length} key moments`
                                }
                              </div>
                            </div>
                          </div>
                          
                          {recommendedPackage.hour_amount && (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="w-3 h-3 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">Right Duration</div>
                                <div className="text-xs text-gray-600">{recommendedPackage.hour_amount} hours</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                              <DollarSign className="w-3 h-3 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">Within Budget</div>
                              <div className="text-xs text-gray-600">Matches your price range</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      {recommendedPackage.features && recommendedPackage.features.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">What's included:</h5>
                          <div className="flex flex-wrap gap-1">
                            {recommendedPackage.features.slice(0, 4).map((feature: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {feature}
                              </span>
                            ))}
                            {recommendedPackage.features.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                +{recommendedPackage.features.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <Button variant="primary" size="lg" className="w-full">
                        Choose This Package
                      </Button>
                    </Card>

                    {/* Other Great Options */}
                    {alternativePackages.length > 0 && (
                      <div>
                        <div className="flex items-center justify-center mb-4">
                          <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                            ✨ Other Great Options
                          </div>
                        </div>
                        <div className="space-y-3">
                          {alternativePackages.map((pkg) => {
                            const packageCoverage = getPackageCoverage(pkg.coverage || {});
                            
                            return (
                              <Card 
                                key={pkg.id} 
                                className="p-4 hover:shadow-lg transition-all cursor-pointer bg-white"
                                onClick={() => handleAlternativeSelect(pkg)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                                      {pkg.hour_amount && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {pkg.hour_amount}h
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{pkg.description}</p>
                                    
                                    {/* Features and Coverage */}
                                    <div className="flex flex-wrap gap-1">
                                      {pkg.features?.slice(0, 2).map((feature: string, index: number) => (
                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                          {feature}
                                        </span>
                                      ))}
                                      {packageCoverage.slice(0, 2).map((coverage, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                                          {coverage}
                                        </span>
                                      ))}
                                      {((pkg.features?.length || 0) + packageCoverage.length) > 4 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                          +{((pkg.features?.length || 0) + packageCoverage.length) - 4} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3 ml-4">
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-900">
                                        {formatPrice(pkg.price)}
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-gradient-to-r from-rose-500 to-amber-500 text-white border-0 hover:shadow-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAlternativeSelect(pkg);
                                      }}
                                    >
                                      Select
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
                    <p className="text-gray-600 mb-6">
                      We couldn't find packages matching your criteria. Try adjusting your preferences.
                    </p>
                    <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                      Go Back
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              {currentStep > 1 && (
                <Button variant="outline" icon={ArrowLeft} onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {currentStep < 7 && (
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => {
                    if (currentStep === 3 && selectedService === 'Live Musician') {
                      setCurrentStep(5); // Skip to moments for musicians
                    } else if (currentStep === 4 || currentStep === 5) {
                      setCurrentStep(7); // Skip budget for now, go to results
                    } else {
                      handleNext();
                    }
                  }}
                  disabled={
                    (currentStep === 1 && !selectedService) ||
                    (currentStep === 2 && !selectedEventType) ||
                    (currentStep === 4 && !selectedHours) ||
                    (currentStep === 5 && selectedMoments.length === 0) ||
                    (currentStep === 6 && !selectedBudget)
                  }
                >
                  {currentStep === 4 || currentStep === 5 ? 'Find My Package' : 'Continue'}
                </Button>
              )}
              
              {currentStep === 7 && recommendedPackage && (
                <Button variant="primary" onClick={handleFinish}>
                  Get My Recommendations
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSave={handleEmailSave}
        onSkip={handleEmailSkip}
      />
    </>
  );
};