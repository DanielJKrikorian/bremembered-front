import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServicePackage } from '../types/booking';

interface UsePackageMatchingParams {
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

        // Sort by price descending to show higher-end packages first
        query = query.order('price', { ascending: false });

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

        // Filter and score packages based on preferences
        let scoredPackages = packages.map(pkg => {
          let score = 0;
          
          // Base score for being in budget
          score += 10;
          
          // Preference-based scoring
          if (preferenceType === 'hours' && preferenceValue && pkg.hour_amount) {
            const targetHours = parseInt(preferenceValue);
            const packageHours = pkg.hour_amount;
            
            // Perfect match gets highest score
            if (packageHours === targetHours) {
              score += 50;
            } else {
              // Closer hours get higher scores
              const diff = Math.abs(packageHours - targetHours);
              score += Math.max(0, 30 - (diff * 5));
            }
          }
          
          if (preferenceType === 'coverage' && preferenceValue && pkg.coverage) {
            const selectedEvents = preferenceValue.split(',').map(e => e.trim().toLowerCase());
            const packageCoverage = getPackageCoverage(pkg.coverage);
            
            // Score based on coverage matches
            const matches = selectedEvents.filter(event => 
              packageCoverage.some(c => c.toLowerCase().includes(event))
            ).length;
            
            score += matches * 10;
          }
          
          // Bonus for higher price within budget (premium packages)
          const priceRatio = (pkg.price - minBudget) / (maxBudget - minBudget);
          score += priceRatio * 20;
          
          return { ...pkg, matchScore: score };
        });

        // Sort by match score (highest first)
        scoredPackages.sort((a, b) => b.matchScore - a.matchScore);
        
        console.log('Scored packages:', scoredPackages);
        
        setMatchedPackages(scoredPackages);
        setRecommendedPackage(scoredPackages[0] || null);

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

// Helper functions for converting user selections to database queries
export const convertBudgetRange = (budgetValue: string): string => {
  return budgetValue; // Already in the correct format (e.g., "150000-300000")
};

export const convertCoverageToString = (coverage: string[]): string => {
  return coverage.join(', ');
};