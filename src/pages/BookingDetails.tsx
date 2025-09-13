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
  // New state for venue editing
  const [editingVenue, setEditingVenue] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');
  const [venueResults, setVenueResults] = useState<any[]>([]);
  const [newVenue, setNewVenue] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [savingVenue, setSavingVenue] = useState(false);
  const [venueError, setVenueError] = useState<string | null>(null);

  // Existing time formatting utilities (unchanged)
  const formatTimeForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '12:00';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '12:00';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/New_York'
      }).replace(' ', ':');
    } catch (err) {
      return '12:00';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'TBD';
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'
      });
    } catch (err) {
      return 'TBD';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'TBD';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/New_York'
      });
    } catch (err) {
      return 'TBD';
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (id && user) {
      fetchBookingDetails();

      // Existing subscriptions (unchanged)
      const coupleSubscription = supabase
        .channel('couple-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'couples', filter: `user_id=eq.${user.id}` },
          () => fetchBookingDetails()
        )
        .subscribe();

      const bookingSubscription = supabase
        .channel('bookings-channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${id}` },
          (payload) => {
            if (payload.new.final_payment_status === 'paid') {
              fetchBookingDetails();
            }
          }
        )
        .subscribe();

      const paymentSubscription = supabase
        .channel('payments-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'payments', filter: `booking_id=eq.${id}` },
          (payload) => {
            if (payload.new.status === 'succeeded') {
              fetchBookingDetails();
            }
          }
        )
        .subscribe();

      // New subscription for venues
      const venueSubscription = supabase
        .channel('venues-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'venues' },
          () => {
            console.log('Venue data changed, refetching booking details');
            fetchBookingDetails();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(coupleSubscription);
        supabase.removeChannel(bookingSubscription);
        supabase.removeChannel(paymentSubscription);
        supabase.removeChannel(venueSubscription);
      };
    }
  }, [id, user]);

  const fetchBookingDetails = async () => {
    if (!id || !user) return;

    try {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) throw coupleError;

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
          ),
          contracts!contracts_booking_id_fkey(
            id,
            content,
            signature,
            signed_at,
            created_at
          ),
          payments!payments_booking_id_fkey(
            id,
            amount,
            payment_type,
            created_at,
            tip,
            status
          )
        `)
        .eq('id', id)
        .eq('couple_id', coupleData.id)
        .single();

      if (error) throw error;
      setBooking(data);

      setNewStartTime(formatTimeForInput(data.events?.start_time));
      setNewEndTime(formatTimeForInput(data.events?.end_time));
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  // New function to search venues
  const searchVenues = async (query: string) => {
    if (!query.trim()) {
      setVenueResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, street_address, city, state')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setVenueResults(data || []);
    } catch (err) {
      console.error('Error searching venues:', err);
      setVenueError('Failed to search venues');
    }
  };

  // New function to handle venue selection
  const handleSelectVenue = async (venueId: string) => {
    try {
      setSavingVenue(true);
      setVenueError(null);

      const { error } = await supabase
        .from('bookings')
        .update({ venue_id: venueId, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Fetch the selected venue to update the booking state
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id, name, street_address, city, state')
        .eq('id', venueId)
        .single();

      if (venueError) throw venueError;

      setBooking((prev: any) => ({
        ...prev,
        venue_id: venueId,
        venues: venueData
      }));
      setEditingVenue(false);
      setVenueSearch('');
      setVenueResults([]);
    } catch (err) {
      console.error('Error updating venue:', err);
      setVenueError(err instanceof Error ? err.message : 'Failed to update venue');
    } finally {
      setSavingVenue(false);
    }
  };

  // New function to create a new venue
  const handleCreateVenue = async () => {
    if (!newVenue.name.trim()) {
      setVenueError('Venue name is required');
      return;
    }

    try {
      setSavingVenue(true);
      setVenueError(null);

      const { data, error } = await supabase
        .from('venues')
        .insert({
          name: newVenue.name,
          street_address: newVenue.street_address || null,
          city: newVenue.city || null,
          state: newVenue.state || null,
          zip: newVenue.zip || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update booking with new venue
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ venue_id: data.id, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      setBooking((prev: any) => ({
        ...prev,
        venue_id: data.id,
        venues: {
          id: data.id,
          name: data.name,
          street_address: data.street_address,
          city: data.city,
          state: data.state
        }
      }));
      setEditingVenue(false);
      setVenueSearch('');
      setVenueResults([]);
      setNewVenue({ name: '', street_address: '', city: '', state: '', zip: '' });
    } catch (err) {
      console.error('Error creating venue:', err);
      setVenueError(err instanceof Error ? err.message : 'Failed to create venue');
    } finally {
      setSavingVenue(false);
    }
  };

  // Existing time-related functions (unchanged)
  const calculateEndTime = (startTime: string, hours: number) => {
    if (!startTime.match(/^\d{2}:\d{2}$/)) return '12:00';
    const [hoursStr, minutesStr] = startTime.split(':');
    const startHours = parseInt(hoursStr, 10);
    const startMinutes = parseInt(minutesStr, 10);
    if (isNaN(startHours) || isNaN(startMinutes)) return '12:00';
    const totalMinutes = startHours * 60 + startMinutes + hours * 60;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const handleStartTimeChange = (time: string) => {
    setNewStartTime(time);
    if (booking?.service_packages?.hour_amount && time.match(/^\d{2}:\d{2}$/)) {
      const calculatedEndTime = calculateEndTime(time, booking.service_packages.hour_amount);
      setNewEndTime(calculatedEndTime);
    } else {
      setNewEndTime('12:00');
    }
  };

  const handleSaveTime = async () => {
    if (!booking || !newStartTime || !newEndTime) {
      setTimeError('Please provide both start and end times.');
      setSavingTime(false);
      return;
    }
    if (!newStartTime.match(/^\d{2}:\d{2}$/) || !newEndTime.match(/^\d{2}:\d{2}$/)) {
      setTimeError('Invalid time format. Please use HH:mm.');
      setSavingTime(false);
      return;
    }
    setSavingTime(true);
    setTimeError(null);

    try {
      let eventDate = '2025-08-09';
      const eventDateRaw = booking.events?.start_time;
      if (eventDateRaw) {
        try {
          const date = new Date(eventDateRaw);
          if (!isNaN(date.getTime())) {
            eventDate = date.toISOString().split('T')[0];
          }
        } catch (err) {}
      }

      const localStartDateTime = new Date(`${eventDate}T${newStartTime}:00-04:00`);
      const localEndDateTime = new Date(`${eventDate}T${newEndTime}:00-04:00`);

      if (isNaN(localStartDateTime.getTime()) || isNaN(localEndDateTime.getTime())) {
        setTimeError('Invalid time values provided.');
        setSavingTime(false);
        return;
      }

      if (localEndDateTime <= localStartDateTime) {
        setTimeError('End time must be after start time.');
        setSavingTime(false);
        return;
      }

      const newStartDateTime = localStartDateTime.toISOString().replace('T', ' ').slice(0, 19) + '+00';
      const newEndDateTime = localEndDateTime.toISOString().replace('T', ' ').slice(0, 19) + '+00';

      const { error } = await supabase
        .from('events')
        .update({
          start_time: newStartDateTime,
          end_time: newEndDateTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.events.id);

      if (error) throw error;

      setBooking(prev => ({
        ...prev,
        events: {
          ...prev.events,
          start_time: newStartDateTime,
          end_time: newEndDateTime
        }
      }));

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-200 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDownloadContract = async () => {
    // Unchanged contract download logic
    if (!booking || !booking.contracts || booking.contracts.length === 0) return;
    const contract = booking.contracts[0];
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const logoUrl = 'https://eecbrvehrhrvdzuutliq.supabase.co/storage/v1/object/public/public-1/B_Logo.png';
      const logoSize = 30;
      doc.addImage(logoUrl, 'PNG', 90, 10, logoSize, logoSize, undefined, 'FAST');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SERVICE CONTRACT', 105, 50, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('B. Remembered', 105, 60, { align: 'center' });
      doc.text('The Smarter Way to Book Your Big Day!', 105, 67, { align: 'center' });
      let yPos = 80;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CONTRACT DETAILS', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Contract ID: ${contract.id.substring(0, 8).toUpperCase()}`, 20, yPos);
      yPos += 7;
      doc.text(`Service: ${booking.service_packages?.name || booking.service_type}`, 20, yPos);
      yPos += 7;
      doc.text(`Vendor: ${booking.vendors?.name}`, 20, yPos);
      yPos += 7;
      doc.text(`Created: ${new Date(contract.created_at).toLocaleDateString()}`, 20, yPos);
      yPos += 7;
      if (contract.signed_at) {
        doc.text(`Signed: ${new Date(contract.signed_at).toLocaleDateString()}`, 20, yPos);
        yPos += 7;
      }
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CONTRACT TERMS', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = contract.content.split('\n');
      lines.forEach((line: string) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        if (line.trim() === '') {
          yPos += 4;
          return;
        }
        if (line.includes(':') && line.length < 50) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        const wrappedLines = doc.splitTextToSize(line, 170);
        doc.text(wrappedLines, 20, yPos);
        yPos += 5 * wrappedLines.length;
      });
      if (contract.signature) {
        yPos += 20;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('DIGITAL SIGNATURE', 20, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Signed by: ${contract.signature}`, 20, yPos);
        yPos += 6;
        doc.text(`Date: ${new Date(contract.signed_at).toLocaleDateString()}`, 20, yPos);
      }
      yPos = Math.max(yPos + 20, 260);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Thank you for choosing B. Remembered for your special day!', 105, yPos, { align: 'center' });
      doc.text('For questions about this contract, contact hello@bremembered.io', 105, yPos + 7, { align: 'center' });
      const fileName = `Contract_${booking.vendors?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating contract PDF:', error);
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

  const totalAmount = (booking.initial_payment || 0) + (booking.final_payment || 0) + (booking.platform_fee || 0);
  const successfulPayments = booking.payments?.filter((p: any) => p.status === 'succeeded') || [];
  const paidAmount = successfulPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const remainingBalance = booking.final_payment_status === 'paid' ? 0 : (booking.vendor_final_share || 0) + (booking.platform_final_share || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="lg:col-span-2 space-y-8">
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
                    {formatPrice(totalAmount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Booked {new Date(booking.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

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
                          const startTime = formatTimeForInput(booking.events?.start_time);
                          const endTime = formatTimeForInput(booking.events?.end_time);
                          setNewStartTime(startTime);
                          setNewEndTime(endTime);
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

              {/* New Venue Editing Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Wedding Venue</h3>
                  {!editingVenue && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit}
                      onClick={() => setEditingVenue(true)}
                    >
                      Change Venue
                    </Button>
                  )}
                </div>

                {venueError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{venueError}</p>
                  </div>
                )}

                {editingVenue ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <Input
                      label="Search Venues"
                      type="text"
                      value={venueSearch}
                      onChange={(e) => {
                        setVenueSearch(e.target.value);
                        searchVenues(e.target.value);
                      }}
                      placeholder="Search for a venue..."
                      icon={Search}
                      className="mb-4"
                    />
                    {venueResults.length > 0 && (
                      <div className="mb-4 max-h-40 overflow-y-auto border rounded-lg">
                        {venueResults.map((venue) => (
                          <div
                            key={venue.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSelectVenue(venue.id)}
                          >
                            <div className="font-medium">{venue.name}</div>
                            <div className="text-sm text-gray-600">
                              {venue.street_address}, {venue.city}, {venue.state}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Add New Venue</h4>
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <Input
                          label="Venue Name"
                          type="text"
                          value={newVenue.name}
                          onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                          placeholder="Enter venue name"
                          required
                        />
                        <Input
                          label="Street Address"
                          type="text"
                          value={newVenue.street_address}
                          onChange={(e) => setNewVenue({ ...newVenue, street_address: e.target.value })}
                          placeholder="Enter street address"
                        />
                        <Input
                          label="City"
                          type="text"
                          value={newVenue.city}
                          onChange={(e) => setNewVenue({ ...newVenue, city: e.target.value })}
                          placeholder="Enter city"
                        />
                        <Input
                          label="State"
                          type="text"
                          value={newVenue.state}
                          onChange={(e) => setNewVenue({ ...newVenue, state: e.target.value })}
                          placeholder="Enter state"
                        />
                        <Input
                          label="Zip Code"
                          type="text"
                          value={newVenue.zip}
                          onChange={(e) => setNewVenue({ ...newVenue, zip: e.target.value })}
                          placeholder="Enter zip code"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Save}
                          onClick={handleCreateVenue}
                          loading={savingVenue}
                          disabled={!newVenue.name}
                        >
                          Save New Venue
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={X}
                          onClick={() => {
                            setEditingVenue(false);
                            setVenueError(null);
                            setVenueSearch('');
                            setVenueResults([]);
                            setNewVenue({ name: '', street_address: '', city: '', state: '', zip: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    {booking.venues ? (
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Venue:</span>
                          <div className="font-medium text-gray-900">{booking.venues.name}</div>
                        </div>
                        {(booking.venues.street_address || booking.venues.city || booking.venues.state) && (
                          <div>
                            <span className="text-sm text-gray-600">Address:</span>
                            <div className="font-medium text-gray-900">
                              {booking.venues.street_address && `${booking.venues.street_address}, `}
                              {booking.venues.city && `${booking.venues.city}, `}
                              {booking.venues.state}
                            </div>
                        </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-600">No venue selected</div>
                    )}
                  </div>
                )}
              </div>

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
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Venue</h4>
                  <div className="space-y-2 text-sm">
                    {booking.venues ? (
                      <>
                        <div>
                          <span className="font-medium">{booking.venues.name}</span>
                        </div>
                        {(booking.venues.street_address || booking.venues.city || booking.venues.state) && (
                          <div className="text-gray-600">
                            {booking.venues.street_address && `${booking.venues.street_address}, `}
                            {booking.venues.city && `${booking.venues.city}, `}
                            {booking.venues.state}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-600">No venue selected</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
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

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package Price:</span>
                  <span className="font-medium">{formatPrice((booking.initial_payment || 0) + (booking.final_payment || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee:</span>
                  <span className="font-medium">{formatPrice(booking.platform_fee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit Paid:</span>
                  <span className="font-medium text-green-600">{formatPrice(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Remaining Balance:</span>
                  <span className="text-red-600">{formatPrice(remainingBalance)}</span>
                </div>
              </div>
              {remainingBalance > 0 && (
                <div className="mt-4">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate('/profile?tab=payments')}
                  >
                    Make Payment
                  </Button>
                </div>
              )}
            </Card>

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
          }}
        />
      )}

      <PackageUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        booking={booking}
        onUpgradeSuccess={() => {
          setShowUpgradeModal(false);
          fetchBookingDetails();
        }}
      />
    </div>
  );
};