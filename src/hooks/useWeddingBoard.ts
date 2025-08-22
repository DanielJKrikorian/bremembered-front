import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCouple } from './useCouple';
import { ServicePackage } from '../types/booking';

export interface WeddingBoardFavorite {
  id: string;
  couple_id: string;
  package_id?: string;
  blog_post_id?: string;
  item_type: 'package' | 'blog_post';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  service_packages?: ServicePackage;
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
    published_at?: string;
  };
}

export const useWeddingBoard = () => {
  const { user, isAuthenticated } = useAuth();
  const { couple } = useCouple();
  const [favorites, setFavorites] = useState<WeddingBoardFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !user || !couple?.id) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Mock favorites for demo
        const mockFavorites: WeddingBoardFavorite[] = [
          {
            id: 'mock-fav-1',
            couple_id: couple.id,
            package_id: 'mock-package-1',
            item_type: 'package',
            notes: 'Love this photography style!',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            service_packages: {
              id: 'mock-package-1',
              service_type: 'Photography',
              name: 'Premium Wedding Photography',
              description: 'Complete wedding day photography with 8 hours of coverage',
              price: 250000,
              features: ['8 hours coverage', '500+ edited photos', 'Online gallery', 'Print release'],
              coverage: { ceremony: true, reception: true, getting_ready: true },
              status: 'approved',
              hour_amount: 8,
              event_type: 'Wedding',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          }
        ];
        setFavorites(mockFavorites);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
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
          .eq('couple_id', couple.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFavorites(data || []);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, isAuthenticated, couple?.id]);

  const addFavoriteItem = async (itemId: string, itemType: 'package' | 'blog_post', notes?: string) => {
    if (!couple?.id || !isAuthenticated) {
      throw new Error('Authentication required');
    }

    if (!supabase || !isSupabaseConfigured()) {
      // Mock adding to favorites
      const mockFavorite: WeddingBoardFavorite = {
        id: `mock-fav-${Date.now()}`,
        couple_id: couple.id,
        package_id: itemType === 'package' ? itemId : undefined,
        blog_post_id: itemType === 'blog_post' ? itemId : undefined,
        item_type: itemType,
        notes: notes || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setFavorites(prev => [mockFavorite, ...prev]);
      return mockFavorite;
    }

    try {
      const insertData = {
        couple_id: couple.id,
        item_type: itemType,
        notes: notes || null,
        ...(itemType === 'package' ? { package_id: itemId } : { blog_post_id: itemId })
      };

      const { data, error } = await supabase
        .from('wedding_board_favorites')
        .insert([insertData])
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
        .single();

      if (error) throw error;
      
      setFavorites(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding to favorites:', err);
      throw err;
    }
  };

  const addPackageToFavorites = async (packageId: string, notes?: string) => {
    return addFavoriteItem(packageId, 'package', notes);
  };

  const addBlogPostToFavorites = async (blogPostId: string, notes?: string) => {
    return addFavoriteItem(blogPostId, 'blog_post', notes);
  };

  const removeFromFavorites = async (favoriteId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    // Update local state immediately
    setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));

    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('wedding_board_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
    } catch (err) {
      // Revert local state on error
      console.error('Error removing from favorites:', err);
      // Refetch to restore correct state
      window.location.reload();
      throw err;
    }
  };

  const updateFavoriteNotes = async (favoriteId: string, notes: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    // Update local state immediately
    setFavorites(prev => prev.map(fav => 
      fav.id === favoriteId 
        ? { ...fav, notes, updated_at: new Date().toISOString() }
        : fav
    ));

    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('wedding_board_favorites')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', favoriteId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating favorite notes:', err);
      throw err;
    }
  };

  const isFavorited = (packageId: string) => {
    return favorites.some(fav => fav.package_id === packageId || fav.blog_post_id === packageId);
  };

  const getFavorite = (packageId: string) => {
    return favorites.find(fav => fav.package_id === packageId || fav.blog_post_id === packageId);
  };

  const isBlogPostFavorited = (blogPostId: string) => {
    return favorites.some(fav => fav.blog_post_id === blogPostId);
  };

  return {
    favorites,
    loading,
    error,
    addFavoriteItem,
    addPackageToFavorites,
    addBlogPostToFavorites,
    removeFromFavorites,
    updateFavoriteNotes,
    isFavorited,
    getFavorite,
    isBlogPostFavorited
  };
};