import React, { useState } from 'react';
import { Heart, Menu, User, Calendar, Search, Bell, ShoppingCart, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AuthModal } from '../../components/auth/AuthModal';
import { NotificationBell } from '../notifications/NotificationBell';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signOut, user } = useAuth();
  const { state: cartState, toggleCart } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showBanner, setShowBanner] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {showBanner && (
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-center py-2 px-3 sm:px-4 flex justify-between items-center">
          <div className="flex-1 text-xs sm:text-sm md:text-base font-bold overflow-hidden text-ellipsis">
            🎉 Use Promo Code <span className="underline">WELCOME10</span> for 10% OFF! 🥳
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-2 text-white hover:text-gray-200"
            aria-label="Close banner"
          >
            <X size={18} />
          </button>
        </div>
      )}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo with original size on desktop, shrinking on mobile */}
            <div
              className="flex items-center cursor-pointer min-w-0"
              onClick={() => navigate('/')}
            >
              <img
                src="https://eecbrvehrhrvdzuutliq.supabase.co/storage/v1/object/public/public-1//2025_IO.png"
                alt="B. Remembered"
                className="h-7 md:h-8 w-auto max-h-8 max-w-[120px] md:max-w-none md:max-h-none object-contain"
                width={160}
                height={42}
              />
            </div>

            {/* Desktop Navigation with original font size */}
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => navigate('/search')}
                className={`transition-colors text-sm md:text-base ${
                  isActive('/search')
                    ? 'text-rose-600 font-medium'
                    : 'text-gray-700 hover:text-rose-600'
                }`}
              >
                Browse Vendors
              </button>
              <button
                onClick={() => navigate('/inspiration')}
                className={`transition-colors text-sm md:text-base ${
                  isActive('/inspiration')
                    ? 'text-rose-600 font-medium'
                    : 'text-gray-700 hover:text-rose-600'
                }`}
              >
                Inspiration
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                className={`transition-colors text-sm md:text-base ${
                  isActive('/how-it-works')
                    ? 'text-rose-600 font-medium'
                    : 'text-gray-700 hover:text-rose-600'
                }`}
              >
                How it Works
              </button>
              <button
                onClick={() => navigate('/support')}
                className={`transition-colors text-sm md:text-base ${
                  isActive('/support')
                    ? 'text-rose-600 font-medium'
                    : 'text-gray-700 hover:text-rose-600'
                }`}
              >
                Support
              </button>
            </nav>

            {/* Right side actions with reduced spacing */}
            <div className="flex items-center space-x-0 sm:space-x-0.5">
              <NotificationBell />
              <Button
                variant="ghost"
                icon={Search}
                size="sm"
                className="md:hidden p-2"
                onClick={() => navigate('/search')}
                aria-label="Search"
              />
              {isAuthenticated ? (
                <>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      icon={ShoppingCart}
                      size="sm"
                      onClick={toggleCart}
                      className="p-2 relative"
                      aria-label="Cart"
                    >
                      {cartState.items.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                          {cartState.items.length}
                        </span>
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    icon={Calendar}
                    size="sm"
                    onClick={() => navigate('/my-bookings')}
                    className={`p-2 ${isActive('/my-bookings') ? 'text-rose-600' : ''}`}
                    aria-label="My Bookings"
                  >
                    <span className="hidden sm:inline">My Bookings</span>
                  </Button>
                  <div className="relative group hidden md:block">
                    <Button
                      variant="ghost"
                      icon={User}
                      size="sm"
                      className="p-2"
                      aria-label="Profile"
                    >
                      <span className="hidden sm:inline">
                        {user?.user_metadata?.name?.split(' ')[0] || 'Profile'}
                      </span>
                    </Button>
                    {/* Desktop Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-2">
                        <button
                          onClick={() => navigate('/profile')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          My Profile
                        </button>
                        <button
                          onClick={() => navigate('/cart')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          My Cart ({cartState.items.length})
                        </button>
                        <button
                          onClick={() => navigate('/my-bookings')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          My Bookings
                        </button>
                        <button
                          onClick={() => navigate('/profile?tab=messages')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Messages
                        </button>
                        <button
                          onClick={() => navigate('/profile?tab=gallery')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Wedding Gallery
                        </button>
                        <button
                          onClick={() => navigate('/profile?tab=payments')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Payments
                        </button>
                        <button
                          onClick={() => navigate('/profile?tab=wedding-board')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Wedding Board
                        </button>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Help Center
                        </a>
                        <hr className="my-1" />
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      icon={ShoppingCart}
                      size="sm"
                      onClick={toggleCart}
                      className="p-2 relative"
                      aria-label="Cart"
                    >
                      {cartState.items.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                          {cartState.items.length}
                        </span>
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleLogin}
                    size="sm"
                    className="p-2 text-xs sm:text-sm"
                  >
                    Log In
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSignup}
                    size="sm"
                    className="p-2 text-xs sm:text-sm"
                  >
                    Sign Up
                  </Button>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  icon={Menu}
                  size="sm"
                  onClick={toggleMobileMenu}
                  className="p-2"
                  aria-label="Toggle menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="fixed inset-0 bg-white z-50 flex flex-col md:hidden"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <img
                src="https://eecbrvehrhrvdzuutliq.supabase.co/storage/v1/object/public/public-1//2025_IO.png"
                alt="B. Remembered"
                className="h-7 w-auto max-h-8 max-w-[120px] object-contain"
                width={160}
                height={42}
              />
              <Button
                variant="ghost"
                icon={X}
                size="sm"
                onClick={toggleMobileMenu}
                aria-label="Close menu"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={() => {
                  navigate('/search');
                  toggleMobileMenu();
                }}
                className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
              >
                Browse Services
              </button>
              <button
                onClick={() => {
                  navigate('/inspiration');
                  toggleMobileMenu();
                }}
                className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
              >
                Inspiration
              </button>
              <button
                onClick={() => {
                  navigate('/how-it-works');
                  toggleMobileMenu();
                }}
                className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
              >
                How it Works
              </button>
              <button
                onClick={() => {
                  navigate('/support');
                  toggleMobileMenu();
                }}
                className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
              >
                Support
              </button>
              {isAuthenticated && (
                <>
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      navigate('/profile');
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate('/cart');
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                  >
                    My Cart ({cartState.items.length})
                  </button>
                  <button
                    onClick={() => {
                      navigate('/my-bookings');
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={() => {
                      navigate('/profile?tab=messages');
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                  >
                    Messages
                  </button>
                  <button
                    onClick={() => {
                      navigate('/profile?tab=gallery');
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                  >
                    Wedding Gallery
                  </button>
                  <button
                    onClick={() => {
                      navigate('/profile?tab=payments');
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => {
                      navigate('/profile?tab=wedding-board');
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                  >
                    Wedding Board
                  </button>
                  <a
                    href="#"
                    className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                  >
                    Help Center
                  </a>
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      handleSignOut();
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
        }}
        initialMode={authMode}
      />
    </>
  );
};