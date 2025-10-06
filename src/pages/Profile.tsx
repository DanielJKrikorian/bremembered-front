import React, { Component, ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Calendar, Heart, Camera, Settings, MessageCircle, CreditCard, Star, FileText, Users, Globe, StickyNote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCouple } from '../hooks/useCouple';
import { supabase } from '../lib/supabase'; // For direct storage and table updates
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { WeddingTimeline } from '../components/profile/WeddingTimeline';
import { GuestManagement } from '../components/profile/GuestManagement';
import { WeddingWebsiteSettings } from '../components/profile/WeddingWebsiteSettings';
import { OverviewDashboard } from '../components/profile/OverviewDashboard';
import { PaymentsSection } from '../components/profile/PaymentsSection';
import { WeddingBoard } from '../components/profile/WeddingBoard';
import { ReviewsSection } from '../components/profile/ReviewsSection';
import { ContractsSection } from '../components/profile/ContractsSection';
import { MessagesSection } from '../components/profile/MessagesSection';
import { PreferencesSection } from '../components/profile/PreferencesSection';
import { SettingsSection } from '../components/profile/SettingsSection';
import { ProfileInformation } from '../components/profile/ProfileInformation';
import { WeddingGallery } from '../components/profile/WeddingGallery';
import { NotesSection } from '../components/profile/NotesSection';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h3 className="text-xl font-semibold text-red-600">Something went wrong</h3>
          <p className="text-gray-600 mt-2">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <p className="text-gray-600 mt-2">
            Please try refreshing the page or contact support.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'timeline' | 'guests' | 'gallery' | 'messages' | 'payments' | 'contracts' | 'preferences' | 'settings' | 'wedding-board' | 'reviews' | 'wedding-website' | 'notes'>('overview');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(couple?.profile_photo || null);

  // Get active tab from URL params
  useEffect(() => {
    console.log('Profile rendered, activeTab:', activeTab);
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'profile', 'timeline', 'guests', 'gallery', 'messages', 'payments', 'contracts', 'preferences', 'settings', 'wedding-board', 'reviews', 'wedding-website', 'notes'].includes(tab)) {
      setActiveTab(tab as any);
    } else {
      setActiveTab('overview');
    }
  }, [location]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !couple) return;

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload an image (JPEG, PNG, GIF).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setUploadError('File size exceeds 50MB limit.');
      return;
    }

    setUploadError(null);
    setUploading(true);
    setProgress(0);

    try {
      console.log('Uploading photo:', { fileName: file.name, fileType: file.type, fileSize: file.size, userId: user.id });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
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
      setProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('couple-photos')
        .getPublicUrl(filePath);

      // Update the couples table with the new profile_photo URL
      const { error: updateError } = await supabase
        .from('couples')
        .update({ profile_photo: publicUrl })
        .eq('id', couple.id);
      if (updateError) throw updateError;

      setPhotoUrl(publicUrl); // Update the displayed photo
      setUploading(false);
      setProgress(0);
    } catch (error) {
      console.error('Error uploading photo:', error);
      if ((error as Error).message.includes('Bucket not found')) {
        setUploadError('Upload failed: The "couple-photos" bucket does not exist. Please create it in your Supabase Dashboard under Storage.');
      } else if ((error as Error).message.includes('net::ERR_NETWORK_CHANGED') || (error as Error).message.includes('Failed to fetch')) {
        setUploadError('Upload failed due to a network issue. Please check your connection and try again.');
      } else {
        setUploadError('Failed to upload photo: ' + (error as Error).message);
      }
      setUploading(false);
      setProgress(0);
    }
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
    { key: 'overview', label: 'Overview', icon: Calendar },
    { key: 'wedding-website', label: 'Wedding Website (BETA)', icon: Globe },
    { key: 'notes', label: 'Wedding Notes', icon: StickyNote },
    { key: 'wedding-board', label: 'Wedding Board', icon: Heart },
    { key: 'timeline', label: 'Wedding Timeline', icon: Calendar },
    { key: 'guests', label: 'Guest Management', icon: Users },
    { key: 'gallery', label: 'Wedding Gallery', icon: Camera },
    { key: 'messages', label: 'Messages', icon: MessageCircle },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'contracts', label: 'Contracts', icon: FileText },
    { key: 'reviews', label: 'My Reviews', icon: Star },
    { key: 'preferences', label: 'Preferences', icon: Heart },
    { key: 'profile', label: 'Profile Information', icon: User },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : couple?.profile_photo ? (
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
                  disabled={uploading}
                />
              </label>
              {uploadError && (
                <p className="mt-2 text-sm text-red-600">{uploadError}</p>
              )}
              {uploading && (
                <p className="mt-2 text-sm text-blue-600">Uploading: {Math.round(progress)}%</p>
              )}
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
                  Wedding: {new Date(couple.wedding_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
                <p className="text-sm text-gray-600">Manage your wedding planning</p>
              </div>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all
                        ${activeTab === tab.key
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewDashboard onTabChange={handleTabChange} />}
            {activeTab === 'profile' && <ProfileInformation />}
            {activeTab === 'timeline' && <WeddingTimeline />}
            {activeTab === 'guests' && <GuestManagement />}
            {activeTab === 'wedding-board' && <WeddingBoard />}
            {activeTab === 'gallery' && (
              <ErrorBoundary>
                <WeddingGallery />
              </ErrorBoundary>
            )}
            {activeTab === 'messages' && <MessagesSection />}
            {activeTab === 'payments' && <PaymentsSection />}
            {activeTab === 'reviews' && <ReviewsSection />}
            {activeTab === 'contracts' && <ContractsSection />}
            {activeTab === 'preferences' && <PreferencesSection />}
            {activeTab === 'settings' && <SettingsSection />}
            {activeTab === 'wedding-website' && <WeddingWebsiteSettings />}
            {activeTab === 'notes' && <NotesSection />}
          </div>
        </div>
      </div>
    </div>
  );
};