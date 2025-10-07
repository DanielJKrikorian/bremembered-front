import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface TimelineEvent {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
  location?: string;
  type: string;
  duration_minutes: number;
  is_standard: boolean;
  music_notes?: string;
  playlist_requests?: string;
  photo_shotlist?: string;
  created_at: string;
  updated_at: string;
  wedding_website: boolean;
}

interface UseWeddingTimeline {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
}

export const useWeddingTimeline = (forWebsite: boolean = false, slug?: string, vendorToken?: string): UseWeddingTimeline => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!slug) {
        console.warn('No slug provided for fetching timeline events');
        setLoading(false);
        return;
      }
      if (!supabase || !isSupabaseConfigured()) {
        console.warn('Supabase not configured for fetching timeline events');
        setEvents([
          {
            id: '1',
            couple_id: 'default',
            title: 'Ceremony',
            event_date: new Date().toISOString().split('T')[0],
            event_time: '14:00',
            duration_minutes: 60,
            type: 'ceremony',
            is_standard: true,
            description: 'Wedding ceremony at the chapel',
            photo_shotlist: 'Bride walking down the aisle',
            wedding_website: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        setLoading(false);
        return;
      }
      try {
        console.log('Fetching couple_id for slug:', slug);
        const { data: websiteData, error: websiteError } = await supabase
          .from('wedding_websites')
          .select('couple_id')
          .eq('slug', slug)
          .single();
        if (websiteError || !websiteData?.couple_id) {
          console.error('Error fetching couple_id:', websiteError);
          throw new Error('Failed to fetch couple_id for timeline events');
        }
        const coupleId = websiteData.couple_id;
        console.log('Fetching timeline events for couple_id:', coupleId);

        let query = supabase
          .from('timeline_events')
          .select('*')
          .eq('couple_id', coupleId)
          .order('event_date', { ascending: true })
          .order('event_time', { ascending: true });

        if (forWebsite) {
          query = query.eq('wedding_website', true);
        } else if (vendorToken) {
          // Verify vendor token
          const { data: tokenData, error: tokenError } = await supabase
            .from('shared_tokens')
            .select('couple_id')
            .eq('token', vendorToken)
            .eq('role', 'vendor')
            .single();
          if (tokenError || !tokenData || tokenData.couple_id !== coupleId) {
            console.error('Invalid vendor token:', tokenError);
            throw new Error('Invalid or unauthorized vendor token');
          }
          // Vendors see all events, not just wedding_website: true
        } else {
          // For non-vendor, non-website queries, require authentication
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('No authenticated user for private timeline access');
            throw new Error('Authentication required for private timeline access');
          }
        }

        const { data, error } = await query;
        if (error) {
          console.error('Supabase fetch error:', error);
          throw new Error(`Failed to fetch timeline events: ${error.message}`);
        }
        setEvents(data || []);
      } catch (err) {
        console.error('Error fetching timeline events:', err);
        setError('Failed to fetch timeline events: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [slug, forWebsite, vendorToken]);

  return { events, loading, error };
};