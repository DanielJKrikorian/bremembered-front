import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useCouple } from './useCouple';

export interface TimelineEvent {
  id: string;
  couple_id: string;
  title: string;
  start_time: string;
  end_time?: string;
  description?: string;
  photo_shotlist?: string;
  created_at: string;
  updated_at: string;
}

interface UseWeddingTimeline {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
}

export const useWeddingTimeline = (): UseWeddingTimeline => {
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
            start_time: '14:00',
            end_time: '15:00',
            description: 'Wedding ceremony at the chapel',
            photo_shotlist: 'Bride walking down the aisle',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('timeline_events')
          .select('*')
          .eq('couple_id', couple.id)
          .order('start_time', { ascending: true });
        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        setError('Failed to fetch timeline events: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [couple]);

  return { events, loading, error };
};