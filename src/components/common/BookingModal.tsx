import React, { useState, useEffect } from 'react';
import { Search, Calendar, Camera, Video, Music, Users, Package, ArrowRight, Check, Clock, Star, X, MapPin, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface ServicePackage {
  id: string;
  service_type: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  coverage: any;
  hour_amount?: number;
  event_type?: string;
  lookup_key?: string;
}

interface LeadData {
  session_id: string;
  event_type?: string;
  selected_services: string[];
  hour_preferences?: string;
  coverage_preferences: string[];
  budget_range?: string;
  selected_packages: Record<string, any>;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [eventType, setEventType] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [preferenceType, setPreferenceType] = useState<'hours' | 'coverage' | ''>('');
  const [selectedHours, setSelectedHours] = useState<number>(0);
  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 10000});
  
  // Data from database
  const [availablePackages, setAvailablePackages] = useState<ServicePackage[]>([]);
  const [recommendedPackage, setRecommendedPackage] = useState<ServicePackage | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<Record<string, ServicePackage>>({});
  
  // Lead tracking
  const [sessionId, setSessionId] = useState<string>('');
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  // Generate session ID on mount
  useEffect(() => {
    const generateSessionId = () => {
      return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    };
    
    let id = localStorage.getItem('booking_session_id');
    if (!id) {
      id = generateSessionId();
      localStorage.setItem('booking_session_id', id);
    }
    setSessionId(id);
  }, []);

  // Initialize or fetch lead data
  useEffect(() => {
    if (!sessionId || !supabase) return;

    const initializeLead = async () => {
      try {
        // Try to get existing lead
        const { data: existingLead, error: fetchError } = await supabase
          .from('leads_information')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingLead) {
          setLeadData(existingLead);
          // Restore form state from database
          if (existingLead.event_type) setEventType(existingLead.event_type);
          if (existingLead.selected_services) setSelectedServices(existingLead.selected_services);
        } else {
          // Create new lead
          const newLead = {
            session_id: sessionId,
            selected_services: [],
            coverage_preferences: [],
            selected_packages: {}
          };

          const { data: createdLead, error: createError } = await supabase
            .from('leads_information')
            .insert(newLead)
            .select()
            .single();

          if (createError) throw createError;
          setLeadData(createdLead);
        }
      } catch (err) {
        console.error('Error initializing lead:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    };

    initializeLead();
  }, [sessionId]);

  // Record answer in database
  const recordAnswer = async (field: string, value: any) => {
    if (!supabase || !sessionId) return;

    try {
      const updateData = {
        [field]: value,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('leads_information')
        .update(updateData)
        .eq('session_id', sessionId);

      if (error) throw error;
      console.log(`Recorded ${field}:`, value);
    } catch (err) {
      console.error('Error recording answer:', err);
    }
  };

  // Step 1: Handle event type selection
  const handleEventTypeSelect = async (type: string) => {
    setEventType(type);
    await recordAnswer('event_type', type);
    
    // Filter packages by event type
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('service_packages')
          .select('*')
          .eq('status', 'approved')
          .eq('event_type', type);

        if (error) throw error;
        setAvailablePackages(data || []);
        console.log(`Found ${data?.length || 0} packages for event type: ${type}`);
      } catch (err) {
        console.error('Error filtering by event type:', err);
      }
    }
    
    setCurrentStep(2);
  };

  // Step 2: Handle service selection
  const handleServiceSelect = async (services: string[]) => {
    setSelectedServices(services);
    await recordAnswer('selected_services', services);
    
    // Filter packages by service lookup_key
    if (supabase && services.length > 0) {
      try {
        // Map service names to lookup keys
        const lookupKeyMap: Record<string, string> = {
          'Photography': 'photography',
          'Videography': 'videography',
          'DJ Services': 'dj',
          'Day-of Coordination': 'coordination',
          'Coordination': 'coordination',
          'Planning': 'planning'
        };

        const lookupKeys = services.map(service => lookupKeyMap[service] || service.toLowerCase());
        
        // Filter from existing packages
        const filteredPackages = availablePackages.filter(pkg => 
          lookupKeys.includes(pkg.lookup_key || '') || 
          services.includes(pkg.service_type)
        );

        setAvailablePackages(filteredPackages);
        console.log(`Filtered to ${filteredPackages.length} packages for services:`, services);
      } catch (err) {
        console.error('Error filtering by service:', err);
      }
    }
    
    setCurrentServiceIndex(0);
    setCurrentStep(3);
  };

  // Step 3: Handle preference type selection (hours vs coverage)
  const handlePreferenceTypeSelect = (type: 'hours' | 'coverage') => {
    setPreferenceType(type);
    setCurrentStep(4);
  };

  // Step 4a: Handle hours selection
  const handleHoursSelect = async (hours: number) => {
    setSelectedHours(hours);
    await recordAnswer('hour_preferences', hours.toString());
    
    // Filter packages by hour_amount (±1 range)
    const filteredPackages = availablePackages.filter(pkg => {
      if (!pkg.hour_amount) return false;
      const hourDiff = Math.abs(pkg.hour_amount - hours);
      return hourDiff <= 1;
    });

    // Sort by closest to target hours
    filteredPackages.sort((a, b) => {
      const diffA = Math.abs((a.hour_amount || 0) - hours);
      const diffB = Math.abs((b.hour_amount || 0) - hours);
      return diffA - diffB;
    });

    setAvailablePackages(filteredPackages);
    console.log(`Found ${filteredPackages.length} packages near ${hours} hours`);
    setCurrentStep(5);
  };

  // Step 4b: Handle coverage selection
  const handleCoverageSelect = async (coverage: string[]) => {
    setSelectedCoverage(coverage);
    await recordAnswer('coverage_preferences', coverage);
    
    // Filter packages by coverage.events
    const filteredPackages = availablePackages.filter(pkg => {
      if (!pkg.coverage || !pkg.coverage.events) return false;
      
      const packageEvents = pkg.coverage.events as string[];
      // Check if package includes all selected coverage items
      return coverage.every(item => 
        packageEvents.some(event => 
          event.toLowerCase().includes(item.toLowerCase()) ||
          item.toLowerCase().includes(event.toLowerCase())
        )
      );
    });

    setAvailablePackages(filteredPackages);
    console.log(`Found ${filteredPackages.length} packages with required coverage`);
    setCurrentStep(5);
  };

  // Step 5: Handle price range and select highest priced package
  const handlePriceRangeSelect = async (minPrice: number, maxPrice: number) => {
    setPriceRange({min: minPrice, max: maxPrice});
    await recordAnswer('budget_range', `${minPrice}-${maxPrice}`);
    
    // Filter packages within price range and select highest priced
    const filteredPackages = availablePackages.filter(pkg => 
      pkg.price >= minPrice && pkg.price <= maxPrice
    );

    const highestPricedPackage = filteredPackages.length > 0 
      ? filteredPackages.reduce((highest, current) => 
          current.price > highest.price ? current : highest
        )
      : null;

    setRecommendedPackage(highestPricedPackage);
    
    // Record recommended package
    if (highestPricedPackage) {
      const currentService = selectedServices[currentServiceIndex];
      const updatedPackages = {
        ...leadData?.selected_packages,
        [currentService]: {
          recommended: highestPricedPackage.id
        }
      };
      await recordAnswer('selected_packages', updatedPackages);
    }

    console.log('Recommended package:', highestPricedPackage?.name, 'at', highestPricedPackage?.price);
    setCurrentStep(6);
  };

  // Step 6: Handle package selection
  const handlePackageSelect = async (packageId: string) => {
    if (!recommendedPackage) return;
    
    const currentService = selectedServices[currentServiceIndex];
    
    // Record selected package
    const updatedPackages = {
      ...leadData?.selected_packages,
      [currentService]: {
        recommended: recommendedPackage.id,
        selected: packageId
      }
    };
    await recordAnswer('selected_packages', updatedPackages);
    
    // Store selected package
    setSelectedPackages(prev => ({
      ...prev,
      [currentService]: recommendedPackage
    }));

    // Check if more services to process
    if (currentServiceIndex < selectedServices.length - 1) {
      // Move to next service
      setCurrentServiceIndex(currentServiceIndex + 1);
      setPreferenceType('');
      setSelectedHours(0);
      setSelectedCoverage([]);
      
      // Reset available packages to original filtered set for next service
      if (supabase) {
        try {
          const lookupKeyMap: Record<string, string> = {
            'Photography': 'photography',
            'Videography': 'videography',
            'DJ Services': 'dj',
            'Day-of Coordination': 'coordination',
            'Coordination': 'coordination',
            'Planning': 'planning'
          };

          const nextService = selectedServices[currentServiceIndex + 1];
          const lookupKey = lookupKeyMap[nextService] || nextService.toLowerCase();
          
          const { data, error } = await supabase
            .from('service_packages')
            .select('*')
            .eq('status', 'approved')
            .eq('event_type', eventType)
            .or(`lookup_key.eq.${lookupKey},service_type.eq.${nextService}`);

          if (error) throw error;
          setAvailablePackages(data || []);
        } catch (err) {
          console.error('Error loading packages for next service:', err);
        }
      }
      
      setCurrentStep(3); // Back to preference type selection
    } else {
      // All services completed
      onClose();
      navigate('/booking/event-details', {
        state: {
          selectedServices,
          selectedPackages,
          eventType
        }
      });
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setEventType('');
    setSelectedServices([]);
    setCurrentServiceIndex(0);
    setPreferenceType('');
    setSelectedHours(0);
    setSelectedCoverage([]);
    setPriceRange({min: 0, max: 10000});
    setAvailablePackages([]);
    setRecommendedPackage(null);
    setSelectedPackages({});
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const getCurrentService = () => selectedServices[currentServiceIndex];

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Photography': return Camera;
      case 'Videography': return Video;
      case 'DJ Services': return Music;
      case 'Day-of Coordination': 
      case 'Coordination': return Users;
      case 'Planning': return Calendar;
      default: return Package;
    }
  };

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
    { label: 'Under $1,000', min: 0, max: 100000 },
    { label: '$1,000 - $2,500', min: 100000, max: 250000 },
    { label: '$2,500 - $5,000', min: 250000, max: 500000 },
    { label: '$5,000 - $10,000', min: 500000, max: 1000000 },
    { label: 'Over $10,000', min: 1000000, max: 5000000 }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedServices.length > 1 && currentServiceIndex > 0 
                  ? `${getCurrentService()} Package Selection`
                  : 'Find Your Perfect Wedding Package'
                }
              </h2>
              {selectedServices.length > 1 && (
                <p className="text-gray-600 mt-1">
                  Service {currentServiceIndex + 1} of {selectedServices.length}: {getCurrentService()}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
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

          {/* Step 3: Preference Type Selection */}
          {currentStep === 3 && (
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                How would you like to choose your {getCurrentService()} package?
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
                How many hours of {getCurrentService().toLowerCase()} do you need?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                What's your budget for {getCurrentService().toLowerCase()}?
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {priceRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => handlePriceRangeSelect(range.min, range.max)}
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
              {recommendedPackage ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Perfect! We found your ideal {getCurrentService()} package
                  </h3>
                  
                  <Card className="p-6 mb-8 text-left bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">{recommendedPackage.name}</h4>
                        <p className="text-gray-600 mb-4">{recommendedPackage.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Service:</span>
                            <div className="font-medium">{recommendedPackage.service_type}</div>
                          </div>
                          {recommendedPackage.hour_amount && (
                            <div>
                              <span className="text-gray-600">Duration:</span>
                              <div className="font-medium">{recommendedPackage.hour_amount} hours</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(recommendedPackage.price)}
                        </div>
                      </div>
                    </div>
                    
                    {recommendedPackage.features && recommendedPackage.features.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Includes:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {recommendedPackage.features.slice(0, 6).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  <div className="space-y-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => handlePackageSelect(recommendedPackage.id)}
                      icon={ArrowRight}
                      className="w-full"
                    >
                      {selectedServices.length > 1 && currentServiceIndex < selectedServices.length - 1
                        ? `Select This Package & Continue to ${selectedServices[currentServiceIndex + 1]}`
                        : 'Select This Package'
                      }
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => setCurrentStep(5)}
                    >
                      See Other Options
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <X className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    No packages found
                  </h3>
                  <p className="text-gray-600 mb-8">
                    We couldn't find any {getCurrentService().toLowerCase()} packages matching your criteria. Try adjusting your preferences.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                  >
                    Try Different Preferences
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Finding your perfect packages...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={() => setError(null)}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};