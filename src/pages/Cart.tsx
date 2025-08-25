import React, { useEffect } from 'react';
import { ShoppingCart, Calendar, MapPin, User, ArrowRight, Trash2, Edit, Plus, Check, Clock, Star, MessageCircle, Save, X, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useCart } from '../context/CartContext';
import { useRecommendedVendors, useVenues } from '../hooks/useSupabase';
import { Vendor } from '../types/booking';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Venue } from '../types/booking';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, removeItem, updateItem, clearCart } = useCart();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [selectingVendorForItem, setSelectingVendorForItem] = useState<string | null>(
    location.state?.selectVendorForItem || null
  );
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedItemForVendor, setSelectedItemForVendor] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    eventDate: '',
    eventTime: '',
    venue: '',
    notes: ''
  });
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedItemForVenue, setSelectedItemForVenue] = useState<string | null>(null);
  const [venueSearch, setVenueSearch] = useState('');
  const [showVenueForm, setShowVenueForm] = useState(false);
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

  // Get vendors for the item we're selecting a vendor for
  const itemForVendorSelection = state.items.find(item => item.id === selectingVendorForItem);
  const { vendors: availableVendors, loading: vendorsLoading } = useRecommendedVendors({
    servicePackageId: itemForVendorSelection?.package.id || '',
    eventDate: itemForVendorSelection?.eventDate || '',
    region: itemForVendorSelection?.venue?.region || '',
    languages: [],
    styles: [],
    vibes: []
  });

  // Get venues for venue selection
  const { venues, loading: venuesLoading } = useVenues(venueSearch);

  const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT'];

  const checkVendorAvailability = async (vendorId: string, eventDate: string): Promise<boolean> => {
    if (!supabase || !isSupabaseConfigured()) {
      // Mock availability check for demo - assume available
      return true;
    }

    try {
      // Check if vendor has any events on the selected date
      const startOfDay = new Date(eventDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(eventDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: conflictingEvents, error } = await supabase
        .from('events')
        .select('id, start_time, end_time, title')
        .eq('vendor_id', vendorId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());

      if (error) {
        console.error('Error checking vendor availability:', error);
        throw error;
      }

      // If there are any events on this date, vendor is not available
      return conflictingEvents.length === 0;
    } catch (error) {
      console.error('Error checking vendor availability:', error);
      throw error;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return '📸';
      case 'Videography': return '🎥';
      case 'DJ Services': return '🎵';
      case 'Live Musician': return '🎼';
      case 'Coordination': return '👰';
      case 'Planning': return '📅';
      default: return '💍';
    }
  };

  const handleVenueSelect = async (venue: Venue, itemId: string) => {
    updateItem(itemId, { 
      venue: {
        id: venue.id,
        name: venue.name,
        city: venue.city,
        state: venue.state,
        region: venue.region
      }
    });
    setShowVenueModal(false);
    setSelectedItemForVenue(null);
    setVenueSearch('');
    setShowVenueForm(false);
  };

  const handleCreateVenue = async (itemId: string) => {
    if (!newVenue.name || !newVenue.region) {
      setAvailabilityError('Please fill in venue name and region');
      return;
    }

    if (!supabase || !isSupabaseConfigured()) {
      // Mock venue creation for demo
      const venue: Venue = {
        id: `temp-${Date.now()}`,
        name: newVenue.name,
        street_address: newVenue.street_address,
        city: newVenue.city,
        state: newVenue.state,
        zip: newVenue.zip,
        region: newVenue.region,
        contact_name: newVenue.contact_name,
        phone: newVenue.phone,
        email: newVenue.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await handleVenueSelect(venue, itemId);
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
      const { data, error } = await supabase
        .from('venues')
        .insert([{
          name: newVenue.name,
          street_address: newVenue.street_address || null,
          city: newVenue.city || null,
          state: newVenue.state || null,
          zip: newVenue.zip || null,
          region: newVenue.region,
          contact_name: newVenue.contact_name || null,
          phone: newVenue.phone || null,
          email: newVenue.email || null
        }])
        .select()
        .single();

      if (error) throw error;

      await handleVenueSelect(data, itemId);
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

  const handleChooseVenue = (itemId: string) => {
    setSelectedItemForVenue(itemId);
    setShowVenueModal(true);
    setVenueSearch('');
    setShowVenueForm(false);
    setAvailabilityError(null);
  };

  const handleVendorSelect = (vendor: Vendor) => {
    if (!selectingVendorForItem) return;

    const item = state.items.find(i => i.id === selectingVendorForItem);
    if (!item) return;

    // Check if event date is set
    if (!item.eventDate) {
      setAvailabilityError('Please set an event date first before choosing a vendor.');
      return;
    }

    if (!item.venue || !item.venue.region) {
      setAvailabilityError('Please select a venue first before choosing a vendor.');
      return;
    }

    // Check vendor availability
    setCheckingAvailability(true);
    setAvailabilityError(null);

    checkVendorAvailability(vendor.id, item.eventDate)
      .then((isAvailable) => {
        if (isAvailable) {
          updateItem(selectingVendorForItem, { vendor });
          setSelectingVendorForItem(null);
          setShowVendorModal(false);
          setAvailabilityError(null);
        } else {
          setAvailabilityError(`${vendor.name} is not available on ${new Date(item.eventDate!).toLocaleDateString()}. Please choose a different vendor or change your event date.`);
        }
      })
      .catch((error) => {
        console.error('Error checking availability:', error);
        setAvailabilityError('Unable to check vendor availability. Please try again.');
      })
      .finally(() => {
        setCheckingAvailability(false);
      });
  };

  const handleChooseVendorWithDateCheck = (itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    if (!item.eventDate) {
      setAvailabilityError('Please set an event date first before choosing a vendor.');
      // Focus on the item that needs a date
      const element = document.getElementById(`item-${itemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!item.venue || !item.venue.region) {
      setAvailabilityError('Please select a venue first before choosing a vendor.');
      const element = document.getElementById(`item-${itemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSelectedItemForVendor(itemId);
    setSelectingVendorForItem(itemId);
    setShowVendorModal(true);
    setAvailabilityError(null);
  };

  const handleChooseVendor = (itemId: string) => {
    setSelectedItemForVendor(itemId);
    setSelectingVendorForItem(itemId);
    setShowVendorModal(true);
  };

  const calculateEndTime = (startTime: string, hourAmount?: number) => {
    if (!startTime || !hourAmount) return '';
    
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate.getTime() + (hourAmount * 60 * 60 * 1000));
      
      return endDate.toTimeString().slice(0, 5); // HH:MM format
    } catch (error) {
      console.error('Error calculating end time:', error);
      return '';
    }
  };

  const startEditing = (item: any) => {
    setEditingItem(item.id);
    setEditForm({
      eventDate: item.eventDate || '',
      eventTime: item.eventTime || '',
      venue: item.venue?.name || '',
      notes: item.notes || ''
    });
  };

  const saveEdit = (itemId: string) => {
    const endTime = calculateEndTime(editForm.eventTime, state.items.find(i => i.id === itemId)?.package.hour_amount);
    
    updateItem(itemId, {
      eventDate: editForm.eventDate || undefined,
      eventTime: editForm.eventTime || undefined,
      endTime: endTime || undefined,
      venue: editForm.venue ? { 
        id: 'temp-venue', 
        name: editForm.venue 
      } : undefined,
      notes: editForm.notes || undefined
    });
    
    setEditingItem(null);
    setEditForm({ eventDate: '', eventTime: '', venue: '', notes: '' });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({ eventDate: '', eventTime: '', venue: '', notes: '' });
  };
  const handlePickForMe = (itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    // Navigate to vendor recommendation flow
    navigate('/booking/vendor-recommendation', {
      state: {
        selectedPackage: item.package,
        selectedServices: [item.package.service_type],
        currentServiceIndex: 0,
        eventDate: item.eventDate,
        venue: item.venue,
        returnToCart: true
      }
    });
  };

  const handleProceedToCheckout = () => {
    // Check if all items have vendors selected
    const itemsWithoutVendors = state.items.filter(item => !item.vendor);
    
    if (itemsWithoutVendors.length > 0) {
      // Focus on first item without vendor
      setSelectingVendorForItem(itemsWithoutVendors[0].id);
      setShowVendorModal(true);
      return;
    }

    // All items have vendors, proceed to checkout
    navigate('/checkout', {
      state: {
        cartItems: state.items,
        totalAmount: state.totalAmount
      }
    });
  };

  const incompleteItems = state.items.filter(item => !item.vendor);
  const completeItems = state.items.filter(item => item.vendor);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Wedding Cart</h1>
              <p className="text-gray-600">
                Review your selected packages and choose your vendors
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/search')}
              >
                Continue Shopping
              </Button>
              {state.items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear Cart
                </Button>
              )}
            </div>
          </div>
        </div>

        {state.items.length === 0 ? (
          /* Empty Cart */
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">
              Start browsing our amazing wedding services to build your perfect day
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/search')}
            >
              Browse Services
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items Needing Vendors */}
              {incompleteItems.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Choose Your Vendors ({incompleteItems.length})
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {incompleteItems.map((item) => (
                      <Card key={item.id} className="p-6" id={`item-${item.id}`}>
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                            {getServiceIcon(item.package.service_type)}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {item.package.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {item.package.description}
                            </p>
                            
                            {/* Package Details */}
                            {/* Event Details Form or Display */}
                            {editingItem === item.id ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-blue-900 mb-3">Edit Event Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Input
                                    label="Event Date"
                                    type="date"
                                    value={editForm.eventDate}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, eventDate: e.target.value }))}
                                    icon={Calendar}
                                  />
                                  <Input
                                    label="Start Time"
                                    type="time"
                                    value={editForm.eventTime}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, eventTime: e.target.value }))}
                                    icon={Clock}
                                  />
                                  <div className="md:col-span-2">
                                    <Input
                                      label="Venue Name"
                                      value={item.venue?.name || ''}
                                      placeholder="Click to select venue"
                                      icon={MapPin}
                                      readOnly
                                      onClick={() => handleChooseVenue(item.id)}
                                      className="cursor-pointer"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Notes
                                    </label>
                                    <textarea
                                      value={editForm.notes}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                      placeholder="Any special requests or notes..."
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                  </div>
                                </div>
                                <div className="flex space-x-3 mt-4">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon={Save}
                                    onClick={() => saveEdit(item.id)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    icon={X}
                                    onClick={cancelEdit}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <span className="font-medium">Service:</span>
                                    <span className="ml-2">{item.package.service_type}</span>
                                  </div>
                                  {item.package.hour_amount && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Clock className="w-4 h-4 mr-1" />
                                      <span>{item.package.hour_amount} hours</span>
                                    </div>
                                  )}
                                  <div className="flex items-center text-sm text-gray-600">
                                    <span className="font-medium">Price:</span>
                                    <span className="ml-2 text-lg font-bold text-gray-900">
                                      {formatPrice(item.package.price)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {item.eventDate ? (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      <span>{new Date(item.eventDate).toLocaleDateString()}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-sm text-amber-600">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      <span>Date not set</span>
                                    </div>
                                  )}
                                  
                                  {item.eventTime ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span>
                                          {new Date(`2000-01-01T${item.eventTime}`).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                          })}
                                          {item.endTime && (
                                            <span className="text-gray-500">
                                              {' - '}
                                              {new Date(`2000-01-01T${item.endTime}`).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                              })}
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-sm text-amber-600">
                                      <Clock className="w-4 h-4 mr-1" />
                                      <span>Time not set</span>
                                    </div>
                                  )}
                                  
                                  {item.venue ? (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <MapPin className="w-4 h-4 mr-1" />
                                      <span>{item.venue.name} ({item.venue.region})</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-sm text-amber-600">
                                      <MapPin className="w-4 h-4 mr-1" />
                                      <span>Venue not set</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Event Details Section */}
                            {!editingItem || editingItem !== item.id ? (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-gray-900">Event Details</h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    icon={Edit}
                                    onClick={() => startEditing(item)}
                                  >
                                    Edit
                                  </Button>
                                </div>
                                
                                {!item.eventDate && !item.eventTime && !item.venue ? (
                                  <div className="text-center py-4">
                                    <p className="text-amber-600 text-sm mb-3">Event details needed</p>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => startEditing(item)}
                                    >
                                      Add Event Details
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-2 text-sm">
                                    {item.eventDate && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">{new Date(item.eventDate).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                    {item.eventTime && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Time:</span>
                                        <span className="font-medium">
                                          {new Date(`2000-01-01T${item.eventTime}`).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                          })}
                                          {item.endTime && (
                                            <span className="text-gray-500">
                                              {' - '}
                                              {new Date(`2000-01-01T${item.endTime}`).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                              })}
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {item.venue && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Venue:</span>
                                        <span className="font-medium">{item.venue.name}</span>
                                      </div>
                                    )}
                                    {item.venue?.region && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Region:</span>
                                        <span className="font-medium">{item.venue.region}</span>
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Notes:</span>
                                        <span className="font-medium text-xs">{item.notes}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {/* Venue Selection */}
                            {!item.venue && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-blue-900 mb-3">Select Venue</h4>
                                <p className="text-sm text-blue-800 mb-3">
                                  Choose your venue to find vendors in your area
                                </p>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleChooseVenue(item.id)}
                                  icon={MapPin}
                                >
                                  Choose Venue
                                </Button>
                              </div>
                            )}

                            {/* Vendor Selection */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-amber-900 mb-3">Choose Your Vendor</h4>
                              {(!item.eventDate || !item.venue) && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                  <p className="text-sm text-red-800">
                                    ⚠️ Please set an event date and venue first before choosing a vendor
                                  </p>
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleChooseVendorWithDateCheck(item.id)}
                                  className="flex-1"
                                  disabled={!item.eventDate || !item.venue}
                                >
                                  Browse Vendors
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePickForMe(item.id)}
                                  className="flex-1"
                                  disabled={!item.eventDate || !item.venue}
                                >
                                  Pick For Me
                                </Button>
                              </div>
                            </div>

                            {/* Features */}
                            {item.package.features && item.package.features.length > 0 && (
                              <div className="mb-4">
                                <h5 className="font-medium text-gray-900 mb-2">Package Features:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {item.package.features.slice(0, 3).map((feature, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                      <Check className="w-3 h-3 mr-1" />
                                      {feature}
                                    </span>
                                  ))}
                                  {item.package.features.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                      +{item.package.features.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Items */}
              {completeItems.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Ready to Book ({completeItems.length})
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {completeItems.map((item) => (
                      <Card key={item.id} className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                            {getServiceIcon(item.package.service_type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {item.package.name}
                              </h3>
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600" />
                              </div>
                            </div>
                            
                            {/* Vendor Info */}
                            {item.vendor && (
                              <div className="flex items-center space-x-3 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <img
                                  src={item.vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                                  alt={item.vendor.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium text-green-900">{item.vendor.name}</h4>
                                  <div className="flex items-center text-sm text-green-700">
                                    {item.vendor.rating && (
                                      <>
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                                        <span>{item.vendor.rating}</span>
                                        <span className="mx-2">•</span>
                                      </>
                                    )}
                                    <span>{item.vendor.years_experience} years experience</span>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleChooseVendor(item.id)}
                                >
                                  Change
                                </Button>
                              </div>
                            )}

                            {/* Event Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                {item.eventDate && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>
                                      {new Date(item.eventDate).toLocaleDateString()}
                                      {item.eventTime && ` at ${item.eventTime}`}
                                    </span>
                                  </div>
                                )}
                                {item.venue && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span>{item.venue.name} ({item.venue.region})</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatPrice(item.package.price)}
                                </div>
                                {item.package.hour_amount && (
                                  <div className="text-sm text-gray-500">
                                    {item.package.hour_amount} hours
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Features */}
                            {item.package.features && item.package.features.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-1">
                                  {item.package.features.slice(0, 3).map((feature, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                      <Check className="w-3 h-3 mr-1" />
                                      {feature}
                                    </span>
                                  ))}
                                  {item.package.features.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                      +{item.package.features.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Add More Services */}
              <Card className="p-6 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Need More Services?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add more wedding services to create your complete package
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/search')}
                  >
                    Browse More Services
                  </Button>
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {item.package.name}
                        </h4>
                        <p className="text-xs text-gray-600">{item.package.service_type}</p>
                        {item.vendor && (
                          <p className="text-xs text-green-600">✓ Vendor selected</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatPrice(item.package.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice(state.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">Service Fee:</span>
                    <span className="font-medium">$150</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold border-t pt-3">
                    <span>Total:</span>
                    <span>{formatPrice(state.totalAmount + 15000)}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-6">
                  {incompleteItems.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                        <span className="font-medium text-amber-900">Action Required</span>
                      </div>
                      <p className="text-sm text-amber-800">
                        Choose vendors for {incompleteItems.length} service{incompleteItems.length !== 1 ? 's' : ''} to proceed
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">Ready to Book</span>
                      </div>
                      <p className="text-sm text-green-800">
                        All services have vendors selected
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleProceedToCheckout}
                    disabled={state.items.length === 0}
                  >
                    {incompleteItems.length > 0 
                      ? `Choose ${incompleteItems.length} Vendor${incompleteItems.length !== 1 ? 's' : ''}`
                      : 'Proceed to Checkout'
                    }
                  </Button>
                  
                  <div className="text-center text-xs text-gray-500">
                    Free cancellation up to 30 days before your event
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Venue Selection Modal */}
        {showVenueModal && selectedItemForVenue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Select Venue</h3>
                  <p className="text-gray-600 mt-1">Choose your event venue</p>
                </div>
                <button
                  onClick={() => {
                    setShowVenueModal(false);
                    setSelectedItemForVenue(null);
                    setVenueSearch('');
                    setShowVenueForm(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {availabilityError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{availabilityError}</p>
                  </div>
                )}

                {!showVenueForm ? (
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
                        <h4 className="font-medium text-gray-900 mb-4">Search Results</h4>
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
                                onClick={() => handleVenueSelect(venue, selectedItemForVenue!)}
                                className="p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-colors"
                              >
                                <h5 className="font-medium text-gray-900">{venue.name}</h5>
                                <p className="text-sm text-gray-600">
                                  {venue.street_address && `${venue.street_address}, `}
                                  {venue.city}, {venue.state} {venue.zip}
                                </p>
                                {venue.region && (
                                  <p className="text-sm text-rose-600 font-medium">Region: {venue.region}</p>
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
                        variant="primary"
                        icon={Plus}
                        onClick={() => setShowVenueForm(true)}
                      >
                        Add New Venue
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Add New Venue Form */
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Venue</h4>
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
                        onClick={() => handleCreateVenue(selectedItemForVenue!)}
                        disabled={!newVenue.name || !newVenue.region}
                      >
                        Add Venue
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Vendor Selection Modal */}
        {showVendorModal && itemForVendorSelection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Choose {itemForVendorSelection.package.service_type} Vendor
                  </h3>
                  <p className="text-gray-600 mt-1">
                    For {itemForVendorSelection.package.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowVendorModal(false);
                    setSelectingVendorForItem(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {availabilityError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{availabilityError}</p>
                  </div>
                )}

                {vendorsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading available vendors...</p>
                  </div>
                ) : availableVendors.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No vendors available</h4>
                    <p className="text-gray-600 mb-6">
                      No vendors are currently available for this package and date.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => handlePickForMe(itemForVendorSelection.id)}
                    >
                      Let Us Find Options
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableVendors.map((vendor) => (
                      <Card key={vendor.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start space-x-4 mb-4">
                          <img
                            src={vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                            alt={vendor.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{vendor.name}</h4>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              {vendor.rating && (
                                <>
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                  <span className="mr-2">{vendor.rating}</span>
                                </>
                              )}
                              <span>{vendor.years_experience} years experience</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {vendor.profile || `Professional ${itemForVendorSelection.package.service_type.toLowerCase()} specialist`}
                            </p>
                          </div>
                        </div>

                        {vendor.specialties && vendor.specialties.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {vendor.specialties.slice(0, 3).map((specialty, index) => (
                                <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
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

                        <div className="flex space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleVendorSelect(vendor)}
                            disabled={checkingAvailability}
                            loading={checkingAvailability}
                          >
                            {checkingAvailability ? 'Checking Availability...' : 'Select Vendor'}
                          </Button>
                          <Button
                            variant="outline"
                            icon={MessageCircle}
                            size="sm"
                          >
                            Message
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};