import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useCouple } from './useCouple';

export interface WebsitePhoto {
  id: string;
  couple_id: string;
  file_name: string;
  public_url: string;
  created_at: string;
}

interface UseWebsiteGallery {
  photos: WebsitePhoto[];
  loading: boolean;
  error: string | null;
  uploadPhoto: (file: File) => Promise<string | null>;
  deletePhoto: (photoId: string) => Promise<void>;
}

export const useWebsiteGallery = (): UseWebsiteGallery => {
  const { couple } = useCouple();
  const [photos, setPhotos] = useState<WebsitePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch website photos
  useEffect(() => {
    const fetchPhotos = async () => {
      if (!couple?.id) {
        setLoading(false);
        return;
      }
      if (!supabase || !isSupabaseConfigured()) {
        setPhotos([]);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('website_photos')
          .select('*')
          .eq('couple_id', couple.id)
          .order('created_at', { ascending: true })
          .limit(6);
        if (error) throw error;
        setPhotos(data || []);
      } catch (err) {
        setError('Failed to fetch website photos: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [couple]);

  // Upload a photo
  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!couple?.id) return null;
    if (photos.length >= 6) {
      setError('Maximum 6 photos allowed');
      return null;
    }
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setError('Supabase not configured');
        return null;
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${couple.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('website-photos')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('website-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('website_photos')
        .insert({
          couple_id: couple.id,
          file_name: file.name,
          public_url: urlData.publicUrl
        });
      if (insertError) throw insertError;

      setPhotos([...photos, {
        id: Date.now().toString(),
        couple_id: couple.id,
        file_name: file.name,
        public_url: urlData.publicUrl,
        created_at: new Date().toISOString()
      }]);
      return urlData.publicUrl;
    } catch (err) {
      setError('Failed to upload photo: ' + (err as Error).message);
      return null;
    }
  };

  // Delete a photo
  const deletePhoto = async (photoId: string) => {
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setError('Supabase not configured');
        return;
      }
      const { data: photo } = await supabase
        .from('website_photos')
        .select('file_name')
        .eq('id', photoId)
        .single();
      if (photo) {
        await supabase.storage
          .from('website-photos')
          .remove([photo.file_name]);
        await supabase
          .from('website_photos')
          .delete()
          .eq('id', photoId);
        setPhotos(photos.filter(p => p.id !== photoId));
      }
    } catch (err) {
      setError('Failed to delete photo: ' + (err as Error).message);
    }
  };

  return { photos, loading, error, uploadPhoto, deletePhoto };
};