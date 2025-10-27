import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { useNavigate, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { Camera, Star, Image, Share2, Menu, X, Sparkles, Clock, Music, Loader2, User, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import InquiryModal from '../components/InquiryModal';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Create ThemeContext for vendor theme preferences
const ThemeContext = createContext();

const ThemeProvider = ({ children, websiteData }) => {
  const [theme, setTheme] = useState({
    layout: 'modern',
    font_family: 'Inter',
    primary_color: '#ef4444', // Default rose
  });

  useEffect(() => {
    if (websiteData?.theme_preferences) {
      setTheme(websiteData.theme_preferences);
    }
  }, [websiteData?.theme_preferences]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${theme.font_family.replace(' ', '+')}:wght@400;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    document.documentElement.style.setProperty('--primary-color', theme.primary_color);
    document.documentElement.style.setProperty('--font-family', theme.font_family);
    document.documentElement.style.setProperty('--primary-light', `${theme.primary_color}1A`); // Light variant for backgrounds
  }, [theme]);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
};

const useTheme = () => useContext(ThemeContext);

// Custom video player component
const CustomVideoPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play().catch(() => setError(true));
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className='relative aspect-video rounded-lg overflow-hidden'>
      {error ? (
        <img src={poster || 'https://via.placeholder.com/150'} alt='Video unavailable' className='w-full h-full object-cover' loading='lazy' />
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            className='w-full h-full object-cover'
            controls={false}
            onClick={togglePlay}
            onError={() => setError(true)}
          />
          <button
            onClick={togglePlay}
            className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg hover:bg-opacity-20 transition-opacity'
          >
            <span className='text-white text-4xl'>{isPlaying ? '❚❚' : '▶'}</span>
          </button>
        </>
      )}
    </div>
  );
};

// Media modal component for gallery items
const MediaModal = ({ isOpen, onClose, media }) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  console.log('MediaModal opened with:', media);

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]'>
      <div className='bg-white rounded-lg p-6 max-w-4xl w-full'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-xl font-semibold text-gray-900'>{media.type === 'image' ? 'View Image' : 'View Video'}</h3>
          <button onClick={onClose} className='text-gray-900' style={{ ':hover': { color: 'var(--primary-color)' } }}>
            <X className='w-6 h-6' />
          </button>
        </div>
        {media.type === 'image' ? (
          <img src={media.url} alt='Gallery item' className='w-full h-auto max-h-[70vh] object-contain rounded-lg' loading='lazy' />
        ) : (
          <CustomVideoPlayer src={media.url} poster={media.poster} />
        )}
      </div>
    </div>
  );
};

// Service areas modal component
const ServiceAreasModal = ({ isOpen, onClose, serviceAreas }) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-xl font-semibold text-gray-900'>Our Service Areas</h3>
          <button onClick={onClose} className='text-gray-900' style={{ ':hover': { color: 'var(--primary-color)' } }}>
            <X className='w-6 h-6' />
          </button>
        </div>
        <div className='flex flex-wrap gap-4'>
          {serviceAreas && serviceAreas.map((area, index) => (
            <span
              key={index}
              className='px-4 py-2 rounded-full text-sm font-medium'
              style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}
            >
              {area.region}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Package details modal component
const PackageDetailsModal = ({ isOpen, onClose, pkg }) => {
  const { theme } = useTheme();
  if (!isOpen || !pkg) return null;

  console.log('PackageDetailsModal opened with:', pkg);

  const formatPrice = (amount) => {
    if (amount === 0) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount / 100);
  };

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]'>
      <div className='bg-white rounded-lg p-6 max-w-2xl w-full'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-xl font-semibold text-gray-900'>{pkg.name || 'Unnamed Package'}</h3>
          <button onClick={onClose} className='text-gray-900' style={{ ':hover': { color: 'var(--primary-color)' } }}>
            <X className='w-6 h-6' />
          </button>
        </div>
        {pkg.primary_image ? (
          <img
            src={pkg.primary_image}
            alt={`${pkg.name} primary image`}
            className='w-full h-64 object-cover rounded-lg mb-4'
            loading='lazy'
          />
        ) : (
          <div className='w-full h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center'>
            <p className='text-gray-500'>No primary image available</p>
          </div>
        )}
        <p className='text-gray-600 mb-4'>{pkg.description || 'No description provided'}</p>
        <div className='mb-4'>
          <h4 className='text-lg font-semibold text-gray-900'>Price</h4>
          <p className='text-2xl' style={{ color: 'var(--primary-color)' }}>{formatPrice(pkg.price || 0)}</p>
        </div>
        {pkg.features?.length > 0 ? (
          <div className='mb-4'>
            <h4 className='text-lg font-semibold text-gray-900'>What’s Included</h4>
            <ul className='list-disc list-inside text-gray-600'>
              {pkg.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className='mb-4'>
            <h4 className='text-lg font-semibold text-gray-900'>What’s Included</h4>
            <p className='text-gray-600'>No features listed</p>
          </div>
        )}
        {pkg.coverage ? (
          <div className='mb-4'>
            <h4 className='text-lg font-semibold text-gray-900'>Coverage</h4>
            <p className='text-gray-600'>{pkg.coverage}</p>
          </div>
        ) : (
          <div className='mb-4'>
            <h4 className='text-lg font-semibold text-gray-900'>Coverage</h4>
            <p className='text-gray-600'>No coverage details provided</p>
          </div>
        )}
        {pkg.gallery_images?.length > 0 ? (
          <div className='mb-4'>
            <h4 className='text-lg font-semibold text-gray-900'>Gallery</h4>
            <div className='grid grid-cols-2 gap-4'>
              {pkg.gallery_images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  className='w-full h-32 object-cover rounded-lg'
                  loading='lazy'
                />
              ))}
            </div>
          </div>
        ) : (
          <div className='mb-4'>
            <h4 className='text-lg font-semibold text-gray-900'>Gallery</h4>
            <p className='text-gray-600'>No gallery images available</p>
          </div>
        )}
        <div className='flex gap-4'>
          <Button
            variant='primary'
            className='w-full py-3'
            style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
            onClick={() => onClose()}
          >
            Close
          </Button>
          {/* TODO: Add to Cart button to be implemented later */}
        </div>
      </div>
    </div>
  );
};

