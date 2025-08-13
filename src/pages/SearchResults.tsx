import React, { useState, useEffect } from 'react';
import { Filter, Grid, List, SlidersHorizontal, MapPin, Star, Clock, Users, ChevronDown, Search, X, Check, Camera, Video, Music, Calendar, Package } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useServicePackages } from '../hooks/useSupabase';
import { ServicePackage } from '../types/booking';

export const SearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    serviceTypes: [] as string[],
    eventTypes: [] as string[],
    minHours: 1,
    maxHours: 12,
    minPrice: 0,
    maxPrice: 500000,
    coverage: [] as string[]
  });

  // Get all service packages with current filters
  const { packages, loading, error } = useServicePackages(
    undefined, // Don't filter by single service type
    undefined, // Don't filter by single event type
    {
      selectedServices: filters.serviceTypes.length > 0 ? filters.serviceTypes : undefined,
      minHours: filters.minHours,
      maxHours: filters.maxHours,
      coverage: filters.coverage.length > 0 ? filters.coverage : undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice
    }
  );

  // Initialize filters from navigation state
  useEffect(() => {
    if (location.state?.filters) {
      setFilters(prev => ({ ...prev, ...location.state.filters }));
    }
  }, [location.state]);

  // Filter packages by search term and additional filters
  const filteredPackages = packages.filter(pkg => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        pkg.name.toLowerCase().includes(searchLower) ||
        pkg.description?.toLowerCase().includes(searchLower) ||
        pkg.service_type.toLowerCase().includes(searchLower) ||
        pkg.features?.some(feature => feature.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Service type filter
    if (filters.serviceTypes.length > 0) {
      const serviceLookupMap: Record<string, string> = {
        'Photography': 'photography',
        'DJ Services': 'dj',
        'Day-of Coordination': 'coordination',
        'Coordination': 'coordination',
        'Videography': 'videography',
        'Live Musician': 'live_musician',
        'Planning': 'planning',
        'Photo Booth': 'photo_booth'
      };
      
      const hasMatchingService = filters.serviceTypes.some(serviceType => {
        const lookupKey = serviceLookupMap[serviceType];
        return pkg.lookup_key === lookupKey || pkg.service_type === serviceType;
      });
      
      if (!hasMatchingService) return false;
    }

    // Event type filter
    if (filters.eventTypes.length > 0 && pkg.event_type) {
      if (!filters.eventTypes.includes(pkg.event_type)) return false;
    }

    return true;
  });

  // Sort packages
  const sortedPackages = [...filteredPackages].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'hours-low': return (a.hour_amount || 0) - (b.hour_amount || 0);
      case 'hours-high': return (b.hour_amount || 0) - (a.hour_amount || 0);
      case 'name': return a.name.localeCompare(b.name);
      default: return 0; // recommended
    }
  });

  const serviceTypeOptions = [
    { value: 'Photography', label: 'Photography', icon: Camera },
    { value: 'Videography', label: 'Videography', icon: Video },
    { value: 'DJ Services', label: 'DJ Services', icon: Music },
    { value: 'Live Musician', label: 'Live Musician', icon: Music },
    { value: 'Coordination', label: 'Day-of Coordination', icon: Users },
    { value: 'Planning', label: 'Planning', icon: Calendar }
  ];

  const eventTypeOptions = [
    { value: 'Wedding', label: 'Wedding' },
    { value: 'Corporate', label: 'Corporate Event' },
    { value: 'Event', label: 'Special Event' },
    { value: 'Sports', label: 'Sports Event' },
    { value: 'School', label: 'School Event' }
  ];

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

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleServiceTypeToggle = (serviceType: string) => {
    setFilters(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceType)
        ? prev.serviceTypes.filter(s => s !== serviceType)
        : [...prev.serviceTypes, serviceType]
    }));
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFilters(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(e => e !== eventType)
        : [...prev.eventTypes, eventType]
    }));
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
      serviceTypes: [],
      eventTypes: [],
      minHours: 1,
      maxHours: 12,
      minPrice: 0,
      maxPrice: 500000,
      coverage: [],
      rating: 0
    });
    setSearchTerm('');
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

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return Camera;
      case 'Videography': return Video;
      case 'DJ Services': return Music;
      case 'Live Musician': return Music;
      case 'Coordination': return Users;
      case 'Planning': return Calendar;
      default: return Package;
    }
  };

  const activeFiltersCount = 
    filters.serviceTypes.length + 
    filters.eventTypes.length + 
    filters.coverage.length + 
    (filters.minPrice > 0 || filters.maxPrice < 500000 ? 1 : 0) +
    (filters.minHours > 1 || filters.maxHours < 12 ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wedding packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search packages by name, service type, or features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-lg"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wedding Service Packages</h1>
              <p className="text-gray-600 mt-1">
                {sortedPackages.length} package{sortedPackages.length !== 1 ? 's' : ''} found
                {activeFiltersCount > 0 && ` with ${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied`}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="hours-low">Hours: Low to High</option>
                  <option value="hours-high">Hours: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <Button
                variant="outline"
                icon={SlidersHorizontal}
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  icon={Grid}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                />
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  icon={List}
                  size="sm"
                  onClick={() => setViewMode('list')}
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.serviceTypes.map(serviceType => (
                <span key={serviceType} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-rose-100 text-rose-800">
                  {serviceType}
                  <button
                    onClick={() => handleServiceTypeToggle(serviceType)}
                    className="ml-2 text-rose-600 hover:text-rose-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {filters.eventTypes.map(eventType => (
                <span key={eventType} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  {eventType}
                  <button
                    onClick={() => handleEventTypeToggle(eventType)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {filters.coverage.map(coverage => (
                <span key={coverage} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  {coverage}
                  <button
                    onClick={() => handleCoverageToggle(coverage)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {(filters.minPrice > 0 || filters.maxPrice < 500000) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                  {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
                  <button
                    onClick={() => handleFilterChange('minPrice', 0) || handleFilterChange('maxPrice', 500000)}
                    className="ml-2 text-amber-600 hover:text-amber-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {(filters.minHours > 1 || filters.maxHours < 12) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                  {filters.minHours}-{filters.maxHours} hours
                  <button
                    onClick={() => handleFilterChange('minHours', 1) || handleFilterChange('maxHours', 12)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.rating > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                  {filters.rating}+ stars
                  <button
                    onClick={() => handleFilterChange('rating', 0)}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {/* Service Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Service Type
                  </label>
                  <div className="space-y-2">
                    {serviceTypeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = filters.serviceTypes.includes(option.value);
                      return (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleServiceTypeToggle(option.value)}
                            className="mr-3 text-rose-500 focus:ring-rose-500 rounded"
                          />
                          <Icon className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Event Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Event Type
                  </label>
                  <div className="space-y-2">
                    {eventTypeOptions.map((option) => {
                      const isSelected = filters.eventTypes.includes(option.value);
                      return (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleEventTypeToggle(option.value)}
                            className="mr-3 text-blue-500 focus:ring-blue-500 rounded"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

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

                {/* Budget Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Budget Range
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="text-xs text-gray-600">Min Budget</label>
                        <input
                          type="range"
                          min="0"
                          max="500000"
                          step="5000"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-center text-sm font-medium text-gray-900">
                          {formatPrice(filters.minPrice)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-600">Max Budget</label>
                        <input
                          type="range"
                          min="0"
                          max="500000"
                          step="5000"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-center text-sm font-medium text-gray-900">
                          {formatPrice(filters.maxPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coverage/Moments Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Moments to Capture
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {coverageOptions.map((coverage) => (
                      <label key={coverage} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.coverage.includes(coverage)}
                          onChange={() => handleCoverageToggle(coverage)}
                          className="mr-2 text-green-500 focus:ring-green-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{coverage}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            {sortedPackages.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No packages found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || activeFiltersCount > 0 
                    ? 'Try adjusting your search or filters to find more options.'
                    : 'No wedding packages are currently available.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/booking/services')}>
                    Start Custom Booking
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedPackages.map((pkg) => {
                      const ServiceIcon = getServiceIcon(pkg.service_type);
                      const packageCoverage = getPackageCoverage(pkg.coverage || {});
                      
                      return (
                        <Card key={pkg.id} hover className="overflow-hidden cursor-pointer" onClick={() => navigate(`/package/${pkg.id}`)}>
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                                  <ServiceIcon className="w-6 h-6 text-rose-600" />
                                </div>
                                <div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                    {pkg.service_type}
                                  </span>
                                  {pkg.event_type && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                                      {pkg.event_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatPrice(pkg.price)}
                                </div>
                                {pkg.hour_amount && (
                                  <div className="text-sm text-gray-500">
                                    {pkg.hour_amount} hours
                                  </div>
                                )}
                              </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">{pkg.description}</p>

                            {/* Features */}
                            {pkg.features && pkg.features.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
                                <div className="flex flex-wrap gap-1">
                                  {pkg.features.slice(0, 3).map((feature, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                      {feature}
                                    </span>
                                  ))}
                                  {pkg.features.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                      +{pkg.features.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Coverage */}
                            {packageCoverage.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Coverage</h4>
                                <div className="flex flex-wrap gap-1">
                                  {packageCoverage.slice(0, 3).map((coverage, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                      {coverage}
                                    </span>
                                  ))}
                                  {packageCoverage.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                      +{packageCoverage.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            <Button variant="primary" size="sm" className="w-full">
                              View Package Details
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedPackages.map((pkg) => {
                      const ServiceIcon = getServiceIcon(pkg.service_type);
                      const packageCoverage = getPackageCoverage(pkg.coverage || {});
                      
                      return (
                        <Card key={pkg.id} hover className="p-6 cursor-pointer" onClick={() => navigate(`/package/${pkg.id}`)}>
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/4">
                              <div className="w-full h-48 bg-gradient-to-br from-rose-100 to-amber-100 rounded-lg flex items-center justify-center">
                                <ServiceIcon className="w-16 h-16 text-rose-600" />
                              </div>
                            </div>
                            <div className="md:w-3/4">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                      {pkg.service_type}
                                    </span>
                                    {pkg.event_type && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {pkg.event_type}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                    {pkg.hour_amount && (
                                      <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span>{pkg.hour_amount} hours</span>
                                      </div>
                                    )}
                                    <div className="flex items-center">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                      <span>Top rated</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {formatPrice(pkg.price)}
                                  </div>
                                  <div className="text-sm text-gray-500">Starting price</div>
                                </div>
                              </div>
                              
                              <p className="text-gray-600 mb-4 line-clamp-2">{pkg.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {pkg.features && pkg.features.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {pkg.features.slice(0, 3).map((feature, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                          {feature}
                                        </span>
                                      ))}
                                      {pkg.features.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                          +{pkg.features.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {packageCoverage.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Coverage</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {packageCoverage.slice(0, 3).map((coverage, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                          {coverage}
                                        </span>
                                      ))}
                                      {packageCoverage.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                          +{packageCoverage.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                  Click to view full details and book
                                </div>
                                <Button variant="primary">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Load More */}
                {sortedPackages.length >= 20 && (
                  <div className="text-center mt-12">
                    <Button variant="outline" size="lg">
                      Load More Packages
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};