import React, { useState } from 'react';
import { ArrowRight, MapPin, Search, Plus, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useVenues, useServiceAreas } from '../../hooks/useSupabase';
import { Venue } from '../../types/booking';

interface VenueSelectionStepProps {
  selectedVenue: Venue | null;
  selectedRegion: string;
  onVenueSelect: (venue: Venue) => void;
  onRegionSelect: (region: string) => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
}

export const VenueSelectionStep: React.FC<VenueSelectionStepProps> = ({
  selectedVenue,
  selectedRegion,
  onVenueSelect,
  onRegionSelect,
  onNext,
  onPrev,
  canProceed
}) => {
  const [venueSearch, setVenueSearch] = useState('');
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [showRegionOnly, setShowRegionOnly] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    zip: '',
    region: '',
    contact_name: '',
    phone: '',
    email: ''
  });

  const { venues, loading: venuesLoading } = useVenues(venueSearch);
  const { serviceAreas, loading: serviceAreasLoading } = useServiceAreas(newVenue.state);

  const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT'];

  const handleCreateVenue = async () => {
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
      region: newVenue.region,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    onVenueSelect(venue);
    setShowVenueForm(false);
    setNewVenue({
      name: '',
      street_address: '',
      city: '',
      state: '',
      zip: '',
      region: '',
      contact_name: '',
      phone: '',
      email: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-rose-600" />
        </div>
        <h4 className="text-2xl font-bold text-gray-900 mb-3">
          Where is your event?
        </h4>
        <p className="text-gray-600">
          Search for your venue or select a region if you're still deciding
        </p>
      </div>

      {!showRegionOnly ? (
        <>
          {selectedVenue ? (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">{selectedVenue.name}</h3>
                  <p className="text-green-700 text-sm">
                    {selectedVenue.street_address}, {selectedVenue.city}, {selectedVenue.state} {selectedVenue.zip}
                  </p>
                  {selectedVenue.region && (
                    <p className="text-green-700 text-sm">Region: {selectedVenue.region}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onVenueSelect(null as any)}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                          onClick={() => onVenueSelect(venue)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-colors"
                        >
                          <h4 className="font-medium text-gray-900">{venue.name}</h4>
                          <p className="text-sm text-gray-600">
                            {venue.street_address}, {venue.city}, {venue.state} {venue.zip}
                          </p>
                          {venue.region && (
                            <p className="text-sm text-gray-500">Region: {venue.region}</p>
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

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  icon={Plus}
                  onClick={() => setShowVenueForm(true)}
                >
                  Add New Venue
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRegionOnly(true)}
                >
                  Unsure - Just Select Region
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        <div>
          <h3 className="font-medium text-gray-900 mb-4 text-center">Select Your Region</h3>
          {serviceAreasLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">Loading regions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {serviceAreas.map((area) => (
                <div
                  key={area.id}
                  onClick={() => onRegionSelect(area.region)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                    ${selectedRegion === area.region
                      ? 'border-rose-500 bg-rose-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <h4 className="font-medium text-gray-900">{area.region}</h4>
                  <p className="text-sm text-gray-600">{area.state}</p>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowRegionOnly(false)}
            >
              Back to Venue Search
            </Button>
          </div>
        </div>
      )}

      {showVenueForm && (
        <Card className="p-6 bg-blue-50 border border-blue-200 mt-6">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                value={newVenue.state}
                onChange={(e) => setNewVenue(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <Input
              label="ZIP Code"
              value={newVenue.zip}
              onChange={(e) => setNewVenue(prev => ({ ...prev, zip: e.target.value }))}
              placeholder="12345"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <select
                value={newVenue.region}
                onChange={(e) => setNewVenue(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              >
                <option value="">Select Region</option>
                {serviceAreas.map((area) => (
                  <option key={area.id} value={area.region}>{area.region}</option>
                ))}
              </select>
            </div>
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
              disabled={!newVenue.name || !newVenue.state || !newVenue.region}
            >
              Add Venue
            </Button>
          </div>
        </Card>
      )}

      <div className="text-center mt-8">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onPrev}
          >
            Back
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onNext}
            disabled={!canProceed}
            icon={ArrowRight}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};