import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Calendar, Heart, Users, MapPin, Check } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { debounce } from 'lodash';

interface Couple {
  id: string;
  name: string;
  wedding_date?: string;
  partner1_name: string;
  partner2_name: string;
  venue_name?: string;
  venue_id?: string;
}

interface Venue {
  id: string;
  name: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export const ProfileInformation: React.FC = () => {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    wedding_date: '',
    partner1_name: '',
    partner2_name: '',
    venue_name: '',
    venue_id: '',
  });
  const [venueSearch, setVenueSearch] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    zip: '',
  });
  const [showAddVenueForm, setShowAddVenueForm] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch couple details
  useEffect(() => {
    const fetchCouple = async () => {
      if (!supabase || !isSupabaseConfigured()) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        const { data, error } = await supabase
          .from('couples')
          .select('id, name, wedding_date, partner1_name, partner2_name, venue_name, venue_id')
          .eq('user_id', user.id)
          .single();
        if (error) throw new Error(`Failed to fetch couple details: ${error.message}`);
        setCouple(data);
        setFormData({
          name: data.name || '',
          wedding_date: data.wedding_date ? format(parseISO(data.wedding_date), 'yyyy-MM-dd') : '',
          partner1_name: data.partner1_name || '',
          partner2_name: data.partner2_name || '',
          venue_name: data.venue_name || '',
          venue_id: data.venue_id || '',
        });
      } catch (err) {
        console.error('Error fetching couple details:', err);
        setFormErrors({ general: 'Failed to load profile' });
      }
    };
    fetchCouple();
  }, []);

  // Search venues
  const searchVenues = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !supabase || !isSupabaseConfigured()) {
        setVenues([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('id, name, street_address, city, state, zip')
          .ilike('name', `%${query}%`)
          .limit(10);
        if (error) throw new Error(`Failed to search venues: ${error.message}`);
        setVenues(data || []);
        setShowVenueDropdown(true);
      } catch (err) {
        console.error('Error searching venues:', err);
        setFormErrors({ venue_search: 'Failed to search venues' });
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchVenues(venueSearch);
  }, [venueSearch, searchVenues]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'venue_name') {
      setVenueSearch(value);
      setFormData(prev => ({ ...prev, venue_id: '' }));
    }
  };

  // Handle new venue input
  const handleNewVenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVenue(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [`new_venue_${name}`]: '' }));
  };

  // Select a venue
  const selectVenue = (venue: Venue) => {
    setFormData(prev => ({
      ...prev,
      venue_name: venue.name,
      venue_id: venue.id,
    }));
    setVenueSearch(venue.name);
    setShowVenueDropdown(false);
    setShowAddVenueForm(false);
    setNewVenue({ name: '', street_address: '', city: '', state: '', zip: '' });
  };

  // Add a new venue
  const addNewVenue = async () => {
    if (!newVenue.name.trim()) {
      setFormErrors({ new_venue_name: 'Venue name is required' });
      return;
    }
    setLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setFormErrors({ general: 'Supabase not configured' });
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('venues')
        .insert({
          name: newVenue.name,
          street_address: newVenue.street_address || null,
          city: newVenue.city || null,
          state: newVenue.state || null,
          zip: newVenue.zip || null,
        })
        .select()
        .single();
      if (error) throw new Error(`Failed to add venue: ${error.message}`);
      setFormData(prev => ({
        ...prev,
        venue_name: data.name,
        venue_id: data.id,
      }));
      setVenueSearch(data.name);
      setShowVenueDropdown(false);
      setShowAddVenueForm(false);
      setNewVenue({ name: '', street_address: '', city: '', state: '', zip: '' });
    } catch (err) {
      console.error('Error adding venue:', err);
      setFormErrors({ general: 'Failed to add venue' });
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Wedding name is required';
    if (!formData.partner1_name.trim()) errors.partner1_name = 'Partner 1 name is required';
    if (!formData.partner2_name.trim()) errors.partner2_name = 'Partner 2 name is required';
    if (formData.wedding_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.wedding_date)) {
      errors.wedding_date = 'Invalid date format (YYYY-MM-DD)';
    }
    if (!formData.venue_name.trim()) errors.venue_name = 'Venue name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save profile changes
  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setSuccessMessage('Changes saved locally (Supabase not configured)');
        setLoading(false);
        return;
      }
      if (!couple?.id) throw new Error('No couple ID available');
      const { error } = await supabase
        .from('couples')
        .update({
          name: formData.name,
          wedding_date: formData.wedding_date || null,
          partner1_name: formData.partner1_name,
          partner2_name: formData.partner2_name,
          venue_name: formData.venue_name,
          venue_id: formData.venue_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', couple.id);
      if (error) throw new Error(`Failed to save profile: ${error.message}`);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setFormErrors({ general: err instanceof Error ? err.message : 'Failed to save profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h3>
        <p className="text-gray-600 mb-6">Update your wedding details</p>
        <div className="space-y-6">
          <Input
            label="Wedding Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Jane & John’s Wedding"
            error={formErrors.name}
            icon={Heart}
          />
          <Input
            label="Partner 1 Name"
            name="partner1_name"
            value={formData.partner1_name}
            onChange={handleInputChange}
            placeholder="e.g., Jane Smith"
            error={formErrors.partner1_name}
            icon={Users}
          />
          <Input
            label="Partner 2 Name"
            name="partner2_name"
            value={formData.partner2_name}
            onChange={handleInputChange}
            placeholder="e.g., John Doe"
            error={formErrors.partner2_name}
            icon={Users}
          />
          <Input
            label="Wedding Date"
            name="wedding_date"
            type="date"
            value={formData.wedding_date}
            onChange={handleInputChange}
            placeholder="YYYY-MM-DD"
            error={formErrors.wedding_date}
            icon={Calendar}
          />
          <div className="relative">
            <Input
              label="Venue"
              name="venue_name"
              value={venueSearch}
              onChange={handleInputChange}
              placeholder="Search for a venue"
              error={formErrors.venue_name}
              icon={MapPin}
              onFocus={() => setShowVenueDropdown(true)}
            />
            {showVenueDropdown && venueSearch.trim() && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
                {venues.length > 0 ? (
                  venues.map(venue => (
                    <div
                      key={venue.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectVenue(venue)}
                    >
                      <p className="text-sm font-medium">{venue.name}</p>
                      {(venue.street_address || venue.city || venue.state) && (
                        <p className="text-xs text-gray-500">
                          {[
                            venue.street_address,
                            venue.city,
                            venue.state,
                            venue.zip,
                          ].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-2 text-sm text-gray-500">No venues found</p>
                )}
                <div
                  className="px-4 py-2 text-sm text-rose-600 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                  onClick={() => {
                    setShowAddVenueForm(true);
                    setShowVenueDropdown(false);
                  }}
                >
                  Add New Venue
                </div>
              </div>
            )}
          </div>
          {showAddVenueForm && (
            <div className="border p-4 rounded-lg space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Add New Venue</h4>
              <Input
                label="Venue Name"
                name="name"
                value={newVenue.name}
                onChange={handleNewVenueChange}
                placeholder="e.g., The Grand Venue"
                error={formErrors.new_venue_name}
              />
              <Input
                label="Street Address (optional)"
                name="street_address"
                value={newVenue.street_address}
                onChange={handleNewVenueChange}
                placeholder="e.g., 123 Main St"
              />
              <Input
                label="City (optional)"
                name="city"
                value={newVenue.city}
                onChange={handleNewVenueChange}
                placeholder="e.g., New York"
              />
              <Input
                label="State (optional)"
                name="state"
                value={newVenue.state}
                onChange={handleNewVenueChange}
                placeholder="e.g., NY"
              />
              <Input
                label="Zip Code (optional)"
                name="zip"
                value={newVenue.zip}
                onChange={handleNewVenueChange}
                placeholder="e.g., 10001"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddVenueForm(false);
                    setNewVenue({ name: '', street_address: '', city: '', state: '', zip: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={addNewVenue} loading={loading} disabled={loading}>
                  Add Venue
                </Button>
              </div>
            </div>
          )}
          {formErrors.general && <p className="text-red-600 text-sm">{formErrors.general}</p>}
          {successMessage && (
            <p className="text-green-600 text-sm flex items-center">
              <Check className="w-4 h-4 mr-2" /> {successMessage}
            </p>
          )}
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave} loading={loading} disabled={loading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};