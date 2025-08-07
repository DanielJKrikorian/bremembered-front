import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Clock, DollarSign, Users, Calendar, MapPin, Camera, Video, Music, Palette, Heart, Star, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useServicePackages, useLeadInformation } from '../../hooks/useSupabase';
import { usePackageMatching } from '../../hooks/usePackageMatching';
import { useAnonymousLead } from '../../hooks/useAnonymousLead';
import { EmailCaptureModal } from './EmailCaptureModal';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [eventType, setEventType] = useState('Wedding');
  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState<string>('');
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [selectedMoments, setSelectedMoments] = useState<string[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);

  // Use anonymous lead tracking
  const { lead, updateLead, saveEmail } = useAnonymousLead();
  
  // Get current service being processed
  const currentService = selectedServices[0]; // For now, handle one service at a time
  
  // Determine preference type and value based on current service and selections
  const getPreferenceType = () => {
    if (currentService === 'Live Musician' && selectedMoments.length > 0) {
      return 'coverage';
    }
    if (selectedHours) {
      return 'hours';
    }
    if (selectedCoverage.length > 0) {
      return 'coverage';
    }
    return undefined;
  };

  const getPreferenceValue = () => {
    if (currentService === 'Live Musician' && selectedMoments.length > 0) {
      return selectedMoments;
    }
    if (selectedHours) {
      return selectedHours;
    }
    if (selectedCoverage.length > 0) {
      return selectedCoverage;
    }
    return undefined;
  };

  // Get package recommendations
  const { recommendedPackage, matchedPackages, loading } = usePackageMatching({
    serviceType: currentService || '',
    eventType,
    preferenceType: getPreferenceType(),
    preferenceValue: getPreferenceValue(),
    budgetRange: selectedBudget
  });

  const services = [
    { 
      id: 'Photography', 
      name: 'Photography', 
      icon: Camera, 
      description: 'Capture every precious moment',
      color: 'from-rose-500 to-pink-500'
    },
    { 
      id: 'Videography', 
      name: 'Videography', 
      icon: Video, 
      description: 'Cinematic wedding films',
      color: 'from-amber-500 to-orange-500'
    },
    { 
      id: 'DJ Services', 
      name: 'DJ Services', 
      icon: Music, 
      description: 'Perfect soundtrack for your day',
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      id: 'Live Musician', 
      name: 'Live Musician', 
      icon: Music, 
      description: 'Live music for special moments',
      color: 'from-purple-500 to-indigo-500'
    },
    { 
      id: 'Coordination', 
      name: 'Coordination', 
      icon: Users, 
      description: 'Stress-free planning',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  const eventTypes = [
    { id: 'Wedding', name: 'Wedding', icon: '💒' },
    { id: 'Engagement', name: 'Engagement Party', icon: '💍' },
    { id: 'Corporate', name: 'Corporate Event', icon: '🏢' },
    { id: 'Other', name: 'Other Celebration', icon: '🎉' }
  ];

  const coverageOptions = [
    'Getting Ready',
    'First Look', 
    'Ceremony',
    'Cocktail Hour',
    'Reception',
    'Dancing',
    'Cake Cutting',
    'Send Off'
  ];

  const hourOptions = ['2', '4', '6', '8', '10', '12'];

  const budgetRanges = [
    '500-1500',
    '1500-3000', 
    '3000-5000',
    '5000-8000',
    '8000-15000',
    '15000+'
  ];

  const musicMoments = [
    { id: 'ceremony', name: 'Ceremony', description: 'Processional, recessional, and ceremony music' },
    { id: 'cocktail', name: 'Cocktail Hour', description: 'Background music during cocktails and mingling' }
  ];

  const formatBudgetRange = (range: string) => {
    if (range === '15000+') return '$15,000+';
    const [min, max] = range.split('-');
    return `$${parseInt(min).toLocaleString()} - $${parseInt(max).toLocaleString()}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCoverageToggle = (coverage: string) => {
    setSelectedCoverage(prev => 
      prev.includes(coverage)
        ? prev.filter(c => c !== coverage)
        : [...prev, coverage]
    );
  };

  const handleMomentToggle = (moment: string) => {
    setSelectedMoments(prev => 
      prev.includes(moment)
        ? prev.filter(m => m !== moment)
        : [...prev, moment]
    );
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      
      // Update lead information
      if (lead) {
        const updates: any = { current_step: currentStep + 1 };
        
        if (currentStep === 1) {
          updates.selected_services = selectedServices;
          updates.event_type = eventType;
        } else if (currentStep === 2) {
          if (currentService === 'Live Musician') {
            updates.coverage_preferences = selectedMoments;
          } else {
            updates.coverage_preferences = selectedCoverage;
          }
        } else if (currentStep === 3) {
          updates.hour_preferences = selectedHours;
        } else if (currentStep === 4) {
          updates.budget_range = selectedBudget;
        }
        
        updateLead(updates);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookPackage = () => {
    if (recommendedPackage) {
      setShowEmailModal(true);
    }
  };

  const handleEmailSave = async (email: string) => {
    await saveEmail(email);
    onClose();
    navigate('/booking/services');
  };

  const handleEmailSkip = () => {
    onClose();
    navigate('/booking/services');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedServices.length > 0;
      case 2: 
        if (currentService === 'Live Musician') {
          return selectedMoments.length > 0;
        }
        return selectedCoverage.length > 0;
      case 3: return selectedHours !== '';
      case 4: return selectedBudget !== '';
      default: return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'What services do you need?';
      case 2: 
        if (currentService === 'Live Musician') {
          return 'Which moments need live music?';
        }
        return 'What should we cover?';
      case 3: return 'How many hours of coverage?';
      case 4: return 'What\'s your budget range?';
      case 5: return 'We Found Your Perfect Match!';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Select the wedding services you\'re looking for';
      case 2: 
        if (currentService === 'Live Musician') {
          return 'Choose the special moments where you\'d like live music';
        }
        return 'Choose the moments you want captured';
      case 3: return 'How long do you need coverage for?';
      case 4: return 'Help us find options in your price range';
      case 5: return `Based on your preferences, here's the ideal ${currentService} package for your ${eventType.toLowerCase()}`;
      default: return '';
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedServices([]);
      setSelectedCoverage([]);
      setSelectedHours('');
      setSelectedBudget('');
      setSelectedMoments([]);
      setShowOtherOptions(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
              <p className="text-gray-600 mt-1">{getStepDescription()}</p>
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step {currentStep} of 5</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / 5) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-rose-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Step 1: Service Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => {
                    const Icon = service.icon;
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleServiceToggle(service.id)}
                        className={`
                          relative p-6 rounded-xl border-2 cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-rose-500 bg-rose-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What type of event?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {eventTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setEventType(type.id)}
                        className={`
                          p-4 rounded-lg border-2 transition-all text-center
                          ${eventType === type.id 
                            ? 'border-rose-500 bg-rose-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Coverage/Moments Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {currentService === 'Live Musician' ? (
                  <>
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Music className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Which moments need live music?
                      </h3>
                      <p className="text-gray-600">
                        Select the special moments where you'd like live musical accompaniment
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {musicMoments.map((moment) => {
                        const isSelected = selectedMoments.includes(moment.id);
                        return (
                          <div
                            key={moment.id}
                            onClick={() => handleMomentToggle(moment.id)}
                            className={`
                              relative p-6 rounded-xl border-2 cursor-pointer transition-all
                              ${isSelected 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{moment.name}</h3>
                            <p className="text-sm text-gray-600">{moment.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-8 h-8 text-rose-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        What should we cover?
                      </h3>
                      <p className="text-gray-600">
                        Select the moments you want captured during your {eventType.toLowerCase()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {coverageOptions.map((coverage) => {
                        const isSelected = selectedCoverage.includes(coverage);
                        return (
                          <button
                            key={coverage}
                            onClick={() => handleCoverageToggle(coverage)}
                            className={`
                              relative p-4 rounded-lg border-2 transition-all text-center
                              ${isSelected 
                                ? 'border-rose-500 bg-rose-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900">{coverage}</div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Hours Selection */}
            {currentStep === 3 && currentService !== 'Live Musician' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    How many hours of coverage?
                  </h3>
                  <p className="text-gray-600">
                    Choose the duration that fits your {eventType.toLowerCase()} timeline
                  </p>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {hourOptions.map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setSelectedHours(hours)}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-center
                        ${selectedHours === hours 
                          ? 'border-amber-500 bg-amber-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="text-2xl font-bold text-gray-900 mb-1">{hours}</div>
                      <div className="text-sm text-gray-600">hours</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Budget Selection */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    What's your budget range?
                  </h3>
                  <p className="text-gray-600">
                    Help us find {currentService?.toLowerCase()} options that fit your budget
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budgetRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => setSelectedBudget(range)}
                      className={`
                        p-6 rounded-lg border-2 transition-all text-center
                        ${selectedBudget === range 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        {formatBudgetRange(range)}
                      </div>
                      <div className="text-sm text-gray-600">Budget range</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Perfect Match */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    We Found Your Perfect Match!
                  </h3>
                  <p className="text-gray-600">
                    Based on your preferences, here's the ideal {currentService} package for your {eventType.toLowerCase()}
                  </p>
                </div>

                {/* Gradient Decoration */}
                <div className="h-2 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full mb-6"></div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Finding your perfect match...</p>
                  </div>
                ) : recommendedPackage ? (
                  <>
                    {/* Recommended Package */}
                    <Card className="p-6 border-2 border-rose-500 bg-gradient-to-br from-rose-50 to-amber-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-500 text-white">
                              ⭐ Recommended
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{recommendedPackage.name}</h3>
                          <p className="text-gray-600 mb-4">{recommendedPackage.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{recommendedPackage.hour_amount || selectedHours} hours</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span>{currentService}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(recommendedPackage.price)}
                          </div>
                          <div className="text-sm text-gray-500">Starting price</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">What's included:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {recommendedPackage.features?.slice(0, 6).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full mb-3"
                        onClick={handleBookPackage}
                      >
                        Book This Package
                      </Button>
                    </Card>

                    {/* Other Options */}
                    {matchedPackages.length > 1 && (
                      <div className="mt-6">
                        <button
                          onClick={() => setShowOtherOptions(!showOtherOptions)}
                          className="flex items-center justify-center space-x-2 w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-medium text-gray-900">
                            View {matchedPackages.length - 1} Other Great Options
                          </span>
                          {showOtherOptions ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </button>

                        {showOtherOptions && (
                          <div className="mt-4 space-y-4">
                            {matchedPackages.slice(1, 4).map((pkg) => (
                              <Card key={pkg.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">{pkg.name}</h4>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{pkg.description}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      {pkg.hour_amount && (
                                        <span className="flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {pkg.hour_amount}h
                                        </span>
                                      )}
                                      <span>{pkg.service_type}</span>
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="text-lg font-bold text-gray-900">
                                      {formatPrice(pkg.price)}
                                    </div>
                                    <Button variant="outline" size="sm" className="mt-2">
                                      Select
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
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
                      We couldn't find any {currentService?.toLowerCase()} packages matching your criteria. 
                      Try adjusting your preferences or contact us for custom options.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" onClick={handleBack}>
                        Adjust Preferences
                      </Button>
                      <Button variant="primary" onClick={() => navigate('/support')}>
                        Contact Support
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <Button variant="outline" icon={ArrowLeft} onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {currentStep < 5 && (
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  {currentStep === 4 ? 'Find My Match' : 'Continue'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSave={handleEmailSave}
        onSkip={handleEmailSkip}
      />
    </>
  );
};