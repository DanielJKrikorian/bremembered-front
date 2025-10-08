import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  uploadPhoto: (file: File, coupleId?: string) => Promise<string | null>;
  deletePhoto: (photoId: string) => Promise<void>;
}

export const useWebsiteGallery = (slug?: string): UseWebsiteGallery => {
  const [photos, setPhotos] = useState<WebsitePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!slug) {
        console.warn('No slug provided for fetching photos');
        setLoading(false);
        return;
      }
      if (!supabase || !isSupabaseConfigured()) {
        console.warn('Supabase not configured for fetching photos');
        setPhotos([]);
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
          throw new Error('Failed to fetch couple_id for photos');
        }
        const coupleId = websiteData.couple_id;
        console.log('Fetching photos for couple_id:', coupleId);
        const { data, error } = await supabase
          .from('website_photos')
          .select('*')
          .eq('couple_id', coupleId)
          .order('created_at', { ascending: true })
          .limit(12);
        if (error) {
          console.error('Supabase fetch error:', error);
          throw new Error(`Failed to fetch website photos: ${error.message}`);
        }
        setPhotos(data || []);
      } catch (err) {
        console.error('Error fetching website photos:', err);
        setError('Failed to fetch website photos: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [slug]);

  const uploadPhoto = async (file: File, coupleId?: string): Promise<string | null> => {
    if (!coupleId) {
      setError('No couple ID available');
      console.error('Upload failed: No couple ID');
      return null;
    }
    if (photos.length >= 12) {
      setError('Maximum 12 photos allowed');
      console.warn('Upload failed: Maximum 12 photos reached');
      return null;
    }
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setError('Supabase not configured');
        console.error('Upload failed: Supabase not configured');
        return null;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setError('No authenticated user');
        console.error('Upload failed: No authenticated user');
        return null;
      }
      console.log('Uploading photo for couple_id:', coupleId, 'User ID:', user.id);
      const fileExt = file.name.split('.').pop();
      const fileName = `${coupleId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('website-photos')
        .upload(fileName, file, {
          upsert: false,
          contentType: file.type
        });
      if (uploadError) {
        console.error('Storage upload error:', uploadError, 'File:', fileName, 'User ID:', user.id);
        throw new Error(`Failed to upload to storage: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('website-photos')
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        console.error('Failed to retrieve public URL for file:', fileName);
        throw new Error('Failed to retrieve public URL');
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('website_photos')
        .insert({
          couple_id: coupleId,
          file_name: fileName,
          public_url: urlData.publicUrl
        })
        .select()
        .single();
      if (insertError) {
        console.error('Database insert error:', insertError, 'File:', fileName);
        throw new Error(`Failed to insert photo metadata: ${insertError.message}`);
      }

      const newPhoto: WebsitePhoto = {
        id: insertedData.id,
        couple_id: coupleId,
        file_name: fileName,
        public_url: urlData.publicUrl,
        created_at: insertedData.created_at || new Date().toISOString()
      };
      setPhotos([...photos, newPhoto]);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo: ' + (err as Error).message);
      return null;
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setError('Supabase not configured');
        console.error('Delete failed: Supabase not configured');
        return;
      }
      const { data: photo, error: fetchError } = await supabase
        .from('website_photos')
        .select('file_name')
        .eq('id', photoId)
        .single();
      if (fetchError) {
        console.error('Error fetching photo metadata:', fetchError, 'Photo ID:', photoId);
        throw new Error(`Failed to fetch photo metadata: ${fetchError.message}`);
      }
      if (photo) {
        const { error: storageError } = await supabase.storage
          .from('website-photos')
          .remove([photo.file_name]);
        if (storageError) {
          console.error('Error deleting from storage:', storageError, 'File:', photo.file_name);
          throw new Error(`Failed to delete from storage: ${storageError.message}`);
        }
        const { error: deleteError } = await supabase
          .from('website_photos')
          .delete()
          .eq('id', photoId);
        if (deleteError) {
          console.error('Error deleting photo metadata:', deleteError, 'Photo ID:', photoId);
          throw new Error(`Failed to delete photo metadata: ${deleteError.message}`);
        }
        setPhotos(photos.filter(p => p.id !== photoId));
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo: ' + (err as Error).message);
    }
  };

  return { photos, loading, error, uploadPhoto, deletePhoto };
};