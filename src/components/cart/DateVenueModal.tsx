// src/components/cart/DateVenueModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Search, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';

interface Venue {
  id: string;
  name: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  region?: string;
}

interface DateVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItem: any;
  onSave: (details: { eventDate: string; eventTime: string; endTime: string; venue: Venue }) => void;
}

export const DateVenueModal: React.FC<DateVenueModalProps> = ({
  isOpen,
  onClose,
  cartItem,
  onSave,
}) => {
  if (!isOpen || !cartItem) return null;

  const [step, setStep] = useState(1);
  const [eventDate, setEventDate] = useState(cartItem.eventDate || '');
  const [eventTime, setEventTime] = useState(cartItem.eventTime || '');
  const [endTime, setEndTime] = useState(cartItem.endTime || '');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(cartItem.venue || null);
  const [venueSearch, setVenueSearch] = useState('');
  const [showNewVenue, setShowNewVenue] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    zip: '',
    region: '',
  });
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-calculate end time
  useEffect(() => {
    if (eventTime && cartItem.package.hour_amount) {
      const [hours, minutes] = eventTime.split(':').map(Number);
      const start = new Date(2000, 0, 1, hours, minutes);
      const end = new Date(start.getTime() + cartItem.package.hour_amount * 60 * 60 * 1000);
      setEndTime(end.toTimeString().slice(0, 5));
    }
  }, [eventTime, cartItem.package.hour_amount]);

  // Search venues
  useEffect(() => {
    const search = async () => {
      if (!venueSearch.trim()) {
        setVenues([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await supabase
          .from('venues')
          .select('*')
          .ilike('name', `%${venueSearch}%`)
          .limit(10);
        setVenues(data || []);
      } catch (err) {
        console.error('Error searching venues:', err);
      } finally {
        setLoading(false);
      }
    };
    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [venueSearch]);

  const handleSave = () => {
    if (!eventDate || !eventTime || !selectedVenue) return;
    onSave({ eventDate, eventTime, endTime, venue: selectedVenue });
    onClose();
  };

  const handleCreateVenue = async () => {
    if (!newVenue.name || !newVenue.region) return;
    try {
      const { data, error } = await supabase
        .from('venues')
        .insert([newVenue])
        .select()
        .single();
      if (error) throw error;
      setSelectedVenue(data);
      setShowNewVenue(false);
      setNewVenue({ name: '', street_address: '', city: '', state: '', zip: '', region: '' });
    } catch (err) {
      console.error('Error creating venue:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Set Date & Venue</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b">
          <div className="flex items-center justify-center space-x-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
            ))}
            <div className={`w-16 h-1 rounded-full transition-all ${step > 1 ? 'bg-rose-500' : 'bg-gray-200'}`} />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <>
              <Input
                label="Event Date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                icon={Calendar}
                required
              />
              <Input
                label="Start Time"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                icon={Clock}
                required
              />
              {endTime && (
                <div className="text-sm text-gray-600">
                  <strong>End Time:</strong> {new Date(`2000-01-01T${endTime}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setStep(2)}
                  disabled={!eventDate || !eventTime}
                  icon={ChevronRight}
                >
                  Next: Venue
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {selectedVenue ? (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{selectedVenue.name}</h4>
                      <p className="text-sm text-gray-600">
                        {selectedVenue.street_address && `${selectedVenue.street_address}, `}
                        {selectedVenue.city}, {selectedVenue.state} {selectedVenue.zip}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedVenue(null)}>
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search venues..."
                      value={venueSearch}
                      onChange={(e) => setVenueSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {loading && (
                    <div className="text-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                  )}

                  {venues.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {venues.map((venue) => (
                        <button
                          key={venue.id}
                          onClick={() => setSelectedVenue(venue)}
                          className="w-full text-left p-3 border rounded-lg hover:bg-rose-50 hover:border-rose-300 transition"
                        >
                          <div className="font-medium">{venue.name}</div>
                          <div className="text-sm text-gray-600">
                            {venue.city}, {venue.state}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      icon={Plus}
                      onClick={() => setShowNewVenue(true)}
                    >
                      Add New Venue
                    </Button>
                  </div>
                </>
              )}

              {showNewVenue && (
                <Card className="p-4 mt-4 border border-blue-200 bg-blue-50">
                  <h4 className="font-semibold mb-3">New Venue</h4>
                  <div className="space-y-3">
                    <Input
                      label="Name"
                      value={newVenue.name}
                      onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Address"
                      value={newVenue.street_address}
                      onChange={(e) => setNewVenue({ ...newVenue, street_address: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="City"
                        value={newVenue.city}
                        onChange={(e) => setNewVenue({ ...newVenue, city: e.target.value })}
                      />
                      <Input
                        label="State"
                        value={newVenue.state}
                        onChange={(e) => setNewVenue({ ...newVenue, state: e.target.value })}
                      />
                    </div>
                    <Input
                      label="ZIP"
                      value={newVenue.zip}
                      onChange={(e) => setNewVenue({ ...newVenue, zip: e.target.value })}
                    />
                    <Input
                      label="Region"
                      value={newVenue.region}
                      onChange={(e) => setNewVenue({ ...newVenue, region: e.target.value })}
                      required
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowNewVenue(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleCreateVenue}
                        disabled={!newVenue.name || !newVenue.region}
                      >
                        Save Venue
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)} icon={ChevronLeft}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!selectedVenue}
                >
                  Save & Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};