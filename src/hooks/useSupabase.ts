import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { ServicePackage, Vendor, VendorService, Venue, StyleTag, VibeTag, VendorReview, VendorServicePackage, LeadInformation } from '../types/booking';

const transformToLookupKey = (serviceName: string): string => {
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
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, returning empty packages');
        setPackages([]);
        setLoading(false);
        return;
      }

      try {
        const serviceLookupMap: Record<string, string> = {
          'Photography': 'photography',
          'DJ Services': 'dj',
          'Day-of Coordination': 'coordination',
          'Coordination': 'coordination',
          'Videography': 'videography',
          'Live Musician': 'live_musician',
          'Planning': 'planning'
        };

        let query = supabase
          .from('service_packages')
          .select('id, slug, service_type, name, description, price, features, coverage, hour_amount, event_type, status, lookup_key, primary_image')
          .eq('status', 'approved')
          .neq('service_type', 'Editing')
          .neq('service_type', 'Photo Booth')
          .not('service_type', 'like', '%,%');

        if (serviceType) {
          const lookupKey = serviceLookupMap[serviceType];
          if (lookupKey) {
            query = query.eq('lookup_key', lookupKey);
          }
        } else if (filters?.selectedServices && filters.selectedServices.length > 0) {
          const lookupKeys = filters.selectedServices
            .map(service => serviceLookupMap[service])
            .filter(Boolean);
          
          if (lookupKeys.length > 0) {
            query = query.in('lookup_key', lookupKeys);
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
          const coverageFilters = filters.coverage.map(c => `coverage->events.cs.["${c}"]`).join(',');
          query = query.or(coverageFilters);
        }

        const { data, error } = await query.order('price', { ascending: true });

        if (error) throw error;
        
        const packageData = data?.map(pkg => ({
          ...pkg,
          slug: pkg.slug 
            ? pkg.slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-') 
            : `package-${pkg.id}`
        })) || [];
        
        console.log('Processed package data:', packageData);
        packageData.forEach(pkg => {
          console.log(`Package: ${pkg.name}, ID: ${pkg.id}, Slug: ${pkg.slug}`);
        });

        setPackages(packageData);
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

export const useRecommendedVendors = (filters: {
  servicePackageId: string;
  eventDate: string;
  region?: string;
  languages?: string[];
  styles?: number[];
  vibes?: number[];
}) => {
  const [recommendedVendors, setRecommendedVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendedVendors = async () => {
      if (!isSupabaseConfigured() || !supabase || !filters.servicePackageId || filters.servicePackageId.trim() === '') {
        if (loading) {
          setRecommendedVendors([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        // Step 1: Fetch vendor_service_packages with basic vendor info
        const { data: servicePackageData, error: servicePackageError } = await supabase
          .from('vendor_service_packages')
          .select(`
            vendor_id,
            service_package_id,
            vendors (
              id,
              name,
              slug,
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

        if (servicePackageError) {
          console.warn('Supabase query error for vendor_service_packages:', servicePackageError);
          throw servicePackageError;
        }

        console.log('Raw vendor_service_packages data:', servicePackageData);

        // Step 2: Fetch premium amounts separately for all vendor IDs
        const vendorIds = servicePackageData?.map(item => item.vendor_id).filter(Boolean) || [];
        let vendorPremiums: { vendor_id: string; amount: number }[] = [];
        if (vendorIds.length > 0) {
          const { data: premiumData, error: premiumError } = await supabase
            .from('vendor_premiums')
            .select('vendor_id, amount')
            .in('vendor_id', vendorIds);

          if (premiumError) {
            console.error('Supabase query error for vendor_premiums:', premiumError);
          } else {
            vendorPremiums = premiumData || [];
            console.log('Raw vendor_premiums data:', vendorPremiums);
          }
        }

        // Map vendor data with premium_amount
        let vendorData = servicePackageData?.map(item => {
          const vendor = item.vendors;
          const premium = vendorPremiums.find(p => p.vendor_id === item.vendor_id);
          return {
            ...vendor,
            slug: vendor.slug || `vendor-${vendor.id}`,
            premium_amount: premium ? premium.amount : null
          };
        }).filter(Boolean) as Vendor[] || [];

        // Step 3: Fetch travel fees for the selected region
        if (filters.region && vendorData.length > 0) {
          const { data: serviceAreasData, error: serviceAreaError } = await supabase
            .from('vendor_service_areas')
            .select('vendor_id, travel_fee')
            .in('vendor_id', vendorData.map(v => v.id))
            .eq('region', filters.region);

          if (serviceAreaError) {
            console.error('Error fetching vendor_service_areas:', serviceAreaError);
          } else {
            console.log('Raw vendor_service_areas data:', serviceAreasData);
            vendorData = vendorData.map(vendor => ({
              ...vendor,
              travel_fee: serviceAreasData?.find(area => area.vendor_id === vendor.id)?.travel_fee ?? null
            }));
          }
        }

        // Step 4: Filter by event date availability
        if (filters.eventDate && vendorData.length > 0) {
          const { data: availabilityData, error: availabilityError } = await supabase
            .from('events')
            .select('vendor_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .gte('start_time', filters.eventDate.split('T')[0])
            .lt('start_time', new Date(new Date(filters.eventDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

          if (availabilityError) {
            console.error('Error checking availability:', availabilityError);
          } else {
            const bookedVendorIds = availabilityData?.map(event => event.vendor_id) || [];
            vendorData = vendorData.filter(vendor => !bookedVendorIds.includes(vendor.id));
          }
        }

        // Step 5: Filter by languages
        if (filters.languages && filters.languages.length > 0 && vendorData.length > 0) {
          const { data: vendorLanguages, error: languageError } = await supabase
            .from('vendor_languages')
            .select('vendor_id, language_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .in('language_id', filters.languages);

          if (languageError) {
            console.error('Error fetching vendor_languages:', languageError);
          } else if (vendorLanguages && vendorLanguages.length > 0) {
            const vendorIdsWithLanguages = vendorLanguages.map(vl => vl.vendor_id);
            vendorData = vendorData.filter(vendor => vendorIdsWithLanguages.includes(vendor.id));
          }
        }

        // Step 6: Filter by styles
        if (filters.styles && filters.styles.length > 0 && vendorData.length > 0) {
          const { data: vendorStyles, error: styleError } = await supabase
            .from('vendor_style_tags')
            .select('vendor_id, style_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .in('style_id', filters.styles);

          if (styleError) {
            console.error('Error fetching vendor_style_tags:', styleError);
          } else if (vendorStyles && vendorStyles.length > 0) {
            const vendorIdsWithStyles = vendorStyles.map(vs => vs.vendor_id);
            vendorData = vendorData.filter(vendor => vendorIdsWithStyles.includes(vendor.id));
          }
        }

        // Step 7: Filter by vibes
        if (filters.vibes && filters.vibes.length > 0 && vendorData.length > 0) {
          const { data: vendorVibes, error: vibeError } = await supabase
            .from('vendor_vibe_tags')
            .select('vendor_id, vibe_id')
            .in('vendor_id', vendorData.map(v => v.id))
            .in('vibe_id', filters.vibes);

          if (vibeError) {
            console.error('Error fetching vendor_vibe_tags:', vibeError);
          } else if (vendorVibes && vendorVibes.length > 0) {
            const vendorIdsWithVibes = vendorVibes.map(vv => vv.vendor_id);
            vendorData = vendorData.filter(vendor => vendorIdsWithVibes.includes(vendor.id));
          }
        }

        // Sort vendors by rating and experience
        vendorData.sort((a, b) => {
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.years_experience || 0) - (a.years_experience || 0);
        });

        console.log('Processed vendor data with travel fees:', vendorData);
        vendorData.forEach(vendor => {
          console.log(`Vendor: ${vendor.name}, ID: ${vendor.id}, Premium Amount: ${vendor.premium_amount}, Travel Fee: ${vendor.travel_fee}, Region: ${filters.region}`);
        });

        setRecommendedVendors(vendorData);
        setError(null);
      } catch (err) {
        console.warn('Error fetching recommended vendors:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vendors. Please check your connection.');
        setRecommendedVendors([]);
      } finally {
        if (loading) {
          setLoading(false);
        }
      }
    };

    fetchRecommendedVendors();
  }, [
    filters.servicePackageId,
    filters.eventDate,
    filters.region,
    JSON.stringify(filters.languages),
    JSON.stringify(filters.styles),
    JSON.stringify(filters.vibes)
  ]);

  return { vendors: recommendedVendors, loading, error };
};

export const useVendorsByPackage = (servicePackageId: string) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorsByPackage = async () => {
      if (!isSupabaseConfigured() || !supabase || !servicePackageId) {
        const mockVendors: Vendor[] = [
          {
            id: 'mock-vendor-1',
            slug: 'elegant-moments-photography',
            name: 'Elegant Moments Photography',
            profile: 'Professional wedding photographer with over 10 years of experience.',
            rating: 4.9,
            profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
            years_experience: 10,
            phone: '(555) 123-4567',
            portfolio_photos: [
              'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
              'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800'
            ],
            portfolio_videos: [
              'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
            ],
            specialties: ['Outdoor Weddings', 'Intimate Ceremonies'],
            service_areas: ['Greater Boston', 'Cape Cod'],
            premium_amount: 50000 // $500 in cents
          }
        ];
        console.log('Using mock vendors:', mockVendors);
        setVendors(mockVendors);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vendor_service_packages')
          .select(`
            vendor_id,
            service_package_id,
            vendors (
              id,
              slug,
              name,
              profile_photo,
              rating,
              years_experience,
              phone,
              portfolio_photos,
              portfolio_videos,
              profile,
              specialties,
              service_areas
            )
          `)
          .eq('service_package_id', servicePackageId)
          .eq('status', 'approved');

        if (error) {
          console.error('Supabase query error for vendor_service_packages:', error);
          throw error;
        }

        console.log('Raw vendor_service_packages data:', data);

        // Fetch premium amounts separately
        const vendorIds = data?.map(item => item.vendor_id).filter(Boolean) || [];
        let vendorPremiums = [];
        if (vendorIds.length > 0) {
          const { data: premiumData, error: premiumError } = await supabase
            .from('vendor_premiums')
            .select('vendor_id, amount')
            .in('vendor_id', vendorIds);

          if (premiumError) {
            console.error('Supabase query error for vendor_premiums:', premiumError);
          } else {
            vendorPremiums = premiumData || [];
            console.log('Raw vendor_premiums data:', premiumData);
          }
        }

        // Map vendors and include premium_amount and slug with fallback
        const vendorData = data?.map(item => ({
          ...item.vendors,
          slug: item.vendors.slug || `vendor-${item.vendors.id}`,
          premium_amount: vendorPremiums.find(p => p.vendor_id === item.vendor_id)?.amount ?? null
        })).filter(Boolean) || [];

        console.log('Processed vendor data:', vendorData);
        vendorData.forEach(vendor => {
          console.log(`Vendor: ${vendor.name}, ID: ${vendor.id}, Slug: ${vendor.slug}, Premium Amount: ${vendor.premium_amount}`);
        });

        setVendors(vendorData);
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setVendors([]);
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
      if (!isSupabaseConfigured() || !supabase) {
        const mockVendors: Vendor[] = [
          {
            id: 'mock-vendor-1',
            slug: 'elegant-moments-photography',
            name: 'Elegant Moments Photography',
            profile: 'Professional wedding photographer with over 10 years of experience.',
            rating: 4.9,
            profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
            years_experience: 10,
            phone: '(555) 123-4567',
            portfolio_photos: [
              'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
              'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800'
            ],
            portfolio_videos: [
              'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
            ],
            specialties: ['Outdoor Weddings', 'Intimate Ceremonies'],
            service_areas: ['Greater Boston', 'Cape Cod'],
            premium_amount: 50000 // $500 in cents
          }
        ];
        console.log('Using mock vendors:', mockVendors);
        setVendors(mockVendors);
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('vendors')
          .select(`
            id,
            slug,
            name,
            profile_photo,
            rating,
            years_experience,
            phone,
            portfolio_photos,
            portfolio_videos,
            profile,
            specialties,
            service_areas,
            vendor_services!inner(service_type, is_active),
            vendor_premiums!left(amount)
          `);

        if (serviceType) {
          query = query.eq('vendor_services.service_type', serviceType)
                      .eq('vendor_services.is_active', true);
        }

        if (location) {
          query = query.contains('service_areas', [location]);
        }

        const { data, error } = await query.order('rating', { ascending: false, nullsLast: true });

        if (error) {
          console.error('Supabase query error:', error);
          throw error;
        }

        console.log('Raw vendors data:', data);

        const vendorData = data?.map(vendor => ({
          ...vendor,
          slug: vendor.slug || `vendor-${vendor.id}`,
          premium_amount: vendor.vendor_premiums?.amount ?? null
        })) || [];

        console.log('Processed vendor data:', vendorData);
        vendorData.forEach(vendor => {
          console.log(`Vendor: ${vendor.name}, ID: ${vendor.id}, Slug: ${vendor.slug}, Premium Amount: ${vendor.premium_amount}`);
        });

        setVendors(vendorData);
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setVendors([]);
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
      if (!isSupabaseConfigured() || !supabase) {
        const mockVenues: Venue[] = [
          {
            id: 'mock-venue-1',
            name: 'Sunset Gardens',
            street_address: '123 Garden Lane',
            city: 'Los Angeles',
            state: 'CA',
            region: 'Southern California',
            booking_count: 150
          }
        ];
        setVenues(mockVenues);
        setLoading(false);
        return;
      }

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
      if (!isSupabaseConfigured() || !supabase) {
        const mockStyleTags: StyleTag[] = [
          { id: 1, label: 'Classic' },
          { id: 2, label: 'Modern' },
          { id: 3, label: 'Rustic' }
        ];
        setStyleTags(mockStyleTags);
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
      if (!isSupabaseConfigured() || !supabase) {
        const mockVibeTags: VibeTag[] = [
          { id: 1, label: 'Romantic' },
          { id: 2, label: 'Fun' },
          { id: 3, label: 'Elegant' }
        ];
        setVibeTags(mockVibeTags);
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
      if (!isSupabaseConfigured() || !supabase) {
        const mockServiceAreas = [
          { id: '1', state: 'MA', region: 'Greater Boston' },
          { id: '2', state: 'MA', region: 'Cape Cod' },
          { id: '3', state: 'MA', region: 'Western Massachusetts' },
          { id: '4', state: 'RI', region: 'Providence' },
          { id: '5', state: 'RI', region: 'Newport' },
          { id: '6', state: 'NH', region: 'Seacoast' },
          { id: '7', state: 'NH', region: 'White Mountains' },
          { id: '8', state: 'CT', region: 'Hartford' },
          { id: '9', state: 'CT', region: 'New Haven' },
          { id: '10', state: 'ME', region: 'Portland' },
          { id: '11', state: 'VT', region: 'Burlington' }
        ];
        
        const filteredAreas = state 
          ? mockServiceAreas.filter(area => area.state === state)
          : mockServiceAreas;
        
        setServiceAreas(filteredAreas);
        setLoading(false);
        return;
      }

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
      if (!isSupabaseConfigured() || !supabase) {
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
  const [averageRating, setAverageRating] = useState<number | null>(null);
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
        setAverageRating(5.0); // Mock average rating
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

        // Calculate average rating from overall_rating
        if (data && data.length > 0) {
          const totalRating = data.reduce((sum, review) => sum + (review.overall_rating || 0), 0);
          const avgRating = totalRating / data.length;
          setAverageRating(avgRating);
        } else {
          setAverageRating(null);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setAverageRating(null);
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchReviews();
    }
  }, [vendorId]);

  return { reviews, averageRating, loading, error };
};

export const useLatestReviews = (limit: number = 3) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  useEffect(() => {
    const fetchLatestReviews = async () => {
      const now = Date.now();
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      
      if (lastFetch && (now - lastFetch) < weekInMs && reviews.length > 0) {
        return;
      }

      if (!isSupabaseConfigured() || !supabase) {
        const mockReviews = [
          {
            id: 'mock-1',
            overall_rating: 5,
            feedback: 'B. Remembered made our wedding planning so much easier. We found our perfect photographer and DJ in one place, and the booking process was seamless.',
            vendor: { name: 'Elegant Moments Photography' },
            couple: { name: 'Sarah & Michael', wedding_date: '2024-01-15' }
          },
          {
            id: 'mock-2',
            overall_rating: 5,
            feedback: 'The quality of vendors on this platform is incredible. Our videographer captured our day perfectly, and the coordination service was flawless.',
            vendor: { name: 'Timeless Studios' },
            couple: { name: 'Emily & James', wedding_date: '2024-01-10' }
          },
          {
            id: 'mock-3',
            overall_rating: 5,
            feedback: 'From booking to our wedding day, everything was perfect. The vendors were professional, and the platform made everything so organized.',
            vendor: { name: 'Perfect Harmony Events' },
            couple: { name: 'Jessica & David', wedding_date: '2024-01-05' }
          }
        ];
        setReviews(mockReviews);
        setLoading(false);
        setLastFetch(now);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vendor_reviews')
          .select(`
            id,
            overall_rating,
            feedback,
            created_at,
            vendors!inner(
              name
            ),
            couples!inner(
              name,
              wedding_date,
              profile_photo
            )
          `)
          .not('feedback', 'is', null)
          .not('overall_rating', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        
        const transformedReviews = [];
        
        for (const review of data || []) {
          let serviceType = null;
          
          if (review.vendor_id && review.couple_id) {
            const { data: booking } = await supabase
              .from('bookings')
              .select('service_type')
              .eq('vendor_id', review.vendor_id)
              .eq('couple_id', review.couple_id)
              .limit(1)
              .single();
            
            serviceType = booking?.service_type;
          }
          
          transformedReviews.push({
            id: review.id,
            overall_rating: review.overall_rating,
            feedback: review.feedback,
            vendor: review.vendors,
            couple: review.couples,
            created_at: review.created_at,
            service_type: serviceType
          });
        }
        
        setReviews(transformedReviews);
        setLastFetch(now);
      } catch (err) {
        console.error('Error fetching latest reviews:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestReviews();
  }, [limit, lastFetch]);

  return { reviews, loading, error };
};

const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

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
      if (!isSupabaseConfigured() || !supabase) {
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
        
        const { data: createdLead, error: createError } = await supabase
          .from('leads_information')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (createError) throw createError;
        
        if (createdLead) {
          setLeadInfo(createdLead);
        } else {
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
            current_step: 'service_selection'
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
      
      setLeadInfo(data);
      return data;
    } catch (err) {
      console.error('Error updating lead info:', err);
      return updatedLeadInfo;
    }
  };

  return { leadInfo, updateLeadInfo, loading, error };
};