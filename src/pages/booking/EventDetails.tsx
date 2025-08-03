import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Search, Plus, Check, Globe, Palette, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useBooking } from '../../context/BookingContext';
import { useVenues, useServiceAreas, useLanguages, useStyleTags, useVibeTags } from '../../hooks/useSupabase';
import { Venue } from '../../types/booking';

export const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setEventDetails } = useBooking();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventDate, setEventDate] = useState(state.eventDate || '');
  const [eventTime, setEventTime] = useState(state.eventTime || '');
  const [venueSearch, setVenueSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(state.venue || null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [showRegionOnly, setShowRegionOnly] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<number[]>([]);
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

  // Get data from previous steps
  const selectedPackage = location.state?.selectedPackage;
  const selectedServices = location.state?.selectedServices || state.selectedServices || [];
  const currentServiceIndex = location.state?.currentServiceIndex || 0;
  const currentService = selectedServices[currentServiceIndex];
  const eventType = state.eventType || 'Wedding';

  // Hooks for data
  const { venues, loading: venuesLoading } = useVenues(venueSearch);
  const { serviceAreas, loading: serviceAreasLoading } = useServiceAreas(newVenue.state);
  const { languages, loading: languagesLoading } = useLanguages();
  const { styleTags, loading: styleTagsLoading } = useStyleTags();
  const { vibeTags, loading: vibeTagsLoading } = useVibeTags();

  const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT'];

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueForm(false);
    setShowRegionOnly(false);
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
      region: newVenue.region,
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
      region: '',
      contact_name: '',
      phone: '',
      email: ''
    });
  };

  const handleLanguageToggle = (languageId: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageId)
        ? prev.filter(id => id !== languageId)
        : [...prev, languageId]
    );
  };

  const handleStyleToggle = (styleId: number) => {
    setSelectedStyles(prev => 
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const handleVibeToggle = (vibeId: number) => {
    setSelectedVibes(prev => 
      prev.includes(vibeId)
        ? prev.filter(id => id !== vibeId)
        : [...prev, vibeId]
    );
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleContinue = () => {
    // Save all the event details and preferences
    const eventDetails = {
      eventDate,
      eventTime,
      venue: selectedVenue,
      region: selectedVenue?.region || selectedRegion,
      languages: selectedLanguages,
      styles: selectedStyles,
      vibes: selectedVibes
    };

    navigate('/booking/vendor-recommendation', {
      state: {
        ...eventDetails,
        selectedPackage,
        selectedServices,
        currentServiceIndex,
        currentService
      }
    });
  };

  const canProceedStep = () => {
    switch (currentStep) {
      case 1: return selectedVenue || selectedRegion;
      case 2: return eventDate;
      case 3: return selectedLanguages.length > 0;
      case 4: return selectedStyles.length > 0;
      case 5: return selectedVibes.length > 0;
      default: return false;
    }
  };

  const stepTitles = {
    1: 'Where is your event?',
    2: `When is your ${eventType.toLowerCase()}?`,
    3: 'What languages do you prefer?',
    4: 'What style do you love?',
    5: 'What vibe are you going for?'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={handleBack}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Details</h1>
              <p className="text-gray-600 mt-1">{stepTitles[currentStep as keyof typeof stepTitles]}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${currentStep >= step 
                    ? 'bg-rose-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 5 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Venue Selection */}
        {currentStep === 1 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-rose-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Where is your {eventType.toLowerCase()}?
              </h2>
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
              /* Region Selection Only */
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
                        onClick={() => setSelectedRegion(area.region)}
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

            {/* Add New Venue Form */}
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
                    disabled={!newVenue.name || !newVenue.state || !newVenue.region}
                  >
                    Add Venue
                  </Button>
                </div>
              </Card>
            )}

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Date Selection */}
        {currentStep === 2 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                When is your {eventType.toLowerCase()}?
              </h2>
              <p className="text-gray-600">
                Select your event date and time
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
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

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Language Selection */}
        {currentStep === 3 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                What languages do you prefer?
              </h2>
              <p className="text-gray-600">
                Select the languages you'd like your vendors to speak
              </p>
            </div>

            {languagesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600">Loading languages...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {languages.map((language) => {
                  const isSelected = selectedLanguages.includes(language.id);
                  return (
                    <div
                      key={language.id}
                      onClick={() => handleLanguageToggle(language.id)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                        ${isSelected 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="font-medium text-gray-900">{language.language}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Style Selection */}
        {currentStep === 4 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                What style do you love?
              </h2>
              <p className="text-gray-600">
                Choose the photography/videography styles that speak to you
              </p>
            </div>

            {styleTagsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600">Loading styles...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {styleTags.map((style) => {
                  const isSelected = selectedStyles.includes(style.id);
                  return (
                    <div
                      key={style.id}
                      onClick={() => handleStyleToggle(style.id)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <h3 className="font-medium text-gray-900 mb-1">{style.label}</h3>
                      {style.description && (
                        <p className="text-sm text-gray-600">{style.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Vibe Selection */}
        {currentStep === 5 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                What vibe are you going for?
              </h2>
              <p className="text-gray-600">
                Select the vibes that match your {eventType.toLowerCase()} vision
              </p>
            </div>

            {vibeTagsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600">Loading vibes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {vibeTags.map((vibe) => {
                  const isSelected = selectedVibes.includes(vibe.id);
                  return (
                    <div
                      key={vibe.id}
                      onClick={() => handleVibeToggle(vibe.id)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-pink-500 bg-pink-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <h3 className="font-medium text-gray-900 mb-1">{vibe.label}</h3>
                      {vibe.description && (
                        <p className="text-sm text-gray-600">{vibe.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinue}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Find My Perfect {currentService}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};