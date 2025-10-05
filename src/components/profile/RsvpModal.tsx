import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { X, Check } from 'lucide-react';

interface MealOption {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Guest {
  id: string;
  name: string;
  meal_option_id?: string | null;
  rsvp_status?: 'pending' | 'accepted' | 'declined';
  has_plus_one: boolean;
  plus_one_name?: string | null;
}

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string;
}

export const RsvpModal: React.FC<RsvpModalProps> = ({ isOpen, onClose, coupleId }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [mealOptions, setMealOptions] = useState<MealOption[]>([]);
  const [selectedMealId, setSelectedMealId] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'accepted' | 'declined'>('accepted');
  const [plusOneName, setPlusOneName] = useState('');
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
          .select('id, name, description, is_active')
          .eq('couple_id', coupleId)
          .eq('is_active', true);
        if (mealError) throw new Error(`Failed to fetch meal options: ${mealError.message}`);
        setMealOptions(meals || []);
      } catch (err) {
        console.error('Error fetching meal options:', err);
        setError('Failed to load meal options');
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
        setGuest({ id: '1', name, rsvp_status: 'pending', has_plus_one: false });
        setStep(2);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('guests')
        .select('id, name, meal_option_id, rsvp_status, has_plus_one, plus_one_name')
        .eq('couple_id', coupleId)
        .ilike('name', `%${name}%`)
        .single();
      if (error || !data) {
        throw new Error('Guest not found');
      }
      setGuest(data);
      setSelectedMealId(data.meal_option_id || '');
      setRsvpStatus(data.rsvp_status === 'declined' ? 'declined' : 'accepted');
      setPlusOneName(data.plus_one_name || '');
      setStep(2);
    } catch (err) {
      console.error('Error searching guest:', err);
      setError('Guest not found');
    } finally {
      setLoading(false);
    }
  };

  // Handle RSVP status selection
  const handleRsvpStatus = () => {
    if (!rsvpStatus) {
      setError('Please select Accept or Decline');
      return;
    }
    setError(null);
    // Advance to plus one name (Step 3) if accepted and has_plus_one, otherwise to confirmation (Step 4)
    setStep(rsvpStatus === 'accepted' && guest?.has_plus_one ? 3 : 4);
  };

  // Handle plus one name submission
  const handlePlusOneSubmit = () => {
    if (guest?.has_plus_one && !plusOneName.trim()) {
      setError('Please enter the plus one name');
      return;
    }
    setError(null);
    setStep(4);
  };

  // Handle RSVP submission
  const handleSubmit = async () => {
    if (!guest) {
      setError('Please search for your name first');
      return;
    }
    if (rsvpStatus === 'accepted' && !selectedMealId) {
      setError('Please select a meal option');
      return;
    }
    setLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setSuccessMessage(rsvpStatus === 'declined' ? 'We are sorry to hear that! Thank you for letting us know!' : 'RSVP submitted locally');
        setLoading(false);
        onClose();
        return;
      }
      const { error } = await supabase
        .from('guests')
        .update({
          meal_option_id: rsvpStatus === 'accepted' ? selectedMealId : null,
          rsvp_status: rsvpStatus,
          plus_one_name: guest.has_plus_one && rsvpStatus === 'accepted' ? plusOneName : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', guest.id)
        .eq('couple_id', coupleId);
      if (error) {
        throw new Error(`Failed to submit RSVP: ${error.message}`);
      }
      setSuccessMessage(rsvpStatus === 'declined' ? 'We are sorry to hear that! Thank you for letting us know!' : 'RSVP submitted successfully');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting RSVP:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit RSVP');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setName('');
      setGuest(null);
      setSelectedMealId('');
      setRsvpStatus('accepted');
      setPlusOneName('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">RSVP</h2>
          <Button variant="ghost" icon={X} onClick={onClose} />
        </div>
        <div className="space-y-4">
          {step === 1 && !guest ? (
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
          ) : step === 2 ? (
            <>
              <p className="text-gray-600">Hello, {guest?.name}!</p>
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
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRsvpStatus}
                  loading={loading}
                  disabled={loading}
                >
                  Next
                </Button>
              </div>
            </>
          ) : step === 3 && guest?.has_plus_one && rsvpStatus === 'accepted' ? (
            <>
              <p className="text-gray-600">Hello, {guest.name}! Please enter the name of your plus one.</p>
              <Input
                label="Plus One Name"
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
                placeholder="Enter plus one name"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePlusOneSubmit}
                  loading={loading}
                  disabled={loading}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">Hello, {guest?.name}!</p>
              {rsvpStatus === 'accepted' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meal Choice</label>
                  <select
                    value={selectedMealId}
                    onChange={(e) => setSelectedMealId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select a meal</option>
                    {mealOptions.map(meal => (
                      <option key={meal.id} value={meal.id}>
                        {meal.name}{meal.description ? ` - ${meal.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-gray-600">Please confirm your RSVP by clicking Submit.</p>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {successMessage && (
                <p className="text-green-600 text-sm flex items-center">
                  <Check className="w-4 h-4 mr-2" /> {successMessage}
                </p>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(guest?.has_plus_one && rsvpStatus === 'accepted' ? 3 : 2)}
                  disabled={loading}
                >
                  Back
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