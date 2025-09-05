import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { createClient } from '@supabase/supabase-js';

interface ResetPasswordProps {
  token?: string;
}

// Initialize Supabase client
// Set VITE_SUPABASE_ANON_KEY in .env.local
const supabase = createClient(
  'https://eecbrvehrhrvdzuutliq.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  { auth: { autoRefreshToken: true, persistSession: true } }
);

export const ResetPassword: React.FC<ResetPasswordProps> = ({ token }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract token from URL if not provided
  useEffect(() => {
    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      if (accessToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
      } else {
        setError('Invalid or missing reset token');
      }
    }
  }, [token]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw new Error(error.message);
      }

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        window.location.href = 'https://bremembered.io/login';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h3>
          <p className="text-gray-600">Enter a new password for your B. Remembered account</p>
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
          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
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

          <div className="text-xs text-gray-500">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>At least 8 characters long</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Include at least one number</li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!!validatePassword(password)}
          >
            Reset Password
          </Button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Back to <a href="/login" className="text-rose-600 hover:text-rose-700">Login</a>
        </p>
      </Card>
    </div>
  );
};