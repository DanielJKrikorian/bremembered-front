import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { X, Check } from 'lucide-react';

interface MealOption {
  id: string;
  name: string;
  is_active: boolean;
}

interface Guest {
  id: string;
  name: string;
  meal_option_id?: string;
  rsvp_status?: 'pending' | 'accepted' | 'declined';
}

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string;
}

export const RsvpModal: React.FC<RsvpModalProps> = ({ isOpen, onClose, coupleId }) => {
  const [name, setName] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [mealOptions, setMealOptions] = useState<MealOption[]>([]);
  const [selectedMealId, setSelectedMealId] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'accepted' | 'declined'>('accepted');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch guest and meal options
  useEffect(() => {
    const fetchData = async () => {
      if (!coupleId || !supabase || !isSupabaseConfigured()) return;
      try {
        // Fetch meal options
        const { data: meals, error: mealError } = await supabase
          .from('meal_options')
          .select('id, name, is_active')
          .eq('couple_id', coupleId)
          .eq('is_active', true);
        if (mealError) throw mealError;
        setMealOptions(meals || []);
      } catch (err) {
        setError('Failed to load data');
      }
    };
    if (isOpen) fetchData();
  }, [isOpen, coupleId]);

  // Search for guest by name
  const handleNameSearch = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setGuest({ id: '1', name, rsvp_status: 'pending' });
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('guests')
        .select('id, name, meal_option_id, rsvp_status')
        .eq('couple_id', coupleId)
        .ilike('name', `%${name}%`)
        .single();
      if (error || !data) {
        setError('Guest not found');
      } else {
        setGuest(data);
        setSelectedMealId(data.meal_option_id || '');
        setRsvpStatus(data.rsvp_status === 'declined' ? 'declined' : 'accepted');
      }
    } catch (err) {
      setError('Failed to find guest');
    } finally {
      setLoading(false);
    }
  };

  // Handle RSVP submission
  const handleSubmit = async () => {
    if (!guest) {
      setError('Please search for your name first');
      return;
    }
    setLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setSuccessMessage('RSVP submitted locally');
        setLoading(false);
        onClose();
        return;
      }
      const { error } = await supabase
        .from('guests')
        .update({
          meal_option_id: rsvpStatus === 'accepted' ? selectedMealId || null : null,
          rsvp_status
        })
        .eq('id', guest.id);
      if (error) throw error;
      setSuccessMessage('RSVP submitted successfully');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to submit RSVP');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">RSVP</h2>
          <Button variant="ghost" icon={X} onClick={onClose} />
        </div>
        <div className="space-y-4">
          {!guest ? (
            <>
              <Input
                label="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button
                variant="primary"
                onClick={handleNameSearch}
                loading={loading}
                disabled={loading}
                className="w-full"
              >
                Find My Invitation
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-600">Hello, {guest.name}!</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RSVP Status</label>
                <select
                  value={rsvpStatus}
                  onChange={(e) => setRsvpStatus(e.target.value as 'accepted' | 'declined')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="accepted">Accept</option>
                  <option value="declined">Decline</option>
                </select>
              </div>
              {rsvpStatus === 'accepted' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meal Choice</label>
                  <select
                    value={selectedMealId}
                    onChange={(e) => setSelectedMealId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select a meal</option>
                    {mealOptions.map(meal => (
                      <option key={meal.id} value={meal.id}>{meal.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {successMessage && (
                <p className="text-green-600 text-sm flex items-center">
                  <Check className="w-4 h-4 mr-2" /> {successMessage}
                </p>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading}
                >
                  Submit RSVP
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};