// Team member page component
const TeamMemberPage = ({ vendor }) => {
  const { memberSlug } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState({ url: '', type: '' });

  const member = vendor.team_members.find((m) => m.slug === memberSlug);

  if (!member) {
    return <div className='text-center py-12' style={{ color: 'var(--primary-color)' }}>Team member not found</div>;
  }

  const handleMediaClick = (e, url, type) => {
    e.stopPropagation();
    console.log('TeamMemberPage media clicked:', { url, type, poster: member.photo_gallery?.[0] });
    setSelectedMedia({ url, type, poster: member.photo_gallery?.[0] });
    setShowMediaModal(true);
  };

  return (
    <div className={`min-h-screen bg-white text-gray-900 font-sans layout-${theme.layout}`} style={{ fontFamily: theme.font_family }}>
      <header className='fixed top-0 left-0 right-0 bg-white shadow-lg z-50 py-4 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <img src={member.profile_photo || 'https://via.placeholder.com/150'} alt={member.full_name} className='w-12 h-12 rounded-full object-cover' loading='lazy' />
            <h1 className='text-2xl font-bold text-gray-900'>{member.full_name}</h1>
          </div>
          <Button
            variant='outline'
            style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)', backgroundColor: '#fff' }}
            onClick={() => navigate(`/v/${vendor.slug}`)}
          >
            Back to Vendor
          </Button>
        </div>
      </header>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12'>
        <section className='py-12 text-center' style={{ background: `linear-gradient(to bottom, var(--primary-light), #fff)` }}>
          <img src={member.profile_photo || 'https://via.placeholder.com/150'} alt={member.full_name} className='w-64 h-64 rounded-full mx-auto mb-4 object-cover shadow-lg' loading='lazy' />
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>{member.full_name}</h1>
          <Button
            variant='outline'
            className='px-6 py-3 text-lg'
            style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)', backgroundColor: '#fff' }}
            onClick={() => navigate(`/v/${vendor.slug}`)}
          >
            Back to Vendor
          </Button>
        </section>
        <section className='py-12'>
          <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>About {member.full_name}</h2>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>{member.bio}</p>
        </section>
        {member.photo_gallery?.length > 0 && (
          <section className='py-12'>
            <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>Photo Gallery</h2>
            <p className='text-xl text-gray-600 text-center mb-12'>Explore {member.full_name}'s photography work</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
              {member.photo_gallery.map((photo, index) => (
                <Card key={index} className='overflow-hidden hover:scale-105 transition-transform cursor-pointer' onClick={(e) => handleMediaClick(e, photo, 'image')}>
                  <img src={photo} alt={`Portfolio ${index + 1}`} className='w-full h-64 object-cover' loading='lazy' />
                </Card>
              ))}
            </div>
          </section>
        )}
        {member.video_gallery?.length > 0 && (
          <section className='py-12'>
            <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>Video Gallery</h2>
            <p className='text-xl text-gray-600 text-center mb-12'>Watch {member.full_name}'s video highlights</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
              {member.video_gallery.map((video, index) => (
                <Card key={`video-${index}`} className='overflow-hidden cursor-pointer' onClick={(e) => handleMediaClick(e, video, 'video')}>
                  <CustomVideoPlayer src={video} poster={member.photo_gallery?.[0]} />
                </Card>
              ))}
            </div>
          </section>
        )}
        {member.soundcloud_url && (
          <section className='py-12'>
            <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>Listen on SoundCloud</h2>
            <p className='text-xl text-gray-600 text-center mb-12'>Hear {member.full_name}'s music and mixes</p>
            <div className='max-w-2xl mx-auto'>
              <Card className='overflow-hidden'>
                <iframe width='100%' height='166' scrolling='no' frameBorder='no' allow='autoplay' src={member.soundcloud_url}></iframe>
                <div className='p-4'>
                  <a href={member.soundcloud_url} target='_blank' rel='noopener noreferrer' className='text-sm mt-2 inline-block' style={{ color: 'var(--primary-color)', ':hover': { textDecoration: 'underline' } }}>
                    View on SoundCloud
                  </a>
                </div>
              </Card>
            </div>
          </section>
        )}
        <MediaModal
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
          media={selectedMedia}
        />
      </main>
      <footer className='py-12 px-4 sm:px-6 lg:px-8 bg-white text-center'>
        <p className='text-gray-600'>
          Powered by{' '}
          <a href='https://bremembered.io' className='font-medium' style={{ color: 'var(--primary-color)', ':hover': { textDecoration: 'underline' } }}>
            B. Remembered
          </a>
        </p>
      </footer>
    </div>
  );
};

