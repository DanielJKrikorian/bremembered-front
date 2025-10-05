import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useCouple } from './useCouple';

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

export const useWeddingTimeline = (forWebsite: boolean = false): UseWeddingTimeline => {
  const { couple } = useCouple();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!couple?.id) {
        setLoading(false);
        return;
      }
      if (!supabase || !isSupabaseConfigured()) {
        setEvents([
          {
            id: '1',
            couple_id: couple.id,
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
        let query = supabase
          .from('timeline_events')
          .select('*')
          .eq('couple_id', couple.id);
        if (forWebsite) {
          query = query.eq('wedding_website', true);
        }
        query = query.order('event_date', { ascending: true }).order('event_time', { ascending: true });
        const { data, error } = await query;
        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        setError('Failed to fetch timeline events: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [couple, forWebsite]);

  return { events, loading, error };
};