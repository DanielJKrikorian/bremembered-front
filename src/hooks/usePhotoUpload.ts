import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const useVendorPhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [success, setSuccess] = useState<boolean>(false);

  const uploadPhoto = async (
    file: File,
    applicationId: string,
    bucketName: string = 'vendor-applications',
    maxFileSizeMB: number = 5,
    folder?: string
  ): Promise<string | null> => {
    if (!supabase || !isSupabaseConfigured()) {
      // Simulate upload for demo
      return new Promise((resolve) => {
        setUploading(true);
        setProgress(0);
        let progressValue = 0;
        const interval = setInterval(() => {
          progressValue += Math.random() * 20;
          if (progressValue >= 100) {
            progressValue = 100;
            setProgress(progressValue);
            clearInterval(interval);
            setSuccess(true);
            setTimeout(() => {
              setSuccess(false);
              setUploading(false);
              setProgress(0);
              resolve(`https://mock-storage.com/${folder || 'uploads'}/${file.name}`);
            }, 3000);
          } else {
            setProgress(progressValue);
          }
        }, 100);
      });
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error('Please select an image or video file');
      }
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        throw new Error(`File must be smaller than ${maxFileSizeMB}MB`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = folder ? `${folder}/${applicationId}/${fileName}` : `${applicationId}/${fileName}`;

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.min(prev + Math.random() * 15, 90);
          if (newProgress >= 90) clearInterval(progressInterval);
          return newProgress;
        });
      }, 200);

      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setProgress(0);
      }, 3000);
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
      setProgress(0);
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
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf('vendor-applications');
      if (bucketIndex === -1) throw new Error('Invalid photo URL');

      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      const { error } = await supabase.storage
        .from('vendor-applications')
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
    error,
    progress,
    success,
  };
};