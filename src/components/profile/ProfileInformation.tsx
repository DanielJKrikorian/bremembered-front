import React, { useState, useEffect } from 'react';
import { useCouple } from '../../hooks/useCouple';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { User, Heart, Calendar } from 'lucide-react';

export const ProfileInformation: React.FC = () => {
  const { couple, updateCouple } = useCouple();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    partner1_name: '',
    partner2_name: '',
    email: '',
    phone: '',
    wedding_date: '',
    venue_name: '',
    guest_count: '',
    ceremony_time: '',
    reception_time: '',
    notes: ''
  });

  useEffect(() => {
    if (couple && !isEditing) {
      setEditForm({
        name: couple.name || '',
        partner1_name: couple.partner1_name || '',
        partner2_name: couple.partner2_name || '',
        email: couple.email || '',
        phone: couple.phone || '',
        wedding_date: couple.wedding_date || '',
        venue_name: couple.venue_name || '',
        guest_count: couple.guest_count?.toString() || '',
        ceremony_time: couple.ceremony_time || '',
        reception_time: couple.reception_time || '',
        notes: couple.notes || ''
      });
    }
  }, [couple, isEditing]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing && couple) {
      setEditForm({
        name: couple.name || '',
        partner1_name: couple.partner1_name || '',
        partner2_name: couple.partner2_name || '',
        email: couple.email || '',
        phone: couple.phone || '',
        wedding_date: couple.wedding_date || '',
        venue_name: couple.venue_name || '',
        guest_count: couple.guest_count?.toString() || '',
        ceremony_time: couple.ceremony_time || '',
        reception_time: couple.reception_time || '',
        notes: couple.notes || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      await updateCouple({
        name: editForm.name,
        partner1_name: editForm.partner1_name,
        partner2_name: editForm.partner2_name,
        email: editForm.email,
        phone: editForm.phone,
        wedding_date: editForm.wedding_date || null,
        venue_name: editForm.venue_name || null,
        guest_count: editForm.guest_count ? parseInt(editForm.guest_count) : null,
        ceremony_time: editForm.ceremony_time || null,
        reception_time: editForm.reception_time || null,
        notes: editForm.notes || null
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not set';
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
        <Button
          variant={isEditing ? 'outline' : 'primary'}
          onClick={handleEditToggle}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Your Name"
              value={editForm.partner1_name}
              onChange={(e) => handleInputChange('partner1_name', e.target.value)}
              icon={User}
              required
            />
            <Input
              label="Partner's Name"
              value={editForm.partner2_name}
              onChange={(e) => handleInputChange('partner2_name', e.target.value)}
              icon={Heart}
            />
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              icon={User}
              required
            />
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              icon={User}
            />
            <Input
              label="Wedding Date"
              type="date"
              value={editForm.wedding_date}
              onChange={(e) => handleInputChange('wedding_date', e.target.value)}
              icon={Calendar}
            />
            <Input
              label="Guest Count"
              type="number"
              value={editForm.guest_count}
              onChange={(e) => handleInputChange('guest_count', e.target.value)}
              icon={User}
            />
            <div className="md:col-span-2">
              <Input
                label="Venue Name"
                value={editForm.venue_name}
                onChange={(e) => handleInputChange('venue_name', e.target.value)}
                icon={User}
              />
            </div>
            <Input
              label="Ceremony Time"
              type="time"
              value={editForm.ceremony_time}
              onChange={(e) => handleInputChange('ceremony_time', e.target.value)}
              icon={Calendar}
            />
            <Input
              label="Reception Time"
              type="time"
              value={editForm.reception_time}
              onChange={(e) => handleInputChange('reception_time', e.target.value)}
              icon={Calendar}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special notes about your wedding..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleEditToggle}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={false}
            >
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <p className="text-gray-900">{couple?.partner1_name || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner's Name</label>
              <p className="text-gray-900">{couple?.partner2_name || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{couple?.email || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <p className="text-gray-900">{couple?.phone || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wedding Date</label>
              <p className="text-gray-900">{formatDate(couple?.wedding_date)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
              <p className="text-gray-900">{couple?.guest_count || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <p className="text-gray-900">{couple?.venue_name || 'Not set'}</p>
            </div>
            {couple?.ceremony_time && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ceremony Time</label>
                <p className="text-gray-900">{formatTime(couple.ceremony_time)}</p>
              </div>
            )}
            {couple?.reception_time && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reception Time</label>
                <p className="text-gray-900">{formatTime(couple.reception_time)}</p>
              </div>
            )}
            {couple?.notes && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-gray-900">{couple.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};