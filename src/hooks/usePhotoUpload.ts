import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = async (
    file: File, 
    userId: string, 
    bucketName: string = 'couple-photos',
    maxFileSizeMB: number = 5
  ): Promise<string | null> => {
    if (!supabase || !isSupabaseConfigured()) {
      throw new Error('Photo upload requires Supabase configuration');
    }

    setUploading(true);
    setError(null);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image or video file');
      }

      if (file.size > maxFileSizeMB * 1024 * 1024) {
        throw new Error(`File must be smaller than ${maxFileSizeMB}MB`);
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      let errorMessage = 'Failed to upload file';
      
      if (err instanceof Error) {
        if (err.message.includes('504') || err.message.includes('timeout')) {
          errorMessage = 'Upload timed out. Please try again with a smaller file or check your connection.';
        } else if (err.message.includes('413') || err.message.includes('too large')) {
          errorMessage = `File is too large. Maximum size is ${maxFileSizeMB}MB.`;
        } else if (err.message.includes('<!DOCTYPE')) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      }
      
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
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf('couple-photos');
      if (bucketIndex === -1) throw new Error('Invalid photo URL');
      
      const filePath = pathParts.slice(bucketIndex + 1).join('/');

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