import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useCouple } from '../../hooks/useCouple';
import { useWebsiteGallery } from '../../hooks/useWebsiteGallery';
import { useWeddingTimeline } from '../../hooks/useWeddingTimeline';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Globe, Lock, Image, User, Upload, Trash, Check, Eye, EyeOff, MapPin, Megaphone } from 'lucide-react';
import { debounce } from 'lodash';

interface WebsiteSettings {
  id?: string;
  couple_id: string;
  slug: string;
  password: string;
  layout: 'classic' | 'modern' | 'romantic';
  about_us?: string;
  love_story?: string;
  accommodations?: { name: string; website: string; room_block?: string }[];
  cover_photo?: string;
  announcements?: string[]; // Added for announcements
}

interface TimelineEvent {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
  location?: string;
  type: string;
  duration_minutes: number;
  is_standard: boolean;
  music_notes?: string;
  playlist_requests?: string;
  photo_shotlist?: string;
  wedding_website: boolean;
}

export const WeddingWebsiteSettings: React.FC = () => {
  const { couple, updateCouple } = useCouple();
  const { photos, loading: galleryLoading, uploadPhoto, deletePhoto, error: galleryError } = useWebsiteGallery();
  const { events, loading: timelineLoading } = useWeddingTimeline(true);
  const memoizedCouple = useMemo(() => couple, [couple?.id, couple?.slug, couple?.partner1_name, couple?.partner2_name, couple?.wedding_date, couple?.venue_name]);
  const [settings, setSettings] = useState<WebsiteSettings>(() => {
    const saved = localStorage.getItem(`wedding_website_settings_${memoizedCouple?.id || 'default'}`);
    return saved ? JSON.parse(saved) : {
      couple_id: memoizedCouple?.id || '',
      slug: memoizedCouple?.slug || '',
      password: 'wedding123',
      layout: 'classic',
      about_us: '',
      love_story: '',
      accommodations: [{ name: '', website: '', room_block: '' }],
      cover_photo: memoizedCouple?.cover_photo || '',
      announcements: [], // Initialize empty announcements array
    };
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [coverPhotoUploading, setCoverPhotoUploading] = useState(false);
  const [coverPhotoProgress, setCoverPhotoProgress] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log('WeddingWebsiteSettings rendered, couple:', memoizedCouple);
  }, [memoizedCouple]);

  const fetchSettings = useCallback(debounce(async (coupleId: string) => {
    if (!coupleId || !supabase || !isSupabaseConfigured()) {
      setSettings(prev => ({
        ...prev,
        couple_id: coupleId || '',
        slug: memoizedCouple?.slug || '',
        password: 'wedding123',
        layout: 'classic',
        cover_photo: memoizedCouple?.cover_photo || '',
        announcements: [],
      }));
      return;
    }
    try {
      const { data, error } = await supabase
        .from('wedding_websites')
        .select('*')
        .eq('couple_id', coupleId)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch website settings: ${error.message}`);
      }
      const newSettings = {
        couple_id: coupleId,
        slug: data?.slug || memoizedCouple?.slug || '',
        password: data?.password || 'wedding123',
        layout: data?.layout || 'classic',
        about_us: data?.about_us || '',
        love_story: data?.love_story || '',
        accommodations: data?.accommodations || [{ name: '', website: '', room_block: '' }],
        cover_photo: memoizedCouple?.cover_photo || data?.cover_photo || '',
        announcements: data?.announcements || [],
        id: data?.id
      };
      setSettings(newSettings);
      localStorage.setItem(`wedding_website_settings_${coupleId}`, JSON.stringify(newSettings));
    } catch (err) {
      console.error('Error fetching website settings:', err);
      setFormErrors({ general: 'Failed to load settings' });
    }
  }, 500), [memoizedCouple?.slug, memoizedCouple?.cover_photo]);

  useEffect(() => {
    if (memoizedCouple?.id) {
      fetchSettings(memoizedCouple.id);
    }
  }, [memoizedCouple?.id, fetchSettings]);

  useEffect(() => {
    if (memoizedCouple?.id) {
      localStorage.setItem(`wedding_website_settings_${memoizedCouple.id}`, JSON.stringify(settings));
    }
  }, [settings, memoizedCouple?.id]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'Session:', !!session);
      if (event === 'TOKEN_REFRESHED' && memoizedCouple?.id) {
        const saved = localStorage.getItem(`wedding_website_settings_${memoizedCouple.id}`);
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      }
    });
    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, [memoizedCouple?.id]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!settings.slug.trim()) errors.slug = 'Slug is required';
    else if (!/^[a-z0-9-]+$/.test(settings.slug)) errors.slug = 'Slug must be lowercase, alphanumeric, and hyphens only';
    if (!settings.password.trim()) errors.password = 'Password is required';
    else if (settings.password.length < 6) errors.password = 'Password must be at least 6 characters';
    settings.accommodations.forEach((hotel, index) => {
      if (hotel.name && !hotel.website) errors[`hotel_website_${index}`] = `Website required for ${hotel.name}`;
      if (hotel.website && !/^https?:\/\/.+/.test(hotel.website)) errors[`hotel_website_${index}`] = 'Invalid URL';
    });
    settings.announcements?.forEach((announcement, index) => {
      if (announcement && announcement.length > 280) {
        errors[`announcement_${index}`] = 'Announcement must be 280 characters or less';
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleLayoutChange = (layout: 'classic' | 'modern' | 'romantic') => {
    setSettings(prev => ({ ...prev, layout }));
    setFormErrors(prev => ({ ...prev, layout: '' }));
  };

  const handleAccommodationChange = (index: number, field: string, value: string) => {
    const newAccommodations = [...settings.accommodations];
    newAccommodations[index] = { ...newAccommodations[index], [field]: value };
    setSettings(prev => ({ ...prev, accommodations: newAccommodations }));
    setFormErrors(prev => ({ ...prev, [`hotel_${field}_${index}`]: '' }));
  };

  const handleAnnouncementChange = (index: number, value: string) => {
    const newAnnouncements = [...(settings.announcements || [])];
    newAnnouncements[index] = value;
    setSettings(prev => ({ ...prev, announcements: newAnnouncements }));
    setFormErrors(prev => ({ ...prev, [`announcement_${index}`]: '' }));
  };

  const addAnnouncement = () => {
    if ((settings.announcements?.length || 0) < 3) {
      setSettings(prev => ({
        ...prev,
        announcements: [...(prev.announcements || []), '']
      }));
    }
  };

  const removeAnnouncement = (index: number) => {
    setSettings(prev => ({
      ...prev,
      announcements: (prev.announcements || []).filter((_, i) => i !== index)
    }));
    setFormErrors(prev => ({ ...prev, [`announcement_${index}`]: '' }));
  };

  const addHotel = () => {
    if (settings.accommodations.length < 3) {
      setSettings(prev => ({
        ...prev,
        accommodations: [...prev.accommodations, { name: '', website: '', room_block: '' }]
      }));
    }
  };

  const removeHotel = (index: number) => {
    setSettings(prev => ({
      ...prev,
      accommodations: prev.accommodations.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const photoUrl = await uploadPhoto(file);
    if (photoUrl) {
      setSuccessMessage('Photo uploaded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setPhotoUploading(false);
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFormErrors({ cover_photo: 'No file selected' });
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFormErrors({ cover_photo: 'Invalid file type. Please upload an image (JPEG, PNG, GIF).' });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setFormErrors({ cover_photo: 'File size exceeds 50MB limit.' });
      return;
    }

    setFormErrors({ cover_photo: '' });
    setCoverPhotoUploading(true);
    setCoverPhotoProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      console.log('Uploading cover photo:', { fileName: file.name, fileType: file.type, fileSize: file.size, userId: user.id });

      const progressInterval = setInterval(() => {
        setCoverPhotoProgress((prev) => {
          const newProgress = Math.min(prev + Math.random() * 15, 90);
          if (newProgress >= 90) clearInterval(progressInterval);
          return newProgress;
        });
      }, 200);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('couple-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      clearInterval(progressInterval);
      setCoverPhotoProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('couple-photos')
        .getPublicUrl(filePath);
      if (!publicUrl) throw new Error('Failed to retrieve public URL');

      setSettings(prev => ({ ...prev, cover_photo: publicUrl }));
      const { error: updateError } = await supabase
        .from('couples')
        .update({ cover_photo: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', memoizedCouple.id);
      if (updateError) throw new Error(`Failed to update cover photo: ${updateError.message}`);

      setSuccessMessage('Cover photo uploaded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      if ((error as Error).message.includes('Bucket not found')) {
        setFormErrors({ cover_photo: 'Upload failed: The "couple-photos" bucket does not exist. Please create it in your Supabase Dashboard under Storage.' });
      } else if ((error as Error).message.includes('net::ERR_NETWORK_CHANGED') || (error as Error).message.includes('Failed to fetch')) {
        setFormErrors({ cover_photo: 'Upload failed due to a network issue. Please check your connection and try again.' });
      } else {
        setFormErrors({ cover_photo: `Failed to upload cover photo: ${(error as Error).message}` });
      }
    } finally {
      setCoverPhotoUploading(false);
      setCoverPhotoProgress(0);
    }
  };

  const handleCoverPhotoDelete = async () => {
    if (!memoizedCouple?.id || !settings.cover_photo) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const fileName = settings.cover_photo.split('/').pop();
      if (fileName) {
        console.log('Deleting cover photo:', { userId: user.id, fileName });
        const { error: deleteError } = await supabase.storage
          .from('couple-photos')
          .remove([`${user.id}/${fileName}`]);
        if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);
      }
      
      setSettings(prev => ({ ...prev, cover_photo: '' }));
      const { error: updateError } = await supabase
        .from('couples')
        .update({ cover_photo: null, updated_at: new Date().toISOString() })
        .eq('id', memoizedCouple.id);
      if (updateError) throw new Error(`Failed to update cover photo: ${updateError.message}`);
      
      setSuccessMessage('Cover photo removed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting cover photo:', err);
      setFormErrors({ cover_photo: err instanceof Error ? err.message : 'Failed to delete cover photo' });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setSuccessMessage('Settings saved locally (Supabase not configured)');
        setLoading(false);
        return;
      }
      if (!memoizedCouple?.id) {
        throw new Error('No couple ID available');
      }
      if (memoizedCouple.slug !== settings.slug) {
        try {
          await updateCouple({ slug: settings.slug });
        } catch (err) {
          console.error('Error updating couple slug:', err);
          const { error: coupleError } = await supabase
            .from('couples')
            .update({ slug: settings.slug, updated_at: new Date().toISOString() })
            .eq('id', memoizedCouple.id);
          if (coupleError) throw coupleError;
        }
      }
      const { error } = await supabase
        .from('wedding_websites')
        .upsert({
          id: settings.id,
          couple_id: memoizedCouple.id,
          slug: settings.slug,
          password: settings.password,
          layout: settings.layout,
          about_us: settings.about_us,
          love_story: settings.love_story,
          accommodations: settings.accommodations.filter(hotel => hotel.name),
          cover_photo: settings.cover_photo,
          announcements: settings.announcements?.filter(a => a.trim()) || [],
          updated_at: new Date().toISOString()
        }, { onConflict: 'couple_id' });
      if (error) throw error;
      setSuccessMessage('Website settings saved successfully');
      localStorage.removeItem(`wedding_website_settings_${memoizedCouple.id}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving website settings:', err);
      setFormErrors({ general: err instanceof Error ? err.message : 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (event: TimelineEvent) => {
    try {
      const date = parseISO(event.event_date);
      const time = parseISO(`2000-01-01T${event.event_time}`);
      const formattedDate = formatInTimeZone(date, 'America/New_York', 'MM/dd/yyyy');
      const formattedTime = format(time, 'h:mm a');
      return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting date/time:', error, 'Event:', event);
      return 'Invalid date/time';
    }
  };

  const layoutPreviews = {
    classic: { bg: 'bg-white border-rose-200', header: 'bg-rose-100 text-rose-800', button: 'bg-rose-600 text-white' },
    modern: { bg: 'bg-gray-50 text-gray-900 border-gray-200', header: 'bg-indigo-800 text-white', button: 'bg-indigo-600 text-white' },
    romantic: { bg: 'bg-pink-50 border-pink-200', header: 'bg-pink-200 text-pink-900', button: 'bg-pink-500 text-white' }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Wedding Website Settings</h3>
        <p className="text-gray-600 mb-6">Configure your public wedding website for guests</p>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Website Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Website Slug"
                  name="slug"
                  value={settings.slug}
                  onChange={handleInputChange}
                  placeholder="jane-and-john"
                  error={formErrors.slug}
                  icon={Globe}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Your website URL: {window.location.origin}/wedding/{settings.slug || 'your-slug'}
                </p>
                {memoizedCouple?.slug && !settings.id && (
                  <p className="text-sm text-gray-600 mt-1">
                    Pregenerated slug: {memoizedCouple.slug}
                  </p>
                )}
              </div>
              <div className="relative flex items-center">
                <Input
                  label="Website Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={settings.password}
                  onChange={handleInputChange}
                  placeholder="Enter a password"
                  error={formErrors.password}
                  icon={Lock}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-full text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <p className="text-sm text-gray-600 mt-1">
                  Default password: wedding123
                </p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Layout Previews</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(layoutPreviews).map(([layout, styles]) => (
                <Card
                  key={layout}
                  className={`p-4 ${styles.bg} border ${settings.layout === layout ? 'border-rose-500' : ''} cursor-pointer`}
                  onClick={() => handleLayoutChange(layout as 'classic' | 'modern' | 'romantic')}
                >
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="layout"
                      value={layout}
                      checked={settings.layout === layout}
                      onChange={() => handleLayoutChange(layout as 'classic' | 'modern' | 'romantic')}
                      className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300 mr-2"
                    />
                    <h5 className="font-medium capitalize">{layout}</h5>
                  </div>
                  <div className={`${styles.header} p-2 rounded-t-lg text-center`}>
                    <h6 className="font-medium">Preview</h6>
                  </div>
                  <div className="p-2">
                    <p className="text-sm">Sample content</p>
                    <Button className={`mt-2 ${styles.button}`}>RSVP</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Couple Information</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {memoizedCouple?.profile_photo ? (
                  <img
                    src={memoizedCouple.profile_photo}
                    alt="Couple"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="text-gray-900 font-medium">
                    {memoizedCouple?.partner1_name || 'Partner 1'} & {memoizedCouple?.partner2_name || 'Partner 2'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Wedding Date: {memoizedCouple?.wedding_date ? formatInTimeZone(parseISO(memoizedCouple.wedding_date), 'America/New_York', 'MM/dd/yyyy') : 'Not set'}
                  </p>
                  {memoizedCouple?.venue_name && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" /> Venue: {memoizedCouple.venue_name}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-2">Cover Photo</h5>
                {settings.cover_photo ? (
                  <div className="relative">
                    <img
                      src={settings.cover_photo}
                      alt="Cover"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      icon={Trash}
                      className="absolute top-2 right-2 text-red-600"
                      onClick={handleCoverPhotoDelete}
                    />
                  </div>
                ) : (
                  <p className="text-gray-600">No cover photo uploaded.</p>
                )}
                <label className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-lg cursor-pointer hover:bg-rose-600 mt-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Cover Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverPhotoUpload}
                    className="hidden"
                    disabled={coverPhotoUploading || !memoizedCouple?.id}
                  />
                </label>
                {coverPhotoUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-rose-500 h-2 rounded-full"
                        style={{ width: `${Math.round(coverPhotoProgress)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">Uploading: {Math.round(coverPhotoProgress)}%</p>
                  </div>
                )}
                {formErrors.cover_photo && <p className="text-red-600 text-sm mt-2">{formErrors.cover_photo}</p>}
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Announcements</h4>
            <p className="text-gray-600 mb-4">Add up to 3 short announcements (max 280 characters each) to share updates with your guests</p>
            {settings.announcements?.map((announcement, index) => (
              <div key={index} className="border p-4 rounded-lg mb-4 relative">
                <Input
                  label={`Announcement ${index + 1}`}
                  value={announcement}
                  onChange={(e) => handleAnnouncementChange(index, e.target.value)}
                  placeholder="Enter a short announcement..."
                  maxLength={280}
                  error={formErrors[`announcement_${index}`]}
                  icon={Megaphone}
                />
                <Button
                  variant="ghost"
                  icon={Trash}
                  className="absolute top-2 right-2 text-red-600"
                  onClick={() => removeAnnouncement(index)}
                />
              </div>
            ))}
            {(settings.announcements?.length || 0) < 3 && (
              <Button variant="outline" onClick={addAnnouncement}>Add Announcement</Button>
            )}
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">About Us</h4>
            <textarea
              name="about_us"
              value={settings.about_us || ''}
              onChange={handleInputChange}
              placeholder="Tell your guests about yourselves..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">How We Met / Our Love Story</h4>
            <textarea
              name="love_story"
              value={settings.love_story || ''}
              onChange={handleInputChange}
              placeholder="Share your love story..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Accommodation Information</h4>
            {settings.accommodations.map((hotel, index) => (
              <div key={index} className="border p-4 rounded-lg mb-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Hotel Name"
                    value={hotel.name}
                    onChange={(e) => handleAccommodationChange(index, 'name', e.target.value)}
                    placeholder="Hotel name"
                    error={formErrors[`hotel_name_${index}`]}
                  />
                  <Input
                    label="Website"
                    value={hotel.website}
                    onChange={(e) => handleAccommodationChange(index, 'website', e.target.value)}
                    placeholder="https://hotelwebsite.com"
                    error={formErrors[`hotel_website_${index}`]}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Room Block Information"
                      value={hotel.room_block}
                      onChange={(e) => handleAccommodationChange(index, 'room_block', e.target.value)}
                      placeholder="Room block details (optional)"
                    />
                  </div>
                </div>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    icon={Trash}
                    className="absolute top-2 right-2 text-red-600"
                    onClick={() => removeHotel(index)}
                  />
                )}
              </div>
            ))}
            {settings.accommodations.length < 3 && (
              <Button variant="outline" onClick={addHotel}>Add Hotel</Button>
            )}
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Timeline</h4>
            <p className="text-gray-600 mb-4">Events marked to show on your wedding website</p>
            {timelineLoading ? (
              <p className="text-gray-600">Loading timeline...</p>
            ) : events.length === 0 ? (
              <p className="text-gray-600">No events set to show on the website. Edit your timeline to select events.</p>
            ) : (
              <div className="space-y-4">
                {events.map(event => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{event.title}</h5>
                        <p className="text-sm text-gray-600">{formatDateTime(event)}</p>
                        {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                        {event.location && <p className="text-sm text-gray-600 mt-1">Location: {event.location}</p>}
                        {event.photo_shotlist && (
                          <p className="text-sm text-blue-600 mt-1 flex items-center">
                            <Image className="w-4 h-4 mr-1" /> {event.photo_shotlist}
                          </p>
                        )}
                        {event.music_notes && <p className="text-sm text-gray-600 mt-1">Music Notes: {event.music_notes}</p>}
                        {event.playlist_requests && <p className="text-sm text-gray-600 mt-1">Playlist Requests: {event.playlist_requests}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Website Gallery</h4>
            <p className="text-gray-600 mb-4">Upload up to 12 photos for your public website</p>
            {galleryError && <p className="text-red-600 text-sm mb-2">{galleryError}</p>}
            <label className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-lg cursor-pointer hover:bg-rose-600">
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={photoUploading || photos.length >= 12}
              />
            </label>
            {photoUploading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Uploading...</p>
              </div>
            )}
            {galleryLoading ? (
              <p className="text-gray-600 mt-4">Loading gallery...</p>
            ) : photos.length === 0 ? (
              <p className="text-gray-600 mt-4">No photos uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {photos.map(photo => (
                  <Card key={photo.id} className="overflow-hidden relative">
                    <img
                      src={photo.public_url}
                      alt={photo.file_name}
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      variant="ghost"
                      icon={Trash}
                      className="absolute top-2 right-2 text-red-600"
                      onClick={() => deletePhoto(photo.id)}
                    />
                    <p className="text-sm text-gray-600 p-2 truncate">{photo.file_name}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
          {formErrors.general && <p className="text-red-600 text-sm mt-2">{formErrors.general}</p>}
          {successMessage && (
            <p className="text-green-600 text-sm mt-2 flex items-center">
              <Check className="w-4 h-4 mr-2" /> {successMessage}
            </p>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="primary" onClick={handleSave} loading={loading} disabled={loading}>
              Save Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};