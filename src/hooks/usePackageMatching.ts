import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServicePackage } from '../types/booking';

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

export const usePackageMatching = () => {
  const [state, setState] = useState<PackageMatchingState>({
    step: 1,
    filters: {},
    availablePackages: [],
    recommendedPackage: null,
    loading: false,
    error: null
  });

  // Step 1: Filter by event type
  const setEventType = async (eventType: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      if (!supabase) {
        throw new Error('Supabase connection not available');
      }

      console.log('Step 1: Filtering by event type:', eventType);

      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('status', 'approved')
        .eq('event_type', eventType);

      if (error) throw error;

      console.log(`Found ${data.length} packages for event type: ${eventType}`);
      
      setState(prev => ({
        ...prev,
        step: 2,
        filters: { ...prev.filters, eventType },
        availablePackages: data || [],
        loading: false
      }));

      // Record this answer in leads_information
      await recordAnswer('event_type', eventType);

    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by event type',
        loading: false
      }));
    }
  };

  // Step 2: Filter by service type using lookup_key
  const setServiceType = async (serviceType: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      if (!supabase) {
        throw new Error('Supabase connection not available');
      }

      // Map service types to lookup keys
      const lookupKeyMap: Record<string, string> = {
        'Photography': 'photography',
        'Videography': 'videography',
        'DJ Services': 'dj',
        'Day-of Coordination': 'coordination',
        'Coordination': 'coordination',
        'Planning': 'planning',
        'Editing': 'editing'
      };

      const lookupKey = lookupKeyMap[serviceType] || serviceType.toLowerCase();
      console.log('Step 2: Filtering by service type:', serviceType, '-> lookup_key:', lookupKey);

      // Filter from existing available packages
      const filteredPackages = state.availablePackages.filter(pkg => 
        pkg.lookup_key === lookupKey || pkg.service_type === serviceType
      );

      console.log(`Filtered to ${filteredPackages.length} packages for service: ${serviceType}`);
      console.log('Filtered packages:', filteredPackages.map(p => ({ 
        name: p.name, 
        service_type: p.service_type, 
        lookup_key: p.lookup_key 
      })));

      setState(prev => ({
        ...prev,
        step: 3,
        filters: { ...prev.filters, serviceType },
        availablePackages: filteredPackages,
        loading: false
      }));

      // Record this answer
      await recordAnswer('selected_services', [serviceType]);

    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by service type',
        loading: false
      }));
    }
  };

  // Step 3: Set preference type (hours or coverage)
  const setPreferenceType = (preferenceType: 'hours' | 'coverage') => {
    setState(prev => ({
      ...prev,
      step: 4,
      filters: { ...prev.filters, preferenceType }
    }));
  };

  // Step 4a: Filter by hours
  const setHours = async (targetHours: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Step 4a: Filtering by hours around:', targetHours);

      // Find packages with hour_amount closest to target (±1 hour range)
      const filteredPackages = state.availablePackages.filter(pkg => {
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
      console.log('Hour-filtered packages:', filteredPackages.map(p => ({ 
        name: p.name, 
        hour_amount: p.hour_amount 
      })));

      setState(prev => ({
        ...prev,
        step: 5,
        filters: { ...prev.filters, hours: targetHours },
        availablePackages: filteredPackages,
        loading: false
      }));

      // Record this answer
      await recordAnswer('hour_preferences', targetHours.toString());

    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by hours',
        loading: false
      }));
    }
  };

  // Step 4b: Filter by coverage
  const setCoverage = async (selectedCoverage: string[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Step 4b: Filtering by coverage:', selectedCoverage);

      // Filter packages that have all selected coverage items
      const filteredPackages = state.availablePackages.filter(pkg => {
        if (!pkg.coverage || !pkg.coverage.events) return false;
        
        const packageEvents = pkg.coverage.events as string[];
        // Check if package includes all selected coverage items
        return selectedCoverage.every(item => 
          packageEvents.some(event => 
            event.toLowerCase().includes(item.toLowerCase()) ||
            item.toLowerCase().includes(event.toLowerCase())
          )
        );
      });

      console.log(`Found ${filteredPackages.length} packages with required coverage`);
      console.log('Coverage-filtered packages:', filteredPackages.map(p => ({ 
        name: p.name, 
        coverage: p.coverage 
      })));

      setState(prev => ({
        ...prev,
        step: 5,
        filters: { ...prev.filters, coverage: selectedCoverage },
        availablePackages: filteredPackages,
        loading: false
      }));

      // Record this answer
      await recordAnswer('coverage_preferences', selectedCoverage);

    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by coverage',
        loading: false
      }));
    }
  };

  // Step 5: Filter by price and select highest within range
  const setPriceRange = async (minPrice: number, maxPrice: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Step 5: Filtering by price range:', minPrice, 'to', maxPrice);

      // Filter packages within price range
      const filteredPackages = state.availablePackages.filter(pkg => 
        pkg.price >= minPrice && pkg.price <= maxPrice
      );

      // Select the highest priced package within the range
      const recommendedPackage = filteredPackages.length > 0 
        ? filteredPackages.reduce((highest, current) => 
            current.price > highest.price ? current : highest
          )
        : null;

      console.log(`Found ${filteredPackages.length} packages in price range`);
      console.log('Recommended package:', recommendedPackage?.name, 'at', recommendedPackage?.price);

      setState(prev => ({
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
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to filter by price',
        loading: false
      }));
    }
  };

  // Record user's selection of the recommended package
  const selectRecommendedPackage = async (packageId: string) => {
    try {
      await recordSelectedPackage(packageId);
      console.log('User selected recommended package:', packageId);
    } catch (err) {
      console.error('Failed to record package selection:', err);
    }
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
        .update(updateData)
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to record answer:', error);
      } else {
        console.log(`Recorded ${field}:`, value);
      }
    } catch (err) {
      console.error('Error recording answer:', err);
    }
  };

  // Record the recommended package ID
  const recordRecommendedPackage = async (packageId: string) => {
    if (!supabase) return;

    try {
      const sessionId = getSessionId();
      
      // Update the selected_packages with the recommended package
      const { error } = await supabase
        .from('leads_information')
        .update({
          selected_packages: { recommended: packageId },
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to record recommended package:', error);
      } else {
        console.log('Recorded recommended package:', packageId);
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
      
      // Update with both recommended and selected for comparison
      const { error } = await supabase
        .from('leads_information')
        .update({
          selected_packages: { 
            recommended: state.recommendedPackage?.id,
            selected: packageId 
          },
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to record selected package:', error);
      } else {
        console.log('Recorded selected package:', packageId);
      }
    } catch (err) {
      console.error('Error recording selected package:', err);
    }
  };

  // Reset the matching process
  const reset = () => {
    setState({
      step: 1,
      filters: {},
      availablePackages: [],
      recommendedPackage: null,
      loading: false,
      error: null
    });
  };

  return {
    ...state,
    setEventType,
    setServiceType,
    setPreferenceType,
    setHours,
    setCoverage,
    setPriceRange,
    selectRecommendedPackage,
    reset
  };
};

// Helper function to get session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('booking_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('booking_session_id', sessionId);
  }
  return sessionId;
};