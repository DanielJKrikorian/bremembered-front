import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Camera, Download, Eye, Calendar, Clock, AlertCircle, CreditCard, Shield, Check, Play, Image as ImageIcon, Video, FileText, Mail, Phone, MapPin, Users, Edit, Save, X, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/auth/AuthModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useCouple, useCouplePreferences } from '../hooks/useCouple';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useStyleTags, useVibeTags, useLanguages } from '../hooks/useSupabase';
import { useWeddingGallery } from '../hooks/useWeddingGallery';
import { StripePaymentModal } from '../components/payment/StripePaymentModal';

export const Profile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'gallery'>('profile');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Profile tab state
  const { couple, loading: coupleLoading, updateCouple } = useCouple();
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

  // Gallery tab state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const {
    files,
    photoFiles,
    videoFiles,
    subscription,
    loading: galleryLoading,
    error: galleryError,
    downloadingAll,
    downloadFile,
    downloadAllFiles,
    isAccessExpired,
    getDaysUntilExpiry,
    getFileType,
    formatFileSize
  } = useWeddingGallery();

  // Handle URL parameters for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab === 'gallery') {
      setActiveTab('gallery');
    } else {
      setActiveTab('profile');
    }
  }, [location.search]);

  // Initialize form when couple data loads
  useEffect(() => {
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

  // Update URL when tab changes
  const handleTabChange = (tab: 'profile' | 'gallery') => {
    setActiveTab(tab);
    const newUrl = tab === 'gallery' ? '/profile?tab=gallery' : '/profile';
    navigate(newUrl, { replace: true });
  };

  // Profile tab handlers
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

  // Gallery tab handlers
  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    // Refresh the page or refetch data
    window.location.reload();
  };

  const handleFileClick = (file: any) => {
    if (isAccessExpired()) {
      setIsPaymentModalOpen(true);
      return;
    }
    
    setSelectedFile(file);
    if (getFileType(file.file_name) === 'image') {
      setShowImageModal(true);
    } else {
      downloadFile(file);
    }
  };

  const handleDownloadAll = async () => {
    if (isAccessExpired()) {
      setIsPaymentModalOpen(true);
      return;
    }
    
    try {
      await downloadAllFiles();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center max-w-md">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In to View Profile</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to your account to view and manage your wedding profile.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 px-6 py-3 text-lg"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full border-2 border-rose-500 text-rose-600 hover:bg-rose-50 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 px-6 py-3 text-lg"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      </>
    );
  }

  // Show loading state while couple data is loading
  if (coupleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if couple data failed to load
  if (!couple) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your wedding information and preferences</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('profile')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${activeTab === 'profile'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile Information
            </button>
            <button
              onClick={() => handleTabChange('gallery')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${activeTab === 'gallery'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Wedding Gallery
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
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

              {coupleLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your profile...</p>
                </div>
              ) : !couple ? (
                <Card className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
                  <p className="text-gray-600">Unable to load your profile information.</p>
                </Card>
              ) : (
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
              )}
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
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Gallery Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Wedding Gallery</h2>
                <p className="text-gray-600">
                  {files.length > 0 
                    ? `${photoFiles.length} photos and ${videoFiles.length} videos from your vendors`
                    : 'Your wedding photos and videos will appear here'
                  }
                </p>
              </div>
              {files.length > 0 && !isAccessExpired() && (
                <Button
                  variant="primary"
                  icon={Download}
                  onClick={handleDownloadAll}
                  loading={downloadingAll}
                  disabled={downloadingAll}
                >
                  {downloadingAll ? 'Downloading...' : 'Download All'}
                </Button>
              )}
            </div>

            {galleryLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your wedding gallery...</p>
              </div>
            ) : galleryError ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Gallery</h3>
                <p className="text-gray-600 mb-4">{galleryError}</p>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </Card>
            ) : (
              <>
                {/* Access Status */}
                {subscription && (
                  <Card className={`p-4 ${isAccessExpired() ? 'bg-red-50 border-red-200' : getDaysUntilExpiry() <= 7 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isAccessExpired() ? 'bg-red-100' : getDaysUntilExpiry() <= 7 ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          {isAccessExpired() ? (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          ) : getDaysUntilExpiry() <= 7 ? (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${
                            isAccessExpired() ? 'text-red-900' : getDaysUntilExpiry() <= 7 ? 'text-yellow-900' : 'text-green-900'
                          }`}>
                            {isAccessExpired() 
                              ? 'Gallery Access Expired' 
                              : getDaysUntilExpiry() <= 7 
                                ? `${getDaysUntilExpiry()} days remaining` 
                                : 'Gallery Access Active'
                            }
                          </p>
                          <p className={`text-sm ${
                            isAccessExpired() ? 'text-red-700' : getDaysUntilExpiry() <= 7 ? 'text-yellow-700' : 'text-green-700'
                          }`}>
                            {isAccessExpired() 
                              ? 'Subscribe to access your wedding photos and videos'
                              : subscription.payment_status === 'active' 
                                ? 'Your subscription is active'
                                : `Free access expires ${subscription.free_period_expiry ? new Date(subscription.free_period_expiry).toLocaleDateString() : 'soon'}`
                            }
                          </p>
                        </div>
                      </div>
                      {(isAccessExpired() || getDaysUntilExpiry() <= 7) && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CreditCard}
                          onClick={() => setIsPaymentModalOpen(true)}
                        >
                          {isAccessExpired() ? 'Subscribe Now' : 'Extend Access'}
                        </Button>
                      )}
                    </div>
                  </Card>
                )}

                {/* Gallery Content */}
                {files.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Photos or Videos Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Your wedding photos and videos from vendors will appear here after your event.
                    </p>
                    <Button variant="primary" onClick={() => navigate('/search')}>
                      Book Wedding Services
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    {/* Photos Section */}
                    {photoFiles.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-gray-900">
                            Photos ({photoFiles.length})
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {photoFiles.map((file) => (
                            <div
                              key={file.id}
                              className="relative group cursor-pointer"
                              onClick={() => handleFileClick(file)}
                            >
                              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                <img
                                  src={file.file_path}
                                  alt={file.file_name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                {isAccessExpired() && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="text-white text-center">
                                      <CreditCard className="w-6 h-6 mx-auto mb-2" />
                                      <p className="text-xs">Subscribe to view</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="absolute bottom-2 left-2 right-2">
                                <div className="bg-black/70 text-white text-xs p-2 rounded">
                                  <p className="font-medium truncate">{file.file_name}</p>
                                  <p className="text-gray-300">
                                    {file.vendors?.name} • {formatFileSize(file.file_size)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos Section */}
                    {videoFiles.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-gray-900">
                            Videos ({videoFiles.length})
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {videoFiles.map((file) => (
                            <Card key={file.id} className="overflow-hidden group cursor-pointer" onClick={() => handleFileClick(file)}>
                              <div className="aspect-video bg-gray-200 relative">
                                <video
                                  src={file.file_path}
                                  className="w-full h-full object-cover"
                                  poster={file.file_path}
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                    <Play className="w-6 h-6 text-gray-900 ml-1" />
                                  </div>
                                </div>
                                {isAccessExpired() && (
                                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <div className="text-white text-center">
                                      <CreditCard className="w-8 h-8 mx-auto mb-2" />
                                      <p className="text-sm">Subscribe to view</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h4 className="font-medium text-gray-900 mb-1 truncate">{file.file_name}</h4>
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <span>{file.vendors?.name}</span>
                                  <span>{formatFileSize(file.file_size)}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File List */}
                    <Card className="overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">All Files</h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {files.map((file) => {
                          const fileType = getFileType(file.file_name);
                          const FileIcon = fileType === 'image' ? ImageIcon : fileType === 'video' ? Video : FileText;
                          
                          return (
                            <div key={file.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileIcon className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate">{file.file_name}</h4>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span>{file.vendors?.name}</span>
                                    <span>{formatFileSize(file.file_size)}</span>
                                    <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    icon={Eye}
                                    onClick={() => handleFileClick(file)}
                                    disabled={isAccessExpired()}
                                  >
                                    {fileType === 'image' ? 'View' : 'Play'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    icon={Download}
                                    onClick={() => downloadFile(file)}
                                    disabled={isAccessExpired()}
                                  >
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Payment Modal */}
        <StripePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          planId="Couple_Capsule"
          planName="Wedding Gallery Access"
          amount={999} // $9.99 in cents
        />

        {/* Image Modal */}
        {showImageModal && selectedFile && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
            <div className="max-w-4xl max-h-full">
              <img
                src={selectedFile.file_path}
                alt={selectedFile.file_name}
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="bg-black/70 text-white p-3 rounded-lg">
                  <h4 className="font-medium">{selectedFile.file_name}</h4>
                  <p className="text-sm text-gray-300">{selectedFile.vendors?.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/70 border-white/30 text-white hover:bg-black/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowImageModal(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};