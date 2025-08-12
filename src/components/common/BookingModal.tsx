import React, { useState, useEffect } from 'react';
import { Heart, Star, Camera, Video, Music, Users, ArrowRight, Shield, Clock, Award, Calendar, Sparkles, X, Check, Eye, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { EmailCaptureModal } from './EmailCaptureModal';
import { EventTypeStep } from '../booking/EventTypeStep';
import { ServiceSelectionStep } from '../booking/ServiceSelectionStep';
import { PreferenceTypeStep } from '../booking/PreferenceTypeStep';
import { PackageSummaryStep } from '../booking/PackageSummaryStep';
import { VenueSelectionStep } from '../booking/VenueSelectionStep';
import { DateTimeStep } from '../booking/DateTimeStep';
import { LanguageSelectionStep } from '../booking/LanguageSelectionStep';
import { StyleSelectionStep } from '../booking/StyleSelectionStep';
import { VibeSelectionStep } from '../booking/VibeSelectionStep';
import { VendorMatchingStep } from '../booking/VendorMatchingStep';
import { VendorRevealStep } from '../booking/VendorRevealStep';
import { useBooking } from '../../context/BookingContext';
import { useAnonymousLead } from '../../hooks/useAnonymousLead';
import { usePackageMatching, convertBudgetRange, convertCoverageToString } from '../../hooks/usePackageMatching';
import { useRecommendedVendors } from '../../hooks/useSupabase';
import { ServicePackage, Venue } from '../../types/booking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setSelectedServices, setEventType } = useBooking();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [localSelectedServices, setLocalSelectedServices] = useState<string[]>([]);
  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [preferenceType, setPreferenceType] = useState<'hours' | 'coverage' | ''>('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchedPackage, setMatchedPackage] = useState<any>(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [recommendedPackage, setRecommendedPackage] = useState<ServicePackage | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<ServicePackage[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  // Vendor questionnaire state
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<number[]>([]);

  // Vendor matching state
  const [isVendorMatching, setIsVendorMatching] = useState(false);
  const [recommendedVendors, setRecommendedVendors] = useState<any[]>([]);

  // Anonymous lead tracking
  const { lead, updateLead, saveEmail, abandonLead } = useAnonymousLead();

  const hourOptions = [
    { value: '2', label: '2 hours', description: 'Perfect for elopements' },
    { value: '4', label: '4 hours', description: 'Half-day coverage' },
    { value: '6', label: '6 hours', description: 'Most popular choice' },
    { value: '8', label: '8 hours', description: 'Full day coverage' },
    { value: '10', label: '10 hours', description: 'Extended celebration coverage' },
    { value: '12', label: '12+ hours', description: 'Complete day documentation' }
  ];

  const budgetOptions = [
    { value: '0-100000', label: 'Under $1,000', description: 'Musicians, photo booths, add-ons' },
    { value: '100000-150000', label: '$1,000 - $1,500', description: 'Budget-friendly packages' },
    { value: '150000-300000', label: '$1,500 - $3,000', description: 'Mid-range packages' },
    { value: '300000-500000', label: '$3,000 - $5,000', description: 'Premium services' },
    { value: '500000-1000000', label: '$5,000+', description: 'Luxury experiences' }
  ];

  // Get service packages based on answers
  const shouldMatch = currentStep >= 5 && localSelectedServices.length > 0 && selectedBudget && (preferenceType === 'hours' ? selectedHours : selectedCoverage.length > 0);
  
  const { matchedPackages, recommendedPackage: matchedRecommendedPackage, loading: packagesLoading } = usePackageMatching({
    serviceType: shouldMatch ? localSelectedServices[0] : '',
    eventType: shouldMatch ? selectedEventType : undefined,
    preferenceType: shouldMatch ? preferenceType : undefined,
    preferenceValue: shouldMatch ? (
      preferenceType === 'hours' ? selectedHours : 
      preferenceType === 'coverage' ? selectedCoverage : 
      undefined
    ) : undefined,
    budgetRange: shouldMatch ? selectedBudget : undefined
  });

  // Get recommended vendors when we have all the data
  const shouldMatchVendors = currentStep >= 15 && selectedPackages.length > 0 && eventDate && (selectedVenue || selectedRegion);
  
  const { vendors: matchedVendors, loading: vendorsLoading } = useRecommendedVendors({
    servicePackageId: shouldMatchVendors ? selectedPackages[0]?.id || '' : '',
    eventDate: shouldMatchVendors ? eventDate : '',
    region: shouldMatchVendors ? (selectedVenue?.region || selectedRegion) : undefined,
    languages: shouldMatchVendors ? selectedLanguages : undefined,
    styles: shouldMatchVendors ? selectedStyles : undefined,
    vibes: shouldMatchVendors ? selectedVibes : undefined
  });

  // Set recommended vendors when loaded
  useEffect(() => {
    if (matchedVendors && matchedVendors.length > 0 && !vendorsLoading) {
      setRecommendedVendors(matchedVendors);
    }
  }, [matchedVendors, vendorsLoading]);

  // Set recommended package when packages are loaded
  useEffect(() => {
    if (matchedRecommendedPackage && !packagesLoading) {
      setRecommendedPackage(matchedRecommendedPackage);
    } else if (matchedPackages && matchedPackages.length > 0 && !packagesLoading) {
      let bestPackage = matchedPackages[0];
      
      if (preferenceType === 'hours' && selectedHours) {
        const targetHours = parseInt(selectedHours);
        bestPackage = matchedPackages.reduce((best, current) => {
          const bestDiff = Math.abs((best.hour_amount || 0) - targetHours);
          const currentDiff = Math.abs((current.hour_amount || 0) - targetHours);
          return currentDiff < bestDiff ? current : best;
        });
      } else if (preferenceType === 'coverage' && selectedCoverage.length > 0) {
        bestPackage = matchedPackages.reduce((best, current) => {
          const bestCoverage = getPackageCoverage(best.coverage || {});
          const currentCoverage = getPackageCoverage(current.coverage || {});
          
          const bestMatches = selectedCoverage.filter(event => 
            bestCoverage.some(c => c.toLowerCase().includes(event.toLowerCase()))
          ).length;
          const currentMatches = selectedCoverage.filter(event => 
            currentCoverage.some(c => c.toLowerCase().includes(event.toLowerCase()))
          ).length;
          
          return currentMatches > bestMatches ? current : best;
        });
      }
      
      setRecommendedPackage(bestPackage);
    }
  }, [matchedPackages, matchedRecommendedPackage, packagesLoading, preferenceType, selectedHours, selectedCoverage]);

  // Update lead data when answers change
  useEffect(() => {
    if (lead && currentStep > 1) {
      updateLead({
        event_type: selectedEventType,
        selected_services: localSelectedServices,
        coverage_preferences: selectedCoverage,
        hour_preferences: selectedHours,
        budget_range: selectedBudget,
        current_step: currentStep
      });
    }
  }, [selectedEventType, localSelectedServices, selectedCoverage, selectedHours, selectedBudget, currentStep, lead, updateLead]);

  // Handle page/modal exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isOpen && currentStep > 1 && !lead?.email) {
        e.preventDefault();
        setShowEmailCapture(true);
        return '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isOpen && currentStep > 1 && !lead?.email) {
        setShowEmailCapture(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, currentStep, lead?.email]);

  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    setCurrentStep(2);
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
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 5) {
      // Start matching process
      setCurrentStep(6);
      
      // Auto-advance to results after 2 seconds
      setTimeout(() => {
        setCurrentStep(8);
      }, 2000);
    } else if (currentStep >= 9) {
      // Continue through vendor questionnaire
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookPackage = () => {
    if (recommendedPackage) {
      // Add package to selected packages and go to summary
      setSelectedPackages([recommendedPackage]);
      setCurrentStep(9); // Package summary step
    }
  };

  const handleViewAllPackages = () => {
    setSelectedServices(localSelectedServices);
    setEventType(selectedEventType);
    onClose();
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
    if (localSelectedServices.length > 0) {
      setSelectedBudget('150000-300000');
      setPreferenceType('hours');
      setSelectedHours('6');
      setCurrentStep(6);
      
      setTimeout(() => {
        setCurrentStep(8);
      }, 2000);
    }
  };

  const handleContinueToVendors = () => {
    // Start vendor questionnaire  
    setCurrentStep(10); // Venue selection step
  };

  const handleAddMoreServices = () => {
    // Go back to service selection to add more
    setCurrentStep(2);
  };

  const handleLanguageToggle = (languageId: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageId)
        ? prev.filter(id => id !== languageId)
        : [...prev, languageId]
    );
  };

  const handleStyleToggle = (styleId: number) => {
    setSelectedStyles(prev => 
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const handleVibeToggle = (vibeId: number) => {
    setSelectedVibes(prev => 
      prev.includes(vibeId)
        ? prev.filter(id => id !== vibeId)
        : [...prev, vibeId]
    );
  };

  const handleFinalContinue = () => {
    // Start vendor matching process
    setCurrentStep(15); // Vendor matching step
    
    // Auto-advance to vendor results after 2 seconds
    setTimeout(() => {
      setCurrentStep(16);
    }, 2000);
  };

  const handleContinueToBooking = () => {
    // Close modal and navigate to final booking with all data
    setSelectedServices(localSelectedServices);
    setEventType(selectedEventType);
    onClose();
    navigate('/booking/final-booking', {
      state: {
        selectedPackages,
        selectedServices: localSelectedServices,
        eventType: selectedEventType,
        eventDate,
        eventTime,
        venue: selectedVenue,
        region: selectedVenue?.region || selectedRegion,
        languages: selectedLanguages,
        styles: selectedStyles,
        vibes: selectedVibes,
        recommendedVendors
      }
    });
  };

  const handleViewAllVendors = () => {
    // Close modal and navigate to vendor browsing with filters
    setSelectedServices(localSelectedServices);
    setEventType(selectedEventType);
    onClose();
    navigate('/booking/vendors', {
      state: {
        selectedPackages,
        selectedServices: localSelectedServices,
        eventType: selectedEventType,
        eventDate,
        eventTime,
        venue: selectedVenue,
        region: selectedVenue?.region || selectedRegion,
        languages: selectedLanguages,
        styles: selectedStyles,
        vibes: selectedVibes
      }
    });
  };

  const handleXButtonClick = () => {
    if (currentStep > 1 && !lead?.email && currentStep !== 6 && currentStep !== 7) {
      setShowEmailCapture(true);
    } else if (currentStep === 6 || currentStep === 7) {
      if (!lead?.email) {
        setShowEmailCapture(true);
      } else {
        handleCloseModal();
      }
    } else {
      handleCloseModal();
    }
  };

  const handleEmailSave = async (email: string) => {
    await saveEmail(email);
    setShowEmailCapture(false);
    handleCloseModal();
  };

  const handleEmailSkip = async () => {
    await abandonLead();
    setShowEmailCapture(false);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setShowEmailCapture(false);
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setCurrentStep(1);
    setSelectedEventType('');
    setLocalSelectedServices([]);
    setPreferenceType('');
    setSelectedCoverage([]);
    setSelectedHours('');
    setSelectedBudget('');
    setIsMatching(false);
    setMatchedPackage(null);
    setRecommendedPackage(null);
    setSelectedPackages([]);
    // Reset vendor questionnaire
    setSelectedVenue(null);
    setSelectedRegion('');
    setEventDate('');
    setEventTime('');
    setSelectedLanguages([]);
    setSelectedStyles([]);
    setSelectedVibes([]);
  };

  const canProceedQuestion = () => {
    switch (currentStep) {
      case 1: return selectedEventType !== '';
      case 2: return localSelectedServices.length > 0;
      case 3: return preferenceType !== '';
      case 4: return preferenceType === 'coverage' ? selectedCoverage.length > 0 : selectedHours !== '';
      case 5: return selectedBudget !== '';
      case 10: return selectedVenue || selectedRegion;
      case 11: return eventDate && eventTime;
      case 12: return selectedLanguages.length > 0;
      case 13: return selectedStyles.length > 0;
      case 14: return selectedVibes.length > 0;
      case 15: return true; // Vendor matching step
      case 16: return true; // Vendor reveal step
      default: return false;
    }
  };

  const getQuestionTitle = () => {
    switch (currentStep) {
      case 1: return 'What type of event?';
      case 2: return 'What services do you need?';
      case 3: return 'How would you like to choose?';
      case 4: return preferenceType === 'coverage' ? 'What moments to capture?' : 'How many hours?';
      case 5: return 'What\'s your budget?';
      case 6: return 'Finding your perfect match...';
      case 8: return 'Your perfect match!';
      case 9: return 'Your selected packages';
      case 10: return 'Where is your event?';
      case 11: return 'When is your event?';
      case 12: return 'Language preferences?';
      case 13: return 'What style do you love?';
      case 14: return 'What vibe are you going for?';
      case 15: return 'Finding your perfect vendors...';
      case 16: return 'Your perfect vendor matches!';
      default: return '';
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

  const getPackageCoverage = (coverage: Record<string, any>) => {
    if (!coverage || typeof coverage !== 'object') return [];
    
    const events = [];
    if (coverage.events && Array.isArray(coverage.events)) {
      events.push(...coverage.events);
    }
    
    Object.keys(coverage).forEach(key => {
      if (key !== 'events' && coverage[key] === true) {
        events.push(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    });
    
    return events;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && handleXButtonClick()}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${currentStep === 8 || currentStep === 9 ? 'max-w-4xl' : 'max-w-2xl'}`} data-modal-content>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {getQuestionTitle()}
              </h3>
              {(currentStep <= 6 || currentStep >= 10) && (
                <p className="text-sm text-gray-600 mt-1">
                  {currentStep <= 6 
                    ? `Question ${currentStep} of 6`
                    : currentStep < 16 ? `Step ${currentStep - 9} of 5` : ''
                  }
                </p>
              )}
            </div>
            <button
              onClick={handleXButtonClick}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {currentStep === 1 && (
              <EventTypeStep
                eventTypes={[
                  { id: 'Wedding', name: 'Wedding', emoji: '🎉' },
                  { id: 'Proposal', name: 'Proposal', emoji: '💍' }
                ]}
                selectedEventType={selectedEventType}
                onEventTypeSelect={handleEventTypeSelect}
              />
            )}

            {currentStep === 2 && (
              <ServiceSelectionStep
                serviceTypes={[
                  { id: 'Photography', name: 'Photography', icon: Camera, emoji: '📸' },
                  { id: 'Videography', name: 'Videography', icon: Video, emoji: '🎥' },
                  { id: 'DJ Services', name: 'DJ Services', icon: Music, emoji: '🎵' },
                  { id: 'Live Musician', name: 'Live Musician', icon: Music, emoji: '🎼' },
                  { id: 'Coordination', name: 'Day-of Coordination', icon: Users, emoji: '👰' },
                  { id: 'Planning', name: 'Planning', icon: Calendar, emoji: '📅' }
                ]}
                localSelectedServices={localSelectedServices}
                onServiceToggle={handleServiceToggle}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                onSkipToPackages={handleSkipToPackages}
                canProceed={canProceedQuestion()}
              />
            )}

            {currentStep === 3 && (
              <PreferenceTypeStep
                localSelectedServices={localSelectedServices}
                preferenceType={preferenceType}
                onPreferenceTypeSelect={setPreferenceType}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                canProceed={canProceedQuestion()}
              />
            )}

            {currentStep === 4 && preferenceType === 'coverage' && (
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
                  {[
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
                  ].map((option) => {
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
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 4 && preferenceType === 'hours' && (
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

            {currentStep === 5 && (
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
                    Find My Perfect Package
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Matching */}
            {currentStep === 6 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Finding Your Perfect Match...
                </h2>
                <p className="text-gray-600 text-lg mb-8">
                  We're analyzing hundreds of {localSelectedServices[0]} packages to find the one that's perfect for your {selectedEventType.toLowerCase()}
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Matching your preferences with available packages...
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setCurrentStep(8)}
                  icon={Heart}
                  className="px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  Click here to reveal your perfect match! ✨
                </Button>
              </div>
            )}

            {/* Step 8: Results */}
            {currentStep === 8 && (
              <div className="space-y-6">
                {recommendedPackage ? (
                  <>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        🎉 We Found Your Perfect Match!
                      </h2>
                      <p className="text-gray-600 text-lg">
                        Based on your preferences, here's the ideal {localSelectedServices[0]} package for your {selectedEventType.toLowerCase()}
                      </p>
                    </div>

                    {/* Package Card */}
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-rose-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                              {recommendedPackage.hour_amount && (
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  <span className="whitespace-nowrap">{recommendedPackage.hour_amount} hours</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="whitespace-nowrap">Top rated package</span>
                              </div>
                              <div className="flex items-center">
                                <Shield className="w-4 h-4 mr-1" />
                                <span className="whitespace-nowrap">Verified vendors</span>
                              </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{recommendedPackage.name}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">What's Included</h4>
                                <div className="space-y-1">
                                  {recommendedPackage.features?.slice(0, 4).map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
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
                                <h4 className="font-semibold text-gray-900 mb-2">Coverage</h4>
                                <div className="space-y-1">
                                  {getPackageCoverage(recommendedPackage.coverage || {}).slice(0, 4).map((event, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{event}</span>
                                    </div>
                                  ))}
                                  {getPackageCoverage(recommendedPackage.coverage || {}).length > 4 && (
                                    <div className="text-sm text-gray-500">
                                      +{getPackageCoverage(recommendedPackage.coverage || {}).length - 4} more events
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Price and Action */}
                          <div className="lg:w-1/3">
                            <div className="bg-gradient-to-br from-rose-500 to-amber-500 rounded-xl p-6 text-white text-center">
                              <div className="text-3xl font-bold mb-2">
                                {formatPrice(recommendedPackage.price)}
                              </div>
                              <div className="text-rose-100 mb-4">Perfect for your needs</div>
                              
                              <div className="space-y-3">
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="w-full border-white text-white hover:bg-white/10 text-sm leading-tight py-3"
                                  onClick={handleBookPackage}
                                >
                                  Select This<br />Package
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Other Great Options */}
                    {matchedPackages.length > 1 && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="inline-block bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-2 rounded-full">
                            <h3 className="text-lg font-semibold">Other Great Options</h3>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {matchedPackages
                            .filter(pkg => pkg.id !== recommendedPackage.id)
                            .slice(0, 2)
                            .map((pkg, index) => (
                              <div key={pkg.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 p-6 hover:border-rose-300 hover:shadow-lg transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-bold text-gray-900 text-lg">{pkg.name}</h4>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {formatPrice(pkg.price)}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-3 mb-4">
                                  <div>
                                    <h5 className="font-medium text-gray-700 mb-2 text-sm">Features</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {pkg.features?.slice(0, 2).map((feature, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                          {feature}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-700 mb-2 text-sm">Coverage</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {getPackageCoverage(pkg.coverage || {}).slice(0, 2).map((coverage, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                                          {coverage}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white border-0 hover:from-rose-600 hover:to-amber-600 group-hover:shadow-md transition-all"
                                  onClick={() => {
                                    setRecommendedPackage(pkg);
                                    const modal = document.querySelector('[data-modal-content]');
                                    if (modal) {
                                      modal.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                  }}
                                >
                                  Select This Package
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Browse All Packages Button */}
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={handleViewAllPackages}
                        icon={Eye}
                        className="px-6"
                      >
                        Browse All {localSelectedServices[0]} Packages
                      </Button>
                    </div>
                  </>
                ) : (
                  /* No Package Found */
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      No Perfect Match Found
                    </h2>
                    <p className="text-gray-600 mb-6">
                      We couldn't find a package that exactly matches your preferences, but we have other great options available.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(3)}
                      >
                        Adjust Preferences
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleViewAllPackages}
                      >
                        View All Packages
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 9: Package Summary */}
            {currentStep === 9 && (
              <PackageSummaryStep
                selectedPackages={selectedPackages}
                selectedServices={localSelectedServices}
                selectedEventType={selectedEventType}
                onContinueToVendors={handleContinueToVendors}
                onAddMoreServices={handleAddMoreServices}
                formatPrice={formatPrice}
              />
            )}

            {/* Step 10: Venue Selection */}
            {currentStep === 10 && (
              <VenueSelectionStep
                selectedVenue={selectedVenue}
                selectedRegion={selectedRegion}
                onVenueSelect={setSelectedVenue}
                onRegionSelect={setSelectedRegion}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                canProceed={canProceedQuestion()}
              />
            )}

            {/* Step 11: Date & Time */}
            {currentStep === 11 && (
              <DateTimeStep
                eventDate={eventDate}
                eventTime={eventTime}
                eventType={selectedEventType}
                onEventDateChange={setEventDate}
                onEventTimeChange={setEventTime}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                canProceed={canProceedQuestion()}
              />
            )}

            {/* Step 12: Language Selection */}
            {currentStep === 12 && (
              <LanguageSelectionStep
                selectedLanguages={selectedLanguages}
                onLanguageToggle={handleLanguageToggle}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                onSkip={() => setCurrentStep(13)}
                canProceed={canProceedQuestion()}
              />
            )}

            {/* Step 13: Style Selection */}
            {currentStep === 13 && (
              <StyleSelectionStep
                selectedStyles={selectedStyles}
                onStyleToggle={handleStyleToggle}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                onSkip={() => setCurrentStep(14)}
                canProceed={canProceedQuestion()}
              />
            )}

            {/* Step 14: Vibe Selection */}
            {currentStep === 14 && (
              <VibeSelectionStep
                selectedVibes={selectedVibes}
                eventType={selectedEventType}
                onVibeToggle={handleVibeToggle}
                onNext={handleFinalContinue}
                onPrev={handlePrevQuestion}
                onSkip={handleFinalContinue}
                canProceed={canProceedQuestion()}
              />
            )}

            {/* Step 15: Vendor Matching */}
            {currentStep === 15 && (
              <VendorMatchingStep
                selectedServices={localSelectedServices}
                selectedEventType={selectedEventType}
                onRevealVendors={() => setCurrentStep(16)}
              />
            )}

            {/* Step 16: Vendor Reveal */}
            {currentStep === 16 && (
              <VendorRevealStep
                selectedPackages={selectedPackages}
                selectedServices={localSelectedServices}
                selectedEventType={selectedEventType}
                vendors={recommendedVendors}
                onContinueToBooking={handleContinueToBooking}
                onViewAllVendors={handleViewAllVendors}
                formatPrice={formatPrice}
              />
            )}
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