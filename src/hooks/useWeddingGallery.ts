import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface FileUpload {
  id: string;
  vendor_id: string;
  couple_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  expiry_date: string;
  created_at: string;
  // Joined data
  vendors?: {
    id: string;
    name: string;
    profile_photo?: string;
  };
}

export interface CoupleSubscription {
  id: string;
  couple_id: string;
  subscription_id?: string;
  payment_status?: string;
  plan_id?: string;
  customer_id?: string;
  free_period_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface StorageExtension {
  id: string;
  couple_id: string;
  file_upload_id: string;
  expiry_date: string;
  payment_id: string;
  created_at: string;
}

export const useWeddingGallery = () => {
  const { user, isAuthenticated } = useAuth();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [subscription, setSubscription] = useState<CoupleSubscription | null>(null);
  const [extensions, setExtensions] = useState<StorageExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    const fetchGalleryData = async () => {
      if (!isAuthenticated || !user) {
        setFiles([]);
        setSubscription(null);
        setExtensions([]);
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Mock data for demo
        const mockFiles: FileUpload[] = [
          {
            id: 'mock-file-1',
            vendor_id: 'mock-vendor-1',
            couple_id: 'mock-couple-1',
            file_path: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
            file_name: 'wedding-ceremony-001.jpg',
            file_size: 2048576,
            upload_date: '2024-01-20T10:00:00Z',
            expiry_date: '2024-02-19T10:00:00Z',
            created_at: '2024-01-20T10:00:00Z',
            vendors: {
              id: 'mock-vendor-1',
              name: 'Elegant Moments Photography',
              profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
            }
          },
          {
            id: 'mock-file-2',
            vendor_id: 'mock-vendor-1',
            couple_id: 'mock-couple-1',
            file_path: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
            file_name: 'wedding-reception-highlights.mp4',
            file_size: 52428800,
            upload_date: '2024-01-22T14:00:00Z',
            expiry_date: '2024-02-21T14:00:00Z',
            created_at: '2024-01-22T14:00:00Z',
            vendors: {
              id: 'mock-vendor-2',
              name: 'Timeless Studios',
              profile_photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'
            }
          }
        ];

        const mockSubscription: CoupleSubscription = {
          id: 'mock-sub-1',
          couple_id: 'mock-couple-1',
          payment_status: 'active',
          plan_id: 'Couple_Capsule',
          free_period_expiry: '2024-02-15T00:00:00Z',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z'
        };

        setFiles(mockFiles);
        setSubscription(mockSubscription);
        setExtensions([]);
        setLoading(false);
        return;
      }

      try {
        // Get couple ID first
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (coupleError) throw coupleError;

        // Fetch files, subscription, and extensions in parallel
        const [filesResult, subscriptionResult, extensionsResult] = await Promise.all([
          supabase
            .from('file_uploads')
            .select(`
              *,
              vendors(
                id,
                name,
                profile_photo
              )
            `)
            .eq('couple_id', coupleData.id)
            .order('upload_date', { ascending: false }),
          
          supabase
            .from('couple_subscriptions')
            .select('*')
            .eq('couple_id', coupleData.id)
            .single(),
          
          supabase
            .from('couple_storage_extensions')
            .select('*')
            .eq('couple_id', coupleData.id)
        ]);

        if (filesResult.error) throw filesResult.error;
        if (subscriptionResult.error && subscriptionResult.error.code !== 'PGRST116') {
          throw subscriptionResult.error;
        }
        if (extensionsResult.error) throw extensionsResult.error;

        setFiles(filesResult.data || []);
        setSubscription(subscriptionResult.data || null);
        setExtensions(extensionsResult.data || []);
      } catch (err) {
        console.error('Error fetching gallery data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch gallery data');
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryData();
  }, [user, isAuthenticated]);

  const downloadFile = async (file: FileUpload) => {
    try {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = file.file_path;
      link.download = file.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading file:', err);
      throw new Error('Failed to download file');
    }
  };

  const downloadAllFiles = async () => {
    setDownloadingAll(true);
    try {
      // Download each file sequentially to avoid overwhelming the browser
      for (const file of files) {
        await downloadFile(file);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error('Error downloading all files:', err);
      throw new Error('Failed to download all files');
    } finally {
      setDownloadingAll(false);
    }
  };

  const isAccessExpired = () => {
    if (!subscription) return true;
    
    // Check if free period has expired
    if (subscription.free_period_expiry) {
      const expiryDate = new Date(subscription.free_period_expiry);
      const now = new Date();
      return now > expiryDate && subscription.payment_status !== 'active';
    }
    
    return subscription.payment_status !== 'active';
  };

  const getDaysUntilExpiry = () => {
    if (!subscription?.free_period_expiry) return 0;
    
    const expiryDate = new Date(subscription.free_period_expiry);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    } else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension || '')) {
      return 'video';
    }
    return 'other';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const photoFiles = files.filter(file => getFileType(file.file_name) === 'image');
  const videoFiles = files.filter(file => getFileType(file.file_name) === 'video');

  return {
    files,
    photoFiles,
    videoFiles,
    subscription,
    extensions,
    loading,
    error,
    downloadingAll,
    downloadFile,
    downloadAllFiles,
    isAccessExpired,
    getDaysUntilExpiry,
    getFileType,
    formatFileSize
  };
};