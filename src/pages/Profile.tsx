import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Camera, Edit, Save, X, Heart, Star, Award, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [profileData, setProfileData] = useState({
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    location: 'Los Angeles, CA',
    weddingDate: '2024-08-15',
    partnerName: 'Michael Davis',
    bio: 'Planning our dream wedding in beautiful California! Looking for the perfect team to capture our special day.',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
    vendorMessages: true,
    bookingUpdates: true,
    newsletter: true
  });

  const handleProfileUpdate = () => {
    setIsEditing(false);
    // Handle profile update logic
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const stats = [
    { label: 'Bookings Made', value: '3', icon: Calendar },
    { label: 'Reviews Left', value: '2', icon: Star },
    { label: 'Favorites', value: '12', icon: Heart },
    { label: 'Member Since', value: 'Jan 2024', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and wedding preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={profileData.avatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover mx-auto"
                  />
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-4">
                  {profileData.firstName} {profileData.lastName}
                </h3>
                <p className="text-gray-600">{profileData.email}</p>
                <div className="flex items-center justify-center space-x-1 mt-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{profileData.location}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile' ? 'bg-rose-100 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'preferences' ? 'bg-rose-100 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Preferences
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'security' ? 'bg-rose-100 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Security
                </button>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Stats</h3>
              <div className="space-y-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                          <Icon className="w-4 h-4 text-rose-600" />
                        </div>
                        <span className="text-sm text-gray-600">{stat.label}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
                  {!isEditing ? (
                    <Button variant="outline" icon={Edit} onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-3">
                      <Button variant="outline" icon={X} onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" icon={Save} onClick={handleProfileUpdate}>
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    icon={User}
                  />
                  <Input
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    icon={User}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    icon={Mail}
                  />
                  <Input
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    icon={Phone}
                  />
                  <Input
                    label="Location"
                    value={profileData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    icon={MapPin}
                  />
                  <Input
                    label="Wedding Date"
                    type="date"
                    value={profileData.weddingDate}
                    onChange={(e) => handleInputChange('weddingDate', e.target.value)}
                    disabled={!isEditing}
                    icon={Calendar}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Partner's Name"
                      value={profileData.partnerName}
                      onChange={(e) => handleInputChange('partnerName', e.target.value)}
                      disabled={!isEditing}
                      icon={Heart}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      About You
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Tell us about your wedding vision and what you're looking for..."
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Profile Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Complete profiles get better vendor responses</li>
                      <li>• Add your wedding date to see availability</li>
                      <li>• Share your vision to help vendors understand your style</li>
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'preferences' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">Notification Preferences</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Communication</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive important updates via email' },
                        { key: 'smsNotifications', label: 'SMS Notifications', description: 'Get urgent updates via text message' },
                        { key: 'vendorMessages', label: 'Vendor Messages', description: 'Notifications when vendors message you' }
                      ].map((pref) => (
                        <div key={pref.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{pref.label}</h4>
                            <p className="text-sm text-gray-600">{pref.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences[pref.key as keyof typeof preferences]}
                              onChange={(e) => handlePreferenceChange(pref.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Updates & Marketing</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'bookingUpdates', label: 'Booking Updates', description: 'Updates about your current bookings' },
                        { key: 'newsletter', label: 'Newsletter', description: 'Weekly wedding tips and inspiration' },
                        { key: 'marketingEmails', label: 'Promotional Emails', description: 'Special offers and new vendor announcements' }
                      ].map((pref) => (
                        <div key={pref.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{pref.label}</h4>
                            <p className="text-sm text-gray-600">{pref.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences[pref.key as keyof typeof preferences]}
                              onChange={(e) => handlePreferenceChange(pref.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button variant="primary">
                    Save Preferences
                  </Button>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">Security Settings</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">Change Password</h4>
                          <p className="text-sm text-gray-600">Last changed 3 months ago</p>
                        </div>
                        <Button variant="outline">
                          Update Password
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Password requirements:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>At least 8 characters long</li>
                          <li>Include uppercase and lowercase letters</li>
                          <li>Include at least one number</li>
                          <li>Include at least one special character</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">2FA Status</h4>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-red-600">Disabled</span>
                          <Button variant="primary" size="sm">
                            Enable 2FA
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Login Activity</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="space-y-4">
                        {[
                          { device: 'MacBook Pro - Chrome', location: 'Los Angeles, CA', time: '2 hours ago', current: true },
                          { device: 'iPhone - Safari', location: 'Los Angeles, CA', time: '1 day ago', current: false },
                          { device: 'iPad - Safari', location: 'Los Angeles, CA', time: '3 days ago', current: false }
                        ].map((session, index) => (
                          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{session.device}</h4>
                                {session.current && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{session.location} • {session.time}</p>
                            </div>
                            {!session.current && (
                              <Button variant="outline" size="sm">
                                Revoke
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                    <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <Shield className="w-6 h-6 text-red-600" />
                        <h4 className="font-medium text-red-900">Danger Zone</h4>
                      </div>
                      <p className="text-sm text-red-700 mb-4">
                        These actions are permanent and cannot be undone. Please proceed with caution.
                      </p>
                      <div className="space-y-3">
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          Download My Data
                        </Button>
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};