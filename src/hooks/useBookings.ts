import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Booking {
  id: string;
  couple_id: string;
  vendor_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  service_type: string;
  created_at: string;
  updated_at: string;
  rating?: number;
  package_id?: string;
  event_id?: string;
  venue_id?: string;
  vibe?: string;
  initial_payment?: number;
  final_payment?: number;
  platform_fee?: number;
  paid_amount?: number;
  booking_intent_id?: string;
  discount?: number;
  vendor_final_share?: number;
  platform_final_share?: number;
  final_payment_status?: 'pending' | 'paid';
  payments?: Array<{
    id: string;
    amount: number;
    payment_type: string;
    created_at: string;
    tip?: number;
    status: string;
  }>;
  vendors?: {
    id: string;
    name: string;
    profile_photo?: string;
    rating?: number;
    years_experience: number;
    user_id: string;
  };
  service_packages?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    service_type: string;
    hour_amount?: number;
    features?: string[];
  };
  venues?: {
    id: string;
    name: string;
    street_address?: string;
    city?: string;
    state?: string;
  };
  events?: {
    id: string;
    start_time: string;
    end_time: string;
    title?: string;
    location?: string;
  };
}

export const useBookings = () => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated || !user) {
        setBookings([]);
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Return mock bookings for demo purposes
        const mockBookings: Booking[] = [
          {
            id: 'mock-booking-1',
            couple_id: user.id,
            vendor_id: 'mock-vendor-1',
            status: 'confirmed',
            amount: 250000, // $2,500 in cents
            initial_payment: 125000,
            final_payment: 125000,
            platform_fee: 15000,
            paid_amount: 125000,
            vendor_final_share: 62500,
            platform_final_share: 62500,
            final_payment_status: 'pending',
            service_type: 'Photography',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            vendors: {
              id: 'mock-vendor-1',
              name: 'Elegant Moments Photography',
              profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
              rating: 4.9,
              years_experience: 10,
              user_id: 'mock-user-1'
            },
            service_packages: {
              id: 'mock-package-1',
              name: 'Premium Wedding Photography',
              description: 'Complete wedding day photography with 8 hours of coverage',
              price: 250000,
              service_type: 'Photography',
              hour_amount: 8,
              features: ['8 hours coverage', '500+ edited photos', 'Online gallery', 'Print release']
            },
            venues: {
              id: 'mock-venue-1',
              name: 'Sunset Gardens',
              street_address: '123 Garden Lane',
              city: 'Los Angeles',
              state: 'CA'
            },
            events: {
              id: 'mock-event-1',
              start_time: '2024-08-15T16:00:00Z',
              end_time: '2024-08-15T23:00:00Z',
              title: 'Sarah & Michael Wedding',
              location: 'Sunset Gardens'
            },
            payments: [
              {
                id: 'mock-payment-1',
                amount: 125000,
                payment_type: 'deposit',
                created_at: '2024-01-15T10:00:00Z',
                tip: 0,
                status: 'succeeded'
              }
            ]
          }
        ];
        setBookings(mockBookings);
        setLoading(false);
        return;
      }

      try {
        // First, get the couple record for this user
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (coupleError) {
          console.error('Error fetching couple:', coupleError);
          throw coupleError;
        }

        if (!coupleData) {
          setBookings([]);
          setLoading(false);
          return;
        }

        // Fetch bookings for this couple with related data
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            vendors!inner(
              id,
              name,
              profile_photo,
              rating,
              years_experience,
              user_id
            ),
            service_packages(
              id,
              name,
              description,
              price,
              service_type,
              hour_amount,
              features
            ),
            venues(
              id,
              name,
              street_address,
              city,
              state
            ),
            events(
              id,
              start_time,
              end_time,
              title,
              location
            ),
            payments!payments_booking_id_fkey(
              id,
              amount,
              payment_type,
              created_at,
              tip,
              status
            )
          `)
          .eq('couple_id', coupleData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();

    if (!user?.id) return;

    // Real-time subscriptions
    const coupleSubscription = supabase
      .channel('couple-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `user_id=eq.${user.id}` },
        () => {
          console.log('Couple data changed, refetching bookings');
          fetchBookings();
        }
      )
      .subscribe();

    const bookingSubscription = supabase
      .channel('bookings-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `couple_id=eq.${user.id}` },
        (payload) => {
          console.log('Booking updated:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    const paymentSubscription = supabase
      .channel('payments-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments', filter: `couple_id=eq.${user.id}` },
        (payload) => {
          console.log('New payment detected:', payload);
          if (payload.new.status === 'succeeded') {
            fetchBookings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(coupleSubscription);
      supabase.removeChannel(bookingSubscription);
      supabase.removeChannel(paymentSubscription);
    };
  }, [user, isAuthenticated]);

  return { bookings, loading, error };
};