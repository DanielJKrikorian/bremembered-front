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