import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface WeddingBoardFavorite {
  id: string;
  couple_id: string;
  item_type: 'package' | 'blog_post';
  package_id?: string;
  blog_post_id?: string;
  notes?: string;
  created_at: string;
  service_packages?: {
    id: string;
    service_type: string;
    name: string;
    description: string;
    price: number;
    features: string[];
    coverage: Record<string, any>;
    status: string;
    hour_amount?: number;
    event_type?: string;
    primary_image?: string;
    created_at: string;
    updated_at: string;
  };
  blog_posts?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featured_image?: string;
    category: string;
    tags: string[];
    read_time: number;
    view_count: number;
    like_count: number;
    published_at: string;
  };
}

export const useWeddingBoard = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<WeddingBoardFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get the couple_id
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) {
        throw coupleError;
      }

      if (!coupleData) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Then get the favorites
      const { data, error: favoritesError } = await supabase
        .from('wedding_board_favorites')
        .select(`
          *,
          service_packages(
            id,
            service_type,
            name,
            description,
            price,
            features,
            coverage,
            status,
            hour_amount,
            event_type,
            primary_image,
            created_at,
            updated_at
          ),
          blog_posts(
            id,
            title,
            slug,
            excerpt,
            featured_image,
            category,
            tags,
            read_time,
            view_count,
            like_count,
            published_at
          )
        `)
        .eq('couple_id', coupleData.id)
        .order('created_at', { ascending: false });

      if (favoritesError) {
        throw favoritesError;
      }

      setFavorites(data || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (itemType: 'package' | 'blog_post', itemId: string, notes?: string) => {
    if (!user) {
      throw new Error('Authentication required');
    }

    try {
      // Get couple_id
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError || !coupleData) {
        throw new Error('Couple profile not found');
      }

      const favoriteData: any = {
        couple_id: coupleData.id,
        item_type: itemType,
        notes: notes || null
      };

      if (itemType === 'package') {
        favoriteData.package_id = itemId;
        favoriteData.blog_post_id = null;
      } else {
        favoriteData.blog_post_id = itemId;
        favoriteData.package_id = null;
      }

      const { error } = await supabase
        .from('wedding_board_favorites')
        .insert(favoriteData);

      if (error) {
        throw error;
      }

      // Refresh favorites
      await fetchFavorites();
    } catch (err) {
      console.error('Error adding to favorites:', err);
      throw err;
    }
  };

  const removeFromFavorites = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('wedding_board_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) {
        throw error;
      }

      // Remove from local state
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (err) {
      console.error('Error removing from favorites:', err);
      throw err;
    }
  };

  const updateFavoriteNotes = async (favoriteId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('wedding_board_favorites')
        .update({ notes })
        .eq('id', favoriteId);

      if (error) {
        throw error;
      }

      // Update local state
      setFavorites(prev => prev.map(fav => 
        fav.id === favoriteId ? { ...fav, notes } : fav
      ));
    } catch (err) {
      console.error('Error updating notes:', err);
      throw err;
    }
  };

  const isFavorited = (itemType: 'package' | 'blog_post', itemId: string) => {
    return favorites.some(fav => 
      fav.item_type === itemType && 
      (itemType === 'package' ? fav.package_id === itemId : fav.blog_post_id === itemId)
    );
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    updateFavoriteNotes,
    isFavorited,
    refetch: fetchFavorites
  };
};