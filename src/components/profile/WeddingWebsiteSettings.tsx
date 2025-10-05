import React, { useState, useEffect } from 'react';
import { useCouple } from '../../hooks/useCouple';
import { useWebsiteGallery } from '../../hooks/useWebsiteGallery';
import { useWeddingTimeline } from '../../hooks/useWeddingTimeline';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Globe, Lock, Image, Calendar, User, Upload, Trash } from 'lucide-react';

interface WebsiteSettings {
  id?: string;
  couple_id: string;
  slug: string;
  password: string;
  layout: 'classic' | 'modern' | 'romantic';
  about_us?: string;
  love_story?: string;
  accommodations?: { name: string; website: string; room_block?: string }[];
}

interface TimelineEvent {
  id: string;
  couple_id: string;
  title: string;
  start_time: string;
  end_time?: string;
  description?: string;
  photo_shotlist?: string;
}

export const WeddingWebsiteSettings: React.FC = () => {
  const { couple, updateCouple } = useCouple();
  const { photos, loading: galleryLoading, uploadPhoto, deletePhoto, error: galleryError } = useWebsiteGallery();
  const { events, loading: timelineLoading } = useWeddingTimeline();
  const [settings, setSettings] = useState<WebsiteSettings>({
    couple_id: couple?.id || '',
    slug: couple?.slug || '',
    password: '',
    layout: 'classic',
    about_us: '',
    love_story: '',
    accommodations: [{ name: '', website: '', room_block: '' }]
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Fetch existing website settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!couple?.id || !supabase || !isSupabaseConfigured()) return;
      try {
        const { data, error } = await supabase
          .from('wedding_websites')
          .select('*')
          .eq('couple_id', couple.id)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          setSettings({
            ...data,
            accommodations: data.accommodations || [{ name: '', website: '', room_block: '' }],
            slug: couple.slug || data.slug
          });
          setIsEditing(true);
        }
      } catch (err) {
        console.error('Error fetching website settings:', err);
      }
    };
    if (couple?.id) fetchSettings();
  }, [couple]);

  // Validate form
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
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Handle accommodation changes
  const handleAccommodationChange = (index: number, field: string, value: string) => {
    const newAccommodations = [...settings.accommodations];
    newAccommodations[index] = { ...newAccommodations[index], [field]: value };
    setSettings(prev => ({ ...prev, accommodations: newAccommodations }));
    setFormErrors(prev => ({ ...prev, [`hotel_${field}_${index}`]: '' }));
  };

  // Add a new hotel
  const addHotel = () => {
    if (settings.accommodations.length < 3) {
      setSettings(prev => ({
        ...prev,
        accommodations: [...prev.accommodations, { name: '', website: '', room_block: '' }]
      }));
    }
  };

  // Remove a hotel
  const removeHotel = (index: number) => {
    setSettings(prev => ({
      ...prev,
      accommodations: prev.accommodations.filter((_, i) => i !== index)
    }));
  };

  // Handle photo upload
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

  // Save settings
  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setSuccessMessage('Settings saved locally (Supabase not configured)');
        setLoading(false);
        return;
      }
      // Update couples table with slug
      await updateCouple({ slug: settings.slug });
      // Save website settings
      const { error } = await supabase
        .from('wedding_websites')
        .upsert({
          id: settings.id,
          couple_id: couple!.id,
          slug: settings.slug,
          password: settings.password,
          layout: settings.layout,
          about_us: settings.about_us,
          love_story: settings.love_story,
          accommodations: settings.accommodations.filter(hotel => hotel.name)
        }, { onConflict: 'couple_id' });
      if (error) throw error;
      setSuccessMessage('Website settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsEditing(true);
    } catch (err) {
      console.error('Error saving website settings:', err);
      setFormErrors({ general: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not set';
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Layout preview styles
  const layoutPreviews = {
    classic: { bg: 'bg-white border-rose-200', header: 'bg-rose-100 text-rose-800', button: 'bg-rose-500 text-white' },
    modern: { bg: 'bg-gray-900 text-white border-gray-700', header: 'bg-gray-800 text-gray-100', button: 'bg-blue-600 text-white' },
    romantic: { bg: 'bg-pink-50 border-pink-200', header: 'bg-pink-200 text-pink-800', button: 'bg-pink-500 text-white' }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Wedding Website Settings</h3>
        <p className="text-gray-600 mb-6">Configure your public wedding website for guests</p>

        {/* Website Configuration Form */}
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
              </div>
              <div>
                <Input
                  label="Website Password"
                  name="password"
                  type="password"
                  value={settings.password}
                  onChange={handleInputChange}
                  placeholder="Enter a password"
                  error={formErrors.password}
                  icon={Lock}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
                <select
                  name="layout"
                  value={settings.layout}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="romantic">Romantic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Layout Previews */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Layout Previews</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(layoutPreviews).map(([layout, styles]) => (
                <Card key={layout} className={`p-4 ${styles.bg} border ${settings.layout === layout ? 'border-rose-500' : ''}`}>
                  <div className={`${styles.header} p-2 rounded-t-lg text-center`}>
                    <h5 className="font-medium capitalize">{layout}</h5>
                  </div>
                  <div className="p-2">
                    <p className="text-sm">Sample content</p>
                    <Button className={`mt-2 ${styles.button}`}>RSVP</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Couple Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Couple Information</h4>
            <div className="flex items-center space-x-4">
              {couple?.profile_photo ? (
                <img
                  src={couple.profile_photo}
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
                  {couple?.partner1_name || 'Partner 1'} & {couple?.partner2_name || 'Partner 2'}
                </p>
                <p className="text-gray-600 text-sm">
                  Wedding Date: {couple?.wedding_date ? new Date(couple.wedding_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* About Us */}
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

          {/* How We Met / Our Love Story */}
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

          {/* Accommodations */}
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
              <Button variant="outline" onClick={addHotel}>
                Add Hotel
              </Button>
            )}
          </div>

          {/* Timeline Preview */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Timeline</h4>
            {timelineLoading ? (
              <p className="text-gray-600">Loading timeline...</p>
            ) : events.length === 0 ? (
              <p className="text-gray-600">No timeline events added yet.</p>
            ) : (
              <div className="space-y-4">
                {events.map(event => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{event.title}</h5>
                        <p className="text-sm text-gray-600">
                          {formatTime(event.start_time)} {event.end_time ? `- ${formatTime(event.end_time)}` : ''}
                        </p>
                        {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                        {event.photo_shotlist && (
                          <p className="text-sm text-blue-600 mt-1 flex items-center">
                            <Camera className="w-4 h-4 mr-1" /> {event.photo_shotlist}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Website Gallery */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Website Gallery</h4>
            <p className="text-gray-600 mb-4">Upload up to 6 photos for your public website</p>
            {galleryError && <p className="text-red-600 text-sm mb-2">{galleryError}</p>}
            <label className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-lg cursor-pointer hover:bg-rose-600">
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={photoUploading || photos.length >= 6}
              />
            </label>
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

          {/* Save Button */}
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