import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Star, Check, Tag, Sparkles, Clock, Users, Shield, Filter, SlidersHorizontal, Calendar, MapPin, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useBooking } from '../../context/BookingContext';
import { useServicePackages } from '../../hooks/useSupabase';
import { ServicePackage } from '../../types/booking';

export const PackageSelection: React.FC = () => {
  const navigate = useNavigate();
  const { state, setServicePackage, setCurrentServiceIndex } = useBooking();
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minHours: 1,
    maxHours: 12,
    coverage: [] as string[]
  });
  
  // Get current service being processed
  const currentService = state.selectedServices[state.currentServiceIndex];
  const isLastService = state.currentServiceIndex === state.selectedServices.length - 1;

  // Get packages for current service with filters
  const { packages, loading, error } = useServicePackages(
    currentService, 
    state.eventType, 
    filters
  );

  const coverageOptions = [
    'Ceremony',
    'First Look', 
    'Cocktail Hour',
    'Reception',
    'Getting Ready',
    'Bridal Party',
    'Family Photos',
    'Sunset Photos',
    'Dancing',
    'Cake Cutting',
    'Bouquet Toss',
    'Send Off'
  ];

  const handlePackageSelect = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setServicePackage(currentService, pkg);
  };

  const handleContinue = () => {
    if (selectedPackage) {
      // Move to vendor selection for this service
      navigate('/booking/vendors');
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCoverageToggle = (coverage: string) => {
    setFilters(prev => ({
      ...prev,
      coverage: prev.coverage.includes(coverage)
        ? prev.coverage.filter(c => c !== coverage)
        : [...prev.coverage, coverage]
    }));
  };

  const clearFilters = () => {
    setFilters({
      minHours: 1,
      maxHours: 12,
      coverage: []
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price / 100);
  };

  const getPackageCoverage = (coverage: Record<string, any>) => {
    return Object.keys(coverage).filter(key => coverage[key] === true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">Error loading packages: {error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => navigate('/booking/event-details')}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Choose {currentService} Package
              </h1>
              <p className="text-gray-600 mt-1">
                Step {state.currentServiceIndex + 1} of {state.selectedServices.length}: {currentService}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Event Details</span>
            </div>
            <div className="w-16 h-1 bg-rose-500 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-rose-600">Package Selection</span>
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">Vendor Selection</span>
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <span className="ml-2 text-sm text-gray-500">Checkout</span>
            </div>
          </div>

          {/* Search Details Summary */}
          <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Your Event Details</h3>
              <Button
                variant="outline"
                size="sm"
                icon={Edit}
                onClick={() => navigate('/booking/event-details')}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {state.eventType && (
                <div className="flex items-center space-x-2">
                  <span className="text-blue-700 font-medium">Event Type:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {state.eventType}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-blue-700 font-medium">Services:</span>
                <div className="flex flex-wrap gap-1">
                  {state.selectedServices.map((service, index) => (
                    <span key={index} className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              {state.venue && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">Venue:</span>
                  <span className="text-blue-800 text-sm">{state.venue.name}</span>
                </div>
              )}
              {state.eventDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">Date:</span>
                  <span className="text-blue-800 text-sm">
                    {new Date(state.eventDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-rose-600 hover:text-rose-700"
                >
                  Clear all
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Hours Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Coverage Hours
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="text-xs text-gray-600">Min Hours</label>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          value={filters.minHours}
                          onChange={(e) => handleFilterChange('minHours', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-center text-sm font-medium text-gray-900">{filters.minHours}h</div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-600">Max Hours</label>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          value={filters.maxHours}
                          onChange={(e) => handleFilterChange('maxHours', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-center text-sm font-medium text-gray-900">{filters.maxHours}h</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coverage Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Coverage Included
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {coverageOptions.map((coverage) => (
                      <label key={coverage} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.coverage.includes(coverage)}
                          onChange={() => handleCoverageToggle(coverage)}
                          className="mr-2 text-rose-500 focus:ring-rose-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{coverage}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Package Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {currentService} Packages
                </h2>
                <p className="text-gray-600">
                  {packages.length} package{packages.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <Button
                variant="outline"
                icon={SlidersHorizontal}
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                Filters
              </Button>
            </div>

            {/* Package Grid */}
            {packages.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or contact us for custom {currentService.toLowerCase()} options.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/booking/event-details')}>
                    Go Back
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const packageCoverage = getPackageCoverage(pkg.coverage || {});
                  
                  return (
                    <Card 
                      key={pkg.id} 
                      className={`
                        relative overflow-hidden cursor-pointer transition-all p-6
                        ${isSelected 
                          ? 'ring-2 ring-rose-500 shadow-xl' 
                          : 'hover:shadow-lg'
                        }
                      `}
                      onClick={() => handlePackageSelect(pkg)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center space-x-6">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">{pkg.name}</h3>
                              {isSelected && (
                                <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">{pkg.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              {pkg.hour_amount && (
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  <span>{pkg.hour_amount} hours</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <Shield className="w-4 h-4 mr-1" />
                                <span>Insured</span>
                              </div>
                            </div>

                            {/* Features and Coverage in same row */}
                            <div className="flex flex-wrap gap-1">
                              {pkg.features && pkg.features.slice(0, 3).map((feature, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  {feature}
                                </span>
                              ))}
                              {packageCoverage.slice(0, 3).map((coverage, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  {coverage}
                                </span>
                              ))}
                              {(pkg.features?.length > 3 || packageCoverage.length > 3) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                  +{(pkg.features?.length || 0) + packageCoverage.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatPrice(pkg.price)}
                            </div>
                            <div className="text-sm text-gray-500">Starting price</div>
                          </div>
                          <Button
                            variant={isSelected ? "primary" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePackageSelect(pkg);
                            }}
                          >
                            {isSelected ? 'Selected' : 'Select Package'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        {selectedPackage && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {currentService} package selected
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedPackage.name} - {formatPrice(selectedPackage.price)}
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                onClick={handleContinue}
              >
                Continue to Vendor Selection
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};