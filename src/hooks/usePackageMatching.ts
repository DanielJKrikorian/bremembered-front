import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServicePackage } from '../types/booking';

interface PackageMatchResult {
  package_id: string;
  package_name: string;
  package_description: string;
  package_price: number;
  package_features: string[];
  package_coverage: Record<string, any>;
  package_hour_amount: number;
  match_score: number;
}

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
        // Use the new matching function
        const { data: matches, error: matchError } = await supabase
          .rpc('find_matching_packages', {
            p_service_type: serviceType,
            p_event_type: eventType || null,
            p_preference_type: preferenceType || null,
            p_preference_value: preferenceValue || null,
            p_budget_range: budgetRange || null
          });

        if (matchError) throw matchError;

        // Convert the results to ServicePackage format
        const packages: ServicePackage[] = (matches || []).map((match: PackageMatchResult) => ({
          id: match.package_id,
          service_type: serviceType,
          name: match.package_name,
          description: match.package_description,
          price: match.package_price,
          features: match.package_features || [],
          coverage: match.package_coverage || {},
          hour_amount: match.package_hour_amount,
          status: 'approved' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        setMatchedPackages(packages);
        
        // Set the top match as recommended
        if (packages.length > 0) {
          setRecommendedPackage(packages[0]);
        } else {
          setRecommendedPackage(null);
        }

      } catch (err) {
        console.error('Error finding package matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to find matches');
      } finally {
        setLoading(false);
      }
    };

    findMatches();
  }, [serviceType, eventType, preferenceType, preferenceValue, budgetRange]);

  return {
    matchedPackages,
    recommendedPackage,
    loading,
    error
  };
};

// Helper function to convert budget range to database format
export const convertBudgetRange = (budgetString: string): string => {
  const budgetMap: Record<string, string> = {
    '0-150000': 'under_1500',
    '150000-300000': '1500_3000',
    '300000-500000': '3000_5000',
    '500000-1000000': '5000_plus'
  };
  
  return budgetMap[budgetString] || 'under_1500';
};

// Helper function to convert coverage array to string
export const convertCoverageToString = (coverage: string[]): string => {
  return coverage.join(',');
};