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
    { value: 'Proposal', label: 'Proposal' }
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
      coverage: []
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

  const getServicePhoto = (serviceType: string, pkg: ServicePackage) => {
    // Create a hash from package ID to ensure consistent but unique photos
    const hash = pkg.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const photoIndex = Math.abs(hash) % getServicePhotos(serviceType).length;
    return getServicePhotos(serviceType)[photoIndex];
  };

  const getServicePhotos = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': 
        return [
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      case 'Videography': 
        return [
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      case 'DJ Services': 
        return [
          'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      case 'Live Musician': 
        return [
          'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1407354/pexels-photo-1407354.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      case 'Coordination': 
        return [
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      case 'Planning': 
        return [
          'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      default: 
        return [
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Wedding Services</h1>
          <p className="text-gray-600">Find the perfect vendors for your special day</p>
        </div>

        {/* Search Bar */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search packages by name, service, or features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
            <Button
              variant="outline"
              icon={SlidersHorizontal}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Service Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Service Types</label>
                  <div className="space-y-2">
                    {serviceTypeOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.serviceTypes.includes(option.value)}
                          onChange={() => handleServiceTypeToggle(option.value)}
                          className="mr-2 text-rose-500 focus:ring-rose-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Event Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Event Types</label>
                  <div className="space-y-2">
                    {eventTypeOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.eventTypes.includes(option.value)}
                          onChange={() => handleEventTypeToggle(option.value)}
                          className="mr-2 text-rose-500 focus:ring-rose-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">Min: {formatPrice(filters.minPrice)}</label>
                      <input
                        type="range"
                        min="0"
                        max="500000"
                        step="5000"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Max: {formatPrice(filters.maxPrice)}</label>
                      <input
                        type="range"
                        min="0"
                        max="500000"
                        step="5000"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Coverage Hours</label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">Min: {filters.minHours}h</label>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={filters.minHours}
                        onChange={(e) => handleFilterChange('minHours', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Max: {filters.maxHours}h</label>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={filters.maxHours}
                        onChange={(e) => handleFilterChange('maxHours', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={clearFilters}
                  className="text-sm text-rose-600 hover:text-rose-700"
                >
                  Clear all filters
                </button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {sortedPackages.length} Package{sortedPackages.length !== 1 ? 's' : ''} Found
            </h2>
            <p className="text-gray-600">
              {searchTerm && `Results for "${searchTerm}"`}
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
                <option value="name">Name: A to Z</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {sortedPackages.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || activeFiltersCount > 0 
                ? 'Try adjusting your search or filters to find more options.'
                : 'No wedding packages are currently available.'
              }
            </p>
            {(searchTerm || activeFiltersCount > 0) && (
              <Button variant="primary" onClick={clearFilters}>
                Clear Search & Filters
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedPackages.map((pkg) => {
              const ServiceIcon = getServiceIcon(pkg.service_type);
              const packageCoverage = getPackageCoverage(pkg.coverage || {});
              
              return (
                <Card key={pkg.id} hover className="overflow-hidden cursor-pointer" onClick={() => navigate(`/package/${pkg.id}`)}>
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={pkg.primary_image || getServicePhoto(pkg.service_type, pkg)}
                      alt={pkg.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                        <ServiceIcon className="w-4 h-4 text-rose-600" />
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                        {pkg.service_type}
                      </span>
                      {pkg.event_type && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {pkg.event_type}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{pkg.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{pkg.description}</p>

                    {/* Features */}
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {pkg.features.slice(0, 2).map((feature, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              {feature}
                            </span>
                          ))}
                          {pkg.features.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              +{pkg.features.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>4.9</span>
                        </div>
                        {pkg.hour_amount && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{pkg.hour_amount}h</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {formatPrice(pkg.price)}
                        </div>
                        <div className="text-xs text-gray-500">Starting price</div>
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      variant="primary" 
                      className="w-full mt-4"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigate(`/package/${pkg.id}`); 
                      }}
                    >
                      View Package
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {sortedPackages.map((pkg) => {
              const ServiceIcon = getServiceIcon(pkg.service_type);
              const packageCoverage = getPackageCoverage(pkg.coverage || {});
              
              return (
                <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-6">
                      <img
                        src={pkg.primary_image || getServicePhoto(pkg.service_type, pkg)}
                        alt={pkg.name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">
                            <ServiceIcon className="w-3 h-3 text-rose-600" />
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            {pkg.service_type}
                          </span>
                          {pkg.event_type && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {pkg.event_type}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{pkg.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pkg.description}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span>4.9 (127 reviews)</span>
                          </div>
                          {pkg.hour_amount && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{pkg.hour_amount} hours</span>
                            </div>
                          )}
                        </div>

                        {/* Features and Coverage */}
                        <div className="flex flex-wrap gap-1">
                          {pkg.features?.slice(0, 3).map((feature, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {feature}
                            </span>
                          ))}
                          {packageCoverage.slice(0, 2).map((coverage, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              {coverage}
                            </span>
                          ))}
                          {((pkg.features?.length || 0) + packageCoverage.length) > 5 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              +{((pkg.features?.length || 0) + packageCoverage.length) - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(pkg.price)}
                          </div>
                          <div className="text-sm text-gray-500">Starting price</div>
                        </div>
                        <button
                          onClick={() => navigate(`/package/${pkg.id}`)}
                          className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
                        >
                          View Package
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};