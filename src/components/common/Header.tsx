import React from 'react';
import { useState } from 'react';
import { Heart, Menu, User, Calendar, Search, Bell, ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AuthModal } from '../auth/AuthModal';
import { NotificationBell } from '../notifications/NotificationBell';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signOut, user } = useAuth();
  const { state: cartState, toggleCart } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

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
  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img 
                src="https://eecbrvehrhrvdzuutliq.supabase.co/storage/v1/object/public/public-1//2025_IO.png" 
                alt="B. Remembered" 
                className="h-8 w-auto"
              />
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => navigate('/search')}
                className={`transition-colors ${
                  isActive('/search') 
                    ? 'text-rose-600 font-medium' 
                    : 'text-gray-700 hover:text-rose-600'
                }`}
              >
                Browse Services
              </button>
              <button 
                onClick={() => navigate('/inspiration')}
                className={`transition-colors ${
                  isActive('/inspiration') 
                    ? 'text-rose-600 font-medium' 
                    : 'text-gray-700 hover:text-rose-600'
                }`}
              >
                Inspiration
              </button>
              <button 
                onClick={() => navigate('/how-it-works')}
                className={`transition-colors ${
                  isActive('/how-it-works') 
                    ? 'text-rose-600 font-medium' 
                    : 'text-gray-700 hover:text-rose-600'
                }`}
              >
                How it Works
              </button>
              <button 
                onClick={() => navigate('/support')}
                className={`transition-colors ${
                  isActive('/support') 
                    ? 'text-rose-600 font-medium' 
                    : 'text-gray-700 hover:text-rose-600'
                }`}
              >
                Support
              </button>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              <NotificationBell />
              <Button 
                variant="ghost" 
                icon={Search} 
                size="sm" 
                className="md:hidden"
                onClick={() => navigate('/search')}
              />

              {isAuthenticated ? (
                <>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      icon={ShoppingCart} 
                      size="sm"
                      onClick={toggleCart}
                      className="relative"
                    >
                      {cartState.items.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
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
                    className={isActive('/my-bookings') ? 'text-rose-600' : ''}
                  >
                    My Bookings
                  </Button>
                  <div className="relative group">
                    <Button variant="ghost" icon={User} size="sm">
                      {user?.user_metadata?.name?.split(' ')[0] || 'Profile'}
                    </Button>
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
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
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Help Center</a>
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
                      className="relative"
                    >
                      {cartState.items.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                          {cartState.items.length}
                        </span>
                      )}
                    </Button>
                  </div>
                  <Button variant="ghost" onClick={handleLogin} size="sm">
                    Log In
                  </Button>
                  <Button variant="primary" onClick={handleSignup} size="sm">
                    Sign Up
                  </Button>
                </>
              )}
              
              {/* Mobile Menu */}
              <div className="relative group md:hidden">
                <Button variant="ghost" icon={Menu} size="sm" />
                {/* Mobile Dropdown */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <button 
                      onClick={() => navigate('/search')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Browse Services
                    </button>
                    <button 
                      onClick={() => navigate('/inspiration')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Inspiration
                    </button>
                    <button 
                      onClick={() => navigate('/how-it-works')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      How it Works
                    </button>
                    <button 
                      onClick={() => navigate('/support')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Support
                    </button>
                    {isAuthenticated && (
                      <>
                        <hr className="my-1" />
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
                          onClick={() => navigate('/profile?tab=gallery')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Wedding Gallery
                        </button>
                        <button 
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Sign Out
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
};