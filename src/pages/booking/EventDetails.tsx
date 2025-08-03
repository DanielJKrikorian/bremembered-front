import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Search, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useBooking } from '../../context/BookingContext';
import { useVenues } from '../../hooks/useSupabase';
import { Venue } from '../../types/booking';

export const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  const { state, setEventDetails } = useBooking();
  const [eventDate, setEventDate] = useState(state.eventDate || '');
  const [eventTime, setEventTime] = useState(state.eventTime || '');
  const [venueSearch, setVenueSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(state.venue || null);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    zip: '',
    contact_name: '',
    phone: '',
    email: ''
  });

  const { venues, loading: venuesLoading } = useVenues(venueSearch);

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueForm(false);
  };

  const handleCreateVenue = async () => {
    // In a real app, this would create a new venue in Supabase
    const venue: Venue = {
      id: `temp-${Date.now()}`,
      name: newVenue.name,
      street_address: newVenue.street_address,
      city: newVenue.city,
      state: newVenue.state,
      zip: newVenue.zip,
      contact_name: newVenue.contact_name,
      phone: newVenue.phone,
      email: newVenue.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setSelectedVenue(venue);
    setShowVenueForm(false);
    setNewVenue({
      name: '',
      street_address: '',
      city: '',
      state: '',
      zip: '',
      contact_name: '',
      phone: '',
      email: ''
    });
  };

  const handleContinue = () => {
    if (eventDate && eventTime && selectedVenue) {
      setEventDetails(eventDate, eventTime, selectedVenue);
      navigate('/booking/vendors');
    }
  };

  const isFormValid = eventDate && eventTime && selectedVenue;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => navigate('/booking/packages')}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Details</h1>
              <p className="text-gray-600 mt-1">When and where is your special day?</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Services</span>
            </div>
            <div className="w-16 h-1 bg-rose-500 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Packages</span>
            </div>
            <div className="w-16 h-1 bg-rose-500 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-rose-600">Event Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <span className="ml-2 text-sm text-gray-500">Vendors</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Date & Time Selection */}
          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">When is your event?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Event Date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                icon={Calendar}
                required
              />
              <Input
                label="Event Time"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                icon={Clock}
                required
              />
            </div>
          </Card>

          {/* Venue Selection */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Where is your event?</h2>
              <Button
                variant="outline"
                icon={Plus}
                onClick={() => setShowVenueForm(!showVenueForm)}
              >
                Add New Venue
              </Button>
            </div>

            {selectedVenue ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900">{selectedVenue.name}</h3>
                    <p className="text-green-700 text-sm">
                      {selectedVenue.street_address}, {selectedVenue.city}, {selectedVenue.state} {selectedVenue.zip}
                    </p>
                    {selectedVenue.contact_name && (
                      <p className="text-green-700 text-sm">
                        Contact: {selectedVenue.contact_name}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVenue(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Venue Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search venues by name or location..."
                      value={venueSearch}
                      onChange={(e) => setVenueSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Venue Results */}
                {venueSearch && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-4">Search Results</h3>
                    {venuesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">Searching venues...</p>
                      </div>
                    ) : venues.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {venues.map((venue) => (
                          <div
                            key={venue.id}
                            onClick={() => handleVenueSelect(venue)}
                            className="p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-colors"
                          >
                            <h4 className="font-medium text-gray-900">{venue.name}</h4>
                            <p className="text-sm text-gray-600">
                              {venue.street_address}, {venue.city}, {venue.state} {venue.zip}
                            </p>
                            {venue.contact_name && (
                              <p className="text-sm text-gray-500">Contact: {venue.contact_name}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No venues found. Try a different search or add a new venue.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Add New Venue Form */}
            {showVenueForm && (
              <Card className="p-6 bg-blue-50 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Add New Venue</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Venue Name"
                      value={newVenue.name}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter venue name"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Street Address"
                      value={newVenue.street_address}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, street_address: e.target.value }))}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <Input
                    label="City"
                    value={newVenue.city}
                    onChange={(e) => setNewVenue(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                  <Input
                    label="State"
                    value={newVenue.state}
                    onChange={(e) => setNewVenue(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                  />
                  <Input
                    label="ZIP Code"
                    value={newVenue.zip}
                    onChange={(e) => setNewVenue(prev => ({ ...prev, zip: e.target.value }))}
                    placeholder="12345"
                  />
                  <Input
                    label="Contact Name"
                    value={newVenue.contact_name}
                    onChange={(e) => setNewVenue(prev => ({ ...prev, contact_name: e.target.value }))}
                    placeholder="Venue coordinator name"
                  />
                  <Input
                    label="Phone"
                    value={newVenue.phone}
                    onChange={(e) => setNewVenue(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={newVenue.email}
                    onChange={(e) => setNewVenue(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="venue@example.com"
                  />
                </div>
                <div className="flex space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowVenueForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateVenue}
                    disabled={!newVenue.name}
                  >
                    Add Venue
                  </Button>
                </div>
              </Card>
            )}
          </Card>

          {/* Summary */}
          <Card className="p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Selected Services:</span>
                <span className="font-medium">{state.selectedServices.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Packages:</span>
                <span className="font-medium">{state.selectedPackages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-medium">${state.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Deposit Required:</span>
                <span className="font-medium text-rose-600">${state.depositAmount.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Continue Button */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate('/booking/packages')}
          >
            Back to Packages
          </Button>
          <Button
            variant="primary"
            icon={ArrowRight}
            onClick={handleContinue}
            disabled={!isFormValid}
          >
            Continue to Vendor Selection
          </Button>
        </div>
      </div>
    </div>
  );
};