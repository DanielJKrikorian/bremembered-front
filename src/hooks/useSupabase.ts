import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { ServicePackage, Vendor, VendorService, Venue, StyleTag, VibeTag, VendorReview, VendorServicePackage, LeadInformation } from '../types/booking';

const transformToLookupKey = (serviceName: string): string => {
  // Transform service names to simple lowercase lookup keys
  const lookupMap: Record<string, string> = {
    'Photography': 'photography',
    'Videography': 'videography', 
    'DJ Services': 'dj',
    'Coordination': 'coordination',
    'Planning': 'planning'
  };
  
  return lookupMap[serviceName] || serviceName.toLowerCase().replace(/\s+/g, '');
};

export const useServicePackages = (serviceType?: string, eventType?: string, filters?: {
  minHours?: number;
  maxHours?: number;
  coverage?: string[];
  minPrice?: number;
  maxPrice?: number;
  selectedServices?: string[];
}) => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!serviceType && (!filters?.selectedServices || filters.selectedServices.length === 0)) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('service_packages')
          .select('id, service_type, name, description, price, features, coverage, hour_amount, event_type, status, lookup_key')
          .eq('status', 'approved');

        // Handle multiple selected services
        if (filters?.selectedServices && filters.selectedServices.length > 0) {
          // Create OR conditions for each service using both service_type and lookup_key
          const serviceConditions = filters.selectedServices.flatMap(service => {
            const lookupKey = transformToLookupKey(service);
            console.log(`Service: ${service} -> lookup_key: ${lookupKey}`);
            return [
              `service_type.eq.${service}`,
              `lookup_key.eq.${lookupKey}`
            ];
          }).join(',');
          console.log('Service conditions:', serviceConditions);
          query = query.or(serviceConditions);
        } else if (serviceType) {
          // Try both service_type and lookup_key with proper transformation
          const lookupKey = transformToLookupKey(serviceType);
          console.log(`Single service: ${serviceType} -> lookup_key: ${lookupKey}`);
          query = query.or(`service_type.eq.${serviceType},lookup_key.eq.${lookupKey}`);
        }

        if (eventType) {
          query = query.eq('event_type', eventType);
        }

        if (filters?.minHours) {
          query = query.gte('hour_amount', filters.minHours);
        }

        if (filters?.maxHours) {
          query = query.lte('hour_amount', filters.maxHours);
        }

        if (filters?.minPrice !== undefined) {
          query = query.gte('price', filters.minPrice);
        }

        if (filters?.maxPrice !== undefined) {
          query = query.lte('price', filters.maxPrice);
        }

        if (filters?.coverage && filters.coverage.length > 0) {
          // Filter packages that have any of the selected coverage options in the events array
          const coverageFilters = filters.coverage.map(c => `coverage->events.cs.["${c}"]`).join(',');
          query = query.or(coverageFilters);
        }

        const { data, error } = await query.order('price', { ascending: true });

        if (error) throw error;
        
        // Filter out packages with multiple service types (containing commas)
        const singleServicePackages = (data || []).filter(pkg => {
          const hasMultipleServices = pkg.service_type && pkg.service_type.includes(',');
          return !hasMultipleServices;
        });
        
        // Debug: Log filtered packages
        console.log('All returned packages:', data);
        console.log('Filtered single-service packages:', singleServicePackages);
        console.log('Detailed package breakdown:', singleServicePackages?.map(p => ({ 
          id: p.id,
          name: p.name, 
          service_type: p.service_type, 
          lookup_key: p.lookup_key,
          status: p.status
        })));
        
        setPackages(singleServicePackages);
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (serviceType || (filters?.selectedServices && filters.selectedServices.length > 0)) {
      fetchPackages();
    } else {
      setLoading(false);
    }
  }, [serviceType, eventType, filters]);

  return { packages, loading, error };
};

