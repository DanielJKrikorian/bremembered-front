import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/auth/AuthModal';
import { ProfileInfoTab } from '../components/profile/ProfileInfoTab';
import { WeddingGalleryTab } from '../components/profile/WeddingGalleryTab';

export const Profile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'gallery'>('profile');
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // Update URL when tab changes
  const handleTabChange = (tab: 'profile' | 'gallery') => {
    setActiveTab(tab);
    const newUrl = tab === 'gallery' ? '/profile?tab=gallery' : '/profile';
    navigate(newUrl, { replace: true });
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
        {activeTab === 'profile' && <ProfileInfoTab />}
        {activeTab === 'gallery' && <WeddingGalleryTab />}
      </div>
    </div>
  );
};