import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { StyleTag, VibeTag } from '../types/booking';

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
  // Preferences
  style_preferences?: StyleTag[];
  vibe_preferences?: VibeTag[];
  language_preferences?: { id: string; language: string }[];
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
          .select(`
            *,
            couple_style_preferences(
              style_tags!inner(id, label, description)
            ),
            couple_vibe_preferences(
              vibe_tags!inner(id, label, description)
            ),
            couple_language_preferences(
              languages!inner(id, language)
            )
          `)
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
          // Transform the data to include preferences
          const coupleWithPreferences = {
            ...data,
            style_preferences: data.couple_style_preferences?.map((pref: any) => pref.style_tags).filter(Boolean) || [],
            vibe_preferences: data.couple_vibe_preferences?.map((pref: any) => pref.vibe_tags).filter(Boolean) || [],
            language_preferences: data.couple_language_preferences?.map((pref: any) => pref.languages).filter(Boolean) || []
          };
          console.log('Loaded couple with preferences:', {
            style_count: coupleWithPreferences.style_preferences.length,
            vibe_count: coupleWithPreferences.vibe_preferences.length,
            language_count: coupleWithPreferences.language_preferences.length
          });
          setCouple(coupleWithPreferences);
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

export const useCouplePreferences = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStylePreferences = async (styleIds: number[]) => {
    if (!isAuthenticated || !user || !supabase || !isSupabaseConfigured()) {
      throw new Error('Authentication required');
    }

    try {
      setLoading(true);
      
      // Get couple ID
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) throw coupleError;

      // Delete existing preferences
      await supabase
        .from('couple_style_preferences')
        .delete()
        .eq('couple_id', coupleData.id);

      // Insert new preferences
      if (styleIds.length > 0) {
        const preferences = styleIds.map(styleId => ({
          couple_id: coupleData.id,
          style_id: styleId
        }));

        const { error: insertError } = await supabase
          .from('couple_style_preferences')
          .insert(preferences);

        if (insertError) throw insertError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update style preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVibePreferences = async (vibeIds: number[]) => {
    if (!isAuthenticated || !user || !supabase || !isSupabaseConfigured()) {
      throw new Error('Authentication required');
    }

    try {
      setLoading(true);
      
      // Get couple ID
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) throw coupleError;

      // Delete existing preferences
      await supabase
        .from('couple_vibe_preferences')
        .delete()
        .eq('couple_id', coupleData.id);

      // Insert new preferences
      if (vibeIds.length > 0) {
        const preferences = vibeIds.map(vibeId => ({
          couple_id: coupleData.id,
          vibe_id: vibeId
        }));

        const { error: insertError } = await supabase
          .from('couple_vibe_preferences')
          .insert(preferences);

        if (insertError) throw insertError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vibe preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLanguagePreferences = async (languageIds: string[]) => {
    if (!isAuthenticated || !user || !supabase || !isSupabaseConfigured()) {
      throw new Error('Authentication required');
    }

    try {
      setLoading(true);
      
      // Get couple ID
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) throw coupleError;

      // Delete existing preferences
      await supabase
        .from('couple_language_preferences')
        .delete()
        .eq('couple_id', coupleData.id);

      // Insert new preferences
      if (languageIds.length > 0) {
        const preferences = languageIds.map(languageId => ({
          couple_id: coupleData.id,
          language_id: languageId
        }));

        const { error: insertError } = await supabase
          .from('couple_language_preferences')
          .insert(preferences);

        if (insertError) throw insertError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update language preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateStylePreferences,
    updateVibePreferences,
    updateLanguagePreferences,
    loading,
    error
  };
};

export const useStyleTags = () => {
  const [styleTags, setStyleTags] = useState<StyleTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStyleTags = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockStyleTags: StyleTag[] = [
          { id: 1, label: 'Classic', description: 'Timeless and traditional photography' },
          { id: 2, label: 'Modern', description: 'Contemporary and sleek aesthetic' },
          { id: 3, label: 'Vintage', description: 'Nostalgic and romantic feel' },
          { id: 4, label: 'Artistic', description: 'Creative and unique compositions' },
          { id: 5, label: 'Candid', description: 'Natural and spontaneous moments' },
          { id: 6, label: 'Editorial', description: 'Fashion-inspired and dramatic' },
          { id: 7, label: 'Fine Art', description: 'Museum-quality artistic vision' },
          { id: 8, label: 'Documentary', description: 'Storytelling through authentic moments' }
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
      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockVibeTags: VibeTag[] = [
          { id: 1, label: 'Romantic', description: 'Soft, dreamy, and intimate' },
          { id: 2, label: 'Fun', description: 'Energetic and playful celebration' },
          { id: 3, label: 'Elegant', description: 'Sophisticated and refined' },
          { id: 4, label: 'Rustic', description: 'Natural and countryside charm' },
          { id: 5, label: 'Boho', description: 'Free-spirited and artistic' },
          { id: 6, label: 'Modern', description: 'Clean lines and contemporary' },
          { id: 7, label: 'Traditional', description: 'Classic and formal ceremony' },
          { id: 8, label: 'Intimate', description: 'Small and meaningful gathering' }
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
          { id: '3', language: 'French' },
          { id: '4', language: 'Italian' },
          { id: '5', language: 'Portuguese' },
          { id: '6', language: 'German' },
          { id: '7', language: 'Mandarin' },
          { id: '8', language: 'Japanese' }
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