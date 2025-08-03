import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServicePackage, Vendor, VendorService, Venue, StyleTag, VibeTag, VendorReview, VendorServicePackage } from '../types/booking';

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
      if (!isSupabaseAvailable()) {
        setError('Supabase connection not available. Please check environment variables.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // First, get vendors who offer this service package
        const { data: vendorServicePackages, error: vspError } = await supabase!
          .from('vendor_service_packages')
          .select('vendor_id')
          .eq('service_package_id', filters.servicePackageId)
          .eq('status', 'approved');

        if (vspError) throw vspError;
        
        const vendorIds = vendorServicePackages?.map(vsp => vsp.vendor_id) || [];
        
        if (vendorIds.length === 0) {
          setVendors([]);
          setLoading(false);
          return;
        }

        // Check availability on the event date
        const { data: busyVendors, error: eventsError } = await supabase!
          .from('events')
          .select('vendor_id')
          .gte('start_time', filters.eventDate + 'T00:00:00')
          .lt('start_time', filters.eventDate + 'T23:59:59')
          .in('vendor_id', vendorIds);

        if (eventsError) throw eventsError;
        
        const busyVendorIds = busyVendors?.map(event => event.vendor_id) || [];
        const availableVendorIds = vendorIds.filter(id => !busyVendorIds.includes(id));

        if (availableVendorIds.length === 0) {
          setVendors([]);
          setLoading(false);
          return;
        }

        // Get vendor details
        const { data: vendorData, error: vendorError } = await supabase!
          .from('vendors')
          .select(`
            id,
            name,
            profile,
            rating,
            profile_photo,
            intro_video,
            years_experience,
            portfolio_photos,
            portfolio_videos,
            specialties,
            awards
          `)
          .in('id', availableVendorIds);

        if (vendorError) throw vendorError;

        // Score vendors based on matching preferences
        const scoredVendors = await Promise.all((vendorData || []).map(async (vendor) => {
          let score = 0;
          
          try {
            // Check region match
            if (filters.region) {
              const { data: serviceAreaMatch, error: regionError } = await supabase!
                .from('vendor_service_areas')
                .select('service_areas!inner(region)')
                .eq('vendor_id', vendor.id)
                .eq('service_areas.region', filters.region);
              
              if (!regionError && serviceAreaMatch && serviceAreaMatch.length > 0) {
                score += 10; // High priority for region match
              }
            }

            // Check language matches
            if (filters.languages && filters.languages.length > 0) {
              const { data: languageMatches, error: langError } = await supabase!
                .from('vendor_languages')
                .select('language_id')
                .eq('vendor_id', vendor.id)
                .in('language_id', filters.languages);
              
              if (!langError) {
                score += (languageMatches?.length || 0) * 3;
              }
            }

            // Check style matches
            if (filters.styles && filters.styles.length > 0) {
              const { data: styleMatches, error: styleError } = await supabase!
                .from('vendor_style_tags')
                .select('style_id')
                .eq('vendor_id', vendor.id)
                .in('style_id', filters.styles);
              
              if (!styleError) {
                score += (styleMatches?.length || 0) * 2;
              }
            }

            // Check vibe matches
            if (filters.vibes && filters.vibes.length > 0) {
              const { data: vibeMatches, error: vibeError } = await supabase!
                .from('vendor_vibe_tags')
                .select('vibe_id')
                .eq('vendor_id', vendor.id)
                .in('vibe_id', filters.vibes);
              
              if (!vibeError) {
                score += (vibeMatches?.length || 0) * 2;
              }
            }
          } catch (matchError) {
            console.warn('Error checking vendor matches:', matchError);
            // Continue with base score if matching fails
          }

          // Bonus for rating
          if (vendor.rating) {
            score += vendor.rating;
          }

          return { ...vendor, score };
        }));

        // Sort by score (highest first)
        const sortedVendors = scoredVendors.sort((a, b) => b.score - a.score);
        setVendors(sortedVendors);
      } catch (err) {
        console.error('Error fetching recommended vendors:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (filters.servicePackageId && filters.eventDate) {
      fetchRecommendedVendors();
    } else {
      setLoading(false);
    }
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
          .select('*')
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