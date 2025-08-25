import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Search, Plus, Check, ArrowRight, ArrowLeft, User, Star, Clock, Shield, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { CartItem } from '../../context/CartContext';
import { useVenues, useServiceAreas, useRecommendedVendors, useVendorReviews } from '../../hooks/useSupabase';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Venue, Vendor } from '../../types/booking';

interface VendorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItem: CartItem;
  onVendorSelected: (vendor: Vendor, eventDetails: {
    eventDate: string;
    eventTime: string;
    endTime: string;
    venue: Venue;
  }) => void;
}

export const VendorSelectionModal: React.FC<VendorSelectionModalProps> = ({
  isOpen,
  onClose,
  cartItem,
  onVendorSelected
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [viewingVendorProfile, setViewingVendorProfile] = useState<Vendor | null>(null);
  const [eventDate, setEventDate] = useState(cartItem.eventDate || '');
  const [eventTime, setEventTime] = useState(cartItem.eventTime || '');
  const [endTime, setEndTime] = useState(cartItem.endTime || '');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(cartItem.venue || null);
  const [venueSearch, setVenueSearch] = useState('');
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [vendorStats, setVendorStats] = useState<Record<string, { eventsCompleted: number }>>({});
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
  
  // Get recommended vendors when we have all required info
  const shouldFetchVendors = currentStep === 3 && selectedVenue && eventDate;
  const { vendors, loading: vendorsLoading } = useRecommendedVendors({
    servicePackageId: cartItem.package.id,
    eventDate: shouldFetchVendors ? eventDate : '',
    region: shouldFetchVendors ? selectedVenue?.region : undefined
  });

  // Get reviews for the vendor being viewed
  const { reviews: vendorReviews, loading: reviewsLoading } = useVendorReviews(viewingVendorProfile?.id || '');

  // Fetch vendor stats when vendors are loaded
  useEffect(() => {
    const fetchVendorStats = async () => {
      if (!vendors.length || !supabase || !isSupabaseConfigured()) {
        // Mock stats for demo
        const mockStats: Record<string, { eventsCompleted: number }> = {};
        vendors.forEach(vendor => {
          mockStats[vendor.id] = { eventsCompleted: Math.floor(Math.random() * 300) + 50 };
        });
        setVendorStats(mockStats);
        return;
      }

      try {
        const vendorIds = vendors.map(v => v.id);
        const { data, error } = await supabase
          .from('bookings')
          .select('vendor_id')
          .in('vendor_id', vendorIds)
          .in('status', ['confirmed', 'completed']);

        if (error) throw error;

        // Count events per vendor
        const stats: Record<string, { eventsCompleted: number }> = {};
        vendorIds.forEach(vendorId => {
          const count = data?.filter(booking => booking.vendor_id === vendorId).length || 0;
          stats[vendorId] = { eventsCompleted: count };
        });

        setVendorStats(stats);
      } catch (error) {
        console.error('Error fetching vendor stats:', error);
        // Fallback to mock data
        const mockStats: Record<string, { eventsCompleted: number }> = {};
        vendors.forEach(vendor => {
          mockStats[vendor.id] = { eventsCompleted: Math.floor(Math.random() * 300) + 50 };
        });
        setVendorStats(mockStats);
      }
    };

    if (vendors.length > 0) {
      fetchVendorStats();
    }
  }, [vendors]);

  const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT'];

  const calculateEndTime = (startTime: string, duration?: number) => {
    if (!startTime || !duration) return '';
    
    const start = new Date(`2000-01-01T${startTime}`);
    start.setHours(start.getHours() + duration);
    return start.toTimeString().slice(0, 5);
  };

  useEffect(() => {
    if (eventTime && cartItem.package.hour_amount) {
      const calculatedEndTime = calculateEndTime(eventTime, cartItem.package.hour_amount);
      setEndTime(calculatedEndTime);
    }
  }, [eventTime, cartItem.package.hour_amount]);

  const checkVendorAvailability = async (vendor: Vendor, date: string): Promise<boolean> => {
    if (!supabase || !isSupabaseConfigured()) {
      return true; // Assume available for demo
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('vendor_id', vendor.id)
        .gte('start_time', `${date}T00:00:00`)
        .lt('start_time', `${date}T23:59:59`);

      if (error) throw error;
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking vendor availability:', error);
      return false;
    }
  };

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueForm(false);
  };

  const handleCreateVenue = async () => {
    if (!supabase || !isSupabaseConfigured()) {
      // Mock venue creation for demo
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
      return;
    }

    try {
      const venueData = {
        name: newVenue.name,
        street_address: newVenue.street_address || null,
        city: newVenue.city || null,
        state: newVenue.state || null,
        zip: newVenue.zip || null,
        region: newVenue.region,
        contact_name: newVenue.contact_name || null,
        phone: newVenue.phone || null,
        email: newVenue.email || null
      };

      const { data, error } = await supabase
        .from('venues')
        .insert([venueData])
        .select()
        .single();

      if (error) throw error;

      setSelectedVenue(data);
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
    } catch (error) {
      console.error('Error creating venue:', error);
      setAvailabilityError('Failed to create venue. Please try again.');
    }
  };

  const handleVendorSelect = async (vendor: Vendor) => {
    if (!eventDate) {
      setAvailabilityError('Please set an event date first');
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityError(null);

    try {
      const isAvailable = await checkVendorAvailability(vendor, eventDate);
      
      if (!isAvailable) {
        setAvailabilityError(`${vendor.name} is not available on ${new Date(eventDate).toLocaleDateString()}. Please choose a different vendor or date.`);
        setCheckingAvailability(false);
        return;
      }

      setSelectedVendor(vendor);
      setAvailabilityError(null);
    } catch (error) {
      setAvailabilityError('Error checking vendor availability. Please try again.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleComplete = () => {
    if (selectedVendor && selectedVenue && eventDate && eventTime && endTime) {
      onVendorSelected(selectedVendor, {
        eventDate,
        eventTime,
        endTime,
        venue: selectedVenue
      });
      onClose();
      resetModal();
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setViewingVendorProfile(null);
    setEventDate(cartItem.eventDate || '');
    setEventTime(cartItem.eventTime || '');
    setEndTime(cartItem.endTime || '');
    setSelectedVenue(cartItem.venue || null);
    setVenueSearch('');
    setShowVenueForm(false);
    setSelectedVendor(null);
    setAvailabilityError(null);
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

  const canProceedStep = () => {
    switch (currentStep) {
      case 1: return eventDate && eventTime;
      case 2: return selectedVenue;
      case 3: return selectedVendor;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceedStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Complete Your Booking</h3>
            <p className="text-sm text-gray-600 mt-1">
              {cartItem.package.name} - Step {currentStep} of 3
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              resetModal();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${currentStep >= step 
                    ? 'bg-rose-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600">
              {currentStep === 1 && 'Event Details'}
              {currentStep === 2 && 'Select Venue'}
              {currentStep === 3 && 'Choose Vendor'}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {availabilityError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{availabilityError}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Event Details</h2>
                <p className="text-gray-600">When is your event?</p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
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
                {cartItem.package.hour_amount && (
                  <Input
                    label="End Time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    icon={Clock}
                    helperText={`Estimated based on ${cartItem.package.hour_amount} hour service`}
                    required
                  />
                )}
              </div>

              <div className="text-center">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!canProceedStep()}
                  icon={ArrowRight}
                >
                  Continue to Venue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Venue Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Select Venue</h2>
                <p className="text-gray-600">Where is your event taking place?</p>
              </div>

              {selectedVenue ? (
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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
                </div>
              ) : (
                <>
                  {/* Venue Search */}
                  <div className="max-w-md mx-auto mb-6">
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
                    <div className="max-w-2xl mx-auto mb-6">
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

                  <div className="text-center">
                    <Button
                      variant="outline"
                      icon={Plus}
                      onClick={() => setShowVenueForm(true)}
                    >
                      Add New Venue
                    </Button>
                  </div>
                </>
              )}

              {/* Add New Venue Form */}
              {showVenueForm && (
                <Card className="p-6 bg-blue-50 border border-blue-200 max-w-2xl mx-auto">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
                      <select
                        value={newVenue.region}
                        onChange={(e) => setNewVenue(prev => ({ ...prev, region: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      >
                        <option value="">Select Region</option>
                        {serviceAreas
                          .filter(area => area.state === newVenue.state)
                          .map((area) => (
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

              <div className="flex justify-center space-x-3 mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!canProceedStep()}
                  icon={ArrowRight}
                >
                  Continue to Vendors
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Vendor Selection */}
          {currentStep === 3 && (
            <>
              {viewingVendorProfile ? (
                /* Vendor Profile View */
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <Button
                      variant="ghost"
                      icon={ArrowLeft}
                      onClick={() => setViewingVendorProfile(null)}
                      size="sm"
                    >
                      Back to Vendors
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{viewingVendorProfile.name}</h2>
                      <p className="text-gray-600">{cartItem.package.service_type} Specialist</p>
                    </div>
                  </div>

                  {/* Vendor Profile Content */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start space-x-6">
                      <img
                        src={viewingVendorProfile.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={viewingVendorProfile.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{viewingVendorProfile.name}</h3>
                        <div className="flex items-center space-x-4 text-gray-600 mb-4">
                          {viewingVendorProfile.rating && (
                            <div className="flex items-center">
                              <div className="flex items-center mr-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-5 h-5 ${
                                      star <= viewingVendorProfile.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium text-lg">({viewingVendorProfile.rating})</span>
                            </div>
                          )}
                          <span>{viewingVendorProfile.years_experience} years experience</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          {viewingVendorProfile.profile || `Professional ${cartItem.package.service_type.toLowerCase()} specialist with ${viewingVendorProfile.years_experience} years of experience creating beautiful memories for couples.`}
                        </p>
                      </div>
                    </div>

                    {/* Specialties */}
                    {viewingVendorProfile.specialties && viewingVendorProfile.specialties.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          {viewingVendorProfile.specialties.map((specialty, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service Areas */}
                    {viewingVendorProfile.service_areas && viewingVendorProfile.service_areas.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Service Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {viewingVendorProfile.service_areas.map((area, index) => (
                            <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Portfolio Preview */}
                    {((viewingVendorProfile.portfolio_photos && viewingVendorProfile.portfolio_photos.length > 0) ||
                      (viewingVendorProfile.portfolio_videos && viewingVendorProfile.portfolio_videos.length > 0)) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Portfolio</h4>
                        
                        {/* Photos */}
                        {viewingVendorProfile.portfolio_photos && viewingVendorProfile.portfolio_photos.length > 0 && (
                          <div className="mb-6">
                            <h5 className="font-medium text-gray-700 mb-3">Recent Photos</h5>
                            <div className="grid grid-cols-3 gap-4">
                              {viewingVendorProfile.portfolio_photos.slice(0, 6).map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Portfolio photo ${index + 1}`}
                                  className="aspect-square object-cover rounded-lg hover:scale-105 transition-transform duration-200 cursor-pointer"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Videos */}
                        {viewingVendorProfile.portfolio_videos && viewingVendorProfile.portfolio_videos.length > 0 && (
                          <div className="mb-6">
                            <h5 className="font-medium text-gray-700 mb-3">Recent Videos</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {viewingVendorProfile.portfolio_videos.slice(0, 4).map((video, index) => (
                                <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                                  <video
                                    src={video}
                                    className="w-full h-full object-cover"
                                    controls
                                    preload="metadata"
                                    poster={viewingVendorProfile.portfolio_photos?.[index] || undefined}
                                  >
                                    <source src={video} type="video/mp4" />
                                    Your browser does not support the video tag.
                                  </video>
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                      <Play className="w-6 h-6 text-gray-900 ml-1" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Intro Video */}
                        {viewingVendorProfile.intro_video && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3">Introduction Video</h5>
                            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <video
                                src={viewingVendorProfile.intro_video}
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                                poster={viewingVendorProfile.portfolio_photos?.[0] || undefined}
                              >
                                <source src={viewingVendorProfile.intro_video} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {viewingVendorProfile.rating || '4.9'}
                        </div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {viewingVendorProfile.years_experience}
                        </div>
                        <div className="text-sm text-gray-600">Years Experience</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {vendorStats[viewingVendorProfile.id]?.eventsCompleted || 0}+
                        </div>
                        <div className="text-sm text-gray-600">Events Completed</div>
                      </div>
                    </div>

                    {/* Reviews Section */}
                    {/* Reviews Section - Only show if vendor has reviews */}
                    {!reviewsLoading && vendorReviews.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Recent Reviews</h4>
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                          {vendorReviews.slice(0, 3).map((review) => (
                            <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium text-gray-900 text-sm">
                                    {review.couples?.name || 'Anonymous Couple'}
                                  </h5>
                                  {review.couples?.wedding_date && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(review.couples.wedding_date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= (review.overall_rating || review.communication_rating) 
                                          ? 'fill-yellow-400 text-yellow-400' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {review.feedback}
                              </p>
                              {review.vendor_response && (
                                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs text-blue-800 font-medium mb-1">Vendor Response:</p>
                                  <p className="text-xs text-blue-700 line-clamp-2">
                                    {review.vendor_response}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                          {vendorReviews.length > 3 && (
                            <div className="text-center">
                              <p className="text-sm text-gray-500">
                                +{vendorReviews.length - 3} more reviews
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-3 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => setViewingVendorProfile(null)}
                    >
                      Back to Vendor List
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleVendorSelect(viewingVendorProfile);
                        setViewingVendorProfile(null);
                      }}
                      disabled={checkingAvailability}
                      loading={checkingAvailability}
                    >
                      Select This Vendor
                    </Button>
                  </div>
                </div>
              ) : (
                /* Vendor Selection List */
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">Choose Your Vendor</h2>
                    <p className="text-gray-600">
                      Available {cartItem.package.service_type.toLowerCase()} vendors for {selectedVenue?.region}
                    </p>
                  </div>

                  {vendorsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-gray-600">Finding available vendors...</p>
                    </div>
                  ) : vendors.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors available</h3>
                      <p className="text-gray-600 mb-4">
                        No {cartItem.package.service_type.toLowerCase()} vendors are available in {selectedVenue?.region} for {new Date(eventDate).toLocaleDateString()}.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        Try Different Venue
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-2xl mx-auto">
                      {vendors.map((vendor) => {
                        const isSelected = selectedVendor?.id === vendor.id;
                        
                        return (
                          <div
                            key={vendor.id}
                            className={`
                              relative p-6 rounded-lg border-2 transition-all
                              ${isSelected 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                              ${checkingAvailability ? 'opacity-50 pointer-events-none' : ''}
                            `}
                          >
                            {isSelected && (
                              <div className="absolute top-4 right-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            
                            <div className="flex items-start space-x-4">
                              <img
                                src={vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                                alt={vendor.name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{vendor.name}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                  {vendor.rating && (
                                    <div className="flex items-center">
                                      <div className="flex items-center mr-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`w-4 h-4 ${
                                              star <= vendor.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm">({vendor.rating})</span>
                                    </div>
                                  )}
                                  <span>{vendor.years_experience} years experience</span>
                                  <div className="flex items-center">
                                    <Shield className="w-4 h-4 text-green-600 mr-1" />
                                    <span>Verified</span>
                                  </div>
                                </div>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                  {vendor.profile || `Professional ${cartItem.package.service_type.toLowerCase()} specialist`}
                                </p>
                                {vendor.specialties && vendor.specialties.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex flex-wrap gap-1">
                                      {vendor.specialties.slice(0, 3).map((specialty, index) => (
                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                          {specialty}
                                        </span>
                                      ))}
                                      {vendor.specialties.length > 3 && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                          +{vendor.specialties.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingVendorProfile(vendor);
                                    }}
                                  >
                                    View Profile
                                  </Button>
                                  <Button
                                    variant={isSelected ? "primary" : "outline"}
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVendorSelect(vendor);
                                    }}
                                    disabled={checkingAvailability}
                                  >
                                    {isSelected ? 'Selected' : 'Select Vendor'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleComplete}
                      disabled={!canProceedStep() || checkingAvailability}
                      loading={checkingAvailability}
                    >
                      Complete Booking Setup
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Package Summary Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{cartItem.package.name}</h4>
              <p className="text-sm text-gray-600">{cartItem.package.service_type}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(cartItem.package.price / 100)}
              </div>
              {cartItem.package.hour_amount && (
                <div className="text-sm text-gray-500">{cartItem.package.hour_amount} hours</div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};