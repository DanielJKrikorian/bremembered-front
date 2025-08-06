import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { ServicePackage } from '../types/booking';

interface UsePackageMatchingParams {
  serviceType: string;
  eventType?: string;
  preferenceType?: 'hours' | 'coverage';
  preferenceValue?: string | string[];
  budgetRange?: string;
}

export const usePackageMatching = ({
  serviceType,
  eventType,
  preferenceType,
  preferenceValue,
  budgetRange
}: UsePackageMatchingParams) => {
  const [matchedPackages, setMatchedPackages] = useState<ServicePackage[]>([]);
  const [recommendedPackage, setRecommendedPackage] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { supabase } = useSupabase();

  useEffect(() => {
    if (!serviceType || !supabase) return;

    const fetchMatchingPackages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching packages with params:', {
          serviceType,
          eventType,
          preferenceType,
          preferenceValue,
          budgetRange
        });

        // Start with base query
        let query = supabase
          .from('service_packages')
          .select('*')
          .eq('status', 'approved')
          .ilike('service_type', `%${serviceType}%`);

        // Add event type filter if specified
        if (eventType) {
          query = query.or(`event_type.ilike.%${eventType}%,event_type.is.null`);
        }

        // Add budget filter if specified
        if (budgetRange) {
          const [minPrice, maxPrice] = convertBudgetRangeToNumbers(budgetRange);
          if (minPrice !== null && maxPrice !== null) {
            query = query.gte('price', minPrice).lte('price', maxPrice);
          }
        }

        const { data: packages, error: fetchError } = await query;

        if (fetchError) {
          console.error('Error fetching packages:', fetchError);
          setError(fetchError.message);
          return;
        }

        console.log('Fetched packages:', packages);

        if (!packages || packages.length === 0) {
          // Try fallback query with just service type
          const { data: fallbackPackages, error: fallbackError } = await supabase
            .from('service_packages')
            .select('*')
            .eq('status', 'approved')
            .ilike('service_type', `%${serviceType}%`);

          if (fallbackError) {
            console.error('Error fetching fallback packages:', fallbackError);
            setError(fallbackError.message);
            return;
          }

          setMatchedPackages(fallbackPackages || []);
          setRecommendedPackage(fallbackPackages?.[0] || null);
          return;
        }

        // Filter and rank packages based on preferences
        let rankedPackages = [...packages];

        if (preferenceType === 'hours' && typeof preferenceValue === 'string') {
          const targetHours = parseInt(preferenceValue);
          rankedPackages = rankedPackages.sort((a, b) => {
            const aDiff = Math.abs((a.hour_amount || 0) - targetHours);
            const bDiff = Math.abs((b.hour_amount || 0) - targetHours);
            return aDiff - bDiff;
          });
        } else if (preferenceType === 'coverage' && Array.isArray(preferenceValue)) {
          rankedPackages = rankedPackages.sort((a, b) => {
            const aMatches = countCoverageMatches(a.coverage || {}, preferenceValue);
            const bMatches = countCoverageMatches(b.coverage || {}, preferenceValue);
            return bMatches - aMatches; // Higher matches first
          });
        }

        setMatchedPackages(rankedPackages);
        setRecommendedPackage(rankedPackages[0] || null);

      } catch (err) {
        console.error('Error in package matching:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchingPackages();
  }, [serviceType, eventType, preferenceType, preferenceValue, budgetRange, supabase]);

  return {
    matchedPackages,
    recommendedPackage,
    loading,
    error
  };
};

// Helper function to convert budget range string to numbers
const convertBudgetRangeToNumbers = (budgetRange: string): [number | null, number | null] => {
  if (!budgetRange) return [null, null];
  
  const [min, max] = budgetRange.split('-').map(str => parseInt(str));
  return [min || null, max || null];
};

// Helper function to count coverage matches
const countCoverageMatches = (packageCoverage: Record<string, any>, selectedCoverage: string[]): number => {
  if (!packageCoverage || !selectedCoverage.length) return 0;
  
  const packageEvents = getPackageCoverageEvents(packageCoverage);
  return selectedCoverage.filter(selected => 
    packageEvents.some(event => 
      event.toLowerCase().includes(selected.toLowerCase()) ||
      selected.toLowerCase().includes(event.toLowerCase())
    )
  ).length;
};

// Helper function to extract coverage events from package coverage object
const getPackageCoverageEvents = (coverage: Record<string, any>): string[] => {
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

// Utility function to convert budget range for API calls
export const convertBudgetRange = (budgetRange: string): string => {
  return budgetRange;
};

// Utility function to convert coverage array to string
export const convertCoverageToString = (coverage: string[]): string => {
  return coverage.join(', ');
};