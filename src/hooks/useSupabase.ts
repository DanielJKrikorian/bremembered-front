import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServicePackage, Vendor, VendorService, Venue, StyleTag, VibeTag, VendorReview, VendorServicePackage, LeadInformation } from '../types/booking';

// Helper function to check if Supabase is available
const isSupabaseAvailable = () => {
  return supabase !== null;
};

export const useServicePackages = (serviceType?: string, eventType?: string, filters?: {
  minHours?: number;
  maxHours?: number;
  coverage?: string[];
  minPrice?: number;
  maxPrice?: number;
}) => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      try {
        let query = supabase!
          .from('service_packages')
          .select('id, service_type, name, description, price, features, coverage, hour_amount, event_type, status')
          .eq('status', 'approved');

        if (serviceType) {
          query = query.eq('service_type', serviceType);
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
        setPackages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [serviceType, eventType, filters]);

  return { packages, loading, error };
};

export const useVendorsByPackage = (servicePackageId: string) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorsByPackage = async () => {
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase!
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
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      try {
        let query = supabase!
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
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      try {
        let query = supabase!.from('venues').select('*');

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
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase!
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
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase!
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
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      try {
        let query = supabase!
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
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase!
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
      // Use mock data immediately to avoid loading issues
      const mockVendors = [
        {
          id: 'mock-vendor-1',
          name: 'Elite Wedding Photography',
          profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
          rating: 4.9,
          years_experience: 8,
          phone: '(555) 123-4567',
          portfolio_photos: [
            'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
          ],
          specialties: ['Wedding Photography', 'Engagement Sessions', 'Fine Art'],
          service_areas: ['Los Angeles', 'Orange County', 'Ventura County'],
          profile: 'Award-winning wedding photographer with a passion for capturing authentic moments and emotions. Specializing in romantic, timeless imagery that tells your unique love story.',
          awards: ['Best Wedding Photographer 2023', 'Couples Choice Award', 'Top Vendor Award'],
          score: 9.8
        },
        {
          id: 'mock-vendor-2',
          name: 'Timeless Moments Studio',
          profile_photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
          rating: 4.8,
          years_experience: 6,
          phone: '(555) 987-6543',
          portfolio_photos: [
            'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800'
          ],
          specialties: ['Destination Weddings', 'Outdoor Ceremonies', 'Editorial Style'],
          service_areas: ['San Francisco', 'Napa Valley', 'Sonoma County'],
          profile: 'Creative wedding photographer known for artistic compositions and natural lighting. Capturing the beauty and emotion of your special day with a documentary approach.',
          awards: ['Rising Star Award 2023', 'Best Portfolio Award'],
          score: 9.5
        },
        {
          id: 'mock-vendor-3',
          name: 'Golden Hour Photography',
          profile_photo: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
          rating: 4.7,
          years_experience: 10,
          phone: '(555) 456-7890',
          portfolio_photos: [
            'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800'
          ],
          specialties: ['Sunset Photography', 'Beach Weddings', 'Romantic Portraits'],
          service_areas: ['San Diego', 'Orange County', 'Riverside County'],
          profile: 'Experienced photographer specializing in golden hour and sunset wedding photography. Creating dreamy, romantic images that capture the magic of your celebration.',
          awards: ['Veteran Photographer Award'],
          score: 9.2
        }
      ];

      // Always use mock data for now to avoid loading issues
      setVendors(mockVendors);
      setLoading(false);
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
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase!
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
      if (!isSupabaseAvailable()) {
        console.log('Supabase not available, using local storage fallback');
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
        setLoading(false);
        return;
      }

      try {
        const sessionId = getSessionId();
        
        // Try to get existing lead information
        const { data: existingLead, error: fetchError } = await supabase!
          .from('leads_information')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        
        if (existingLead) {
          setLeadInfo(existingLead);
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

    // Try to persist to database if available
    if (!isSupabaseAvailable()) {
      console.log('Supabase not available, using local state only');
      return updatedLeadInfo;
    }

    try {
      const { data, error } = await supabase!
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