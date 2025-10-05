import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Shield, Download, Check, AlertTriangle } from 'lucide-react';

export const SettingsSection: React.FC = () => {
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'Weak' | 'Moderate' | 'Strong' | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  useEffect(() => {
    const { newPassword, confirmPassword } = passwordForm;
    if (newPassword.length === 0) {
      setPasswordStrength(null);
    } else {
      let score = 0;
      if (newPassword.length >= 6) score += 1;
      if (newPassword.length >= 8) score += 1;
      if (/[A-Z]/.test(newPassword)) score += 1;
      if (/[0-9]/.test(newPassword)) score += 1;
      if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
      if (score <= 2) setPasswordStrength('Weak');
      else if (score <= 3) setPasswordStrength('Moderate');
      else setPasswordStrength('Strong');
    }
    if (newPassword.length > 0 && confirmPassword.length > 0) {
      setPasswordsMatch(newPassword === confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [passwordForm]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordLoading(true);
    const { newPassword, confirmPassword } = passwordForm;
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setPasswordLoading(false);
      return;
    }
    if (passwordStrength === 'Weak') {
      setPasswordError('Password is too weak. Please use a stronger password.');
      setPasswordLoading(false);
      return;
    }
    try {
      if (!supabase || !isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess('Password updated successfully');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setPasswordStrength(null);
      setPasswordsMatch(null);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
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
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h3>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <Input
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Enter new password"
              icon={Shield}
              required
            />
            {passwordStrength && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength === 'Weak'
                        ? 'w-1/3 bg-red-500'
                        : passwordStrength === 'Moderate'
                        ? 'w-2/3 bg-yellow-500'
                        : 'w-full bg-green-500'
                    }`}
                  ></div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    passwordStrength === 'Weak'
                      ? 'text-red-600'
                      : passwordStrength === 'Moderate'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {passwordStrength}
                </span>
              </div>
            )}
          </div>
          <div>
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              icon={Shield}
              required
            />
            {passwordsMatch !== null && (
              <div className="mt-2 flex items-center space-x-2">
                {passwordsMatch ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>
          {passwordError && (
            <p className="text-red-600 text-sm">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-green-600 text-sm">{passwordSuccess}</p>
          )}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPasswordForm({ newPassword: '', confirmPassword: '' });
                setPasswordStrength(null);
                setPasswordsMatch(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={passwordLoading}
              disabled={passwordLoading || passwordStrength === 'Weak' || passwordsMatch === false}
            >
              Save New Password
            </Button>
          </div>
        </form>
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
  );
};