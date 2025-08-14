import React, { useState } from 'react';
import { User, Calendar, Heart, Camera, Settings, Bell, Shield, Download, Share2, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCouple } from '../hooks/useCouple';
import { useWeddingGallery } from '../hooks/useWeddingGallery';
import { useCouplePreferences } from '../hooks/useCouple';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { StripePaymentModal } from '../components/payment/StripePaymentModal';
import { WeddingTimeline } from '../components/profile/WeddingTimeline';

export const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { couple, loading: coupleLoading, updateCouple } = useCouple();
  const { 
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
    loading: galleryLoading, 
    downloadFile, 
    downloadAllFiles, 
    downloadingAll,
    isAccessExpired, 
    getDaysUntilExpiry,
    formatFileSize 
  } = useWeddingGallery();
  const { updateStylePreferences, updateVibePreferences, updateLanguagePreferences } = useCouplePreferences();
  const { uploadPhoto, uploading: photoUploading } = usePhotoUpload();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline' | 'gallery' | 'preferences' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    partner1_name: '',
    partner2_name: '',
    email: '',
    phone: '',
    wedding_date: '',
    venue_name: '',
    guest_count: '',
    ceremony_time: '',
    reception_time: '',
    notes: ''
  });

  // Initialize edit form when couple data loads
  React.useEffect(() => {
    if (couple && !isEditing) {
      setEditForm({
        name: couple.name || '',
        partner1_name: couple.partner1_name || '',
        partner2_name: couple.partner2_name || '',
        email: couple.email || '',
        phone: couple.phone || '',
        wedding_date: couple.wedding_date || '',
        venue_name: couple.venue_name || '',
        guest_count: couple.guest_count?.toString() || '',
        ceremony_time: couple.ceremony_time || '',
        reception_time: couple.reception_time || '',
        notes: couple.notes || ''
      });
    }
  }, [couple, isEditing]);

  // Get active tab from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['profile', 'timeline', 'gallery', 'preferences', 'settings'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setIsEditing(false);
      if (couple) {
        setEditForm({
          name: couple.name || '',
          partner1_name: couple.partner1_name || '',
          partner2_name: couple.partner2_name || '',
          email: couple.email || '',
          phone: couple.phone || '',
          wedding_date: couple.wedding_date || '',
          venue_name: couple.venue_name || '',
          guest_count: couple.guest_count?.toString() || '',
          ceremony_time: couple.ceremony_time || '',
          reception_time: couple.reception_time || '',
          notes: couple.notes || ''
        });
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateCouple({
        name: editForm.name,
        partner1_name: editForm.partner1_name,
        partner2_name: editForm.partner2_name,
        email: editForm.email,
        phone: editForm.phone,
        wedding_date: editForm.wedding_date || null,
        venue_name: editForm.venue_name || null,
        guest_count: editForm.guest_count ? parseInt(editForm.guest_count) : null,
        ceremony_time: editForm.ceremony_time || null,
        reception_time: editForm.reception_time || null,
        notes: editForm.notes || null
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const photoUrl = await uploadPhoto(file, user.id);
      await updateCouple({ profile_photo: photoUrl });
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not set';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your profile.</p>
        </Card>
      </div>
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

  const tabs = [
    { key: 'profile', label: 'Profile Information', icon: User },
    { key: 'timeline', label: 'Wedding Timeline', icon: Calendar },
    { key: 'gallery', label: 'Wedding Gallery', icon: Camera },
    { key: 'preferences', label: 'Preferences', icon: Heart },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {couple?.profile_photo ? (
                <img
                  src={couple.profile_photo}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-rose-600 transition-colors shadow-lg">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={photoUploading}
                />
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {couple?.name || 'Your Profile'}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your wedding information and preferences
              </p>
              {couple?.wedding_date && (
                <p className="text-rose-600 font-medium mt-1">
                  Wedding: {formatDate(couple.wedding_date)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors
                    ${activeTab === tab.key
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
                <Button
                  variant={isEditing ? "outline" : "primary"}
                  onClick={isEditing ? handleEditToggle : handleEditToggle}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Couple Name"
                    value={isEditing ? editForm.name : couple?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Sarah & Michael"
                    disabled={!isEditing}
                  />
                  <Input
                    label="Partner 1 Name"
                    value={isEditing ? editForm.partner1_name : couple?.partner1_name || ''}
                    onChange={(e) => handleInputChange('partner1_name', e.target.value)}
                    placeholder="Sarah Johnson"
                    disabled={!isEditing}
                  />
                  <Input
                    label="Partner 2 Name"
                    value={isEditing ? editForm.partner2_name : couple?.partner2_name || ''}
                    onChange={(e) => handleInputChange('partner2_name', e.target.value)}
                    placeholder="Michael Davis"
                    disabled={!isEditing}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={isEditing ? editForm.email : couple?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="sarah@example.com"
                    disabled={!isEditing}
                  />
                  <Input
                    label="Phone"
                    value={isEditing ? editForm.phone : couple?.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-4">
                  <Input
                    label="Wedding Date"
                    type="date"
                    value={isEditing ? editForm.wedding_date : couple?.wedding_date || ''}
                    onChange={(e) => handleInputChange('wedding_date', e.target.value)}
                    disabled={!isEditing}
                    icon={Calendar}
                  />
                  <Input
                    label="Venue Name"
                    value={isEditing ? editForm.venue_name : couple?.venue_name || ''}
                    onChange={(e) => handleInputChange('venue_name', e.target.value)}
                    placeholder="Sunset Gardens"
                    disabled={!isEditing}
                  />
                  <Input
                    label="Guest Count"
                    type="number"
                    value={isEditing ? editForm.guest_count : couple?.guest_count?.toString() || ''}
                    onChange={(e) => handleInputChange('guest_count', e.target.value)}
                    placeholder="120"
                    disabled={!isEditing}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Ceremony Time"
                      type="time"
                      value={isEditing ? editForm.ceremony_time : couple?.ceremony_time || ''}
                      onChange={(e) => handleInputChange('ceremony_time', e.target.value)}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Reception Time"
                      type="time"
                      value={isEditing ? editForm.reception_time : couple?.reception_time || ''}
                      onChange={(e) => handleInputChange('reception_time', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wedding Notes
                </label>
                <textarea
                  value={isEditing ? editForm.notes : couple?.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Share any special details about your wedding..."
                  rows={4}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" onClick={handleEditToggle}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'timeline' && (
            <WeddingTimeline />
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {/* Gallery Header */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Wedding Gallery</h3>
                    <p className="text-gray-600 mt-1">
                      Your photos and videos from vendors
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      icon={Download}
                      onClick={downloadAllFiles}
                      disabled={files.length === 0 || downloadingAll}
                      loading={downloadingAll}
                    >
                      Download All
                    </Button>
                    <Button
                      variant="outline"
                      icon={Share2}
                    >
                      Share Gallery
                    </Button>
                  </div>
                </div>

                {/* Storage Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{files.length}</div>
                    <div className="text-blue-800 text-sm">Total Files</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-600">{photoFiles.length}</div>
                    <div className="text-emerald-800 text-sm">Photos</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{videoFiles.length}</div>
                    <div className="text-purple-800 text-sm">Videos</div>
                  </div>
                </div>

                {/* Access Status */}
                {isAccessExpired() ? (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">Gallery Access Expired</h4>
                        <p className="text-red-700 text-sm">
                          Subscribe to continue accessing your wedding photos and videos
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        Subscribe Now
                      </Button>
                    </div>
                  </div>
                ) : subscription?.payment_status !== 'active' && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-amber-900">Free Access Ending Soon</h4>
                        <p className="text-amber-700 text-sm">
                          {getDaysUntilExpiry()} days left to access your gallery
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        Secure Access
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Gallery Content */}
              {galleryLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your gallery...</p>
                </div>
              ) : !currentFolder && folders.length === 0 ? (
                <Card className="p-12 text-center">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No files yet</h3>
                  <p className="text-gray-600 mb-6">
                    Your vendors will upload photos and videos here after your events
                  </p>
                </Card>
              ) : !currentFolder ? (
                /* Folder View */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Browse by Folder</h4>
                    <p className="text-gray-600">{folders.length} folder{folders.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {folders.map((folder) => (
                      <div
                        key={folder.path}
                        onClick={() => setCurrentFolder(folder.path)}
                        className="cursor-pointer"
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
                          {folder.previewImage ? (
                            <img
                              src={folder.previewImage}
                              alt={folder.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Folder</p>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            {folder.fileCount} files
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900 truncate mb-2">{folder.name}</h4>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <span>{formatFileSize(folder.totalSize)}</span>
                            <span>{new Date(folder.lastModified).toLocaleDateString()}</span>
                          </div>
                          {folder.vendor && (
                            <div className="flex items-center space-x-2">
                              {folder.vendor.profile_photo ? (
                                <img
                                  src={folder.vendor.profile_photo}
                                  alt={folder.vendor.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Camera className="w-3 h-3 text-gray-400" />
                                </div>
                              )}
                              <p className="text-xs text-gray-500 truncate">
                                By {folder.vendor.name}
                              </p>
                            </div>
                          )}
                        </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ) : currentFolderFiles.length === 0 ? (
                <Card className="p-12 text-center">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No files in this folder</h3>
                  <p className="text-gray-600 mb-6">
                    This folder appears to be empty or files are still being uploaded.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentFolder(null)}
                  >
                    Back to Folders
                  </Button>
                </Card>
              ) : (
                /* File View for Current Folder */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentFolderFiles.map((file) => (
                    <Card key={file.id} className="overflow-hidden">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        {file.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={file.public_url}
                            alt={file.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Video File</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 truncate">{file.file_name}</h4>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                        </div>
                        {file.vendors && (
                          <p className="text-xs text-gray-500 mt-1">
                            By {file.vendors.name}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => downloadFile(file)}
                          icon={Download}
                        >
                          Download
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Wedding Preferences</h3>
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Style Preferences</h4>
                  <p className="text-gray-600 mb-4">
                    Select the photography and videography styles you love
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {['Classic', 'Modern', 'Vintage', 'Artistic', 'Candid', 'Editorial', 'Fine Art', 'Documentary'].map((style) => (
                      <label key={style} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="text-rose-500 focus:ring-rose-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{style}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Vibe Preferences</h4>
                  <p className="text-gray-600 mb-4">
                    Choose the vibes that match your wedding vision
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {['Romantic', 'Fun', 'Elegant', 'Rustic', 'Boho', 'Modern', 'Traditional', 'Intimate'].map((vibe) => (
                      <label key={vibe} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="text-rose-500 focus:ring-rose-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{vibe}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Language Preferences</h4>
                  <p className="text-gray-600 mb-4">
                    Select languages you'd like your vendors to speak
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {['English', 'Spanish', 'French', 'Italian', 'Portuguese', 'German', 'Mandarin', 'Japanese'].map((language) => (
                      <label key={language} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="text-rose-500 focus:ring-rose-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="primary">
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive updates about your bookings and timeline</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                      <p className="text-sm text-gray-600">Get text updates for urgent matters</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Reminder Notifications</h4>
                      <p className="text-sm text-gray-600">Get reminders about upcoming events and deadlines</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                      <p className="text-sm text-gray-600">Allow vendors to see your profile information</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Marketing Communications</h4>
                      <p className="text-sm text-gray-600">Receive wedding tips and special offers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h3>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                    <Shield className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          // Refresh gallery data
          window.location.reload();
        }}
        planId="Couple_Capsule"
        planName="Wedding Gallery"
        amount={499}
      />
    </div>
  );
};