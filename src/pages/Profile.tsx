import React, { useState } from 'react';
import { User, Heart, Calendar, Camera, Settings, Bell, Shield, CreditCard, Download, Share2, Music } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useCouple } from '../hooks/useCouple';
import { useWeddingGallery } from '../hooks/useWeddingGallery';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { StripePaymentModal } from '../components/payment/StripePaymentModal';
import { WeddingTimeline } from '../components/profile/WeddingTimeline';
import { AuthModal } from '../components/auth/AuthModal';

export const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { couple, loading: coupleLoading, updateCouple } = useCouple();
  const { 
    files, 
    photoFiles, 
    videoFiles, 
    subscription, 
    loading: galleryLoading, 
    downloadingAll,
    downloadFile, 
    downloadAllFiles, 
    isAccessExpired, 
    getDaysUntilExpiry,
    formatFileSize 
  } = useWeddingGallery();
  const { uploadPhoto, uploading: photoUploading } = usePhotoUpload();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline' | 'gallery' | 'settings'>('profile');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    partner1_name: '',
    partner2_name: '',
    email: '',
    phone: '',
    wedding_date: '',
    venue_name: '',
    guest_count: 0,
    ceremony_time: '',
    reception_time: '',
    notes: ''
  });

  // Initialize form data when couple data loads
  React.useEffect(() => {
    if (couple) {
      setProfileForm({
        name: couple.name || '',
        partner1_name: couple.partner1_name || '',
        partner2_name: couple.partner2_name || '',
        email: couple.email || '',
        phone: couple.phone || '',
        wedding_date: couple.wedding_date || '',
        venue_name: couple.venue_name || '',
        guest_count: couple.guest_count || 0,
        ceremony_time: couple.ceremony_time || '',
        reception_time: couple.reception_time || '',
        notes: couple.notes || ''
      });
    }
  }, [couple]);

  // Get active tab from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['profile', 'timeline', 'gallery', 'settings'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, []);

  const handleProfileUpdate = async () => {
    if (!couple) return;

    try {
      await updateCouple(profileForm);
      setEditingProfile(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const photoUrl = await uploadPhoto(file, user.id);
      if (photoUrl && couple) {
        await updateCouple({ profile_photo: photoUrl });
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-12 text-center max-w-md">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In to View Profile</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to your account to view and manage your wedding profile.
            </p>
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
            </Button>
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

  const tabs = [
    { key: 'profile', label: 'Profile Information', icon: User },
    { key: 'timeline', label: 'Wedding Timeline', icon: Calendar },
    { key: 'gallery', label: 'Wedding Gallery', icon: Camera },
    { key: 'settings', label: 'Account Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {couple?.profile_photo ? (
              <img
                src={couple.profile_photo}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <Heart className="w-8 h-8 text-rose-600" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {couple?.name || 'Your Wedding Profile'}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your wedding details and timeline
              </p>
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
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex items-center space-x-2
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
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Information */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                <Button
                  variant={editingProfile ? "primary" : "outline"}
                  icon={editingProfile ? Save : Edit2}
                  onClick={() => editingProfile ? handleProfileUpdate() : setEditingProfile(true)}
                >
                  {editingProfile ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </div>

              {coupleLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading profile...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Couple Name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Sarah & Michael"
                      disabled={!editingProfile}
                    />
                    <Input
                      label="Partner 1 Name"
                      value={profileForm.partner1_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, partner1_name: e.target.value }))}
                      placeholder="Sarah Johnson"
                      disabled={!editingProfile}
                    />
                    <Input
                      label="Partner 2 Name"
                      value={profileForm.partner2_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, partner2_name: e.target.value }))}
                      placeholder="Michael Davis"
                      disabled={!editingProfile}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      disabled={!editingProfile}
                      icon={User}
                    />
                    <Input
                      label="Phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      disabled={!editingProfile}
                    />
                    <Input
                      label="Wedding Date"
                      type="date"
                      value={profileForm.wedding_date}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, wedding_date: e.target.value }))}
                      disabled={!editingProfile}
                      icon={Calendar}
                    />
                    <Input
                      label="Venue Name"
                      value={profileForm.venue_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, venue_name: e.target.value }))}
                      placeholder="Sunset Gardens"
                      disabled={!editingProfile}
                    />
                    <Input
                      label="Guest Count"
                      type="number"
                      value={profileForm.guest_count.toString()}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, guest_count: parseInt(e.target.value) || 0 }))}
                      placeholder="120"
                      disabled={!editingProfile}
                    />
                    <Input
                      label="Ceremony Time"
                      type="time"
                      value={profileForm.ceremony_time}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, ceremony_time: e.target.value }))}
                      disabled={!editingProfile}
                    />
                    <Input
                      label="Reception Time"
                      type="time"
                      value={profileForm.reception_time}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, reception_time: e.target.value }))}
                      disabled={!editingProfile}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wedding Notes
                    </label>
                    <textarea
                      value={profileForm.notes}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-gray-50"
                      placeholder="Share any special details about your wedding..."
                      disabled={!editingProfile}
                    />
                  </div>

                  {editingProfile && (
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                      <Button variant="outline" onClick={() => setEditingProfile(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={handleProfileUpdate}>
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'timeline' && <WeddingTimeline />}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Gallery Header */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Wedding Gallery</h2>
                  <p className="text-gray-600 mt-1">Your wedding photos and videos from vendors</p>
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
                  <Button variant="outline" icon={Share2}>
                    Share Gallery
                  </Button>
                </div>
              </div>

              {/* Subscription Status */}
              {subscription && (
                <div className={`p-4 rounded-lg border ${
                  isAccessExpired() 
                    ? 'bg-red-50 border-red-200' 
                    : getDaysUntilExpiry() <= 7
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-medium ${
                        isAccessExpired() ? 'text-red-900' : 
                        getDaysUntilExpiry() <= 7 ? 'text-yellow-900' : 'text-green-900'
                      }`}>
                        Gallery Access Status
                      </h3>
                      <p className={`text-sm ${
                        isAccessExpired() ? 'text-red-700' : 
                        getDaysUntilExpiry() <= 7 ? 'text-yellow-700' : 'text-green-700'
                      }`}>
                        {isAccessExpired() 
                          ? 'Your free access has expired. Subscribe to continue accessing your photos and videos.'
                          : getDaysUntilExpiry() <= 7
                            ? `Your free access expires in ${getDaysUntilExpiry()} days.`
                            : subscription.payment_status === 'active' 
                              ? 'You have unlimited access to your wedding gallery.'
                              : `${getDaysUntilExpiry()} days remaining in your free access period.`
                        }
                      </p>
                    </div>
                    {(isAccessExpired() || getDaysUntilExpiry() <= 7) && subscription.payment_status !== 'active' && (
                      <Button
                        variant="primary"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        Subscribe Now
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Gallery Content */}
            {galleryLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your wedding gallery...</p>
              </div>
            ) : files.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos or videos yet</h3>
                <p className="text-gray-600 mb-6">
                  Your vendors will upload photos and videos here after your wedding day.
                </p>
                <Button variant="primary" onClick={() => setActiveTab('timeline')}>
                  Set Up Your Timeline
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Gallery Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-rose-500 mb-2">{files.length}</div>
                    <div className="text-gray-600">Total Files</div>
                  </Card>
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-2">{photoFiles.length}</div>
                    <div className="text-gray-600">Photos</div>
                  </Card>
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-purple-500 mb-2">{videoFiles.length}</div>
                    <div className="text-gray-600">Videos</div>
                  </Card>
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-emerald-500 mb-2">
                      {formatFileSize(files.reduce((sum, file) => sum + file.file_size, 0))}
                    </div>
                    <div className="text-gray-600">Total Size</div>
                  </Card>
                </div>

                {/* Files Grid */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Wedding Files</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {files.map((file) => (
                      <div key={file.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 truncate">{file.file_name}</h4>
                            <p className="text-sm text-gray-600">
                              Uploaded by {file.vendors?.name || 'Vendor'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.file_size)} • {new Date(file.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Download}
                            onClick={() => downloadFile(file)}
                          >
                            Download
                          </Button>
                        </div>
                        
                        {file.file_path && (
                          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={file.file_path}
                              alt={file.file_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Account Settings */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive updates about your bookings and timeline</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Privacy Settings</h3>
                      <p className="text-sm text-gray-600">Control who can see your wedding information</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Payment Methods</h3>
                      <p className="text-sm text-gray-600">Manage your saved payment methods</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-red-200">
              <h2 className="text-xl font-semibold text-red-900 mb-6">Danger Zone</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <h3 className="font-medium text-red-900">Delete Account</h3>
                    <p className="text-sm text-red-700">Permanently delete your account and all associated data</p>
                  </div>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
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
      />
    </div>
  );
};