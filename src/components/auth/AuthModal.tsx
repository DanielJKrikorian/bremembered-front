import React, { useState, useEffect } from 'react';
import { X, Mail, User, Heart, Lock, Eye, EyeOff, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

// Initialize Supabase client (client-side, public key)
const supabase = createClient(
  'https://eecbrvehrhrvdzuutliq.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  { auth: { autoRefreshToken: true, persistSession: true } }
);

const EDGE_FUNCTION_URL = 'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/new-couple-account-creation';
const RESET_PASSWORD_URL = 'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-couple-password-reset';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    partner1_name: '',
    partner2_name: '',
    wedding_date: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Sync mode with initialMode prop when it changes
  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccess(null);
    setFormData({ email: '', password: '', name: '', partner1_name: '', partner2_name: '', wedding_date: '' });
    setShowPassword(false);
  }, [initialMode]);

  if (!isOpen) return null;

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must include at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must include at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must include at least one number';
    }
    return null;
  };

  const validateWeddingDate = (date: string) => {
    if (!date) {
      return 'Wedding date is required';
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Invalid wedding date format';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return 'Wedding date cannot be in the past';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
        }
      } else {
        // Validate inputs
        if (!formData.email || !formData.name) {
          throw new Error('Email and name are required');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          throw new Error('Invalid email format');
        }
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          throw new Error(passwordError);
        }
        const dateError = validateWeddingDate(formData.wedding_date);
        if (dateError) {
          throw new Error(dateError);
        }

        // Call edge function for signup
        console.log('Sending signup request to edge function');
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            password: formData.password,
            partner1_name: formData.partner1_name || null,
            partner2_name: formData.partner2_name || null,
            wedding_date: formData.wedding_date
          })
        });

        const data = await response.json();
        console.log('Edge function response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create account');
        }

        // Set session for auto-login
        const { access_token, refresh_token } = data;
        if (!access_token || !refresh_token) {
          console.error('No session tokens received');
          throw new Error('Failed to receive session tokens');
        }

        console.log('Setting session with Supabase client');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Failed to set session: ' + sessionError.message);
        }

        // Verify session
        const { data: session } = await supabase.auth.getSession();
        console.log('Current session:', session);

        setSuccess('Account created! Redirecting to your profile...');
        // Redirect to profile
        const redirectUrl = window.location.hostname === 'localhost' ? '/profile' : 'https://bremembered.io/profile';
        console.log('Redirecting to:', redirectUrl);
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    try {
      console.log('Sending password reset request');
      const response = await fetch(RESET_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An unexpected error occurred');
    }
  };

  const handleClose = () => {
    setSuccess(null);
    setError(null);
    setFormData({ email: '', password: '', name: '', partner1_name: '', partner2_name: '', wedding_date: '' });
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-rose-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? 'Welcome Back!' : 'Join B. Remembered'}
          </h3>
          <p className="text-gray-600">
            {mode === 'login' 
              ? 'Sign in to manage your wedding bookings' 
              : 'Create your account to start planning your perfect day'
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <Input
                label="Your Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                icon={User}
                required
              />
              <Input
                label="Partner 1 Name (Optional)"
                value={formData.partner1_name}
                onChange={(e) => handleInputChange('partner1_name', e.target.value)}
                placeholder="Enter your partner's name"
                icon={Heart}
              />
              <Input
                label="Partner 2 Name (Optional)"
                value={formData.partner2_name}
                onChange={(e) => handleInputChange('partner2_name', e.target.value)}
                placeholder="Enter your second partner's name"
                icon={Heart}
              />
              <Input
                label="Wedding Date"
                type="date"
                value={formData.wedding_date}
                onChange={(e) => handleInputChange('wedding_date', e.target.value)}
                placeholder="Select your wedding date"
                icon={Calendar}
                required
              />
            </>
          )}
          
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your.email@example.com"
            icon={Mail}
            required
          />
          
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={mode === 'login' ? 'Enter your password' : 'Create a secure password'}
              icon={Lock}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {mode === 'signup' && (
            <div className="text-xs text-gray-500">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At least 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number</li>
              </ul>
            </div>
          )}
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={
              !formData.email || 
              (mode === 'signup' && (!formData.name || !!validatePassword(formData.password) || !!validateWeddingDate(formData.wedding_date))) || 
              (mode === 'login' && !formData.password)
            }
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
                setSuccess(null);
                setFormData({ email: '', password: '', name: '', partner1_name: '', partner2_name: '', wedding_date: '' });
                setShowPassword(false);
              }}
              className="text-rose-600 hover:text-rose-700 font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {mode === 'login' && (
          <div className="mt-4 text-center">
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={handlePasswordReset}
            >
              Forgot your password?
            </button>
          </div>
        )}

        {mode === 'signup' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Personalized vendor recommendations</li>
              <li>• Easy booking management</li>
              <li>• Wedding planning tools</li>
              <li>• 24/7 customer support</li>
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          By continuing, you agree to our <a href="/terms" className="text-rose-600 hover:text-rose-700">Terms of Service</a> and <a href="/privacy" className="text-rose-600 hover:text-rose-700">Privacy Policy</a>.
        </p>
      </Card>
    </div>
  );
};