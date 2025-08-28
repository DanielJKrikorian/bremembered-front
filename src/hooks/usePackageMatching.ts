import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
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
        console.log('=== PACKAGE MATCHING DEBUG ===');
        console.log('Service Type:', serviceType);
        console.log('Event Type:', eventType);
        console.log('Preference Type:', preferenceType);
        console.log('Preference Value:', preferenceValue);
        console.log('Budget Range:', budgetRange);
        console.log('Supabase configured:', isSupabaseConfigured());
        console.log('Supabase client exists:', !!supabase);

        if (!supabase || !isSupabaseConfigured()) {
          console.warn('Supabase not configured, returning empty packages');
          setMatchedPackages([]);
          setRecommendedPackage(null);
          setLoading(false);
          return;
        }

        // First, let's see what packages exist in the database
        console.log('Checking all packages in database...');
        const { data: allPackages, error: allError } = await supabase
          .from('service_packages')
          .select('id, service_type, name, price, status, event_type, hour_amount')
          .limit(10);
        
        console.log('All packages found:', allPackages?.length || 0);
        console.log('Sample packages:', allPackages?.map(p => ({
          id: p.id,
          service_type: p.service_type,
          name: p.name,
          status: p.status,
          price: p.price
        })));
        
        if (allError) {
          console.error('Error fetching all packages:', allError);
        }

        // Now try the filtered query
        let query = supabase
          .from('service_packages')
          .select('*');

        // Only filter by status if we have approved packages
        const approvedPackages = allPackages?.filter(p => p.status === 'approved') || [];
        console.log('Approved packages:', approvedPackages.length);
        
        if (approvedPackages.length > 0) {
          query = query.eq('status', 'approved');
        }

        // Map service types to what's actually in the database
        const serviceTypeMapping: Record<string, string> = {
          'Photography': 'Photography',
          'Videography': 'Videography', 
          'DJ Services': 'DJ Services',
          'Live Musician': 'Live Musician',
          'Coordination': 'Coordination',
          'Planning': 'Planning'
        };
        
        const mappedServiceType = serviceTypeMapping[serviceType] || serviceType;
        
        // Try exact match first, then partial match
        console.log(`Trying to match service type: "${serviceType}"`);
        console.log(`Mapped to: "${mappedServiceType}"`);
        const exactMatches = allPackages?.filter(p => 
          p.service_type === mappedServiceType || 
          p.service_type?.toLowerCase() === mappedServiceType.toLowerCase()
        ) || [];
        console.log('Exact matches:', exactMatches.length);
        
        const partialMatches = allPackages?.filter(p => 
          p.service_type?.toLowerCase().includes(mappedServiceType.toLowerCase()) ||
          mappedServiceType.toLowerCase().includes(p.service_type?.toLowerCase() || '')
        ) || [];
        console.log('Partial matches:', partialMatches.length);
        
        if (exactMatches.length > 0) {
          query = query.eq('service_type', mappedServiceType);
        } else if (partialMatches.length > 0) {
          query = query.ilike('service_type', `%${mappedServiceType}%`);
        } else {
          // No service type filter - get all packages
          console.log('No service type matches, getting all packages');
        }

        // Add other filters only if we have matches
        if (budgetRange) {
          // Convert budget range from cents to dollars for comparison
          try {
            const [minStr, maxStr] = budgetRange.split('-');
            const minCents = parseInt(minStr);
            const maxCents = maxStr ? parseInt(maxStr) : 99999999;
            
            console.log(`Budget filter: ${minCents} - ${maxCents} cents`);
            
            if (!isNaN(minCents) && !isNaN(maxCents)) {
              query = query.gte('price', minCents).lte('price', maxCents);
            }
          } catch (budgetError) {
            console.warn('Error parsing budget range:', budgetError);
          }
        }

        const { data: packages, error } = await query;
        
        console.log('Query result - packages found:', packages?.length || 0);
        console.log('Query error:', error);

        if (error) {
          console.error('Error fetching packages:', error);
          // Simple fallback - just get some packages
          const { data: fallbackPackages } = await supabase
            .from('service_packages')
            .select('*')
            .order('price', { ascending: true })
            .eq('status', 'approved')
            .limit(10);
          
          console.log('Fallback packages found:', fallbackPackages?.length || 0);
          setMatchedPackages(fallbackPackages || []);
          setRecommendedPackage(fallbackPackages?.[0] || null);
        } else {
          console.log('Successfully found packages:', packages?.length || 0);
          console.log('Package details:', packages?.slice(0, 3).map(p => ({ 
            name: p.name, 
            service_type: p.service_type, 
            price: p.price,
            status: p.status
          })));
          
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
            console.log('Recommended package:', bestPackage?.name);
          } else {
            console.log('No packages found, setting recommended to null');
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