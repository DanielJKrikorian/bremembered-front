import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Camera, Edit, Save, X, Heart, Star, Award, Shield, Upload, Trash2, Palette, Globe, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useCouple, useCouplePreferences } from '../hooks/useCouple';
import { useBookings } from '../hooks/useBookings';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useStyleTags, useVibeTags, useLanguages } from '../hooks/useSupabase';
import { AuthModal } from '../components/auth/AuthModal';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { couple, loading: coupleLoading, updateCouple } = useCouple();
  const { updateStylePreferences, updateVibePreferences, loading: preferencesLoading } = useCouplePreferences();
  const { bookings } = useBookings();
  const { uploadPhoto, deletePhoto, uploading: photoUploading, error: photoError } = usePhotoUpload();
  const { styleTags, loading: styleTagsLoading } = useStyleTags();
  const { vibeTags, loading: vibeTagsLoading } = useVibeTags();
  const { languages, loading: languagesLoading } = useLanguages();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'wedding-preferences' | 'preferences' | 'security'>('profile');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  
  // Preference states
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [preferencesChanged, setPreferencesChanged] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
    vendorMessages: true,
    bookingUpdates: true,
    newsletter: true
  });

  // Initialize preferences when couple data loads
  React.useEffect(() => {
    if (couple) {
      setSelectedStyles(couple.style_preferences?.map(s => s.id) || []);
      setSelectedVibes(couple.vibe_preferences?.map(v => v.id) || []);
      setSelectedLanguages(couple.language_preferences?.map(l => l.id) || []);
    }
  }, [couple]);

  const handleProfileUpdate = async () => {
    if (!couple) return;
    
    setUpdating(true);
    setUpdateError(null);
    
    try {
      await updateCouple({
        partner1_name: couple.partner1_name,
        partner2_name: couple.partner2_name,
        email: couple.email,
        phone: couple.phone,
        wedding_date: couple.wedding_date,
        notes: couple.notes,
        venue_name: couple.venue_name,
        venue_city: couple.venue_city,
        venue_state: couple.venue_state,
        guest_count: couple.guest_count,
        ceremony_time: couple.ceremony_time,
        reception_time: couple.reception_time,
        profile_photo: couple.profile_photo
      });
      setIsEditing(false);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (!couple) return;
    setIsEditing(true);
    // This should update the couple state through the useCouple hook
    // We'll need to modify this to work with the couple state properly
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !couple) return;

    setPhotoUploadError(null);

    try {
      // Delete old photo if it exists
      if (couple.profile_photo) {
        try {
          await deletePhoto(couple.profile_photo);
        } catch (err) {
          console.warn('Failed to delete old photo:', err);
        }
      }

      // Upload new photo
      const photoUrl = await uploadPhoto(file, user.id);
      
      if (photoUrl) {
        // Update couple record with new photo URL
        await updateCouple({ profile_photo: photoUrl });
      }
    } catch (err) {
      setPhotoUploadError(err instanceof Error ? err.message : 'Failed to upload photo');
    }

    // Clear the input
    event.target.value = '';
  };

  const handlePhotoDelete = async () => {
    if (!couple?.profile_photo) return;

    setPhotoUploadError(null);

    try {
      await deletePhoto(couple.profile_photo);
      await updateCouple({ profile_photo: null });
    } catch (err) {
      setPhotoUploadError(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  };

  const handlePreferenceChange = (field: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleStyleToggle = (styleId: number) => {
    setSelectedStyles(prev => {
      const newStyles = prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId];
      setPreferencesChanged(true);
      return newStyles;
    });
  };

  const handleVibeToggle = (vibeId: number) => {
    setSelectedVibes(prev => {
      const newVibes = prev.includes(vibeId)
        ? prev.filter(id => id !== vibeId)
        : [...prev, vibeId];
      setPreferencesChanged(true);
      return newVibes;
    });
  };

  const handleLanguageToggle = (languageId: string) => {
    setSelectedLanguages(prev => {
      const newLanguages = prev.includes(languageId)
        ? prev.filter(id => id !== languageId)
        : [...prev, languageId];
      setPreferencesChanged(true);
      return newLanguages;
    });
  };

  const handleSavePreferences = async () => {
    try {
      setUpdating(true);
      setUpdateError(null);
      
      await Promise.all([
        updateStylePreferences(selectedStyles),
        updateVibePreferences(selectedVibes)
        // Note: Language preferences would need a similar table structure
      ]);
      
      setPreferencesChanged(false);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setUpdating(false);
    }
  };

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-12 text-center max-w-md">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In to View Your Profile</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to your account to view and manage your wedding profile.
            </p>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          </Card>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      </>
    );
  }

  if (coupleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!couple) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">Error loading profile data</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: 'Bookings Made', value: bookings.length.toString(), icon: Calendar },
    { label: 'Reviews Left', value: '0', icon: Star },
    { label: 'Favorites', value: '0', icon: Heart },
    { 
      label: 'Member Since', 
      value: new Date(couple.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
      icon: Award 
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and wedding preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  {couple.profile_photo ? (
                    <img
                      src={couple.profile_photo}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-gray-300 border-dashed flex items-center justify-center mx-auto">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Photo Upload/Delete Controls */}
                  <div className="absolute bottom-0 right-0 flex space-x-1">
                    <label className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={photoUploading}
                      />
                      {photoUploading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </label>
                    
                    {couple.profile_photo && (
                      <button
                        onClick={handlePhotoDelete}
                        className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                        disabled={photoUploading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-4">
                  {couple.partner1_name}
                </h3>
                <p className="text-gray-600">{couple.email}</p>
                
                {/* Photo Upload Error */}
                {photoUploadError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    {photoUploadError}
                  </div>
                )}
                
                <div className="flex items-center justify-center space-x-1 mt-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {couple.venue_city && couple.venue_state 
                      ? `${couple.venue_city}, ${couple.venue_state}` 
                      : couple.venue_region || 'Location not set'
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile' ? 'bg-rose-100 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('wedding-preferences')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'wedding-preferences' ? 'bg-rose-100 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Wedding Preferences
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'preferences' ? 'bg-rose-100 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'security' ? 'bg-rose-100 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Security
                </button>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Stats</h3>
              <div className="space-y-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                          <Icon className="w-4 h-4 text-rose-600" />
                        </div>
                        <span className="text-sm text-gray-600">{stat.label}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
                  {!isEditing ? (
                    <Button variant="outline" icon={Edit} onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-3">
                      <Button variant="outline" icon={X} onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="primary" 
                        icon={Save} 
                        onClick={handleProfileUpdate}
                        loading={updating}
                        disabled={updating}
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>

                {updateError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{updateError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Your Name"
                    value={couple.partner1_name}
                    onChange={(e) => {
                      if (isEditing) {
                        setCouple(prev => prev ? { ...prev, partner1_name: e.target.value } : null);
                      }
                    }}
                    disabled={!isEditing}
                    icon={User}
                  />
                  <Input
                    label="Partner's Name"
                    value={couple.partner2_name || ''}
                    onChange={(e) => {
                      if (isEditing) {
                        setCouple(prev => prev ? { ...prev, partner2_name: e.target.value } : null);
                      }
                    }}
                    disabled={!isEditing}
                    icon={Heart}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={couple.email || ''}
                    onChange={(e) => {
                      if (isEditing) {
                        setCouple(prev => prev ? { ...prev, email: e.target.value } : null);
                      }
                    }}
                    disabled={!isEditing}
                    icon={Mail}
                  />
                  <Input
                    label="Phone Number"
                    value={couple.phone || ''}
                    onChange={(e) => {
                      if (isEditing) {
                        setCouple(prev => prev ? { ...prev, phone: e.target.value } : null);
                      }
                    }}
                    disabled={!isEditing}
                    icon={Phone}
                  />
                  <Input
                    label="Wedding Venue"
                    value={couple.venue_name || ''}
                    onChange={(e) => {
                      if (isEditing) {
                        setCouple(prev => prev ? { ...prev, venue_name: e.target.value } : null);
                      }
                    }}
                    disabled={!isEditing}
                    icon={MapPin}
                  />
                  <Input
                    label="Wedding Date"
                    type="date"
                    value={couple.wedding_date || ''}
                    onChange={(e) => {
                      if (isEditing) {
                        setCouple(prev => prev ? { ...prev, wedding_date: e.target.value } : null);
                      }
                    }}
                    disabled={!isEditing}
                    icon={Calendar}
                  />
                  <Input
                    label="Guest Count"
                    type="number"
                    value={couple.guest_count?.toString() || ''}
                    onChange={(e) => {
                      if (isEditing) {
                        setCouple(prev => prev ? { ...prev, guest_count: parseInt(e.target.value) || 0 } : null);
                      }
                    }}
                    disabled={!isEditing}
                    icon={User}
                  />
                  <Input
                    label="Budget"
                    type="number"
                    value={couple.budget ? (couple.budget / 100).toString() : ''}
                    onChange={(e) => {
                      if (isEditing) {
                        setCouple(prev => prev ? { ...prev, budget: (parseInt(e.target.value) || 0) * 100 } : null);
                      }
                    }}
                    disabled={!isEditing}
                    placeholder="Enter budget in dollars"
                    helperText="Your total wedding budget"
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wedding Notes & Vision
                    </label>
                    <textarea
                      value={couple.notes || ''}
                      onChange={(e) => {
                        if (isEditing) {
                          setCouple(prev => prev ? { ...prev, notes: e.target.value } : null);
                        }
                      }}
                      disabled={!isEditing}
                      rows={4}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Tell us about your wedding vision and what you're looking for..."
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Profile Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Complete profiles get better vendor responses</li>
                      <li>• Add your wedding date to see availability</li>
                      <li>• Share your vision to help vendors understand your style</li>
                      <li>• Keep your contact information up to date</li>
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'wedding-preferences' && (
              <Card className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Wedding Preferences</h2>
                  {preferencesChanged && (
                    <Button 
                      variant="primary" 
                      icon={Save} 
                      onClick={handleSavePreferences}
                      loading={updating || preferencesLoading}
                      disabled={updating || preferencesLoading}
                    >
                      Save Changes
                    </Button>
                  )}
                </div>

                {updateError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{updateError}</p>
                  </div>
                )}

                <div className="space-y-8">
                  {/* Style Preferences */}
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Palette className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Style Preferences</h3>
                        <p className="text-sm text-gray-600">Choose the photography/videography styles you love</p>
                      </div>
                    </div>
                    
                    {styleTagsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading styles...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {styleTags.map((style) => {
                          const isSelected = selectedStyles.includes(style.id);
                          return (
                            <div
                              key={style.id}
                              onClick={() => handleStyleToggle(style.id)}
                              className={`
                                relative p-3 rounded-lg border-2 cursor-pointer transition-all
                                ${isSelected 
                                  ? 'border-purple-500 bg-purple-50' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                                }
                              `}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <h4 className="font-medium text-gray-900 text-sm">{style.label}</h4>
                              {style.description && (
                                <p className="text-xs text-gray-600 mt-1">{style.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Vibe Preferences */}
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Vibe Preferences</h3>
                        <p className="text-sm text-gray-600">Select the vibes that match your wedding vision</p>
                      </div>
                    </div>
                    
                    {vibeTagsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-6 h-6 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading vibes...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {vibeTags.map((vibe) => {
                          const isSelected = selectedVibes.includes(vibe.id);
                          return (
                            <div
                              key={vibe.id}
                              onClick={() => handleVibeToggle(vibe.id)}
                              className={`
                                relative p-3 rounded-lg border-2 cursor-pointer transition-all
                                ${isSelected 
                                  ? 'border-pink-500 bg-pink-50' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                                }
                              `}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <h4 className="font-medium text-gray-900 text-sm">{vibe.label}</h4>
                              {vibe.description && (
                                <p className="text-xs text-gray-600 mt-1">{vibe.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Language Preferences */}
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Globe className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Language Preferences</h3>
                        <p className="text-sm text-gray-600">Select languages you'd like your vendors to speak</p>
                      </div>
                    </div>
                    
                    {languagesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading languages...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {languages.map((language) => {
                          const isSelected = selectedLanguages.includes(language.id);
                          return (
                            <div
                              key={language.id}
                              onClick={() => handleLanguageToggle(language.id)}
                              className={`
                                relative p-3 rounded-lg border-2 cursor-pointer transition-all text-center
                                ${isSelected 
                                  ? 'border-emerald-500 bg-emerald-50' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                                }
                              `}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <div className="font-medium text-gray-900 text-sm">{language.language}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Help Text */}
                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Why set preferences?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Get better vendor recommendations that match your style</li>
                    <li>• Help vendors understand your vision before they contact you</li>
                    <li>• Find vendors who speak your preferred languages</li>
                    <li>• Save time by filtering out vendors who don't match your vibe</li>
                  </ul>
                </div>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">Notification Preferences</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Communication</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive important updates via email' },
                        { key: 'smsNotifications', label: 'SMS Notifications', description: 'Get urgent updates via text message' },
                        { key: 'vendorMessages', label: 'Vendor Messages', description: 'Notifications when vendors message you' }
                      ].map((pref) => (
                        <div key={pref.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{pref.label}</h4>
                            <p className="text-sm text-gray-600">{pref.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences[pref.key as keyof typeof preferences]}
                              onChange={(e) => handlePreferenceChange(pref.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Updates & Marketing</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'bookingUpdates', label: 'Booking Updates', description: 'Updates about your current bookings' },
                        { key: 'newsletter', label: 'Newsletter', description: 'Weekly wedding tips and inspiration' },
                        { key: 'marketingEmails', label: 'Promotional Emails', description: 'Special offers and new vendor announcements' }
                      ].map((pref) => (
                        <div key={pref.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{pref.label}</h4>
                            <p className="text-sm text-gray-600">{pref.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences[pref.key as keyof typeof preferences]}
                              onChange={(e) => handlePreferenceChange(pref.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button variant="primary">
                    Save Preferences
                  </Button>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">Security Settings</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">Change Password</h4>
                          <p className="text-sm text-gray-600">Last changed 3 months ago</p>
                        </div>
                        <Button variant="outline">
                          Update Password
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Password requirements:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>At least 8 characters long</li>
                          <li>Include uppercase and lowercase letters</li>
                          <li>Include at least one number</li>
                          <li>Include at least one special character</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">2FA Status</h4>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-red-600">Disabled</span>
                          <Button variant="primary" size="sm">
                            Enable 2FA
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Login Activity</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="space-y-4">
                        {[
                          { device: 'MacBook Pro - Chrome', location: 'Los Angeles, CA', time: '2 hours ago', current: true },
                          { device: 'iPhone - Safari', location: 'Los Angeles, CA', time: '1 day ago', current: false },
                          { device: 'iPad - Safari', location: 'Los Angeles, CA', time: '3 days ago', current: false }
                        ].map((session, index) => (
                          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{session.device}</h4>
                                {session.current && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{session.location} • {session.time}</p>
                            </div>
                            {!session.current && (
                              <Button variant="outline" size="sm">
                                Revoke
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                    <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <Shield className="w-6 h-6 text-red-600" />
                        <h4 className="font-medium text-red-900">Danger Zone</h4>
                      </div>
                      <p className="text-sm text-red-700 mb-4">
                        These actions are permanent and cannot be undone. Please proceed with caution.
                      </p>
                      <div className="space-y-3">
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          Download My Data
                        </Button>
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
};