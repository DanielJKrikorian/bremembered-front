import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { differenceInDays, addDays } from 'date-fns';

export interface FileUpload {
  id: string;
  vendor_id: string;
  couple_id: string;
  file_path: string;
  public_url?: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  expiry_date: string;
  created_at: string;
  vendors?: {
    id: string;
    name: string;
    profile_photo?: string;
  };
}

export interface GalleryFolder {
  name: string;
  path: string;
  fileCount: number;
  totalSize: number;
  lastModified: string;
  vendor?: {
    id: string;
    name: string;
    profile_photo?: string;
  };
  previewImage?: string;
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
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentFolderFiles, setCurrentFolderFiles] = useState<FileUpload[]>([]);
  const [subscription, setSubscription] = useState<CoupleSubscription | null>(null);
  const [extensions, setExtensions] = useState<StorageExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [freeAccessActive, setFreeAccessActive] = useState(false);

  useEffect(() => {
    const fetchGalleryData = async () => {
      if (!isAuthenticated || !user) {
        setFiles([]);
        setFolders([]);
        setSubscription(null);
        setExtensions([]);
        setHasSubscription(false);
        setFreeAccessActive(false);
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        setError('Supabase not configured');
        setLoading(false);
        return;
      }

      try {
        // Get couple ID
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('id, created_at')
          .eq('user_id', user.id)
          .single();
        if (coupleError) throw new Error(`Failed to fetch couple: ${coupleError.message}`);

        // Fetch files, subscription, and extensions in parallel
        const [filesResult, subscriptionResult, extensionsResult] = await Promise.all([
          supabase
            .from('file_uploads')
            .select(`
              id, vendor_id, couple_id, file_path, file_name, file_size, upload_date, expiry_date, created_at,
              vendors(id, name, profile_photo)
            `)
            .eq('couple_id', coupleData.id)
            .order('upload_date', { ascending: false }),
          supabase
            .from('couple_subscriptions')
            .select('id, couple_id, subscription_id, payment_status, plan_id, customer_id, free_period_expiry, created_at, updated_at')
            .eq('couple_id', coupleData.id)
            .maybeSingle(),
          supabase
            .from('couple_storage_extensions')
            .select('id, couple_id, file_upload_id, expiry_date, payment_id, created_at')
            .eq('couple_id', coupleData.id),
        ]);

        if (filesResult.error) throw new Error(`Failed to fetch files: ${filesResult.error.message}`);
        if (subscriptionResult.error && subscriptionResult.error.code !== 'PGRST116') {
          throw new Error(`Failed to fetch subscription: ${subscriptionResult.error.message}`);
        }
        if (extensionsResult.error) throw new Error(`Failed to fetch extensions: ${extensionsResult.error.message}`);

        // Process subscription and free access
        const subData = subscriptionResult.data;
        setSubscription(subData);
        setHasSubscription(!!subData && subData.payment_status === 'active');

        // Determine free access (15 days from earliest file upload or couple.created_at)
        let freePeriodStart: Date;
        if (filesResult.data && filesResult.data.length > 0) {
          freePeriodStart = new Date(
            filesResult.data.reduce((earliest, file) => {
              const uploadDate = new Date(file.upload_date);
              return uploadDate < new Date(earliest) ? file.upload_date : earliest;
            }, filesResult.data[0].upload_date)
          );
        } else {
          freePeriodStart = new Date(coupleData.created_at);
        }
        const freePeriodEnd = addDays(freePeriodStart, 15);
        const isFreeAccessActive = differenceInDays(freePeriodEnd, new Date()) > 0;
        setFreeAccessActive(isFreeAccessActive);

        // Process files with public URLs
        const processedFiles = (filesResult.data || []).map(file => {
          let publicUrl = file.public_url;
          if (!publicUrl && file.file_path && supabase && isSupabaseConfigured()) {
            try {
              const { data } = supabase.storage.from('vendor_media').getPublicUrl(file.file_path);
              publicUrl = data.publicUrl;
            } catch (err) {
              console.error('Error getting public URL for file:', file.file_path, err);
            }
          }
          return { ...file, public_url: publicUrl || '/default-file.jpg' };
        });
        setFiles(processedFiles);

        // Process folders from files
        const folderMap = new Map<string, GalleryFolder>();
        processedFiles.forEach(file => {
          const pathParts = file.file_path.split('/');
          const folderPath = pathParts.slice(0, -1).join('/');
          const folderName = pathParts[pathParts.length - 2] || 'Root';

          if (!folderMap.has(folderPath)) {
            folderMap.set(folderPath, {
              name: folderName,
              path: folderPath,
              fileCount: 0,
              totalSize: 0,
              lastModified: file.upload_date,
              vendor: file.vendors,
              previewImage: file.public_url,
            });
          }

          const folder = folderMap.get(folderPath)!;
          folder.fileCount += 1;
          folder.totalSize += file.file_size;
          if (new Date(file.upload_date) > new Date(folder.lastModified)) {
            folder.lastModified = file.upload_date;
            folder.previewImage = file.public_url;
          }
        });
        setFolders(Array.from(folderMap.values()));

        setExtensions(extensionsResult.data || []);
      } catch (err) {
        console.error('Error fetching gallery data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load gallery data');
      } finally {
        setLoading(false);
      }
    };
    fetchGalleryData();
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (currentFolder) {
      const folderFiles = files.filter(file => file.file_path.startsWith(currentFolder));
      setCurrentFolderFiles(folderFiles);
    } else {
      setCurrentFolderFiles([]);
    }
  }, [currentFolder, files]);

  const downloadFile = async (file: FileUpload) => {
    if (!freeAccessActive && !hasSubscription) return;
    try {
      const response = await fetch(file.public_url || file.file_path);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      throw new Error('Failed to download file');
    }
  };

  const downloadAllFiles = async () => {
    if (!freeAccessActive && !hasSubscription) return;
    setDownloadingAll(true);
    try {
      const filesToDownload = currentFolder
        ? files.filter(file => file.file_path.startsWith(currentFolder))
        : files;
      for (const file of filesToDownload) {
        await downloadFile(file);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error('Error downloading all files:', err);
      throw new Error('Failed to download all files');
    } finally {
      setDownloadingAll(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const photoFiles = files.filter(file =>
    file.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  );
  const videoFiles = files.filter(file =>
    file.file_name.match(/\.(mp4|mov|avi|mkv|webm)$/i)
  );
  const currentFolderPhotoFiles = currentFolderFiles.filter(file =>
    file.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  );
  const currentFolderVideoFiles = currentFolderFiles.filter(file =>
    file.file_name.match(/\.(mp4|mov|avi|mkv|webm)$/i)
  );

  return {
    files,
    folders,
    currentFolder,
    setCurrentFolder,
    currentFolderFiles,
    photoFiles,
    videoFiles,
    currentFolderPhotoFiles,
    currentFolderVideoFiles,
    subscription,
    extensions,
    loading,
    error,
    downloadingAll,
    downloadFile,
    downloadAllFiles,
    hasSubscription,
    freeAccessActive,
    formatFileSize,
  };
};