// Main content component to use theme
const MainContent = ({ vendor, websiteData, stats, reviews, servicePackages, teamMembers, showIntroVideo, setShowIntroVideo, showMediaModal, setShowMediaModal, selectedMedia, setSelectedMedia, showAuthModal, setShowAuthModal, showInquiryModal, setShowInquiryModal, showServiceAreasModal, setShowServiceAreasModal, inquiryForm, setInquiryForm, isMobileMenuOpen, setIsMobileMenuOpen, isAuthenticated, signOut, cartState, toggleCart }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Check out ${vendor?.name}`, url: shareUrl }).catch((err) => console.error('Share failed:', err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleMediaClick = (e, url, type) => {
    e.stopPropagation();
    console.log('Gallery media clicked:', { url, type, poster: vendor?.portfolio_photos?.[0], showMediaModal });
    setSelectedMedia({ url, type, poster: vendor?.portfolio_photos?.[0] || 'https://via.placeholder.com/150' });
    setShowMediaModal(true);
    console.log('Set showMediaModal to true, selectedMedia:', { url, type, poster: vendor?.portfolio_photos?.[0] });
  };

  const handlePackageClick = (pkg) => {
    console.log('Package clicked:', pkg);
    setSelectedPackage(pkg);
    setShowPackageModal(true);
  };

  const handleLogin = () => {
    setShowAuthModal({ isOpen: true, initialMode: 'login' });
  };

  const handleSignup = () => {
    setShowAuthModal({ isOpen: true, initialMode: 'signup' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatPrice = (amount) => {
    if (amount === 0) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount / 100);
  };

  const renderStars = (rating) => (
    <div className='flex'>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={`min-h-screen bg-white text-gray-900 font-sans layout-${websiteData?.theme_preferences?.layout || 'modern'}`} style={{ fontFamily: websiteData?.theme_preferences?.font_family || 'Inter' }}>
      <header className='fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-100 z-50 py-4 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <img src={websiteData?.logo_url} alt={`${vendor.name} logo`} className='w-12 h-12 rounded-full object-cover' loading='lazy' />
            <h1 className='text-2xl font-bold text-gray-900'>{vendor.name}</h1>
          </div>
          <div className='hidden md:flex items-center space-x-0 sm:space-x-0.5'>
            <nav className='flex gap-6'>
              {['Home', 'About', 'Gallery', 'Packages', 'Reviews'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className='text-base font-medium text-gray-700'
                  style={{ ':hover': { color: 'var(--primary-color)' } }}
                >
                  {item}
                </a>
              ))}
              {vendor.studio_subscription?.pro_studio && teamMembers?.length > 0 && (
                <a href='#team' className='text-base font-medium text-gray-700' style={{ ':hover': { color: 'var(--primary-color)' } }}>
                  Team
                </a>
              )}
            </nav>
            <button onClick={handleShare} className='text-gray-900 ml-4' style={{ ':hover': { color: 'var(--primary-color)' } }}>
              <Share2 className='w-5 h-5' />
            </button>
            {isAuthenticated ? (
              <>
                <div className='relative'>
                  <Button
                    variant='ghost'
                    icon={ShoppingCart}
                    size='sm'
                    onClick={toggleCart}
                    className='p-2 relative'
                    style={{ color: 'var(--primary-color)' }}
                    aria-label='Cart'
                  >
                    {cartState.items.length > 0 && (
                      <span className='absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-white text-xs rounded-full flex items-center justify-center' style={{ backgroundColor: 'var(--primary-color)' }}>
                        {cartState.items.length}
                      </span>
                    )}
                  </Button>
                </div>
                <div className='relative group'>
                  <Button
                    variant='ghost'
                    icon={User}
                    size='sm'
                    className='p-2'
                    style={{ color: 'var(--primary-color)' }}
                    onClick={() => navigate('/profile')}
                    aria-label='Profile'
                  >
                    <span className='text-xs sm:text-sm'>Profile</span>
                  </Button>
                  <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50'>
                    <div className='py-2'>
                      <button
                        onClick={() => navigate('/profile')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--primary-light)]'
                        style={{ ':hover': { color: 'var(--primary-color)' } }}
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => navigate('/cart')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--primary-light)]'
                        style={{ ':hover': { color: 'var(--primary-color)' } }}
                      >
                        My Cart ({cartState.items.length})
                      </button>
                      <button
                        onClick={() => navigate('/my-bookings')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--primary-light)]'
                        style={{ ':hover': { color: 'var(--primary-color)' } }}
                      >
                        My Bookings
                      </button>
                      <button
                        onClick={() => navigate('/profile?tab=messages')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--primary-light)]'
                        style={{ ':hover': { color: 'var(--primary-color)' } }}
                      >
                        Messages
                      </button>
                      <button
                        onClick={() => navigate('/profile?tab=gallery')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--primary-light)]'
                        style={{ ':hover': { color: 'var(--primary-color)' } }}
                      >
                        Wedding Gallery
                      </button>
                      <button
                        onClick={() => navigate('/profile?tab=payments')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--primary-light)]'
                        style={{ ':hover': { color: 'var(--primary-color)' } }}
                      >
                        Payments
                      </button>
                      <button
                        onClick={() => navigate('/profile?tab=wedding-board')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--primary-light)]'
                        style={{ ':hover': { color: 'var(--primary-color)' } }}
                      >
                        Wedding Board
                      </button>
                      <a
                        href='#'
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-[var(--primary-light)]'
                        style={{ ':hover': { color: 'var(--primary-color)' } }}
                      >
                        Help Center
                      </a>
                      <hr className='my-1' />
                      <button
                        onClick={handleSignOut}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--primary-light)]'
                        style={{ ':hover': { color: 'var(--primary-color)' } }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant='ghost'
                  onClick={handleLogin}
                  size='sm'
                  className='p-2 text-xs sm:text-sm'
                  style={{ color: 'var(--primary-color)' }}
                >
                  Log In
                </Button>
                <Button
                  variant='primary'
                  onClick={handleSignup}
                  size='sm'
                  className='p-2 text-xs sm:text-sm'
                  style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
                >
                  Sign Up
                </Button>
              </>
            )}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className='md:hidden text-gray-900'>
              {isMobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
            </button>
          </div>
          {isMobileMenuOpen && (
            <nav className='md:hidden bg-white shadow-lg py-4 px-4 mt-4 flex flex-col space-y-4'>
              {['Home', 'About', 'Gallery', 'Packages', 'Reviews', ...(vendor.studio_subscription?.pro_studio && teamMembers?.length > 0 ? ['Team'] : [])].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className='text-base font-medium text-gray-700'
                  style={{ ':hover': { color: 'var(--primary-color)' } }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                    className='block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-[var(--primary-light)]'
                    style={{ ':hover': { color: 'var(--primary-color)' } }}
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => { navigate('/cart'); setIsMobileMenuOpen(false); }}
                    className='block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-[var(--primary-light)]'
                    style={{ ':hover': { color: 'var(--primary-color)' } }}
                  >
                    My Cart ({cartState.items.length})
                  </button>
                  <button
                    onClick={() => { navigate('/my-bookings'); setIsMobileMenuOpen(false); }}
                    className='block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-[var(--primary-light)]'
                    style={{ ':hover': { color: 'var(--primary-color)' } }}
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={() => { navigate('/profile?tab=messages'); setIsMobileMenuOpen(false); }}
                    className='block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-[var(--primary-light)]'
                    style={{ ':hover': { color: 'var(--primary-color)' } }}
                  >
                    Messages
                  </button>
                  <button
                    onClick={() => { navigate('/profile?tab=gallery'); setIsMobileMenuOpen(false); }}
                    className='block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-[var(--primary-light)]'
                    style={{ ':hover': { color: 'var(--primary-color)' } }}
                  >
                    Wedding Gallery
                  </button>
                  <button
                    onClick={() => { navigate('/profile?tab=payments'); setIsMobileMenuOpen(false); }}
                    className='block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-[var(--primary-light)]'
                    style={{ ':hover': { color: 'var(--primary-color)' } }}
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => { navigate('/profile?tab=wedding-board'); setIsMobileMenuOpen(false); }}
                    className='block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-[var(--primary-light)]'
                    style={{ ':hover': { color: 'var(--primary-color)' } }}
                  >
                    Wedding Board
                  </button>
                  <a
                    href='#'
                    className='block px-4 py-3 text-base text-gray-700 hover:bg-[var(--primary-light)]'
                    style={{ ':hover': { color: 'var(--primary-color)' } }}
                  >
                    Help Center
                  </a>
                  <hr className='my-2' />
                  <button
                    onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                    className='block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-[var(--primary-light)]'
                    style={{ ':hover': { color: 'var(--primary-color)' } }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Button
                    variant='ghost'
                    onClick={() => { handleLogin(); setIsMobileMenuOpen(false); }}
                    size='sm'
                    className='text-base'
                    style={{ color: 'var(--primary-color)' }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant='primary'
                    onClick={() => { handleSignup(); setIsMobileMenuOpen(false); }}
                    size='sm'
                    className='text-base'
                    style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </nav>
          )}
        </div>
      </header>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12'>
        {/* Hero Section */}
        <section
          className='relative min-h-[600px] flex items-center justify-center text-center bg-cover bg-center overflow-hidden'
          style={{ backgroundImage: `url(${websiteData?.hero_image_url})` }}
        >
          <div className='absolute inset-0 bg-gradient-to-b from-black/60 to-black/20'></div>
          <div className='relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8'>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight'>
              {websiteData?.opening_text}
            </h1>
            <p className='text-lg sm:text-xl text-white/90 max-w-3xl mx-auto'>
              {vendor.name} • {vendor.service_types[0]} • {vendor.years_experience} Years of Excellence
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                variant='outline'
                className='px-8 py-4 text-lg'
                style={{ borderColor: '#fff', color: '#fff', backgroundColor: 'transparent' }}
                onClick={() => setShowInquiryModal(true)}
              >
                Inquire <Sparkles className='w-5 h-5 ml-2 inline' />
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center'>
            <div className='flex flex-col items-center'>
              <div className='w-14 h-14 rounded-full flex items-center justify-center mb-4' style={{ backgroundColor: 'var(--primary-light)' }}>
                <Star className='w-8 h-8' style={{ color: 'var(--primary-color)' }} />
              </div>
              <div className='text-3xl font-bold text-gray-900 mb-2'>{stats.averageRating.toFixed(1)}/5</div>
              <div className='text-base text-gray-600'>Average Rating</div>
            </div>
            <div className='flex flex-col items-center'>
              <div className='w-14 h-14 rounded-full flex items-center justify-center mb-4' style={{ backgroundColor: 'var(--primary-light)' }}>
                <Camera className='w-8 h-8' style={{ color: 'var(--primary-color)' }} />
              </div>
              <div className='text-3xl font-bold text-gray-900 mb-2'>{stats.eventsCompleted}+</div>
              <div className='text-base text-gray-600'>Events Completed</div>
            </div>
            <div className='flex flex-col items-center'>
              <div className='w-14 h-14 rounded-full flex items-center justify-center mb-4' style={{ backgroundColor: 'var(--primary-light)' }}>
                <Clock className='w-8 h-8' style={{ color: 'var(--primary-color)' }} />
              </div>
              <div className='text-3xl font-bold text-gray-900 mb-2'>{stats.responseTime}</div>
              <div className='text-base text-gray-600'>Response Time</div>
            </div>
          </div>
        </section>

        {/* Deal of the Week Section */}
        {websiteData?.special_offer && (
          <section className='py-16 px-4 sm:px-6 lg:px-8' style={{ background: `linear-gradient(to right, var(--primary-color), ${theme.primary_color}CC)` }}>
            <div className='max-w-7xl mx-auto text-center'>
              <div className='inline-flex items-center space-x-2 bg-white px-6 py-2 rounded-full mb-4' style={{ color: 'var(--primary-color)' }}>
                <Sparkles className='w-4 h-4' />
                <span className='font-bold'>Special Offer</span>
                <Sparkles className='w-4 h-4' />
              </div>
              <h2 className='text-3xl font-bold mb-4 text-white'>Special Offer</h2>
              <p className='text-xl mb-6 max-w-2xl mx-auto text-white'>{websiteData.offer_text}</p>
              <p className='text-lg mb-6 text-white'>Use promo code: <span className='font-bold'>{websiteData.promo_code}</span></p>
              <Button
                variant='outline'
                className='px-8 py-4 text-lg'
                style={{ borderColor: '#fff', color: '#fff', backgroundColor: 'transparent' }}
                onClick={() => setShowInquiryModal(true)}
              >
                Claim This Deal
              </Button>
            </div>
          </section>
        )}

        {/* About Section */}
        <section id='about' className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-7xl mx-auto'>
            <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>About {vendor.name}</h2>
            {vendor.profile_photo && (
              <img
                src={vendor.profile_photo}
                alt={`${vendor.name} profile`}
                className='w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg'
                loading='lazy'
              />
            )}
            <p className='text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto'>{vendor.profile}</p>
            {vendor.intro_video && (
              <div className='flex justify-center'>
                <Button
                  variant='primary'
                  className='px-6 py-3 text-lg'
                  style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
                  onClick={() => setShowIntroVideo(true)}
                >
                  Watch Our Intro Video
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Meet the Team Section */}
        {vendor.studio_subscription?.pro_studio && teamMembers?.length > 0 && (
          <section id='team' className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
            <div className='max-w-7xl mx-auto'>
              <h2 className='text-3xl font-bold text-center text-gray-900 mb-12'>Meet Our Team</h2>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                {teamMembers.slice(0, 3).map((member) => (
                  <Card key={member.id} className='text-center p-6'>
                    <img src={member.profile_photo || 'https://via.placeholder.com/150'} alt={member.full_name} className='w-32 h-32 rounded-full mx-auto mb-4 object-cover' loading='lazy' />
                    <h3 className='text-xl font-semibold mb-2'>{member.full_name}</h3>
                    <p className='text-gray-600 mb-4'>{member.bio}</p>
                    <Button
                      variant='outline'
                      style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)', backgroundColor: '#fff' }}
                      onClick={() => navigate(`/v/${vendor.slug}/team/${member.slug}`)}
                    >
                      View Profile
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        <section id='gallery' className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-7xl mx-auto'>
            <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>Our Gallery</h2>
            <p className='text-xl text-gray-600 text-center mb-12'>Explore our stunning photography and videography</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
              {vendor.portfolio_photos?.length > 0 ? vendor.portfolio_photos.map((photo, index) => (
                <Card key={index} className='overflow-hidden hover:scale-105 transition-transform cursor-pointer' onClick={(e) => handleMediaClick(e, photo, 'image')}>
                  <img src={photo} alt={`Portfolio ${index + 1}`} className='w-full h-64 object-cover' loading='lazy' />
                </Card>
              )) : (
                <p className='text-gray-600 text-center col-span-full'>No photos available</p>
              )}
              {vendor.portfolio_videos?.length > 0 ? vendor.portfolio_videos.map((video, index) => (
                <Card key={`video-${index}`} className='overflow-hidden cursor-pointer' onClick={(e) => handleMediaClick(e, video, 'video')}>
                  <CustomVideoPlayer src={video} poster={vendor.portfolio_photos?.[0] || 'https://via.placeholder.com/150'} />
                </Card>
              )) : (
                <p className='text-gray-600 text-center col-span-full'>No videos available</p>
              )}
            </div>
          </div>
        </section>

        {/* SoundCloud Section */}
        {(vendor.service_types.includes('DJ Services') || vendor.service_types.includes('Live Musician')) && websiteData?.soundcloud && (
          <section id='soundcloud' className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
            <div className='max-w-7xl mx-auto'>
              <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>Listen on SoundCloud</h2>
              <p className='text-xl text-gray-600 text-center mb-12'>Hear our music and mixes</p>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
                <Card className='overflow-hidden'>
                  <iframe
                    width='100%'
                    height='166'
                    scrolling='no'
                    frameBorder='no'
                    allow='autoplay'
                    src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/users/${websiteData.soundcloud}`}
                    className='w-full'
                  ></iframe>
                  <div className='p-4'>
                    <p className='text-sm text-gray-600 truncate'>{vendor.name}'s Mixes</p>
                    <a
                      href={`https://soundcloud.com/${websiteData.soundcloud}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm mt-2 inline-block'
                      style={{ color: 'var(--primary-color)', ':hover': { textDecoration: 'underline' } }}
                    >
                      View on SoundCloud
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Packages Section */}
        <section id='packages' className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-7xl mx-auto'>
            <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>Our Packages</h2>
            <p className='text-xl text-gray-600 text-center mb-12'>Choose the perfect package for your special day</p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {servicePackages.length > 0 ? servicePackages.map((pkg) => (
                <Card key={pkg.id} className='p-6 hover:scale-105 transition-transform cursor-pointer' onClick={() => handlePackageClick(pkg)}>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>{pkg.name}</h3>
                  <p className='text-gray-600 mb-4 text-sm'>{pkg.description}</p>
                  <div className='flex justify-between items-center mb-4'>
                    <span className='text-2xl font-bold' style={{ color: 'var(--primary-color)' }}>{formatPrice(pkg.price || 0)}</span>
                  </div>
                  <Button
                    variant='primary'
                    className='w-full py-3'
                    style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePackageClick(pkg);
                    }}
                  >
                    View Details
                  </Button>
                </Card>
              )) : (
                <p className='text-gray-600 text-center col-span-full'>No packages available</p>
              )}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id='reviews' className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-7xl mx-auto'>
            <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>What Our Couples Say</h2>
            <p className='text-xl text-gray-600 text-center mb-12'>Hear from those who trusted us with their special day</p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {reviews.length > 0 ? reviews.map((review) => (
                <Card key={review.id} className='p-6'>
                  <div className='flex items-center mb-4'>{renderStars(review.overall_rating)}</div>
                  <p className='text-gray-600 mb-4 italic'>"{review.feedback}"</p>
                  {review.vendor_response && (
                    <div className='mb-4 p-3 rounded-lg' style={{ backgroundColor: 'var(--primary-light)' }}>
                      <p className='text-sm' style={{ color: 'var(--primary-color)' }}>{review.vendor_response}</p>
                    </div>
                  )}
                  <div className='flex items-center'>
                    <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3'>
                      <span className='text-base font-medium text-gray-700'>{review.couples?.name?.[0] || 'A'}</span>
                    </div>
                    <div>
                      <h4 className='font-semibold text-gray-900'>{review.couples?.name || 'Happy Couple'}</h4>
                      {review.couples?.wedding_date && (
                        <p className='text-xs text-gray-400'>{formatDate(review.couples.wedding_date)}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )) : (
                <p className='text-gray-600 text-center col-span-full'>No reviews available</p>
              )}
            </div>
          </div>
        </section>

        {/* Instagram Section */}
        <section id='instagram' className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-7xl mx-auto'>
            <h2 className='text-3xl font-bold text-center text-gray-900 mb-4'>Follow Us on Instagram</h2>
            <p className='text-xl text-gray-600 text-center mb-12'>See our latest moments and inspiration</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
              {vendor.instagram && (
                <Card className='overflow-hidden hover:scale-105 transition-transform'>
                  <img src={vendor.portfolio_photos?.[0] || 'https://via.placeholder.com/150'} alt='Instagram post' className='w-full h-48 object-cover' loading='lazy' />
                  <div className='p-4'>
                    <p className='text-sm text-gray-600 truncate'>Latest from {vendor.instagram}</p>
                    <a
                      href={`https://instagram.com/${vendor.instagram}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm mt-2 inline-block'
                      style={{ color: 'var(--primary-color)', ':hover': { textDecoration: 'underline' } }}
                    >
                      View on Instagram
                    </a>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id='contact' className='py-16 px-4 sm:px-6 lg:px-8' style={{ background: `linear-gradient(to right, var(--primary-color), ${theme.primary_color}CC)` }}>
          <div className='max-w-7xl mx-auto text-center'>
            <h2 className='text-3xl font-bold mb-4 text-white'>Ready to Capture Your Special Day?</h2>
            <p className='text-xl mb-12 text-white'>Let’s make your wedding unforgettable with {vendor.name}</p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                variant='outline'
                className='px-8 py-4 text-lg'
                style={{ borderColor: '#fff', color: '#fff', backgroundColor: 'transparent' }}
                onClick={() => setShowInquiryModal(true)}
              >
                Inquire
              </Button>
              <Button
                variant='outline'
                className='px-8 py-4 text-lg'
                style={{ borderColor: '#fff', color: '#fff', backgroundColor: 'transparent' }}
                onClick={() => setShowServiceAreasModal(true)}
              >
                View Service Areas
              </Button>
            </div>
          </div>
        </section>

        {/* Modals */}
        <InquiryModal
          isOpen={showInquiryModal}
          onClose={() => setShowInquiryModal(false)}
          vendor={{ id: vendor.id, name: vendor.name }}
          servicePackages={servicePackages}
          inquiryForm={inquiryForm}
          setInquiryForm={setInquiryForm}
          onSubmit={({ coupleId, partner1Name }) => {
            console.log('Inquiry submitted:', { coupleId, partner1Name });
            navigate('/profile');
          }}
        />
        <ServiceAreasModal
          isOpen={showServiceAreasModal}
          onClose={() => setShowServiceAreasModal(false)}
          serviceAreas={vendor.service_areas}
        />
        <PackageDetailsModal
          isOpen={showPackageModal}
          onClose={() => setShowPackageModal(false)}
          pkg={selectedPackage}
        />
        {showIntroVideo && vendor.intro_video && (
          <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]'>
            <div className='bg-white rounded-lg p-6 max-w-4xl w-full'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-xl font-semibold text-gray-900'>Introduction Video</h3>
                <button onClick={() => setShowIntroVideo(false)} className='text-gray-900' style={{ ':hover': { color: 'var(--primary-color)' } }}>
                  <X className='w-6 h-6' />
                </button>
              </div>
              <CustomVideoPlayer src={vendor.intro_video} poster={vendor.portfolio_photos?.[0]} />
            </div>
          </div>
        )}
        {showAuthModal.isOpen && (
          <AuthModal
            isOpen={showAuthModal.isOpen}
            onClose={() => setShowAuthModal({ isOpen: false, initialMode: 'signup' })}
            initialMode={showAuthModal.initialMode}
          />
        )}
        <MediaModal
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
          media={selectedMedia}
        />
      </main>
      <footer className='py-12 px-4 sm:px-6 lg:px-8 bg-white text-center'>
        <p className='text-gray-600'>
          Powered by{' '}
          <a href='https://bremembered.io' className='font-medium' style={{ color: 'var(--primary-color)', ':hover': { textDecoration: 'underline' } }}>
            B. Remembered
          </a>
        </p>
      </footer>
    </div>
  );
};

