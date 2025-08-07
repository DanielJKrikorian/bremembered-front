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
    if (!serviceType) {
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
          const [minStr, maxStr] = budgetRange.split('-');
          const min = parseInt(minStr);
          const max = maxStr ? parseInt(maxStr) : 999999999;
          
          if (!isNaN(min) && !isNaN(max)) {
            query = query.gte('price', min).lte('price', max);
          }
        }

        const { data: packages, error } = await query;

        if (error) {
          console.error('Error fetching packages:', error);
          // Try fallback query without filters
          const { data: fallbackPackages } = await supabase
            .from('service_packages')
            .select('*')
            .eq('status', 'approved')
            .ilike('service_type', `%${serviceType}%`)
            .limit(10);
          
          setMatchedPackages(fallbackPackages || []);
          setRecommendedPackage(fallbackPackages?.[0] || null);
        } else {
          console.log('Found packages:', packages?.length || 0);
          setMatchedPackages(packages || []);
          
          // Find best matching package
          if (packages && packages.length > 0) {
            let bestPackage = packages[0];
            
            if (preferenceType === 'hours' && typeof preferenceValue === 'string' && preferenceValue) {
              const targetHours = parseInt(preferenceValue);
              if (!isNaN(targetHours)) {
                bestPackage = packages.reduce((best, current) => {
                  const bestDiff = Math.abs((best.hour_amount || 0) - targetHours);
                  const currentDiff = Math.abs((current.hour_amount || 0) - targetHours);
                  return currentDiff < bestDiff ? current : best;
                });
              }
            } else if (preferenceType === 'coverage' && Array.isArray(preferenceValue)) {
              // Find package that covers the most selected events
              bestPackage = packages.reduce((best, current) => {
                const bestCoverage = getPackageCoverage(best.coverage || {});
                const currentCoverage = getPackageCoverage(current.coverage || {});
                
                const bestMatches = preferenceValue.filter(event => 
                  bestCoverage.some(c => c.toLowerCase().includes(event.toLowerCase()))
                ).length;
                const currentMatches = preferenceValue.filter(event => 
                  currentCoverage.some(c => c.toLowerCase().includes(event.toLowerCase()))
                ).length;
                
                return currentMatches > bestMatches ? current : best;
              });
            }
            
            setRecommendedPackage(bestPackage);
          } else {
            setRecommendedPackage(null);
          }
        }
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

// Utility function to get package coverage events
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

// Utility functions
export const convertBudgetRange = (budgetRange: string): string => {
  return budgetRange;
};

export const convertCoverageToString = (coverage: string[]): string => {
  return coverage.join(', ');
};