import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServicePackage } from '../types/booking';

interface UsePackageMatchingProps {
  serviceType: string;
  eventType?: string;
  preferenceType?: 'hours' | 'coverage';
  preferenceValue?: string;
  budgetRange?: string;
}

export const usePackageMatching = ({
  serviceType,
  eventType,
  preferenceType,
  preferenceValue,
  budgetRange
}: UsePackageMatchingProps) => {
  const [matchedPackages, setMatchedPackages] = useState<ServicePackage[]>([]);
  const [recommendedPackage, setRecommendedPackage] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const findMatches = async () => {
      if (!serviceType) return;

      setLoading(true);
      setError(null);

      try {
        console.log('Starting package search for:', serviceType);
        
        // First, let's try a simple direct query to see what packages exist
        let query = supabase
          .from('service_packages')
          .select('*')
          .eq('status', 'approved');

        // Try both exact match and lookup key
        const lookupKey = serviceType.toLowerCase().replace(/\s+/g, '');
        query = query.or(`service_type.eq.${serviceType},lookup_key.eq.${lookupKey}`);

        console.log('Query conditions:', { serviceType, lookupKey });

        const { data: allPackages, error: queryError } = await query;

        if (queryError) {
          console.error('Query error:', queryError);
          throw queryError;
        }

        console.log('Found packages:', allPackages?.length || 0);
        console.log('Package details:', allPackages?.map(p => ({ 
          id: p.id, 
          name: p.name, 
          service_type: p.service_type, 
          lookup_key: p.lookup_key,
          price: p.price,
          hour_amount: p.hour_amount
        })));

        let filteredPackages = allPackages || [];

        // Filter by event type if specified
        if (eventType && filteredPackages.length > 0) {
          filteredPackages = filteredPackages.filter(pkg => 
            !pkg.event_type || pkg.event_type === eventType
          );
          console.log('After event type filter:', filteredPackages.length);
        }

        // Filter by hours if specified
        if (preferenceType === 'hours' && preferenceValue && filteredPackages.length > 0) {
          const targetHours = parseInt(preferenceValue);
          filteredPackages = filteredPackages.filter(pkg => {
            if (!pkg.hour_amount) return false;
            // Allow packages within 1 hour of target
            return Math.abs(pkg.hour_amount - targetHours) <= 1;
          });
          console.log('After hours filter:', filteredPackages.length, 'target hours:', targetHours);
        }

        // Filter by budget if specified
        if (budgetRange && filteredPackages.length > 0) {
          const [minPrice, maxPrice] = budgetRange.split('-').map(p => parseInt(p));
          filteredPackages = filteredPackages.filter(pkg => 
            pkg.price >= minPrice && pkg.price <= maxPrice
          );
          console.log('After budget filter:', filteredPackages.length, 'budget range:', budgetRange);
        }

        // Sort by price (lowest first)
        filteredPackages.sort((a, b) => a.price - b.price);

        console.log('Final filtered packages:', filteredPackages.length);

        setMatchedPackages(filteredPackages);
        
        // Set the first (cheapest) match as recommended
        if (filteredPackages.length > 0) {
          setRecommendedPackage(filteredPackages[0]);
          console.log('Recommended package:', filteredPackages[0].name, formatPrice(filteredPackages[0].price));
        } else {
          setRecommendedPackage(null);
          console.log('No packages found matching criteria');
        }

      } catch (err) {
        console.error('Error finding package matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to find matches');
      } finally {
        setLoading(false);
      }
    };

    if (serviceType) {
      findMatches();
    }
  }, [serviceType, eventType, preferenceType, preferenceValue, budgetRange]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  return {
    matchedPackages,
    recommendedPackage,
    loading,
    error
  };
};

// Helper function to convert budget range to database format
export const convertBudgetRange = (budgetString: string): string => {
  // Convert budget strings to price ranges in cents
  const budgetMap: Record<string, string> = {
    '0-150000': '0-150000',
    '150000-300000': '150000-300000', 
    '300000-500000': '300000-500000',
    '500000-1000000': '500000-1000000'
  };
  
  return budgetMap[budgetString] || '0-150000';
};

// Helper function to convert coverage array to string
export const convertCoverageToString = (coverage: string[]): string => {
  return coverage.join(',');
};