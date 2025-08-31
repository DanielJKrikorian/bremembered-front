import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Hook for fetching latest reviews
export const useLatestReviews = (limit: number = 6) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockReviews = [
          {
            id: '1',
            overall_rating: 5,
            feedback: 'Amazing photographer! Captured every moment perfectly.',
            vendor_reviews: {
              vendors: {
                name: 'Sarah Photography',
                profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
              }
            },
            couples: {
              name: 'Emma & James'
            },
            created_at: '2024-01-15T10:00:00Z'
          }
        ];
        setReviews(mockReviews);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vendor_reviews')
          .select(`
            *,
            vendors(name, profile_photo),
            couples(name)
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setReviews(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [limit]);

  return { reviews, loading, error };
};

// Hook for fetching service packages
export const useServicePackages = (serviceType?: string) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockPackages = [
          {
            id: '1',
            name: 'Premium Wedding Photography',
            description: 'Complete wedding day coverage',
            price: 250000,
            service_type: 'Photography',
            hour_amount: 8,
            features: ['8 hours coverage', '500+ edited photos', 'Online gallery']
          }
        ];
        setPackages(serviceType ? mockPackages.filter(p => p.service_type === serviceType) : mockPackages);
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('service_packages')
          .select('*')
          .eq('status', 'approved');

        if (serviceType) {
          query = query.eq('service_type', serviceType);
        }

        const { data, error } = await query.order('price', { ascending: true });

        if (error) throw error;
        setPackages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch packages');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [serviceType]);

  return { packages, loading, error };
};

// Hook for fetching vendors by package
export const useVendorsByPackage = (packageIds: string[]) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (packageIds.length === 0) {
      setVendors([]);
      setLoading(false);
      return;
    }

    const fetchVendors = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockVendors = [
          {
            id: '1',
            name: 'Sarah Photography',
            profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
            rating: 4.9,
            years_experience: 8
          }
        ];
        setVendors(mockVendors);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vendors')
          .select(`
            *,
            service_packages!inner(id)
          `)
          .in('service_packages.id', packageIds);

        if (error) throw error;
        setVendors(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [packageIds]);

  return { vendors, loading, error };
};

// Hook for fetching venues
export const useVenues = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockVenues = [
          {
            id: '1',
            name: 'Sunset Gardens',
            street_address: '123 Garden Lane',
            city: 'Los Angeles',
            state: 'CA'
          }
        ];
        setVenues(mockVenues);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .order('name');

        if (error) throw error;
        setVenues(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch venues');
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  return { venues, loading, error };
};

// Hook for fetching service areas
export const useServiceAreas = () => {
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceAreas = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockAreas = [
          { id: '1', state: 'CA', region: 'Los Angeles' },
          { id: '2', state: 'CA', region: 'San Francisco' }
        ];
        setServiceAreas(mockAreas);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('service_areas')
          .select('*')
          .order('state');

        if (error) throw error;
        setServiceAreas(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch service areas');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceAreas();
  }, []);

  return { serviceAreas, loading, error };
};

// Hook for fetching languages
export const useLanguages = () => {
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockLanguages = [
          { id: '1', language: 'English' },
          { id: '2', language: 'Spanish' },
          { id: '3', language: 'French' }
        ];
        setLanguages(mockLanguages);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .order('language');

        if (error) throw error;
        setLanguages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch languages');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  return { languages, loading, error };
};

// Hook for fetching style tags
export const useStyleTags = () => {
  const [styleTags, setStyleTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStyleTags = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockTags = [
          { id: 1, label: 'Modern', description: 'Clean and contemporary' },
          { id: 2, label: 'Rustic', description: 'Natural and earthy' },
          { id: 3, label: 'Classic', description: 'Timeless and elegant' }
        ];
        setStyleTags(mockTags);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('style_tags')
          .select('*')
          .order('label');

        if (error) throw error;
        setStyleTags(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch style tags');
      } finally {
        setLoading(false);
      }
    };

    fetchStyleTags();
  }, []);

  return { styleTags, loading, error };
};

// Hook for fetching vibe tags
export const useVibeTags = () => {
  const [vibeTags, setVibeTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVibeTags = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockTags = [
          { id: 1, label: 'Romantic', description: 'Soft and intimate' },
          { id: 2, label: 'Fun', description: 'Energetic and lively' },
          { id: 3, label: 'Elegant', description: 'Sophisticated and refined' }
        ];
        setVibeTags(mockTags);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vibe_tags')
          .select('*')
          .order('label');

        if (error) throw error;
        setVibeTags(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vibe tags');
      } finally {
        setLoading(false);
      }
    };

    fetchVibeTags();
  }, []);

  return { vibeTags, loading, error };
};

// Hook for fetching recommended vendors
export const useRecommendedVendors = (preferences: any) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendedVendors = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockVendors = [
          {
            id: '1',
            name: 'Sarah Photography',
            profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
            rating: 4.9,
            years_experience: 8,
            service_types: ['Photography']
          }
        ];
        setVendors(mockVendors);
        setLoading(false);
        return;
      }

      try {
        // This would implement vendor recommendation logic based on preferences
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .limit(10);

        if (error) throw error;
        setVendors(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recommended vendors');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedVendors();
  }, [preferences]);

  return { vendors, loading, error };
};

// Hook for fetching vendor reviews
export const useVendorReviews = (vendorId: string) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) return;

    const fetchVendorReviews = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockReviews = [
          {
            id: '1',
            overall_rating: 5,
            feedback: 'Excellent service!',
            couples: { name: 'John & Jane' },
            created_at: '2024-01-15T10:00:00Z'
          }
        ];
        setReviews(mockReviews);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vendor_reviews')
          .select(`
            *,
            couples(name)
          `)
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vendor reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorReviews();
  }, [vendorId]);

  return { reviews, loading, error };
};

// Hook for fetching lead information
export const useLeadInformation = (sessionId?: string) => {
  const [leadInfo, setLeadInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchLeadInfo = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockLeadInfo = {
          id: '1',
          session_id: sessionId,
          selected_services: ['Photography'],
          event_type: 'Wedding',
          current_step: 'service_selection'
        };
        setLeadInfo(mockLeadInfo);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('leads_information')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setLeadInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lead information');
      } finally {
        setLoading(false);
      }
    };

    fetchLeadInfo();
  }, [sessionId]);

  return { leadInfo, loading, error };
};