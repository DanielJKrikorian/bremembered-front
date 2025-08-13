import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { ServicePackage, Vendor, VendorService, Venue, StyleTag, VibeTag, VendorReview, VendorServicePackage, LeadInformation } from '../types/booking';

const transformToLookupKey = (serviceName: string): string => {
  // Transform service names to simple lowercase lookup keys
  const lookupMap: Record<string, string> = {
    'Photography': 'photography',
    'Videography': 'videography', 
    'DJ Services': 'dj_services',
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

      // Check if Supabase is configured first
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, returning empty packages');
        setPackages([]);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching packages for service type:', serviceType);
        console.log('Event type:', eventType);
        console.log('Filters:', filters);

        let query = supabase
          .from('service_packages')
          .select('id, service_type, name, description, price, features, coverage, hour_amount, event_type, status, lookup_key')
          .eq('status', 'approved');

        // Handle multiple selected services
        if (filters?.selectedServices && filters.selectedServices.length > 0) {
          // Try both service_type and lookup_key matching for multiple services
          const serviceTypeConditions = filters.selectedServices.map(service => `service_type.eq.${service}`).join(',');
          const lookupKeyConditions = filters.selectedServices.map(service => {
            if (service === 'DJ Services') return 'lookup_key.eq.dj';
            if (service === 'Photography') return 'lookup_key.eq.photography';
            if (service === 'Videography') return 'lookup_key.eq.videography';
            if (service === 'Live Musician') return 'lookup_key.eq.musician';
            if (service === 'Coordination') return 'lookup_key.eq.coordination';
            if (service === 'Planning') return 'lookup_key.eq.planning';
            return `lookup_key.eq.${service.toLowerCase()}`;
          }).join(',');
          
          query = query.or(`${serviceTypeConditions},${lookupKeyConditions}`);
        } else if (serviceType) {
          // Try both service_type and lookup_key for single service
          if (serviceType === 'DJ Services') {
            query = query.or('service_type.eq.DJ Services,lookup_key.eq.dj');
          } else if (serviceType === 'Photography') {
            query = query.or('service_type.eq.Photography,lookup_key.eq.photography');
          } else if (serviceType === 'Videography') {
            query = query.or('service_type.eq.Videography,lookup_key.eq.videography');
          } else if (serviceType === 'Live Musician') {
            query = query.or('service_type.eq.Live Musician,lookup_key.eq.musician');
          } else if (serviceType === 'Coordination') {
            query = query.or('service_type.eq.Coordination,lookup_key.eq.coordination');
          } else if (serviceType === 'Planning') {
            query = query.or('service_type.eq.Planning,lookup_key.eq.planning');
          } else {
            // Fallback to exact service_type match
            query = query.eq('service_type', serviceType);
          }
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
        
        console.log('Found packages:', data?.length || 0);
        console.log('Sample packages:', data?.slice(0, 3).map(p => ({ 
          name: p.name, 
          service_type: p.service_type, 
          lookup_key: p.lookup_key 
        })));
        
        setPackages(data || []);
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [serviceType, eventType, filters]);

  return { packages, loading, error };
};

export const useRecommendedVendors = (filters: {
  servicePackageId: string;
  eventDate: string;
  region?: string;
  languages?: string[];
  styles?: number[];
  vibes?: number[];
}) => {
  const [recommendedVendors, setRecommendedVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendedVendors = async () => {
      // Check if Supabase is configured first
      if (!isSupabaseConfigured() || !supabase || !filters.servicePackageId || filters.servicePackageId.trim() === '') {
        if (loading) {
          setRecommendedVendors([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        // First, get vendors who have this package approved and are available
        const { data, error } = await supabase
          .from('vendor_service_packages')
          .select(`
            vendor_id,
            service_package_id,
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

        if (error) {
          console.warn('Supabase query error:', error);
          if (loading) {
            setRecommendedVendors([]);
            setError(null);
            setLoading(false);
          }
          return;
        }

        let vendorData = data?.map(item => item.vendors).filter(Boolean) || [];

        // Check vendor availability for the event date
        if (filters.eventDate && vendorData.length > 0) {
          const eventDate = new Date(filters.eventDate);
          const { data: availabilityData, error: availabilityError } = await supabase
            .from('events')
            .select('vendor_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .gte('start_time', filters.eventDate.split('T')[0])
            .lt('start_time', new Date(new Date(filters.eventDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

          if (!availabilityError && availabilityData) {
            // Filter out vendors who are already booked on this date
            const bookedVendorIds = availabilityData.map(event => event.vendor_id);
            vendorData = vendorData.filter(vendor => 
              !bookedVendorIds.includes(vendor.id)
            );
          }
        }

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
          const { data: vendorLanguages, error: languageError } = await supabase
            .from('vendor_languages')
            .select('vendor_id, language_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .in('language_id', filters.languages);

          if (!languageError && vendorLanguages && vendorLanguages.length > 0) {
            const vendorIdsWithLanguages = vendorLanguages.map(vl => vl.vendor_id);
            vendorData = vendorData.filter(vendor => 
              vendorIdsWithLanguages.includes(vendor.id)
            );
          }
        }

        // If we have style preferences, filter vendors
        if (filters.styles && filters.styles.length > 0 && vendorData.length > 0) {
          const { data: vendorStyles, error: styleError } = await supabase
            .from('vendor_style_tags')
            .select('vendor_id, style_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .in('style_id', filters.styles);

          if (!styleError && vendorStyles && vendorStyles.length > 0) {
            const vendorIdsWithStyles = vendorStyles.map(vs => vs.vendor_id);
            vendorData = vendorData.filter(vendor => 
              vendorIdsWithStyles.includes(vendor.id)
            );
          }
        }

        // If we have vibe preferences, filter vendors
        if (filters.vibes && filters.vibes.length > 0 && vendorData.length > 0) {
          const { data: vendorVibes, error: vibeError } = await supabase
            .from('vendor_vibe_tags')
            .select('vendor_id, vibe_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .in('vibe_id', filters.vibes);

          if (!vibeError && vendorVibes && vendorVibes.length > 0) {
            const vendorIdsWithVibes = vendorVibes.map(vv => vv.vendor_id);
            vendorData = vendorData.filter(vendor => 
              vendorIdsWithVibes.includes(vendor.id)
            );
          }
        }

        // Sort by rating (highest first)
        vendorData.sort((a, b) => {
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.years_experience || 0) - (a.years_experience || 0);
        });

        setRecommendedVendors(vendorData);
        setError(null);
      } catch (err) {
        console.warn('Error fetching recommended vendors:', err);
        if (loading) {
          setRecommendedVendors([]);
          setError(null);
        }
      } finally {
        if (loading) {
          setLoading(false);
        }
      }
    };

    fetchRecommendedVendors();
  }, [filters.servicePackageId, filters.eventDate, filters.region, JSON.stringify(filters.languages), JSON.stringify(filters.styles), JSON.stringify(filters.vibes)]);

  return { vendors: recommendedVendors, loading, error };
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

      if (!isSupabaseConfigured() || !supabase) {
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

    if (!isSupabaseConfigured()) {
      return updatedLeadInfo;
    }

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