// Main VendorWebsite component
const VendorWebsite = () => {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const location = useLocation();
  const { isAuthenticated, signOut, user } = useAuth();
  const { state: cartState, toggleCart } = useCart();
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState({ url: '', type: '', poster: '' });
  const [showAuthModal, setShowAuthModal] = useState({ isOpen: false, initialMode: 'signup' });
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showServiceAreasModal, setShowServiceAreasModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    partner1Name: '',
    partner2Name: '',
    email: '',
    phone: '',
    serviceType: '',
    packageId: '',
    message: '',
    weddingDate: '',
    termsAccepted: false,
    hoursNeeded: 8,
    coverageEvents: [],
    referral: 'Website',
    referralCoupleName: '',
    venueId: '',
    guestCount: ''
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [websiteData, setWebsiteData] = useState(null);
  const [stats, setStats] = useState({ eventsCompleted: 0, averageRating: 0, responseTime: 'Within 2 hours' });
  const [reviews, setReviews] = useState([]);
  const [servicePackages, setServicePackages] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch vendor, website data, stats, reviews, packages, team members
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch vendor data with studio subscription
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select(`
            id, slug, name, profile, profile_photo, years_experience, service_types, service_areas, portfolio_photos, portfolio_videos, intro_video,
            studio_subscriptions:studio_subscriptions(pro_studio)
          `)
          .eq('slug', vendorSlug)
          .single();

        if (vendorError || !vendorData) {
          throw new Error(vendorError?.message || 'Vendor not found');
        }

        // Fetch service areas
        const { data: serviceAreasData, error: serviceAreasError } = await supabase
          .from('vendor_service_areas')
          .select('region')
          .eq('vendor_id', vendorData.id)
          .order('region');

        if (serviceAreasError) {
          console.error('Error fetching service areas:', serviceAreasError.message, serviceAreasError.details, serviceAreasError.hint);
          throw new Error('Failed to fetch service areas');
        }

        // Fetch website data with theme_preferences and soundcloud
        const { data: websiteData, error: websiteError } = await supabase
          .from('vendor_website')
          .select('logo_url, hero_image_url, opening_text, special_offer, offer_text, discount_type, discount_amount, promo_code, theme_preferences, soundcloud')
          .eq('vendor_id', vendorData.id)
          .single();

        if (websiteError) {
          console.error('Error fetching website data:', websiteError.message, websiteError.details, websiteError.hint);
          throw new Error('Failed to fetch website data');
        }

        // Fetch service packages
        const { data: packagesData, error: packagesError } = await supabase
          .from('service_packages')
          .select('id, service_type, name, description, price, features, coverage, primary_image, gallery_images')
          .eq('vendor_id', vendorData.id)
          .is('couple_id', null);

        if (packagesError) {
          console.error('Error fetching service packages:', packagesError.message, packagesError.details, packagesError.hint);
          throw new Error('Failed to fetch service packages: ' + packagesError.message);
        }

        // Fetch team members
        const { data: teamData, error: teamError } = await supabase
          .from('team_members')
          .select('id, vendor_id, full_name, role, bio, profile_photo, photo_gallery, video_gallery, soundcloud_url')
          .eq('vendor_id', vendorData.id)
          .eq('website_displayed', true);

        if (teamError) {
          console.error('Error fetching team members:', teamError.message, teamError.details, teamError.hint);
          throw new Error('Failed to fetch team members');
        }

        // Fetch bookings count for events completed
        const { count: bookingsCount, error: bookingsError } = await supabase
          .from('bookings')
          .select('id', { count: 'exact' })
          .eq('vendor_id', vendorData.id);

        if (bookingsError) {
          console.error('Error fetching bookings count:', bookingsError.message, bookingsError.details, bookingsError.hint);
          throw new Error('Failed to fetch bookings count');
        }

        // Fetch reviews for average rating and reviews list
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('vendor_reviews')
          .select('id, overall_rating, feedback, vendor_response, couples(name, wedding_date)')
          .eq('vendor_id', vendorData.id);

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError.message, reviewsError.details, reviewsError.hint);
          throw new Error('Failed to fetch reviews data');
        }

        // Process vendor data
        const processedVendor = {
          ...vendorData,
          studio_subscription: vendorData.studio_subscriptions || { pro_studio: false },
          service_areas: serviceAreasData?.map((area) => ({
            region: area.region,
          })) || [],
          packages: packagesData || [],
          team_members: teamData?.map((member) => ({
            ...member,
            slug: member.full_name.toLowerCase().replace(/\s+/g, '-'),
          })) || [],
        };

        setVendor(processedVendor);
        setWebsiteData(websiteData || {
          logo_url: 'https://images.pexels.com/photos/123456/logo.jpeg?auto=compress&cs=tinysrgb&w=400',
          hero_image_url: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg',
          opening_text: 'Your Love Story, Captured with Passion',
          special_offer: false,
          offer_text: '',
          discount_type: null,
          discount_amount: 0,
          promo_code: '',
          theme_preferences: { layout: 'modern', font_family: 'Inter', primary_color: '#ef4444' },
          soundcloud: null,
        });
        setServicePackages(packagesData || []);
        setTeamMembers(teamData || []);
        setStats({
          eventsCompleted: bookingsCount || 0,
          averageRating: reviewsData?.length ? reviewsData.reduce((sum, r) => sum + r.overall_rating, 0) / reviewsData.length : 0,
          responseTime: 'Within 2 hours',
        });
        setReviews(reviewsData || []);

        console.log('Fetched vendor data:', processedVendor);
        console.log('Fetched website data:', websiteData);
        console.log('Fetched service packages:', packagesData);
        console.log('Fetched team members:', teamData);
        console.log('Fetched bookings count:', bookingsCount);
        console.log('Fetched reviews:', reviewsData);
      } catch (err) {
        console.error('[VendorWebsite] Error fetching data:', err);
        setError(err.message || 'Failed to load vendor data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vendorSlug]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-white'>
        <Loader2 className='h-12 w-12 animate-spin' style={{ color: 'var(--primary-color)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 bg-white'>
        <div className='border rounded-lg p-2 text-center max-w-md mx-auto' style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary-color)' }}>
          <p className='font-medium text-base' style={{ color: 'var(--primary-color)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className='p-4 bg-white'>
        <div className='border rounded-lg p-2 text-center max-w-md mx-auto' style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary-color)' }}>
          <p className='font-medium text-base' style={{ color: 'var(--primary-color)' }}>Vendor not found</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider websiteData={websiteData}>
      <Routes>
        <Route path='/' element={
          <MainContent
            vendor={vendor}
            websiteData={websiteData}
            stats={stats}
            reviews={reviews}
            servicePackages={servicePackages}
            teamMembers={teamMembers}
            showIntroVideo={showIntroVideo}
            setShowIntroVideo={setShowIntroVideo}
            showMediaModal={showMediaModal}
            setShowMediaModal={setShowMediaModal}
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
            showAuthModal={showAuthModal}
            setShowAuthModal={setShowAuthModal}
            showInquiryModal={showInquiryModal}
            setShowInquiryModal={setShowInquiryModal}
            showServiceAreasModal={showServiceAreasModal}
            setShowServiceAreasModal={setShowServiceAreasModal}
            inquiryForm={inquiryForm}
            setInquiryForm={setInquiryForm}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            isAuthenticated={isAuthenticated}
            signOut={signOut}
            cartState={cartState}
            toggleCart={toggleCart}
          />
        } />
        <Route path='team/:memberSlug' element={<TeamMemberPage vendor={vendor} />} />
      </Routes>
    </ThemeProvider>
  );
};

export default VendorWebsite;