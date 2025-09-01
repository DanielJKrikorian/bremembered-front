import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, Star, MessageCircle, Download, Eye, Plus, Filter, Search, Edit, Save, X, TrendingUp, Check, AlertCircle } from 'lucide-react';
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

  // Utility to format time for input fields (display in EDT)
  const formatTimeForInput = (dateString: string | null | undefined): string => {
    if (!dateString) {
      console.debug('formatTimeForInput: Missing dateString, returning 12:00', { dateString });
      return '12:00';
    }
    try {
      // Parse as UTC
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.debug('formatTimeForInput: Invalid date, returning 12:00', { dateString });
        return '12:00';
      }
      // Convert UTC to EDT
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/New_York'
      }).replace(' ', ':');
    } catch (err) {
      console.debug('formatTimeForInput: Error parsing date, returning 12:00', { dateString, error: err });
      return '12:00';
    }
  };

  // Utility to format time for non-editing display (display in EDT)
  const formatTime = (dateString: string) => {
    try {
      // Parse as UTC
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.debug('formatTime: Invalid date, returning TBD', { dateString });
        return 'TBD';
      }
      // Convert UTC to EDT
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'
      });
    } catch (err) {
      console.debug('formatTime: Error parsing date, returning TBD', { dateString, error: err });
      return 'TBD';
    }
  };

  // Utility to format date for display
  const formatDate = (dateString: string) => {
    try {
      // Parse as UTC
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.debug('formatDate: Invalid date, returning TBD', { dateString });
        return 'TBD';
      }
      // Convert UTC to EDT
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/New_York'
      });
    } catch (err) {
      console.debug('formatDate: Error parsing date, returning TBD', { dateString, error: err });
      return 'TBD';
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  const fetchBookingDetails = async () => {
    if (!id) return;

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
      const startTime = formatTimeForInput(data.events?.start_time);
      const endTime = formatTimeForInput(data.events?.end_time);
      setNewStartTime(startTime);
      setNewEndTime(endTime);
      console.debug('fetchBookingDetails: Set times', {
        start_time: data.events?.start_time,
        end_time: data.events?.end_time,
        newStartTime: startTime,
        newEndTime: endTime
      });
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime: string, hours: number) => {
    if (!startTime.match(/^\d{2}:\d{2}$/)) {
      console.debug('calculateEndTime: Invalid startTime format, returning 12:00', { startTime });
      return '12:00';
    }
    const [hoursStr, minutesStr] = startTime.split(':');
    const startHours = parseInt(hoursStr, 10);
    const startMinutes = parseInt(minutesStr, 10);
    if (isNaN(startHours) || isNaN(startMinutes)) {
      console.debug('calculateEndTime: Invalid time values, returning 12:00', { startTime });
      return '12:00';
    }
    // Add package hours directly in EDT
    const totalMinutes = startHours * 60 + startMinutes + hours * 60;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    const result = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    console.debug('calculateEndTime: Calculated end time', { startTime, hours, result });
    return result;
  };

  const handleStartTimeChange = (time: string) => {
    setNewStartTime(time);
    if (booking?.service_packages?.hour_amount && time.match(/^\d{2}:\d{2}$/)) {
      const calculatedEndTime = calculateEndTime(time, booking.service_packages.hour_amount);
      setNewEndTime(calculatedEndTime);
      console.debug('handleStartTimeChange: Calculated end time', { startTime: time, endTime: calculatedEndTime });
    } else {
      setNewEndTime('12:00');
      console.debug('handleStartTimeChange: Invalid start time, reset end time', { startTime: time });
    }
  };

  const handleSaveTime = async () => {
    if (!booking || !newStartTime || !newEndTime) {
      setTimeError('Please provide both start and end times.');
      setSavingTime(false);
      console.debug('handleSaveTime: Missing inputs', { newStartTime, newEndTime });
      return;
    }
    if (!newStartTime.match(/^\d{2}:\d{2}$/) || !newEndTime.match(/^\d{2}:\d{2}$/)) {
      setTimeError('Invalid time format. Please use HH:mm.');
      setSavingTime(false);
      console.debug('handleSaveTime: Invalid time format', { newStartTime, newEndTime });
      return;
    }
    setSavingTime(true);
    setTimeError(null);

    try {
      // Get the event date (parse UTC time)
      let eventDate = '2025-08-09'; // Fallback
      const eventDateRaw = booking.events?.start_time;
      if (eventDateRaw) {
        try {
          const date = new Date(eventDateRaw);
          if (!isNaN(date.getTime())) {
            eventDate = date.toISOString().split('T')[0];
          }
        } catch (err) {
          console.debug('handleSaveTime: Error parsing event date, using fallback', { eventDateRaw, error: err });
        }
      }
      console.debug('handleSaveTime: Parsed event date', { eventDateRaw, eventDate });

      // Parse input times as EDT (UTC-4)
      const localStartDateTime = new Date(`${eventDate}T${newStartTime}:00-04:00`);
      const localEndDateTime = new Date(`${eventDate}T${newEndTime}:00-04:00`);

      // Validate dates
      if (isNaN(localStartDateTime.getTime()) || isNaN(localEndDateTime.getTime())) {
        setTimeError('Invalid time values provided.');
        setSavingTime(false);
        console.debug('handleSaveTime: Invalid date objects', { newStartTime, newEndTime, eventDate });
        return;
      }

      // Validate that end time is after start time
      if (localEndDateTime <= localStartDateTime) {
        setTimeError('End time must be after start time.');
        setSavingTime(false);
        console.debug('handleSaveTime: End time not after start time', { newStartTime, newEndTime });
        return;
      }

      // Format UTC times for storage (YYYY-MM-DD HH:mm:ss+00)
      const newStartDateTime = localStartDateTime.toISOString().replace('T', ' ').slice(0, 19) + '+00';
      const newEndDateTime = localEndDateTime.toISOString().replace('T', ' ').slice(0, 19) + '+00';
      console.debug('handleSaveTime: Saving times', { newStartDateTime, newEndDateTime });

      // Update the event time in Supabase
      const { error } = await supabase
        .from('events')
        .update({
          start_time: newStartDateTime,
          end_time: newEndDateTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.events.id);

      if (error) throw error;

      // Update local state with UTC times
      setBooking(prev => ({
        ...prev,
        events: {
          ...prev.events,
          start_time: newStartDateTime,
          end_time: newEndDateTime
        }
      }));

      // Update input fields to reflect saved times in EDT
      setNewStartTime(formatTimeForInput(newStartDateTime));
      setNewEndTime(formatTimeForInput(newEndDateTime));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-200 border-red-200';
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
Wedding Contract for ${booking.service_packages?.name || booking.service_type}
Client: ${booking.couples?.name}
Vendor: ${booking.vendors?.name}
Service: ${booking.service_packages?.name}
Amount: ${formatPrice(booking.amount)}
Date: ${booking.events?.start_time ? formatDate(booking.events.start_time) : 'TBD'}
Time: ${booking.events?.start_time ? formatTime(booking.events.start_time) : 'TBD'}
Location: ${booking.venues?.name || booking.events?.location || 'TBD'}
This contract confirms the booking of ${booking.service_type.toLowerCase()} services
for the above wedding details.
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
              <h1 className="text-3xl font-bold text-gray-900">Wedding Details</h1>
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
                  <h3 className="font-semibold text-gray-900">Wedding Time</h3>
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
                        helperText={`Auto-calculated based on ${booking.service_packages?.hour_amount || 4} hour service`}
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
                        disabled={!newStartTime || !newEndTime}
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
                          const startTime = formatTimeForInput(booking.events?.start_time);
                          const endTime = formatTimeForInput(booking.events?.end_time);
                          setNewStartTime(startTime);
                          setNewEndTime(endTime);
                          console.debug('Cancel: Reset times', { startTime, endTime });
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
                <div className="bg-purple-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Current Package</span>
                  </div>
                  <p className="text-purple-800 text-sm mb-3">
                    {booking.service_packages?.name} - {formatPrice(booking.service_packages?.price || booking.amount)}
                  </p>
                  <p className="text-purple-700 text-sm">
                    Want more coverage or additional features? Upgrade your package anytime before your wedding.
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

            {/* Wedding Details */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Wedding Details</h3>
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
                      <div className="font-medium">
                        {booking.events?.start_time ? formatTime(booking.events.start_time) : 'TBD'}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Time:</span>
                      <div className="font-medium">
                        {booking.events?.end_time ? formatTime(booking.events.end_time) : 'TBD'}
                      </div>
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