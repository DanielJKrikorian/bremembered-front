import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = async (file: File, userId: string): Promise<string | null> => {
    if (!supabase || !isSupabaseConfigured()) {
      throw new Error('Photo upload requires Supabase configuration');
    }

    setUploading(true);
    setError(null);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image must be smaller than 5MB');
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('couple-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('couple-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoUrl: string): Promise<void> => {
    if (!supabase || !isSupabaseConfigured()) {
      throw new Error('Photo deletion requires Supabase configuration');
    }

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `profile-photos/${fileName}`;

      const { error } = await supabase.storage
        .from('couple-photos')
        .remove([filePath]);

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    uploadPhoto,
    deletePhoto,
    uploading,
    error
  };
};