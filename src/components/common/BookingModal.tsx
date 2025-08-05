import React, { useState, useEffect } from 'react';
import { Heart, Star, Camera, Video, Music, Users, ArrowRight, Shield, Clock, Award, Calendar, Sparkles, X, Check, Eye, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { EmailCaptureModal } from './EmailCaptureModal';
import { useBooking } from '../../context/BookingContext';
import { useAnonymousLead } from '../../hooks/useAnonymousLead';
import { useServicePackages } from '../../hooks/useSupabase';
import { ServicePackage } from '../../types/booking';

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

  // Anonymous lead tracking
  const { lead, updateLead, saveEmail, abandonLead } = useAnonymousLead();

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

  // Get service packages based on answers
  const shouldFetchPackages = currentStep === 6 && localSelectedServices.length > 0;
  const { packages, loading: packagesLoading } = useServicePackages(
    shouldFetchPackages ? localSelectedServices[0] : undefined,
    shouldFetchPackages ? selectedEventType : undefined,
    shouldFetchPackages ? {
      coverage: selectedCoverage,
      minHours: selectedHours ? parseInt(selectedHours) - 1 : undefined,
      maxHours: selectedHours ? parseInt(selectedHours) + 1 : undefined,
      minPrice: selectedBudget ? parseInt(selectedBudget.split('-')[0]) : undefined,
      maxPrice: selectedBudget ? parseInt(selectedBudget.split('-')[1]) : undefined,
      selectedServices: localSelectedServices
    } : undefined
  );

  // Set recommended package when packages are loaded
  useEffect(() => {
    if (packages && packages.length > 0 && !recommendedPackage) {
      setRecommendedPackage(packages[0]);
    }
  }, [packages, recommendedPackage]);

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
  }, [lead, selectedEventType, localSelectedServices, selectedCoverage, selectedHours, selectedBudget, currentStep, updateLead]);

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
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 6) {
      // Start matching process
      setIsMatching(true);
      setCurrentStep(7);
      
      // Update lead as starting matching process
      updateLead({
        current_step: 7
      });
      
      // Simulate matching delay
      setTimeout(() => {
        // Mock package matching logic
        const mockPackage = {
          id: 'recommended-1',
          name: 'Perfect Wedding Photography',
          description: 'Our most popular photography package, perfectly tailored to your preferences and budget.',
          price: selectedBudget === '0-150000' ? 120000 : 
                 selectedBudget === '150000-300000' ? 220000 :
                 selectedBudget === '300000-500000' ? 380000 : 480000,
          service_type: localSelectedServices[0],
          hour_amount: parseInt(selectedHours),
          features: [
            'High-resolution digital gallery',
            'Online sharing platform',
            'Print release included',
            selectedHours === '8' || selectedHours === '10' || selectedHours === '12' ? 'Engagement session' : null,
            selectedCoverage.includes('Getting Ready') ? 'Getting ready coverage' : null,
            selectedCoverage.includes('Reception') ? 'Reception coverage' : null
          ].filter(Boolean),
          coverage: {
            events: selectedCoverage
          },
          vendor: {
            name: 'Elegant Moments Photography',
            rating: 4.9,
            reviewCount: 127,
            experience: 8,
            avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
            portfolio: [
              'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=400'
            ]
          }
        };
        
        const topPackage = packages?.[0];
        setRecommendedPackage(topPackage);
        setMatchedPackage(mockPackage);
        setIsMatching(false);
        setCurrentStep(8);
        
        // Update lead with completion
        updateLead({
          current_step: 8,
          completed_at: new Date().toISOString()
        });
      }, 2000);
    }
  };

  const handlePrevQuestion = () => {
    if (currentStep > 1 && currentStep <= 6) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 8) {
      // Go back to budget question
      setCurrentStep(6);
      setMatchedPackage(null);
    }
  };

  const handleBookPackage = () => {
    if (recommendedPackage) {
      // Navigate to booking with the recommended package
      setSelectedServices(localSelectedServices);
      setEventType(selectedEventType);
      onClose();
      navigate('/booking/congratulations', {
        state: {
          selectedPackage: recommendedPackage,
          selectedServices: localSelectedServices,
          currentServiceIndex: 0,
          eventType: selectedEventType,
          preferences: {
            coverage: selectedCoverage,
            hours: selectedHours,
            budget: selectedBudget
          }
        }
      });
    }
  };

  const handleViewAllPackages = () => {
    // View all packages instead of the recommended one
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
    // Skip questionnaire and go directly to packages
    if (localSelectedServices.length > 0) {
      setSelectedServices(localSelectedServices);
      setEventType(selectedEventType);
      onClose();
      navigate('/booking/packages', {
        state: {
          selectedServices: localSelectedServices,
          eventType: selectedEventType
        }
      });
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    if (currentStep > 1 && !lead?.email) {
      setShowEmailCapture(true);
    } else {
      onClose();
      resetModal();
    }
  };

  // Handle email save
  const handleEmailSave = async (email: string) => {
    await saveEmail(email);
    setShowEmailCapture(false);
    onClose();
    resetModal();
  };

  // Handle email skip
  const handleEmailSkip = async () => {
    await abandonLead();
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
  };

  const canProceedQuestion = () => {
    switch (currentStep) {
      case 1: return selectedEventType !== '';
      case 2: return localSelectedServices.length > 0;
      case 3: return preferenceType !== '';
      case 4: return preferenceType === 'coverage' ? selectedCoverage.length > 0 : selectedHours !== '';
      case 5: return selectedBudget !== '';
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
      case 7: return 'Your perfect match!';
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
    
    // Add other coverage properties if they exist
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${currentStep === 7 ? 'max-w-4xl' : 'max-w-2xl'}`}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {getQuestionTitle()}
              </h3>
              {currentStep <= 5 && (
                <p className="text-sm text-gray-600 mt-1">
                  Question {currentStep} of 5
                </p>
              )}
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
            {currentStep === 1 && (
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

            {currentStep === 2 && (
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

            {currentStep === 3 && (
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

            {currentStep === 4 && (
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
                    disabled={!canProceedQuestion() || packagesLoading}
                    icon={ArrowRight}
                    className="px-8"
                  >
                    {packagesLoading ? 'Loading Packages...' : 'Find My Perfect Package'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Matching/Loading */}
            {currentStep === 6 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h4 className="text-3xl font-bold text-gray-900 mb-4">
                  Finding Your Perfect Match...
                </h4>
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                  We're analyzing hundreds of {localSelectedServices[0]?.toLowerCase()} packages to find your ideal match
                </p>
                
                <div className="space-y-4 max-w-sm mx-auto">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce"></div>
                    <span>Analyzing your preferences...</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span>Matching with verified vendors...</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    <span>Calculating best value...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Perfect Match Result */}
            {currentStep === 7 && (
              <div className="space-y-6">
                {recommendedPackage ? (
                  <>
                    {/* Success Header */}
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
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
                      {/* Recommended Badge */}
                      <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Sparkles className="w-5 h-5" />
                          <span className="font-semibold">Perfect Match for You</span>
                          <Sparkles className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{recommendedPackage.name}</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">{recommendedPackage.description}</p>
                            
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

                            <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                              <div className="flex items-center">
                                <Shield className="w-4 h-4 mr-1" />
                                <span>Verified vendors</span>
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
                                  variant="secondary"
                                  size="lg"
                                  className="w-full bg-white text-rose-600 hover:bg-gray-50"
                                  onClick={handleBookPackage}
                                >
                                  Book This Package
                                </Button>
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="w-full border-white text-white hover:bg-white hover:text-rose-600"
                                  icon={Eye}
                                  onClick={handleViewAllPackages}
                                >
                                  View Other Options
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Why Perfect Match */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">
                        Why this is perfect for you:
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
                            <div className="text-sm text-blue-700">
                              {recommendedPackage.hour_amount ? `${recommendedPackage.hour_amount} hours` : 'Perfect timing'}
                            </div>
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
                    </div>
                  </>
                ) : (
                  /* No Package Found */
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      How would you like to choose your package?
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      No Perfect Match Found
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Choose how you'd like to find your perfect {localSelectedServices[0]?.toLowerCase()} package
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
                    Question {currentStep} of 6
                  </div>
                )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                      onClick={() => setPreferenceType('hours')}
                      className={`
                        relative p-6 rounded-xl border-2 transition-all text-center
                        ${preferenceType === 'hours'
                          ? 'border-amber-500 bg-amber-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {preferenceType === 'hours' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="text-4xl mb-4">⏰</div>
                      <h5 className="text-lg font-semibold text-gray-900 mb-2">By Hours</h5>
                      <p className="text-sm text-gray-600">
                        Choose based on how many hours of coverage you need
                      </p>
                    </button>

                    <button
                      onClick={() => setPreferenceType('coverage')}
                      className={`
                        relative p-6 rounded-xl border-2 transition-all text-center
                        ${preferenceType === 'coverage'
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {preferenceType === 'coverage' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="text-4xl mb-4">📸</div>
                      <h5 className="text-lg font-semibold text-gray-900 mb-2">By Moments</h5>
                      <p className="text-sm text-gray-600">
                        Choose based on specific moments you want captured
                      </p>
                    </button>
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
        </div>
              {/* Step 8: Perfect Match Result */}
              {currentStep === 8 && (
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
                    {coverageOptions.map((option) => {
                      const isSelected = selectedCoverage.includes(option.id);
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