import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

  useEffect(() => {
    if (!serviceType || !budgetRange) {
      setMatchedPackages([]);
      setRecommendedPackage(null);
      return;
    }

    const fetchPackages = async () => {
      setLoading(true);
      try {
        console.log('Fetching packages with params:', {
          serviceType,
          eventType,
          preferenceType,
          preferenceValue,
          budgetRange
        });

        // Parse budget range
        const [minBudget, maxBudget] = budgetRange.split('-').map(b => parseInt(b));
        
        // Build query
        let query = supabase
          .from('service_packages')
          .select('*')
          .eq('status', 'approved')
          .gte('price', minBudget)
          .lte('price', maxBudget);

        // Filter by service type
        if (serviceType) {
          query = query.ilike('service_type', `%${serviceType}%`);
        }

        // Filter by event type if provided
        if (eventType) {
          query = query.or(`event_type.ilike.%${eventType}%,event_type.is.null`);
        }

        const { data: packages, error } = await query;

        if (error) {
          console.error('Error fetching packages:', error);
          setMatchedPackages([]);
          setRecommendedPackage(null);
          return;
        }

        console.log('Fetched packages:', packages);

        if (!packages || packages.length === 0) {
          setMatchedPackages([]);
          setRecommendedPackage(null);
          return;
        }

        // Sort packages by price (highest first within budget)
        const sortedPackages = packages.sort((a, b) => b.price - a.price);

        setMatchedPackages(sortedPackages);

        // Find the best matching package
        let bestPackage = sortedPackages[0];

        if (preferenceType === 'hours' && preferenceValue) {
          const targetHours = parseInt(preferenceValue as string);
          // Find package with hour_amount closest to target, preferring higher values
          bestPackage = sortedPackages.reduce((best, current) => {
            const bestHours = best.hour_amount || 0;
            const currentHours = current.hour_amount || 0;
            
            // If both are within range, prefer the one closer to target but higher
            if (bestHours <= targetHours && currentHours <= targetHours) {
              return currentHours > bestHours ? current : best;
            }
            
            // If one exceeds target, prefer the one that doesn't
            if (bestHours > targetHours && currentHours <= targetHours) {
              return current;
            }
            if (currentHours > targetHours && bestHours <= targetHours) {
              return best;
            }
            
            // If both exceed target, prefer the smaller one
            const bestDiff = Math.abs(bestHours - targetHours);
            const currentDiff = Math.abs(currentHours - targetHours);
            return currentDiff < bestDiff ? current : best;
          });
        } else if (preferenceType === 'coverage' && Array.isArray(preferenceValue)) {
          // Find package that covers the most selected events
          bestPackage = sortedPackages.reduce((best, current) => {
            const bestCoverage = getPackageCoverage(best.coverage || {});
            const currentCoverage = getPackageCoverage(current.coverage || {});
            
            const bestMatches = (preferenceValue as string[]).filter(event => 
              bestCoverage.some(c => c.toLowerCase().includes(event.toLowerCase()))
            ).length;
            const currentMatches = (preferenceValue as string[]).filter(event => 
              currentCoverage.some(c => c.toLowerCase().includes(event.toLowerCase()))
            ).length;
            
            // If same number of matches, prefer higher priced package
            if (currentMatches === bestMatches) {
              return current.price > best.price ? current : best;
            }
            
            return currentMatches > bestMatches ? current : best;
          });
        }

        setRecommendedPackage(bestPackage);
        console.log('Set recommended package:', bestPackage);

      } catch (error) {
        console.error('Error in fetchPackages:', error);
        setMatchedPackages([]);
        setRecommendedPackage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [serviceType, eventType, preferenceType, preferenceValue, budgetRange]);

  return {
    matchedPackages,
    recommendedPackage,
    loading
  };
};

// Helper function to extract coverage events from package coverage object
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

// Helper function to convert budget range string to database format
export const convertBudgetRange = (budgetRange: string): string => {
  // Convert from display format to database format
  const budgetMap: Record<string, string> = {
    '0-150000': '0-150000',
    '150000-300000': '150000-300000', 
    '300000-500000': '300000-500000',
    '500000-1000000': '500000-1000000'
  };
  
  return budgetMap[budgetRange] || budgetRange;
};

// Helper function to convert coverage array to string
export const convertCoverageToString = (coverage: string[]): string => {
  return coverage.join(', ');
};