export const useVendorsByPackage = (servicePackageId: string) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorsByPackage = async () => {

      try {
        const { data, error } = await supabase
          .from('vendor_service_packages')
          .select(`
            vendor_id,
            vendors!inner(
              id,
              name,
              profile_photo,
              rating,
              years_experience,
              phone,
              portfolio_photos,
              specialties,
              service_areas
            )
          `)
          .eq('service_package_id', servicePackageId)
          .eq('status', 'approved');

        if (error) throw error;
        
        // Extract vendors from the joined data
        const vendorData = data?.map(item => item.vendors).filter(Boolean) || [];
        setVendors(vendorData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (servicePackageId) {
      fetchVendorsByPackage();
    }
  }, [servicePackageId]);

  return { vendors, loading, error };
};
export const useVendors = (serviceType?: string, location?: string) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {

      try {
        let query = supabase
          .from('vendors')
          .select(`
            *,
            vendor_services!inner(service_type, is_active)
          `);

        if (serviceType) {
          query = query.eq('vendor_services.service_type', serviceType)
                      .eq('vendor_services.is_active', true);
        }

        if (location) {
          query = query.contains('service_areas', [location]);
        }

        const { data, error } = await query.order('rating', { ascending: false, nullsLast: true });

        if (error) throw error;
        setVendors(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [serviceType, location]);

  return { vendors, loading, error };
};

export const useVenues = (searchTerm?: string) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {

      try {
        let query = supabase.from('venues').select('*');

        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,street_address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query.order('booking_count', { ascending: false }).limit(50);

        if (error) throw error;
        setVenues(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [searchTerm]);

  return { venues, loading, error };
};

export const useStyleTags = () => {
  const [styleTags, setStyleTags] = useState<StyleTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStyleTags = async () => {

      try {
        const { data, error } = await supabase
          .from('style_tags')
          .select('*')
          .order('label');

        if (error) throw error;
        setStyleTags(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStyleTags();
  }, []);

  return { styleTags, loading, error };
};

export const useVibeTags = () => {
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVibeTags = async () => {

      try {
        const { data, error } = await supabase
          .from('vibe_tags')
          .select('*')
          .order('label');

        if (error) throw error;
        setVibeTags(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVibeTags();
  }, []);

  return { vibeTags, loading, error };
};

export const useServiceAreas = (state?: string) => {
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceAreas = async () => {

      try {
        let query = supabase
          .from('service_areas')
          .select('*');

        if (state) {
          query = query.eq('state', state);
        }

        const { data, error } = await query.order('region');

        if (error) throw error;
        setServiceAreas(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceAreas();
  }, [state]);

  return { serviceAreas, loading, error };
};

export const useLanguages = () => {
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {

      try {
        const { data, error } = await supabase
          .from('languages')
          .select('id, language')
          .order('language');

        if (error) throw error;
        setLanguages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  return { languages, loading, error };
};

export const useRecommendedVendors = (filters: {
  servicePackageId: string;
  eventDate: string;
  region?: string;
  languages?: string[];
  styles?: number[];
  vibes?: number[];
}) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendedVendors = async () => {
      // Check if servicePackageId is empty or invalid
      if (!filters.servicePackageId || filters.servicePackageId.trim() === '') {
        setLoading(false);
        return;
      }

      try {
        // Get vendors who offer the selected service package
        let query = supabase
          .from('vendor_service_packages')
          .select(`
            vendor_id,
            vendors!inner(
              id,
              name,
              profile_photo,
              rating,
              years_experience,
              phone,
              portfolio_photos,
              portfolio_videos,
              intro_video,
              specialties,
              awards,
              service_areas,
              profile
            )
          `)
          .eq('service_package_id', filters.servicePackageId)
          .eq('status', 'approved');

        const { data: vendorPackages, error: vendorError } = await query;

        if (vendorError) throw vendorError;

        let vendorData = vendorPackages?.map(item => item.vendors).filter(Boolean) || [];

        // Filter by region if specified
        if (filters.region && vendorData.length > 0) {
          vendorData = vendorData.filter(vendor => 
            vendor.service_areas?.some((area: string) => 
              area.toLowerCase().includes(filters.region!.toLowerCase())
            )
          );
        }

        // If we have language preferences, filter vendors
        if (filters.languages && filters.languages.length > 0 && vendorData.length > 0) {
          const { data: vendorLanguages } = await supabase
            .from('vendor_languages')
            .select('vendor_id, language_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .in('language_id', filters.languages);

          if (vendorLanguages && vendorLanguages.length > 0) {
            const vendorIdsWithLanguages = vendorLanguages.map(vl => vl.vendor_id);
            vendorData = vendorData.filter(vendor => 
              vendorIdsWithLanguages.includes(vendor.id)
            );
          }
        }

        // If we have style preferences, filter vendors
        if (filters.styles && filters.styles.length > 0 && vendorData.length > 0) {
          const { data: vendorStyles } = await supabase
            .from('vendor_style_tags')
            .select('vendor_id, style_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .in('style_id', filters.styles);

          if (vendorStyles && vendorStyles.length > 0) {
            const vendorIdsWithStyles = vendorStyles.map(vs => vs.vendor_id);
            vendorData = vendorData.filter(vendor => 
              vendorIdsWithStyles.includes(vendor.id)
            );
          }
        }

        // If we have vibe preferences, filter vendors
        if (filters.vibes && filters.vibes.length > 0 && vendorData.length > 0) {
          const { data: vendorVibes } = await supabase
            .from('vendor_vibe_tags')
            .select('vendor_id, vibe_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .in('vibe_id', filters.vibes);

          if (vendorVibes && vendorVibes.length > 0) {
            const vendorIdsWithVibes = vendorVibes.map(vv => vv.vendor_id);
            vendorData = vendorData.filter(vendor => 
              vendorIdsWithVibes.includes(vendor.id)
            );
          }
        }

        // Sort by rating (highest first)
        vendorData.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setVendors(vendorData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedVendors();
  }, [filters]);

  return { vendors, loading, error };
};

export const useVendorReviews = (vendorId: string) => {
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      // Check if this is a mock vendor ID
      if (vendorId && vendorId.startsWith('mock-vendor-')) {
        // Return mock review data for mock vendors
        const mockReviews: VendorReview[] = [
          {
            id: 'mock-review-1',
            vendor_id: vendorId,
            couple_id: 'mock-couple-1',
            communication_rating: 5,
            experience_rating: 5,
            quality_rating: 5,
            overall_rating: 5,
            feedback: 'Absolutely amazing photographer! They captured every special moment perfectly and were so professional throughout the entire process.',
            vendor_response: 'Thank you so much for the kind words! It was an honor to be part of your special day.',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            couples: {
              name: 'Sarah & Michael',
              wedding_date: '2024-01-10'
            }
          },
          {
            id: 'mock-review-2',
            vendor_id: vendorId,
            couple_id: 'mock-couple-2',
            communication_rating: 5,
            experience_rating: 4,
            quality_rating: 5,
            overall_rating: 5,
            feedback: 'Incredible work and attention to detail. The photos exceeded our expectations and we couldn\'t be happier!',
            vendor_response: null,
            created_at: '2023-12-20T14:30:00Z',
            updated_at: '2023-12-20T14:30:00Z',
            couples: {
              name: 'Jessica & David',
              wedding_date: '2023-12-15'
            }
          }
        ];
        setReviews(mockReviews);
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vendor_reviews')
          .select(`
            id,
            communication_rating,
            experience_rating,
            quality_rating,
            overall_rating,
            feedback,
            vendor_response,
            created_at,
            couple_id,
            couples!inner(
              name,
              wedding_date
            )
          `)
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchReviews();
    }
  }, [vendorId]);

  return { reviews, loading, error };
};

// Generate a unique session ID for anonymous users
const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('booking_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('booking_session_id', sessionId);
  }
  return sessionId;
};

export const useLeadInformation = () => {
  const [leadInfo, setLeadInfo] = useState<LeadInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrCreateLeadInfo = async () => {

      try {
        const sessionId = getSessionId();
        
        // Try to get existing lead information
        const { data: createdLead, error: createError } = await supabase
          .from('leads_information')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (createError) throw createError;
        
        if (createdLead) {
          setLeadInfo(createdLead);
        } else {
          // Create new lead information record in database
          const newLeadInfo = {
            session_id: sessionId,
            user_id: null,
            selected_services: [],
            event_type: null,
            event_date: null,
            event_time: null,
            venue_id: null,
            venue_name: null,
            region: null,
            languages: [],
            style_preferences: [],
            vibe_preferences: [],
            budget_range: null,
            coverage_preferences: [],
            hour_preferences: null,
            selected_packages: {},
            selected_vendors: {},
            total_estimated_cost: 0,
            current_step: 'service_selection',
            completed_steps: []
          };
          
          const { data: createdLead, error: createError } = await supabase!
            .from('leads_information')
            .insert(newLeadInfo)
            .select()
            .single();
            
          if (createError) throw createError;
          setLeadInfo(createdLead);
        }
      } catch (err) {
        console.error('Error with leads_information:', err);
        // Fallback to local state if database operations fail
        const defaultLeadInfo: LeadInformation = {
          id: getSessionId(),
          session_id: getSessionId(),
          user_id: null,
          selected_services: [],
          event_type: null,
          event_date: null,
          event_time: null,
          venue_id: null,
          venue_name: null,
          region: null,
          languages: [],
          style_preferences: [],
          vibe_preferences: [],
          budget_range: null,
          coverage_preferences: [],
          hour_preferences: null,
          selected_packages: {},
          selected_vendors: {},
          total_estimated_cost: 0,
          current_step: 'service_selection',
          completed_steps: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setLeadInfo(defaultLeadInfo);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateLeadInfo();
  }, []);

  const updateLeadInfo = async (updates: Partial<LeadInformation>) => {
    if (!leadInfo) {
      console.error('No lead info to update');
      return null;
    }

    // Always update local state first
    const updatedLeadInfo = { ...leadInfo, ...updates, updated_at: new Date().toISOString() };
    setLeadInfo(updatedLeadInfo);


    try {
      const { data, error } = await supabase
        .from('leads_information')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', leadInfo.id)
        .select()
        .single();

      if (error) {
        console.error('Database update failed, using local state:', error);
        return updatedLeadInfo;
      }
      
      // Update local state with database response
      setLeadInfo(data);
      return data;
    } catch (err) {
      console.error('Error updating lead info:', err);
      // Local state is already updated, just return it
      return updatedLeadInfo;
    }
  };

  return { leadInfo, updateLeadInfo, loading, error };
};