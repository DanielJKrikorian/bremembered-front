import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, Star, MessageCircle, Download, Eye, Edit, Save, X, TrendingUp, Check, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import { VendorReviewModal } from '../components/reviews/VendorReviewModal';
import { PackageUpgradeModal } from '../components/booking/PackageUpgradeModal';

export const BookingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  const calculateEndTime = (startTime: string, hours: number) => {
    const start = new Date(`2000-01-01T${startTime}`);
    start.setHours(start.getHours() + hours);
    return start.toTimeString().slice(0, 5);
  };

  const handleStartTimeChange = (time: string) => {
    setNewStartTime(time);
    if (booking?.service_packages?.hour_amount) {
      const calculatedEndTime = calculateEndTime(time, booking.service_packages.hour_amount);
      setNewEndTime(calculatedEndTime);
    }
  };

  const handleSaveTime = async () => {
    if (!booking || !newStartTime) return;

    setSavingTime(true);
    setTimeError(null);

    if (!supabase || !isSupabaseConfigured()) {
      // Mock save for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setBooking(prev => ({
        ...prev,
        events: {
          ...prev.events,
          start_time: `${prev.events.start_time.split('T')[0]}T${newStartTime}:00Z`,
          end_time: `${prev.events.end_time.split('T')[0]}T${newEndTime}:00Z`
        }
      }));
      
      setEditingTime(false);
      setSavingTime(false);
      return;
    }

    try {
      // Update the event time
      const eventDate = booking.events.start_time.split('T')[0];
      const newStartDateTime = `${eventDate}T${newStartTime}:00Z`;
  const calculateEndTime = (startTime: string, hours: number) => {
    const start = new Date(`2000-01-01T${startTime}`);
    start.setHours(start.getHours() + hours);
    return start.toTimeString().slice(0, 5);
  };

  const handleStartTimeChange = (time: string) => {
    setNewStartTime(time);
    if (booking?.service_packages?.hour_amount) {
  const fetchBookingDetails = async () => {
    if (!id) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Mock booking for demo
      const mockBooking = {
        id: id,
        couple_id: 'mock-couple-1',
        vendor_id: 'mock-vendor-1',
        status: 'confirmed',
        amount: 250000,
        service_type: 'Photography',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        vendors: {
          id: 'mock-vendor-1',
          name: 'Elegant Moments Photography',
          profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
          rating: 4.9,
          years_experience: 10,
          phone: '(555) 123-4567'
        },
        service_packages: {
          id: 'mock-package-1',
          name: 'Premium Wedding Photography',
          description: 'Complete wedding day photography with 8 hours of coverage',
          price: 250000,
          service_type: 'Photography',
          hour_amount: 8,
          features: ['8 hours coverage', '500+ edited photos', 'Online gallery', 'Print release']
        },
        venues: {
          id: 'mock-venue-1',
          name: 'Sunset Gardens',
          street_address: '123 Garden Lane',
          city: 'Los Angeles',
          state: 'CA'
        },
        events: {
          id: 'mock-event-1',
          start_time: '2024-08-15T16:00:00Z',
          end_time: '2024-08-15T23:00:00Z',
          title: 'Sarah & Michael Wedding',
          location: 'Sunset Gardens'
        },
        couples: {
          id: 'mock-couple-1',
          name: 'Sarah & Michael',
          email: 'sarah@example.com',
          phone: '(555) 987-6543'
        }
      };
      setBooking(mockBooking);
      setLoading(false);
      return;
    }

    try {
      // Get couple ID first
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (coupleError) throw coupleError;

      // Fetch booking details
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vendors!inner(
            id,
            name,
            profile_photo,
            rating,
            years_experience,
            phone,
            user_id
          ),
          service_packages(
            id,
            name,
            description,
            price,
            service_type,
            hour_amount,
            features
          ),
          venues(
            id,
            name,
            street_address,
            city,
            state
          ),
          events(
            id,
            start_time,
            end_time,
            title,
            location
          ),
          couples(
            id,
            name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .eq('couple_id', coupleData.id)
        .single();

      if (error) throw error;
      setBooking(data);
      
      // Set initial time values
      if (data.events?.start_time) {
        const startTime = new Date(data.events.start_time);
        setNewStartTime(startTime.toTimeString().slice(0, 5));
        
        if (data.events.end_time) {
          const endTime = new Date(data.events.end_time);
          setNewEndTime(endTime.toTimeString().slice(0, 5));
        }
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime: string, hours: number) => {
    const start = new Date(`2000-01-01T${startTime}`);
    start.setHours(start.getHours() + hours);
    return start.toTimeString().slice(0, 5);
  };

  const handleStartTimeChange = (time: string) => {
    setNewStartTime(time);
    if (booking?.service_packages?.hour_amount) {
      const calculatedEndTime = calculateEndTime(time, booking.service_packages.hour_amount);
      setNewEndTime(calculatedEndTime);
    }
  };

  const handleSaveTime = async () => {
    if (!booking || !newStartTime) return;

    setSavingTime(true);
    setTimeError(null);

    if (!supabase || !isSupabaseConfigured()) {
      // Mock save for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setBooking(prev => ({
        ...prev,
        events: {
          ...prev.events,
          start_time: `${prev.events.start_time.split('T')[0]}T${newStartTime}:00Z`,
          end_time: `${prev.events.end_time.split('T')[0]}T${newEndTime}:00Z`
        }
      }));
      
      setEditingTime(false);
      setSavingTime(false);
      return;
    }

    try {
      // Update the event time
      const eventDate = booking.events.start_time.split('T')[0];
      const newStartDateTime = `${eventDate}T${newStartTime}:00Z`;
      const newEndDateTime = `${eventDate}T${newEndTime}:00Z`;

      const { error } = await supabase
        .from('events')
        .update({
          start_time: newStartDateTime,
          end_time: newEndDateTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.events.id);

      if (error) throw error;

      // Update local state
      setBooking(prev => ({
        ...prev,
        events: {
          ...prev.events,
          start_time: newStartDateTime,
          end_time: newEndDateTime
        }
      }));

      setEditingTime(false);
    } catch (err) {
      console.error('Error updating time:', err);
      setTimeError(err instanceof Error ? err.message : 'Failed to update time');
    } finally {
      setSavingTime(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDownloadContract = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SERVICE CONTRACT', 105, 30, { align: 'center' });
      
      // Contract content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      let yPos = 50;
      
      const contractText = `
Contract for ${booking.service_packages?.name || booking.service_type}

Client: ${booking.couples?.name}
Vendor: ${booking.vendors?.name}
Service: ${booking.service_packages?.name}
Amount: ${formatPrice(booking.amount)}
Date: ${booking.events?.start_time ? formatDate(booking.events.start_time) : 'TBD'}
Time: ${booking.events?.start_time ? formatTime(booking.events.start_time) : 'TBD'}
Location: ${booking.venues?.name || booking.events?.location || 'TBD'}

This contract confirms the booking of ${booking.service_type.toLowerCase()} services
for the above event details.
      `.trim();

      const lines = contractText.split('\n');
      lines.forEach(line => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 7;
      });

      doc.save(`Contract_${booking.vendors?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating contract:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view booking details.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The booking you're looking for doesn't exist."}</p>
          <Button variant="primary" onClick={() => navigate('/my-bookings')}>
            Back to My Bookings
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => navigate('/my-bookings')}
            >
              Back to My Bookings
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600 mt-1">
                {booking.service_packages?.name || booking.service_type}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Booking Overview */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    {booking.service_packages?.name || booking.service_type}
                  </h2>
                  <div className="flex items-center space-x-4 text-gray-600 mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        {booking.events?.start_time 
                          ? formatDate(booking.events.start_time)
                          : 'Date TBD'
                        }
                      </span>
                    </div>
                    {booking.venues && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{booking.venues.name}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {booking.service_packages?.description || `Professional ${booking.service_type.toLowerCase()} services for your special day.`}
                  </p>
                </div>
                <div className="text-right ml-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatPrice(booking.amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Booked {new Date(booking.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Package Features */}
              {booking.service_packages?.features && booking.service_packages.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">What's Included</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {booking.service_packages.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Modification Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Event Time</h3>
                  {!editingTime && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit}
                      onClick={() => setEditingTime(true)}
                    >
                      Change Time
                    </Button>
                  )}
                </div>

                {timeError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{timeError}</p>
                  </div>
                )}

                {editingTime ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Start Time"
                        type="time"
                        value={newStartTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        icon={Clock}
                      />
                      <Input
                        label="End Time"
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        icon={Clock}
                        helperText={`Auto-calculated based on ${booking.service_packages?.hour_amount || 8} hour service`}
                        disabled
                      />
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Save}
                        onClick={handleSaveTime}
                        loading={savingTime}
                        disabled={!newStartTime}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={X}
                        onClick={() => {
                          setEditingTime(false);
                          setTimeError(null);
                          // Reset to original values
                          if (booking.events?.start_time) {
                            const startTime = new Date(booking.events.start_time);
                            setNewStartTime(startTime.toTimeString().slice(0, 5));
                            
                            if (booking.events.end_time) {
                              const endTime = new Date(booking.events.end_time);
                              setNewEndTime(endTime.toTimeString().slice(0, 5));
                            }
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Start Time:</span>
                        <div className="font-medium text-gray-900">
                          {booking.events?.start_time ? formatTime(booking.events.start_time) : 'TBD'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">End Time:</span>
                        <div className="font-medium text-gray-900">
                          {booking.events?.end_time ? formatTime(booking.events.end_time) : 'TBD'}
                        </div>
                      </div>
                    </div>
                    {booking.service_packages?.hour_amount && (
                      <div className="mt-2 text-sm text-gray-600">
                        Duration: {booking.service_packages.hour_amount} hours
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Package Upgrade Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Package Options</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={TrendingUp}
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    Upgrade Package
                  </Button>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Current Package</span>
                  </div>
                  <p className="text-purple-800 text-sm mb-3">
                    {booking.service_packages?.name} - {formatPrice(booking.service_packages?.price || booking.amount)}
                  </p>
                  <p className="text-purple-700 text-sm">
                    Want more coverage or additional features? Upgrade your package anytime before your event.
                  </p>
                </div>
              </div>
            </Card>

            {/* Vendor Information */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Vendor</h3>
              <div className="flex items-start space-x-6">
                <img
                  src={booking.vendors?.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={booking.vendors?.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{booking.vendors?.name}</h4>
                  <div className="flex items-center space-x-4 text-gray-600 mb-4">
                    {booking.vendors?.rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>{booking.vendors.rating} rating</span>
                      </div>
                    )}
                    <span>{booking.vendors?.years_experience} years experience</span>
                    {booking.vendors?.phone && (
                      <span>{booking.vendors.phone}</span>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="primary"
                      icon={MessageCircle}
                      onClick={() => navigate('/profile?tab=messages')}
                    >
                      Message Vendor
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/vendor/${booking.vendors?.id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Event Details */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Date & Time</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {booking.events?.start_time ? formatDate(booking.events.start_time) : 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Time:</span>
                      <span className="font-medium">
                        {booking.events?.start_time ? formatTime(booking.events.start_time) : 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Time:</span>
                      <span className="font-medium">
                        {booking.events?.end_time ? formatTime(booking.events.end_time) : 'TBD'}
                      </span>
                    </div>
                    {booking.service_packages?.hour_amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{booking.service_packages.hour_amount} hours</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {booking.venues && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Venue</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">{booking.venues.name}</span>
                      </div>
                      {booking.venues.street_address && (
                        <div className="text-gray-600">
                          {booking.venues.street_address}<br />
                          {booking.venues.city}, {booking.venues.state}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  icon={MessageCircle}
                  className="w-full"
                  onClick={() => navigate('/profile?tab=messages')}
                >
                  Message Vendor
                </Button>
                <Button
                  variant="outline"
                  icon={Download}
                  className="w-full"
                  onClick={handleDownloadContract}
                >
                  Download Contract
                </Button>
                <Button
                  variant="outline"
                  icon={Eye}
                  className="w-full"
                  onClick={() => navigate('/profile?tab=gallery')}
                >
                  View Gallery
                </Button>
                {booking.status === 'completed' && (
                  <Button
                    variant="outline"
                    icon={Star}
                    className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => setShowReviewModal(true)}
                  >
                    Leave Review
                  </Button>
                )}
              </div>
            </Card>

            {/* Payment Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package Price:</span>
                  <span className="font-medium">{formatPrice(booking.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee:</span>
                  <span className="font-medium">$150</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit Paid:</span>
                  <span className="font-medium text-green-600">{formatPrice(Math.round(booking.amount * 0.5))}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Remaining Balance:</span>
                  <span className="text-red-600">{formatPrice(Math.round(booking.amount * 0.5))}</span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/profile?tab=payments')}
                >
                  Make Payment
                </Button>
              </div>
            </Card>

            {/* Booking Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-medium font-mono">#{booking.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Type:</span>
                  <span className="font-medium">{booking.service_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{new Date(booking.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{new Date(booking.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {booking.vendors && (
        <VendorReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          vendor={{
            id: booking.vendors.id,
            name: booking.vendors.name,
            profile_photo: booking.vendors.profile_photo,
            service_type: booking.service_type
          }}
          booking={{
            id: booking.id,
            service_packages: booking.service_packages
          }}
          onReviewSubmitted={() => {
            setShowReviewModal(false);
            // Could refresh booking data here if needed
          }}
        />
      )}

      {/* Package Upgrade Modal */}
      <PackageUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        booking={booking}
        onUpgradeSuccess={() => {
          setShowUpgradeModal(false);
          fetchBookingDetails(); // Refresh booking data
        }}
      />
    </div>
  );
};