import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Couple {
  id: string;
  user_id: string;
  name: string;
  partner1_name: string;
  partner2_name?: string;
  email?: string;
  phone?: string;
  wedding_date?: string;
  budget?: number;
  vibe_tags?: string[];
  venue_name?: string;
  guest_count?: number;
  ceremony_time?: string;
  reception_time?: string;
  notes?: string;
  venue_id?: string;
  venue_street_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_zip?: string;
  venue_region?: string;
  stripe_customer_id?: string;
  profile_photo?: string;
  created_at: string;
  updated_at: string;
}

export const useCouple = () => {
  const { user, isAuthenticated } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCouple = async () => {
      if (!isAuthenticated || !user) {
        setCouple(null);
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Return mock couple data for demo purposes
        const mockCouple: Couple = {
          id: 'mock-couple-1',
          user_id: user.id,
          name: 'Sarah & Michael',
          partner1_name: 'Sarah Johnson',
          partner2_name: 'Michael Davis',
          email: user.email || 'sarah.johnson@email.com',
          phone: '(555) 123-4567',
          wedding_date: '2024-08-15',
          budget: 450000, // $4,500 in cents
          venue_name: 'Sunset Gardens',
          guest_count: 120,
          ceremony_time: '16:00',
          reception_time: '18:00',
          notes: 'Planning our dream wedding in beautiful California! Looking for the perfect team to capture our special day.',
          venue_city: 'Los Angeles',
          venue_state: 'CA',
          venue_region: 'Southern California',
          profile_photo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        };
        setCouple(mockCouple);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('couples')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No couple record found, create one
            const newCouple = {
              user_id: user.id,
              name: user.user_metadata?.name || 'New Couple',
              partner1_name: user.user_metadata?.name || '',
              email: user.email,
              guest_count: 0
            };

            const { data: createdCouple, error: createError } = await supabase
              .from('couples')
              .insert([newCouple])
              .select()
              .single();

            if (createError) throw createError;
            setCouple(createdCouple);
          } else {
            throw error;
          }
        } else {
          setCouple(data);
        }
      } catch (err) {
        console.error('Error fetching couple:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch couple data');
      } finally {
        setLoading(false);
      }
    };

    fetchCouple();
  }, [user, isAuthenticated]);

  const updateCouple = async (updates: Partial<Couple>) => {
    if (!couple || !isAuthenticated) {
      throw new Error('No couple data to update or not authenticated');
    }

    // Update local state immediately for better UX
    const updatedCouple = { ...couple, ...updates, updated_at: new Date().toISOString() };
    setCouple(updatedCouple);

    if (!supabase || !isSupabaseConfigured()) {
      return updatedCouple;
    }

    try {
      const { data, error } = await supabase
        .from('couples')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', couple.id)
        .select()
        .single();

      if (error) throw error;
      setCouple(data);
      return data;
    } catch (err) {
      // Revert local state on error
      setCouple(couple);
      throw err;
    }
  };

  return { couple, loading, error, updateCouple };
};