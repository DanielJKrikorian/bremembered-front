import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Users, Clock, Camera, Edit, Save, X, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useCouple, useCouplePreferences } from '../../hooks/useCouple';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import { useStyleTags, useVibeTags, useLanguages } from '../../hooks/useSupabase';
import { useAuth } from '../../context/AuthContext';

export const ProfileInfoTab: React.FC = () => {
  const { user } = useAuth();
  const { couple, loading, updateCouple } = useCouple();
  const { updateStylePreferences, updateVibePreferences, updateLanguagePreferences } = useCouplePreferences();
  const { uploadPhoto, uploading } = usePhotoUpload();
  const { styleTags } = useStyleTags();
  const { vibeTags } = useVibeTags();
  const { languages } = useLanguages();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    partner1_name: '',
    partner2_name: '',
    email: '',
    phone: '',
    wedding_date: '',
    venue_name: '',
    venue_city: '',
    venue_state: '',
    guest_count: '',
    ceremony_time: '',
    reception_time: '',
    notes: '',
    budget: ''
  });
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Initialize form when couple data loads
  React.useEffect(() => {
    if (couple && !isEditing) {
      setEditForm({
        partner1_name: couple.partner1_name || '',
        partner2_name: couple.partner2_name || '',
        email: couple.email || '',
        phone: couple.phone || '',
        wedding_date: couple.wedding_date || '',
        venue_name: couple.venue_name || '',
        venue_city: couple.venue_city || '',
        venue_state: couple.venue_state || '',
        guest_count: couple.guest_count?.toString() || '',
        ceremony_time: couple.ceremony_time || '',
        reception_time: couple.reception_time || '',
        notes: couple.notes || '',
        budget: couple.budget ? (couple.budget / 100).toString() : ''
      });
      setSelectedStyles(couple.style_preferences?.map(s => s.id) || []);
      setSelectedVibes(couple.vibe_preferences?.map(v => v.id) || []);
      setSelectedLanguages(couple.language_preferences?.map(l => l.id) || []);
    }
  }, [couple, isEditing]);

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!couple) return;

    try {
      const updates = {
        ...editForm,
        guest_count: editForm.guest_count ? parseInt(editForm.guest_count) : 0,
        budget: editForm.budget ? Math.round(parseFloat(editForm.budget) * 100) : null
      };

      await updateCouple(updates);
      
      // Update preferences
      if (selectedStyles.length > 0) {
        await updateStylePreferences(selectedStyles);
      }
      if (selectedVibes.length > 0) {
        await updateVibePreferences(selectedVibes);
      }
      if (selectedLanguages.length > 0) {
        await updateLanguagePreferences(selectedLanguages);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (couple) {
      setEditForm({
        partner1_name: couple.partner1_name || '',
        partner2_name: couple.partner2_name || '',
        email: couple.email || '',
        phone: couple.phone || '',
        wedding_date: couple.wedding_date || '',
        venue_name: couple.venue_name || '',
        venue_city: couple.venue_city || '',
        venue_state: couple.venue_state || '',
        guest_count: couple.guest_count?.toString() || '',
        ceremony_time: couple.ceremony_time || '',
        reception_time: couple.reception_time || '',
        notes: couple.notes || '',
        budget: couple.budget ? (couple.budget / 100).toString() : ''
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !couple) return;

    try {
      const photoUrl = await uploadPhoto(file, user.id);
      if (photoUrl) {
        await updateCouple({ profile_photo: photoUrl });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleStyleToggle = (styleId: number) => {
    setSelectedStyles(prev => 
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const handleVibeToggle = (vibeId: number) => {
    setSelectedVibes(prev => 
      prev.includes(vibeId)
        ? prev.filter(id => id !== vibeId)
        : [...prev, vibeId]
    );
  };

  const handleLanguageToggle = (languageId: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageId)
        ? prev.filter(id => id !== languageId)
        : [...prev, languageId]
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  if (!couple) {
    return (
      <Card className="p-8 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-600">Unable to load your profile information.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          {!isEditing ? (
            <Button variant="outline" icon={Edit} onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" icon={X} onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" icon={Save} onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden mx-auto mb-4">
                {couple.profile_photo ? (
                  <img
                    src={couple.profile_photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-rose-600 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Upload className="w-4 h-4 text-white" />
                  )}
                </label>
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{couple.name}</h3>
            <p className="text-gray-600">{couple.email}</p>
          </div>

          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Partner 1 Name"
                  value={isEditing ? editForm.partner1_name : couple.partner1_name}
                  onChange={(e) => handleInputChange('partner1_name', e.target.value)}
                  icon={User}
                  disabled={!isEditing}
                />
                <Input
                  label="Partner 2 Name"
                  value={isEditing ? editForm.partner2_name : couple.partner2_name || ''}
                  onChange={(e) => handleInputChange('partner2_name', e.target.value)}
                  icon={User}
                  disabled={!isEditing}
                />
                <Input
                  label="Email"
                  type="email"
                  value={isEditing ? editForm.email : couple.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  icon={Mail}
                  disabled={!isEditing}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={isEditing ? editForm.phone : couple.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  icon={Phone}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Wedding Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Wedding Date"
                  type="date"
                  value={isEditing ? editForm.wedding_date : couple.wedding_date || ''}
                  onChange={(e) => handleInputChange('wedding_date', e.target.value)}
                  icon={Calendar}
                  disabled={!isEditing}
                />
                <Input
                  label="Guest Count"
                  type="number"
                  value={isEditing ? editForm.guest_count : couple.guest_count?.toString() || ''}
                  onChange={(e) => handleInputChange('guest_count', e.target.value)}
                  icon={Users}
                  disabled={!isEditing}
                />
                <Input
                  label="Ceremony Time"
                  type="time"
                  value={isEditing ? editForm.ceremony_time : couple.ceremony_time || ''}
                  onChange={(e) => handleInputChange('ceremony_time', e.target.value)}
                  icon={Clock}
                  disabled={!isEditing}
                />
                <Input
                  label="Reception Time"
                  type="time"
                  value={isEditing ? editForm.reception_time : couple.reception_time || ''}
                  onChange={(e) => handleInputChange('reception_time', e.target.value)}
                  icon={Clock}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Venue Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Venue Name"
                  value={isEditing ? editForm.venue_name : couple.venue_name || ''}
                  onChange={(e) => handleInputChange('venue_name', e.target.value)}
                  icon={MapPin}
                  disabled={!isEditing}
                />
                <Input
                  label="Budget"
                  type="number"
                  value={isEditing ? editForm.budget : couple.budget ? (couple.budget / 100).toString() : ''}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="Enter total budget"
                  disabled={!isEditing}
                />
                <Input
                  label="City"
                  value={isEditing ? editForm.venue_city : couple.venue_city || ''}
                  onChange={(e) => handleInputChange('venue_city', e.target.value)}
                  icon={MapPin}
                  disabled={!isEditing}
                />
                <Input
                  label="State"
                  value={isEditing ? editForm.venue_state : couple.venue_state || ''}
                  onChange={(e) => handleInputChange('venue_state', e.target.value)}
                  icon={MapPin}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Share any special details about your wedding vision, requirements, or preferences..."
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Preferences */}
      {isEditing && (
        <>
          {/* Style Preferences */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Style Preferences</h3>
            <p className="text-gray-600 mb-4">Select the photography and videography styles you love</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {styleTags.map((style) => {
                const isSelected = selectedStyles.includes(style.id);
                return (
                  <button
                    key={style.id}
                    onClick={() => handleStyleToggle(style.id)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="font-medium text-gray-900 text-sm">{style.label}</div>
                    {style.description && (
                      <div className="text-xs text-gray-600 mt-1">{style.description}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Vibe Preferences */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vibe Preferences</h3>
            <p className="text-gray-600 mb-4">Choose the vibes that match your wedding vision</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {vibeTags.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe.id);
                return (
                  <button
                    key={vibe.id}
                    onClick={() => handleVibeToggle(vibe.id)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-pink-500 bg-pink-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="font-medium text-gray-900 text-sm">{vibe.label}</div>
                    {vibe.description && (
                      <div className="text-xs text-gray-600 mt-1">{vibe.description}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Language Preferences */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Preferences</h3>
            <p className="text-gray-600 mb-4">Select languages you'd like your vendors to speak</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {languages.map((language) => {
                const isSelected = selectedLanguages.includes(language.id);
                return (
                  <button
                    key={language.id}
                    onClick={() => handleLanguageToggle(language.id)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-center
                      ${isSelected 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="font-medium text-gray-900 text-sm">{language.language}</div>
                  </button>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* Display Preferences (when not editing) */}
      {!isEditing && (
        <>
          {couple.style_preferences && couple.style_preferences.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Style Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {couple.style_preferences.map((style) => (
                  <span key={style.id} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {style.label}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {couple.vibe_preferences && couple.vibe_preferences.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vibe Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {couple.vibe_preferences.map((vibe) => (
                  <span key={vibe.id} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                    {vibe.label}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {couple.language_preferences && couple.language_preferences.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {couple.language_preferences.map((language) => (
                  <span key={language.id} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                    {language.language}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};