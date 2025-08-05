import React, { useState } from 'react';
import { Search, MapPin, Calendar, Camera, Video, Music, Users, CalendarDays, Package, ChevronDown, X, Clock, DollarSign, Check, Star, Sparkles, Eye, Grid, List, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { ServicePackage } from '../../types/booking';

interface SearchBarProps {
  onSearch?: (filters: any) => void;
  className?: string;
}

interface MatchingFilters {
  eventType?: string;
  serviceType?: string;
  preferenceType?: 'hours' | 'coverage';
  hours?: number;
  coverage?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

interface PackageMatchingState {
  step: number;
  filters: MatchingFilters;
  availablePackages: ServicePackage[];
  recommendedPackage: ServicePackage | null;
  loading: boolean;
  error: string | null;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = '' }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [eventType, setEventType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [completedServices, setCompletedServices] = useState<string[]>([]);
  
  // Package matching state
  const [matchingState, setMatchingState] = useState<PackageMatchingState>({
    step: 1,
    filters: {},
    availablePackages: [],
    recommendedPackage: null,
    loading: false,
    error: null
  });

  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{min: number, max: number} | null>(null);

  const serviceTypes = [
    { id: 'Photography', name: 'Photography', icon: Camera },
    { id: 'Engagement Photography', name: 'Engagement Photography', icon: Camera },
    { id: 'Videography', name: 'Videography', icon: Video },
    { id: 'DJ Services', name: 'DJ Services', icon: Music },
    { id: 'Coordination', name: 'Day-of Coordination', icon: Users },
    { id: 'Planning', name: 'Planning', icon: CalendarDays }
  ];

  const eventTypes = [
    'Wedding',
    'Proposal'
  ];

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

  // Helper function to get session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem('booking_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('booking_session_id', sessionId);
    }
    return sessionId;
  };

  // Helper function to record answers in leads_information
  const recordAnswer = async (field: string, value: any) => {
    if (!supabase) return;

    try {
      const sessionId = getSessionId();
      
      const updateData: Record<string, any> = {
        [field]: value,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('leads_information')
        .upsert({
          session_id: sessionId,
          ...updateData
        }, {
          onConflict: 'session_id'
        });

      if (error) {
        console.error('Failed to record answer:', error);
      } else {
        console.log(`Recorded ${field}:`, value);
      }
    } catch (err) {
      console.error('Error recording answer:', err);
    }
  };

  // Step 1: Filter by event type
  const setMatchingEventType = async (eventTypeValue: string) => {
    setMatchingState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      if (!supabase) {
        throw new Error('Supabase connection not available');
      }

      console.log('Step 1: Filtering by event type:', eventTypeValue);

      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('status', 'approved')
        .eq('event_type', eventTypeValue);

      if (error) throw error;

      console.log(`Found ${data.length} packages for event type: ${eventTypeValue}`);
      
      setMatchingState(prev => ({
        ...prev,
        step: 2,
        filters: { ...prev.filters, eventType: eventTypeValue },
        availablePackages: data || [],
        loading: false
      }));

      // Record this answer in leads_information
      await recordAnswer('event_type', eventTypeValue);

    } catch (err) {
      setMatchingState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by event type',
        loading: false
      }));
    }
  };

  // Step 2: Filter by service type using lookup_key
  const setServiceType = async (serviceType: string) => {
    setMatchingState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      if (!supabase) {
        throw new Error('Supabase connection not available');
      }

      // Map service types to lookup keys
      const lookupKeyMap: Record<string, string> = {
        'Photography': 'photography',
        'Engagement Photography': 'engagement',
        'Videography': 'videography',
        'DJ Services': 'dj',
        'Day-of Coordination': 'coordination',
        'Coordination': 'coordination',
        'Planning': 'planning',
        'Editing': 'editing'
      };

      const lookupKey = lookupKeyMap[serviceType] || serviceType.toLowerCase();
      console.log('Step 2: Filtering by service type:', serviceType, '-> lookup_key:', lookupKey);

      // Filter from existing available packages by lookup_key only
      const filteredPackages = matchingState.availablePackages.filter(pkg => {
        // Only match single-service packages and exact lookup_key match
        const hasMultipleServices = pkg.service_type && pkg.service_type.includes(',');
        const matchesLookupKey = pkg.lookup_key === lookupKey;
        
        console.log(`Package ${pkg.name}: service_type="${pkg.service_type}", lookup_key="${pkg.lookup_key}", hasMultiple=${hasMultipleServices}, matches=${matchesLookupKey}`);
        
        return !hasMultipleServices && matchesLookupKey;
      });

      console.log(`Filtered to ${filteredPackages.length} packages for service: ${serviceType}`);

      setMatchingState(prev => ({
        ...prev,
        step: 3,
        filters: { ...prev.filters, serviceType },
        availablePackages: filteredPackages,
        loading: false
      }));

      // Record this answer
      await recordAnswer('selected_services', [serviceType]);

    } catch (err) {
      setMatchingState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by service type',
        loading: false
      }));
    }
  };

  // Step 3: Set preference type (hours or coverage)
  const setPreferenceType = (preferenceType: 'hours' | 'coverage') => {
    setMatchingState(prev => ({
      ...prev,
      step: 4,
      filters: { ...prev.filters, preferenceType }
    }));
  };

  // Step 4a: Filter by hours (±1 range)
  const setHours = async (targetHours: number) => {
    setMatchingState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Step 4a: Filtering by hours around:', targetHours);

      // Find packages with hour_amount within ±1 of target
      const filteredPackages = matchingState.availablePackages.filter(pkg => {
        if (!pkg.hour_amount) return false;
        const hourDiff = Math.abs(pkg.hour_amount - targetHours);
        return hourDiff <= 1; // Within 1 hour of target
      });

      // Sort by how close they are to the target hours
      filteredPackages.sort((a, b) => {
        const diffA = Math.abs((a.hour_amount || 0) - targetHours);
        const diffB = Math.abs((b.hour_amount || 0) - targetHours);
        return diffA - diffB;
      });

      console.log(`Found ${filteredPackages.length} packages near ${targetHours} hours`);

      setMatchingState(prev => ({
        ...prev,
        step: 5,
        filters: { ...prev.filters, hours: targetHours },
        availablePackages: filteredPackages,
        loading: false
      }));

      // Record this answer
      await recordAnswer('hour_preferences', targetHours.toString());

    } catch (err) {
      setMatchingState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by hours',
        loading: false
      }));
    }
  };

  // Step 4b: Filter by coverage
  const setCoverage = async (selectedCoverageItems: string[]) => {
    setMatchingState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Step 4b: Filtering by coverage:', selectedCoverageItems);

      // Filter packages that have all selected coverage items in their coverage.events array
      const filteredPackages = matchingState.availablePackages.filter(pkg => {
        if (!pkg.coverage || !pkg.coverage.events) return false;
        
        const packageEvents = pkg.coverage.events as string[];
        // Check if package includes all selected coverage items
        return selectedCoverageItems.every(item => 
          packageEvents.includes(item)
        );
      });

      console.log(`Found ${filteredPackages.length} packages with required coverage`);

      setMatchingState(prev => ({
        ...prev,
        step: 5,
        filters: { ...prev.filters, coverage: selectedCoverageItems },
        availablePackages: filteredPackages,
        loading: false
      }));

      // Record this answer
      await recordAnswer('coverage_preferences', selectedCoverageItems);

    } catch (err) {
      setMatchingState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by coverage',
        loading: false
      }));
    }
  };

  // Step 5: Filter by price and select highest within range
  const setPriceRange = async (minPrice: number, maxPrice: number) => {
    setMatchingState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Step 5: Filtering by price range:', minPrice, 'to', maxPrice);

      // Filter packages within price range
      const filteredPackages = matchingState.availablePackages.filter(pkg => 
        pkg.price >= minPrice && pkg.price <= maxPrice
      );

      // Select the HIGHEST priced package within the range
      const recommendedPackage = filteredPackages.length > 0 
        ? filteredPackages.reduce((highest, current) => 
            current.price > highest.price ? current : highest
          )
        : null;

      console.log(`Found ${filteredPackages.length} packages in price range`);
      console.log('Recommended package (highest priced):', recommendedPackage?.name, 'at', recommendedPackage?.price);

      setMatchingState(prev => ({
        ...prev,
        step: 6,
        filters: { ...prev.filters, priceRange: { min: minPrice, max: maxPrice } },
        availablePackages: filteredPackages,
        recommendedPackage,
        loading: false
      }));

      // Record the price range and recommended package
      await recordAnswer('budget_range', `${minPrice}-${maxPrice}`);
      if (recommendedPackage) {
        await recordRecommendedPackage(recommendedPackage.id);
      }

    } catch (err) {
      setMatchingState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by price',
        loading: false
      }));
    }
  };

  // Record the recommended package ID
  const recordRecommendedPackage = async (packageId: string) => {
    if (!supabase) return;

    try {
      const sessionId = getSessionId();
      
      // Get current selected_packages or initialize empty object
      const { data: currentLead } = await supabase
        .from('leads_information')
        .select('selected_packages')
        .eq('session_id', sessionId)
        .single();

      const currentPackages = currentLead?.selected_packages || {};
      const currentService = getCurrentService();
      
      // Update the selected_packages with the recommended package for this service
      const updatedPackages = {
        ...currentPackages,
        [currentService]: {
          recommended: packageId
        }
      };

      const { error } = await supabase
        .from('leads_information')
        .update({
          selected_packages: updatedPackages,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to record recommended package:', error);
      } else {
        console.log('Recorded recommended package for', currentService, ':', packageId);
      }
    } catch (err) {
      console.error('Error recording recommended package:', err);
    }
  };

  // Record when user selects the recommended package
  const recordSelectedPackage = async (packageId: string) => {
    if (!supabase) return;

    try {
      const sessionId = getSessionId();
      const currentService = getCurrentService();
      
      // Get current selected_packages
      const { data: currentLead } = await supabase
        .from('leads_information')
        .select('selected_packages')
        .eq('session_id', sessionId)
        .single();

      const currentPackages = currentLead?.selected_packages || {};
      
      // Update with both recommended and selected for comparison
      const updatedPackages = {
        ...currentPackages,
        [currentService]: {
          ...currentPackages[currentService],
          selected: packageId
        }
      };

      const { error } = await supabase
        .from('leads_information')
        .update({
          selected_packages: updatedPackages,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to record selected package:', error);
      } else {
        console.log('Recorded selected package for', currentService, ':', packageId);
      }
    } catch (err) {
      console.error('Error recording selected package:', err);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleStartQuestionnaire = () => {
    if (selectedServices.length > 0 && eventType) {
      setShowModal(true);
      setCurrentServiceIndex(0);
      setCompletedServices([]);
      // Reset matching state and start with event type
      setMatchingState({
        step: 1,
        filters: {},
        availablePackages: [],
        recommendedPackage: null,
        loading: false,
        error: null
      });
      setMatchingEventType(eventType);
    }
  };

  const getCurrentService = () => {
    return selectedServices[currentServiceIndex];
  };

  const handleServiceTypeSelect = () => {
    const currentService = getCurrentService();
    if (currentService) {
      setServiceType(currentService);
    }
  };

  const handleCoverageToggle = (coverageId: string) => {
    setSelectedCoverage(prev => 
      prev.includes(coverageId)
        ? prev.filter(id => id !== coverageId)
        : [...prev, coverageId]
    );
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

  const handleSelectRecommended = async () => {
    if (matchingState.recommendedPackage) {
      await recordSelectedPackage(matchingState.recommendedPackage.id);
      
      // Mark current service as completed
      const currentService = getCurrentService();
      setCompletedServices(prev => [...prev, currentService]);
      
      // Check if there are more services
      if (currentServiceIndex < selectedServices.length - 1) {
        // Move to next service - reset to step 3 (preference type selection)
        setCurrentServiceIndex(prev => prev + 1);
        setSelectedCoverage([]);
        setSelectedHours(null);
        setSelectedPriceRange(null);
        
        // Reset the matching process for next service but keep event type
        setMatchingState({
          step: 3, // Start at preference type for next service
          filters: { eventType }, // Keep event type
          availablePackages: [], // Will be populated when we call setServiceType
          recommendedPackage: null,
          loading: false,
          error: null
        });
        
        // Automatically filter by the next service
        const nextService = selectedServices[currentServiceIndex + 1];
        setServiceType(nextService);
      } else {
        // All services completed, close modal and go to vendor selection
        setShowModal(false);
        window.location.href = '/booking/event-details';
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setMatchingState({
      step: 1,
      filters: {},
      availablePackages: [],
      recommendedPackage: null,
      loading: false,
      error: null
    });
    setCurrentServiceIndex(0);
    setCompletedServices([]);
    setSelectedCoverage([]);
    setSelectedHours(null);
    setSelectedPriceRange(null);
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
    const service = serviceTypes.find(s => s.id === serviceType);
    return service?.icon || Camera;
  };

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 ${className}`}>
        <div className="space-y-4 sm:space-y-6">
          {/* Event Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of event are you planning? <span className="text-gray-500 font-normal">(select one)</span>
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {eventTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setEventType(eventType === type ? '' : type)}
                  className={`
                    px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all border
                    ${eventType === type
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What services are you looking to book? <span className="text-gray-500 font-normal">(select all you'd like to book)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {serviceTypes.map((service) => {
                const Icon = service.icon;
                const isSelected = selectedServices.includes(service.id);
                
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceToggle(service.id)}
                    className={`
                      flex flex-col items-center p-2 sm:p-3 rounded-lg border-2 transition-all
                      ${isSelected 
                        ? 'border-rose-500 bg-rose-50 text-rose-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                    <span className="text-xs font-medium text-center leading-tight">{service.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center">
            <Button
              variant="primary"
              icon={Search}
              size={window.innerWidth < 640 ? "md" : "lg"}
              onClick={handleStartQuestionnaire}
              className="px-6 sm:px-12"
              disabled={selectedServices.length === 0 || !eventType}
            >
              Start Your Booking Journey
            </Button>
          </div>
                How would you like to choose your package?
      </div>

                Select your preferred way to narrow down the perfect package
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Find Your Perfect {getCurrentService()} Package
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Service {currentServiceIndex + 1} of {selectedServices.length}: {getCurrentService()}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Progress for Multiple Services */}
              {selectedServices.length > 1 && (
                <div className="mb-8">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    {selectedServices.map((service, index) => {
                      const ServiceIcon = getServiceIcon(service);
                      const isCompleted = completedServices.includes(service);
                      const isCurrent = index === currentServiceIndex;
                      
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
                          {index < selectedServices.length - 1 && (
                            <div className={`w-8 h-1 mx-2 rounded-full ${
                              isCompleted ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-center text-sm text-gray-600">
                    {completedServices.length} of {selectedServices.length} services completed
                  </p>
                </div>
              )}

              {/* Progress Steps for Current Service */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                {[1, 2, 3, 4, 5].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${matchingState.step >= stepNum 
                        ? 'bg-rose-500 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {matchingState.step > stepNum ? <Check className="w-5 h-5" /> : stepNum}
                    </div>
                    {stepNum < 5 && (
                      <div className={`w-20 h-1 mx-2 rounded-full transition-all ${
                        matchingState.step > stepNum ? 'bg-rose-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Question Steps */}
              {matchingState.step === 2 && (
                <Card className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-rose-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                      Confirm Your Service Selection
                    </h2>
                    <p className="text-gray-600">
                      We'll find {getCurrentService()} packages for your {matchingState.filters.eventType?.toLowerCase()}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center space-x-4 p-6 bg-white rounded-xl border-2 border-rose-200">
                      <div className="text-2xl">📅</div>
                      <div>
                        <div className="font-semibold text-gray-900">Event Type: {matchingState.filters.eventType}</div>
                        <div className="text-gray-600">Service: {getCurrentService()}</div>
                        <div className="text-sm text-gray-500">{matchingState.availablePackages.length} packages available</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-8">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleServiceTypeSelect}
                      disabled={matchingState.loading}
                      icon={ArrowRight}
                    >
                      {matchingState.loading ? 'Loading...' : 'Continue'}
                    </Button>
                  </div>
                </Card>
              )}

              {matchingState.step === 3 && (
                <Card className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Grid className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                      How would you like to choose your {getCurrentService()} package?
                    </h2>
                    <p className="text-gray-600">
                      Select your preferred way to narrow down the perfect package
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div
                      onClick={() => setPreferenceType('hours')}
                      className="p-8 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-all text-center"
                    >
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">By Hours</h3>
                      <p className="text-gray-600">Choose based on how many hours of coverage you need</p>
                    </div>
                    
                    <div
                      onClick={() => setPreferenceType('coverage')}
                      className="p-8 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-all text-center"
                    >
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <List className="w-8 h-8 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">By Coverage</h3>
                      <p className="text-gray-600">Choose based on specific moments you want captured</p>
                    </div>
                  </div>
                </Card>
              )}

              {matchingState.step === 4 && matchingState.filters.preferenceType === 'hours' && (
                <Card className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                      How many hours of {getCurrentService().toLowerCase()} do you need?
                    </h2>
                    <p className="text-gray-600">
                      Choose the duration that best fits your {matchingState.filters.eventType?.toLowerCase()} timeline
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
                </Card>
              )}

              {matchingState.step === 4 && matchingState.filters.preferenceType === 'coverage' && (
                <Card className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <List className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                      What moments would you like covered?
                    </h2>
                    <p className="text-gray-600">
                      Select all the moments you want captured during your {matchingState.filters.eventType?.toLowerCase()}
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
                  </div>
                </Card>
              )}

              {matchingState.step === 5 && (
                <Card className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                      What's your budget for {getCurrentService()?.toLowerCase()}?
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
              {matchingState.step === 6 && (
                <div className="space-y-8">
                  {matchingState.recommendedPackage ? (
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
                              <h3 className="text-3xl font-bold text-gray-900 mb-4">{matchingState.recommendedPackage.name}</h3>
                              <p className="text-gray-600 text-lg leading-relaxed mb-6">{matchingState.recommendedPackage.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">What's Included</h4>
                                  <div className="space-y-2">
                                    {matchingState.recommendedPackage.features?.slice(0, 4).map((feature, index) => (
                                      <div key={index} className="flex items-center space-x-2">
                                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{feature}</span>
                                      </div>
                                    ))}
                                    {(matchingState.recommendedPackage.features?.length || 0) > 4 && (
                                      <div className="text-sm text-gray-500">
                                        +{(matchingState.recommendedPackage.features?.length || 0) - 4} more features
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">Coverage</h4>
                                  <div className="space-y-2">
                                    {(matchingState.recommendedPackage.coverage?.events || []).slice(0, 4).map((event: string, index: number) => (
                                      <div key={index} className="flex items-center space-x-2">
                                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{event}</span>
                                      </div>
                                    ))}
                                    {(matchingState.recommendedPackage.coverage?.events?.length || 0) > 4 && (
                                      <div className="text-sm text-gray-500">
                                        +{(matchingState.recommendedPackage.coverage?.events?.length || 0) - 4} more events
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-6 text-sm text-gray-600">
                                {matchingState.recommendedPackage.hour_amount && (
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>{matchingState.recommendedPackage.hour_amount} hours</span>
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
                                  {formatPrice(matchingState.recommendedPackage.price)}
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
                                    {currentServiceIndex < selectedServices.length - 1 
                                      ? `Select & Continue to ${selectedServices[currentServiceIndex + 1]}`
                                      : 'Select This Package'
                                    }
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full border-white text-white hover:bg-white hover:text-rose-600"
                                    icon={Eye}
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
                          Why we recommend this {getCurrentService().toLowerCase()} package for you:
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
                        No {getCurrentService().toLowerCase()} packages match your criteria
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Try adjusting your preferences or contact us for custom options.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          // Skip this service and move to next
                          if (currentServiceIndex < selectedServices.length - 1) {
                            setCurrentServiceIndex(prev => prev + 1);
                            setMatchingState({
                              step: 3,
                              filters: { eventType },
                              availablePackages: [],
                              recommendedPackage: null,
                              loading: false,
                              error: null
                            });
                            const nextService = selectedServices[currentServiceIndex + 1];
                            setServiceType(nextService);
                          } else {
                            handleCloseModal();
                            window.location.href = '/booking/event-details';
                          }
                        }}
                      >
                        {currentServiceIndex < selectedServices.length - 1 
                          ? `Skip to ${selectedServices[currentServiceIndex + 1]}`
                          : 'Continue to Event Details'
                        }
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
                    <div>Current Service: {getCurrentService()} ({currentServiceIndex + 1}/{selectedServices.length})</div>
                    <div>Completed Services: {completedServices.join(', ')}</div>
                    <div>Step: {matchingState.step}</div>
                    <div>Event Type: {matchingState.filters.eventType}</div>
                    <div>Service Type: {matchingState.filters.serviceType}</div>
                    <div>Preference Type: {matchingState.filters.preferenceType}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div
                onClick={() => setPreferenceType('hours')}
                className="p-8 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-all text-center"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">By Hours</h3>
                <p className="text-gray-600">Choose based on how many hours of coverage you need</p>
              </div>
        {step === 4 && filters.preferenceType === 'coverage' && (
        {/* Step 4: Hours vs Coverage Selection */}
        {step === 4 && filters.preferenceType === 'hours' && (
          <div className="space-y-6">
                <List className="w-8 h-8 text-purple-600" />
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
                What moments would you like covered?
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                How many hours of coverage do you need?
                Select all the moments you want captured during your {filters.eventType?.toLowerCase()}
              <p className="text-gray-600">
                Choose the duration that best fits your {filters.eventType?.toLowerCase()} timeline
              </p>
            </div>
              {coverageOptions.map((option) => {
                const isSelected = selectedCoverage.includes(option.id);
              {hourOptions.map((option) => {
                const isSelected = selectedHours === option.value;
                    key={option.id}
                    onClick={() => handleCoverageToggle(option.id)}
                    key={option.value}
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all
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
                    <h3 className="font-medium text-gray-900 mb-1">{option.name}</h3>
                    )}
                    <div className="text-2xl font-bold text-gray-900 mb-2">{option.label}</div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                );

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
            </div>
              })}
        )}
          </div>
        </div>
      )}
    </>
  );
};