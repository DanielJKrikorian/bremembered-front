import React from 'react';
import { Heart, Menu, User, Calendar, Search, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onSignup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAuthenticated = false, onLogin, onSignup }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
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

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Icon for Mobile */}
            <Button 
              variant="ghost" 
              icon={Search} 
              size="sm" 
              className="md:hidden"
              onClick={() => navigate('/search')}
            />

            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  icon={Bell} 
                  size="sm"
                  className="relative"
                >
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                </Button>
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
                    Profile
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
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Help Center</a>
                      <hr className="my-1" />
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sign Out</a>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={onLogin} size="sm">
                  Log In
                </Button>
                <Button variant="primary" onClick={onSignup} size="sm">
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
                        onClick={() => navigate('/my-bookings')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        My Bookings
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
  );
};