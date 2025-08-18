import React, { useState, useEffect } from 'react';
import { X, Camera, Video, Music, Users, Calendar, ArrowRight, ArrowLeft, Check, Star, Sparkles, Package, Clock, Image, Download, Palette, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useServicePackages } from '../../hooks/useSupabase';
import { ServicePackage } from '../../types/booking';

interface CustomPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceOption {
  id: string;
  name: string;
  icon: any;
  emoji: string;
  description: string;
}

interface PackagePreferences {
  selectedServices: string[];
  hours: Record<string, number>;
  photoCount: Record<string, number>;
  rawPhotos: Record<string, boolean>;
  videoLength: Record<string, number>;
  additionalFeatures: Record<string, string[]>;
  budget: string;
  style: string[];
  vibe: string[];
}

export const CustomPackageModal: React.FC<CustomPackageModalProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [preferences, setPreferences] = useState<PackagePreferences>({
    selectedServices: [],
    hours: {},
    photoCount: {},
    rawPhotos: {},
    videoLength: {},
    additionalFeatures: {},
    budget: '',
    style: [],
    vibe: []
  });
  const [recommendedPackages, setRecommendedPackages] = useState<ServicePackage[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  // Get packages for matching
  const { packages } = useServicePackages();

  const serviceOptions: ServiceOption[] = [
    {
      id: 'Photography',
      name: 'Photography',
      icon: Camera,
      emoji: '📸',
      description: 'Professional wedding photography to capture every moment'
    },
    {
      id: 'Videography',
      name: 'Videography',
      icon: Video,
      emoji: '🎥',
      description: 'Cinematic wedding films and highlight reels'
    },
    {
      id: 'DJ Services',
      name: 'DJ Services',
      icon: Music,
      emoji: '🎵',
      description: 'Professional DJ and entertainment services'
    },
    {
      id: 'Live Musician',
      name: 'Live Musician',
      icon: Music,
      emoji: '🎼',
      description: 'Live musical performances for ceremony and reception'
    },
    {
      id: 'Coordination',
      name: 'Day-of Coordination',
      icon: Users,
      emoji: '👰',
      description: 'Professional coordination for your wedding day'
    },
    {
      id: 'Planning',
      name: 'Full Planning',
      icon: Calendar,
      emoji: '📅',
      description: 'Complete wedding planning from start to finish'
    }
  ];

  const hourOptions = [
    { value: 2, label: '2 hours', description: 'Perfect for elopements or small ceremonies' },
    { value: 4, label: '4 hours', description: 'Half-day coverage for intimate weddings' },
    { value: 6, label: '6 hours', description: 'Most popular - ceremony and reception' },
    { value: 8, label: '8 hours', description: 'Full day coverage with getting ready' },
    { value: 10, label: '10 hours', description: 'Extended coverage for large celebrations' },
    { value: 12, label: '12+ hours', description: 'Complete day documentation' }
  ];

  const photoCountOptions = [
    { value: 100, label: '100-200 photos', description: 'Essential moments captured' },
    { value: 300, label: '300-500 photos', description: 'Comprehensive coverage' },
    { value: 600, label: '600-800 photos', description: 'Extensive documentation' },
    { value: 1000, label: '1000+ photos', description: 'Every moment preserved' }
  ];

  const videoLengthOptions = [
    { value: 3, label: '3-5 minute highlight', description: 'Short cinematic summary' },
    { value: 10, label: '10-15 minute film', description: 'Extended highlight reel' },
    { value: 30, label: '30+ minute documentary', description: 'Full ceremony and reception' },
    { value: 60, label: 'Full raw footage', description: 'Complete unedited coverage' }
  ];

  const budgetOptions = [
    { value: '0-150000', label: 'Under $1,500', description: 'Budget-friendly options' },
    { value: '150000-300000', label: '$1,500 - $3,000', description: 'Mid-range packages' },
    { value: '300000-500000', label: '$3,000 - $5,000', description: 'Premium services' },
    { value: '500000-1000000', label: '$5,000+', description: 'Luxury experiences' }
  ];

  const styleOptions = [
    { id: 'Classic', name: 'Classic', description: 'Timeless and traditional' },
    { id: 'Modern', name: 'Modern', description: 'Contemporary and sleek' },
    { id: 'Artistic', name: 'Artistic', description: 'Creative and unique' },
    { id: 'Candid', name: 'Candid', description: 'Natural and spontaneous' },
    { id: 'Editorial', name: 'Editorial', description: 'Fashion-inspired' },
    { id: 'Fine Art', name: 'Fine Art', description: 'Museum-quality artistic vision' }
  ];

  const vibeOptions = [
    { id: 'Romantic', name: 'Romantic', description: 'Soft, dreamy, and intimate' },
    { id: 'Fun', name: 'Fun', description: 'Energetic and playful' },
    { id: 'Elegant', name: 'Elegant', description: 'Sophisticated and refined' },
    { id: 'Rustic', name: 'Rustic', description: 'Natural countryside charm' },
    { id: 'Boho', name: 'Boho', description: 'Free-spirited and artistic' },
    { id: 'Modern', name: 'Modern', description: 'Clean and contemporary' }
  ];

  const additionalFeatureOptions: Record<string, string[]> = {
    Photography: [
      'Engagement session',
      'Second photographer',
      'Print release',
      'USB drive with photos',
      'Online gallery',
      'Same-day preview',
      'Photo booth',
      'Drone photography'
    ],
    Videography: [
      'Drone footage',
      'Same-day edit',
      'Raw footage',
      'Multiple camera angles',
      'Audio recording',
      'Live streaming',
      'Documentary style',
      'Cinematic trailer'
    ],
    'DJ Services': [
      'Ceremony sound',
      'Wireless microphones',
      'Uplighting',
      'Photo booth',
      'MC services',
      'Custom playlist',
      'Dance floor lighting',
      'Backup equipment'
    ],
    'Live Musician': [
      'Ceremony music',
      'Cocktail hour performance',
      'Reception entertainment',
      'Custom song requests',
      'Sound equipment',
      'Multiple musicians',
      'Acoustic sets',
      'Special arrangements'
    ],
    Coordination: [
      'Rehearsal coordination',
      'Vendor management',
      'Timeline creation',
      'Emergency kit',
      'Setup supervision',
      'Guest assistance',
      'Cleanup coordination',
      'Day-of timeline'
    ],
    Planning: [
      'Venue selection',
      'Vendor sourcing',
      'Budget management',
      'Design consultation',
      'Contract review',
      'Timeline planning',
      'RSVP management',
      'Seating charts'
    ]
  };

  const handleServiceToggle = (serviceId: string) => {
    setPreferences(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(s => s !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const handleHoursChange = (service: string, hours: number) => {
    setPreferences(prev => ({
      ...prev,
      hours: { ...prev.hours, [service]: hours }
    }));
  };

  const handlePhotoCountChange = (service: string, count: number) => {
    setPreferences(prev => ({
      ...prev,
      photoCount: { ...prev.photoCount, [service]: count }
    }));
  };

  const handleRawPhotosToggle = (service: string, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      rawPhotos: { ...prev.rawPhotos, [service]: enabled }
    }));
  };

  const handleVideoLengthChange = (service: string, length: number) => {
    setPreferences(prev => ({
      ...prev,
      videoLength: { ...prev.videoLength, [service]: length }
    }));
  };

  const handleFeatureToggle = (service: string, feature: string) => {
    setPreferences(prev => ({
      ...prev,
      additionalFeatures: {
        ...prev.additionalFeatures,
        [service]: prev.additionalFeatures[service]?.includes(feature)
          ? prev.additionalFeatures[service].filter(f => f !== feature)
          : [...(prev.additionalFeatures[service] || []), feature]
      }
    }));
  };

  const handleStyleToggle = (style: string) => {
    setPreferences(prev => ({
      ...prev,
      style: prev.style.includes(style)
        ? prev.style.filter(s => s !== style)
        : [...prev.style, style]
    }));
  };

  const handleVibeToggle = (vibe: string) => {
    setPreferences(prev => ({
      ...prev,
      vibe: prev.vibe.includes(vibe)
        ? prev.vibe.filter(v => v !== vibe)
        : [...prev.vibe, vibe]
    }));
  };

  const findMatchingPackages = () => {
    setIsMatching(true);
    
    // Filter packages based on preferences
    let matchedPackages = packages.filter(pkg => {
      // Service type match
      if (!preferences.selectedServices.includes(pkg.service_type)) {
        return false;
      }

      // Budget match
      if (preferences.budget) {
        const [minStr, maxStr] = preferences.budget.split('-');
        const minBudget = parseInt(minStr);
        const maxBudget = maxStr ? parseInt(maxStr) : 999999999;
        
        if (pkg.price < minBudget || pkg.price > maxBudget) {
          return false;
        }
      }

      // Hours match (if specified)
      const serviceHours = preferences.hours[pkg.service_type];
      if (serviceHours && pkg.hour_amount) {
        const hoursDiff = Math.abs(pkg.hour_amount - serviceHours);
        if (hoursDiff > 2) { // Allow 2 hour variance
          return false;
        }
      }

      return true;
    });

    // Sort by best match (closest to preferences)
    matchedPackages = matchedPackages.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Score based on hours match
      const serviceHoursA = preferences.hours[a.service_type];
      const serviceHoursB = preferences.hours[b.service_type];
      
      if (serviceHoursA && a.hour_amount) {
        scoreA += Math.max(0, 10 - Math.abs(a.hour_amount - serviceHoursA));
      }
      if (serviceHoursB && b.hour_amount) {
        scoreB += Math.max(0, 10 - Math.abs(b.hour_amount - serviceHoursB));
      }

      // Score based on features match
      const selectedFeatures = preferences.additionalFeatures[a.service_type] || [];
      const featuresMatchA = a.features?.filter(f => 
        selectedFeatures.some(sf => f.toLowerCase().includes(sf.toLowerCase()))
      ).length || 0;
      const featuresMatchB = b.features?.filter(f => 
        selectedFeatures.some(sf => f.toLowerCase().includes(sf.toLowerCase()))
      ).length || 0;

      scoreA += featuresMatchA * 5;
      scoreB += featuresMatchB * 5;

      return scoreB - scoreA;
    });

    setRecommendedPackages(matchedPackages.slice(0, 3));
    
    setTimeout(() => {
      setIsMatching(false);
      setCurrentStep(8); // Results step
    }, 2000);
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 6) {
      setCurrentStep(7); // Go to matching step
    } else if (currentStep === 7) {
      findMatchingPackages(); // Start matching process
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return preferences.selectedServices.length > 0;
      case 2: return preferences.selectedServices.every(service => preferences.hours[service]);
      case 3: return true; // Always allow proceeding from step 3
      case 4: return true; // Always allow proceeding from step 4
      case 5: return preferences.style.length > 0;
      case 6: return preferences.budget !== '';
      case 7: return true; // Matching step
      default: return false;
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
    const service = serviceOptions.find(s => s.id === serviceType);
    return service?.icon || Package;
  };

  const resetModal = () => {
    setCurrentStep(1);
    setPreferences({
      selectedServices: [],
      hours: {},
      photoCount: {},
      rawPhotos: {},
      videoLength: {},
      additionalFeatures: {},
      budget: '',
      style: [],
      vibe: []
    });
    setRecommendedPackages([]);
    setIsMatching(false);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  const handleBookPackage = (pkg: ServicePackage) => {
    onClose();
    navigate(`/package/${pkg.id}`);
  };

  const handleBrowseAll = () => {
    onClose();
    navigate('/search', {
      state: {
        filters: {
          serviceTypes: preferences.selectedServices,
          minPrice: preferences.budget ? parseInt(preferences.budget.split('-')[0]) : 0,
          maxPrice: preferences.budget ? parseInt(preferences.budget.split('-')[1] || '999999999') : 500000
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Create Custom Package</h3>
            <p className="text-gray-600 mt-1">
              {currentStep <= 6 ? `Step ${currentStep} of 6` : 'Your Recommendations'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        {currentStep <= 7 && !isMatching && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${currentStep >= step 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 6 && (
                    <div className={`w-8 h-1 mx-1 rounded-full transition-all ${
                      currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-rose-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  What services do you need?
                </h4>
                <p className="text-gray-600">
                  Select all the wedding services you'd like to include in your custom package
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceOptions.map((service) => {
                  const Icon = service.icon;
                  const isSelected = preferences.selectedServices.includes(service.id);
                  
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleServiceToggle(service.id)}
                      className={`
                        relative p-6 rounded-xl border-2 cursor-pointer transition-all
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
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{service.emoji}</div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-1">{service.name}</h5>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Hours Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  How many hours of coverage?
                </h4>
                <p className="text-gray-600">
                  Choose the duration for each selected service
                </p>
              </div>

              <div className="space-y-8">
                {preferences.selectedServices.map((service) => {
                  const Icon = getServiceIcon(service);
                  return (
                    <div key={service} className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                          <Icon className="w-4 h-4 text-rose-600" />
                        </div>
                        <h5 className="text-lg font-semibold text-gray-900">{service}</h5>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-amber-600 mb-2">
                            {preferences.hours[service] || 6} hours
                          </div>
                          <p className="text-sm text-gray-600">
                            Drag the slider to select your preferred coverage duration
                          </p>
                        </div>
                        
                        <div className="px-4">
                          <input
                            type="range"
                            min="2"
                            max="16"
                            value={preferences.hours[service] || 6}
                            onChange={(e) => handleHoursChange(service, parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                              background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((preferences.hours[service] || 6) - 2) / 14 * 100}%, #e5e7eb ${((preferences.hours[service] || 6) - 2) / 14 * 100}%, #e5e7eb 100%)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>2 hours</span>
                            <span>16 hours</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-600">
                            {preferences.hours[service] <= 4 && "Perfect for intimate ceremonies and elopements"}
                            {preferences.hours[service] >= 5 && preferences.hours[service] <= 8 && "Great for traditional wedding coverage"}
                            {preferences.hours[service] >= 9 && preferences.hours[service] <= 12 && "Comprehensive full-day documentation"}
                            {preferences.hours[service] >= 13 && "Complete extended celebration coverage"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Photo Count (Photography only) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {preferences.selectedServices.includes('Photography') ? (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">
                      Photography Preferences
                    </h4>
                    <p className="text-gray-600">
                      Customize your photography package details
                    </p>
                  </div>

                  <div className="space-y-8">
                    {preferences.selectedServices.filter(s => s === 'Photography').map((service) => (
                      <div key={service} className="space-y-4">
                        {/* Photo Count Selection */}
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-4">Number of Edited Photos</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {photoCountOptions.map((option) => {
                            const isSelected = preferences.photoCount[service] === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => handlePhotoCountChange(service, option.value)}
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
                                <div className="font-bold text-gray-900 mb-1">{option.label}</div>
                                <p className="text-xs text-gray-600">{option.description}</p>
                              </button>
                            );
                          })}
                        </div>
                        </div>

                        {/* Raw Photos Option */}
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-4">Additional Options</h5>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.rawPhotos[service] || false}
                              onChange={(e) => handleRawPhotosToggle(service, e.target.checked)}
                              className="text-blue-500 focus:ring-blue-500 rounded"
                            />
                            <div>
                              <span className="font-medium text-blue-900">Include raw/unedited photos</span>
                              <p className="text-sm text-blue-700">Get access to all unedited photos from your wedding day</p>
                            </div>
                          </label>
                        </div>
                        </div>

                        {/* Additional Features */}
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-4">Additional Features</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {additionalFeatureOptions[service]?.map((feature) => {
                              const isSelected = preferences.additionalFeatures[service]?.includes(feature);
                              return (
                                <label key={feature} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleFeatureToggle(service, feature)}
                                    className="text-emerald-500 focus:ring-emerald-500 rounded"
                                  />
                                  <span className="text-sm text-gray-700">{feature}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Skip photography step if not selected */
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowRight className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    Skipping Photo Preferences
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Photography not selected, moving to next step...
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep(4)}
                    icon={ArrowRight}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Video Length (Videography only) */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {preferences.selectedServices.some(s => ['Videography', 'DJ Services', 'Live Musician', 'Coordination', 'Planning'].includes(s)) ? (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-purple-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">
                      Service Preferences
                    </h4>
                    <p className="text-gray-600">
                      Customize preferences for each selected service
                    </p>
                  </div>

                  <div className="space-y-8">
                    {preferences.selectedServices.filter(s => ['Videography', 'DJ Services', 'Live Musician', 'Coordination', 'Planning'].includes(s)).map((service) => {
                      const ServiceIcon = getServiceIcon(service);
                      return (
                      <div key={service} className="space-y-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <ServiceIcon className="w-4 h-4 text-purple-600" />
                          </div>
                          <h5 className="text-lg font-semibold text-gray-900">{service}</h5>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-6">
                          {service === 'Videography' && (
                            <div className="space-y-4">
                              <h6 className="font-medium text-gray-900">Video Style & Length</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {videoLengthOptions.map((option) => {
                                  const isSelected = preferences.videoLength[service] === option.value;
                                  return (
                                    <button
                                      key={option.value}
                                      onClick={() => handleVideoLengthChange(service, option.value)}
                                      className={`
                                        relative p-3 rounded-lg border-2 transition-all text-center
                                        ${isSelected 
                                          ? 'border-purple-500 bg-purple-50' 
                                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }
                                      `}
                                    >
                                      {isSelected && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                          <Check className="w-2 h-2 text-white" />
                                        </div>
                                      )}
                                      <div className="font-medium text-gray-900 text-sm mb-1">{option.label}</div>
                                      <p className="text-xs text-gray-600">{option.description}</p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Additional Features for all services */}
                          <div className={service === 'Videography' ? 'mt-6 pt-6 border-t border-gray-200' : ''}>
                            <h6 className="font-medium text-gray-900 mb-4">Additional Features</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {additionalFeatureOptions[service]?.map((feature) => {
                                const isSelected = preferences.additionalFeatures[service]?.includes(feature);
                                return (
                                  <label key={feature} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-white transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleFeatureToggle(service, feature)}
                                      className="text-purple-500 focus:ring-purple-500 rounded"
                                    />
                                    <span className="text-sm text-gray-700">{feature}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                </>
              ) : (
                /* Skip videography step if not selected */
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowRight className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    Skipping Service Preferences
                  </h4>
                  <p className="text-gray-600 mb-6">
                    No additional preferences needed, moving to style preferences...
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep(5)}
                    icon={ArrowRight}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Style Preferences */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-indigo-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  What style do you love?
                </h4>
                <p className="text-gray-600">
                  Select the styles that match your wedding vision
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {styleOptions.map((style) => {
                  const isSelected = preferences.style.includes(style.id);
                  return (
                    <div
                      key={style.id}
                      onClick={() => handleStyleToggle(style.id)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <h5 className="font-medium text-gray-900 mb-1">{style.name}</h5>
                      <p className="text-sm text-gray-600">{style.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 6: Budget */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  What's your budget?
                </h4>
                <p className="text-gray-600">
                  Select a budget range for your custom package
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgetOptions.map((option) => {
                  const isSelected = preferences.budget === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setPreferences(prev => ({ ...prev, budget: option.value }))}
                      className={`
                        relative p-6 rounded-lg border-2 transition-all text-center
                        ${isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="text-xl font-bold text-gray-900 mb-2">{option.label}</div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 7: Ready to Match */}
          {currentStep === 7 && !isMatching && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Ready to Find Your Perfect Package?
                </h2>
                <p className="text-gray-600 text-lg mb-8">
                  We'll analyze your preferences to find the best wedding packages for you
                </p>
                
                {/* Summary of selections */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Your Selections Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Services</h4>
                      <div className="space-y-1">
                        {preferences.selectedServices.map(service => (
                          <div key={service} className="flex items-center space-x-2">
                            <Check className="w-3 h-3 text-green-600" />
                            <span className="text-sm">{service} ({preferences.hours[service]}h)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Preferences</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Budget: {budgetOptions.find(b => b.value === preferences.budget)?.label}</div>
                        <div>Style: {preferences.style.join(', ') || 'Any'}</div>
                        <div>Vibe: {preferences.vibe.join(', ') || 'Any'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNext}
                  icon={Sparkles}
                  className="px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  Find My Perfect Packages ✨
                </Button>
              </div>
            </div>
          )}

          {/* Matching Step */}
          {isMatching && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Creating Your Perfect Package...
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                We're analyzing your preferences to find the best packages for your wedding
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-sm text-gray-500">
                  Matching your preferences with available packages...
                </p>
              </div>
            </div>
          )}

          {/* Step 8: Results */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🎉 We Found Perfect Matches!
                </h2>
                <p className="text-gray-600 text-lg">
                  Based on your preferences, here are the best packages for your wedding
                </p>
              </div>

              {recommendedPackages.length === 0 ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    No exact matches found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find packages that exactly match your preferences, but we have other great options available.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Adjust Preferences
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleBrowseAll}
                    >
                      Browse All Packages
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {recommendedPackages.map((pkg, index) => {
                    const ServiceIcon = getServiceIcon(pkg.service_type);
                    const isTopMatch = index === 0;
                    
                    return (
                      <div key={pkg.id} className={`
                        relative rounded-xl border-2 overflow-hidden transition-all
                        ${isTopMatch 
                          ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-amber-50' 
                          : 'border-gray-200 bg-white'
                        }
                      `}>
                        {isTopMatch && (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                            🏆 Best Match
                          </div>
                        )}
                        
                        <div className="p-6">
                          <div className="flex items-start space-x-6">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <ServiceIcon className="w-8 h-8 text-rose-600" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                              <p className="text-gray-600 mb-4">{pkg.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-2">Package Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Service:</span>
                                      <span className="font-medium">{pkg.service_type}</span>
                                    </div>
                                    {pkg.hour_amount && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-medium">{pkg.hour_amount} hours</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Price:</span>
                                      <span className="font-medium text-lg">{formatPrice(pkg.price)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-2">Features</h4>
                                  <div className="space-y-1">
                                    {pkg.features?.slice(0, 4).map((feature, idx) => (
                                      <div key={idx} className="flex items-center space-x-2">
                                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{feature}</span>
                                      </div>
                                    ))}
                                    {(pkg.features?.length || 0) > 4 && (
                                      <div className="text-sm text-gray-500">
                                        +{(pkg.features?.length || 0) - 4} more features
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-3xl font-bold text-gray-900 mb-2">
                                {formatPrice(pkg.price)}
                              </div>
                              <Button
                                variant={isTopMatch ? "primary" : "outline"}
                                onClick={() => handleBookPackage(pkg)}
                                className={isTopMatch ? "shadow-lg" : ""}
                              >
                                {isTopMatch ? 'Book This Package' : 'View Package'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={handleBrowseAll}
                      className="px-6"
                    >
                      Browse All Packages
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep <= 7 && !isMatching && (
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? handleClose : handlePrev}
                icon={currentStep === 1 ? X : ArrowLeft}
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Step {currentStep} of {currentStep <= 6 ? '6' : '7'}
                </p>
                {currentStep === 7 && (
                  <p className="text-xs text-gray-400">
                    We'll find packages that match your preferences
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
                icon={ArrowRight}
              >
                {currentStep === 7 ? 'Find My Packages' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};