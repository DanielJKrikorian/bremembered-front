import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, User, Star, Clock, CreditCard, FileText, Download, Eye, MessageCircle, Edit, Check, X, AlertCircle, Shield, Award, Save, TrendingUp } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import { VendorReviewModal } from '../components/reviews/VendorReviewModal';
import { PackageUpgradeModal } from '../components/booking/PackageUpgradeModal';

interface BookingDetails {
  id: string;
  couple_id: string;
  vendor_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  service_type: string;
  created_at: string;
  updated_at: string;
  rating?: number;
  package_id?: string;
  event_id?: string;
  venue_id?: string;
  vibe?: string;
  initial_payment?: number;
  final_payment?: number;
  platform_fee?: number;
  paid_amount?: number;
  booking_intent_id?: string;
  discount?: number;
  // Joined data
  vendors?: {
    id: string;
    name: string;
    profile_photo?: string;
    rating?: number;
    years_experience: number;
    phone?: string;
    profile?: string;
    specialties?: string[];
  };
  service_packages?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    service_type: string;
    hour_amount?: number;
    features?: string[];
    coverage?: Record<string, any>;
  };
  venues?: {
    id: string;
    name: string;
    street_address?: string;
    city?: string;
    state?: string;
    zip?: string;
    contact_name?: string;
    phone?: string;
    email?: string;
  };
  events?: {
    id: string;
    start_time: string;
    end_time: string;
    title?: string;
    location?: string;
    description?: string;
  };
  couples?: {
    id: string;
    name: string;
    partner1_name: string;
    partner2_name?: string;
    email?: string;
    phone?: string;
    wedding_date?: string;
  };
}

interface Contract {
  id: string;
  booking_id?: string;
  content: string;
  signature?: string;
  signed_at?: string;
  created_at: string;
  updated_at: string;
  status?: string;
  booking_intent_id?: string;
}

interface ContractTemplate {
  id: string;
  service_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_type: string;
  created_at: string;
  tip?: number;
  status: string;
  stripe_payment_id?: string;
}

export const BookingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractTemplate, setContractTemplate] = useState<ContractTemplate | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'contract' | 'payments'>('overview');
  const [isSigningContract, setIsSigningContract] = useState(false);
  const [signature, setSignature] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [timeUpdateLoading, setTimeUpdateLoading] = useState(false);

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchBookingDetails();
    }
  }, [id, isAuthenticated]);

  const fetchBookingDetails = async () => {
    if (!id || !user) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Mock data for demo
      const mockBooking: BookingDetails = {
        id: id,
        couple_id: 'mock-couple-1',
        vendor_id: 'mock-vendor-1',
        status: 'confirmed',
        amount: 250000,
        service_type: 'Photography',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        paid_amount: 125000,
        vendors: {
          id: 'mock-vendor-1',
          name: 'Elegant Moments Photography',
          profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
          rating: 4.9,
          years_experience: 10,
          phone: '(555) 123-4567',
          profile: 'Professional wedding photographer with over 10 years of experience capturing beautiful moments.',
          specialties: ['Outdoor Weddings', 'Intimate Ceremonies', 'Fine Art Photography']
        },
        service_packages: {
          id: 'mock-package-1',
          name: 'Premium Wedding Photography',
          description: 'Complete wedding day photography with 8 hours of coverage',
          price: 250000,
          service_type: 'Photography',
          hour_amount: 8,
          features: ['8 hours coverage', '500+ edited photos', 'Online gallery', 'Print release', 'Engagement session'],
          coverage: {
            events: ['Ceremony', 'Reception', 'Getting Ready', 'First Look', 'Family Photos']
          }
        },
        venues: {
          id: 'mock-venue-1',
          name: 'Sunset Gardens',
          street_address: '123 Garden Lane',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90210',
          contact_name: 'Sarah Wilson',
          phone: '(555) 987-6543',
          email: 'events@sunsetgardens.com'
        },
        events: {
          id: 'mock-event-1',
          start_time: '2024-08-15T16:00:00Z',
          end_time: '2024-08-15T23:00:00Z',
          title: 'Sarah & Michael Wedding',
          location: 'Sunset Gardens',
          description: 'Beautiful outdoor wedding ceremony and reception'
        },
        couples: {
          id: 'mock-couple-1',
          name: 'Sarah & Michael',
          partner1_name: 'Sarah Johnson',
          partner2_name: 'Michael Davis',
          email: 'sarah.johnson@email.com',
          phone: '(555) 123-4567',
          wedding_date: '2024-08-15'
        }
      };

      const mockContract: Contract = {
        id: 'mock-contract-1',
        booking_id: id,
        content: `WEDDING PHOTOGRAPHY SERVICE AGREEMENT

This agreement is between ${mockBooking.couples?.name || 'the couple'} (Client) and ${mockBooking.vendors?.name || 'the vendor'} (Photographer) for photography services.

EVENT DETAILS:
- Date: ${mockBooking.events?.start_time ? new Date(mockBooking.events.start_time).toLocaleDateString() : 'TBD'}
- Location: ${mockBooking.venues?.name || 'TBD'}
- Service: ${mockBooking.service_packages?.name || mockBooking.service_type}

SERVICES PROVIDED:
${mockBooking.service_packages?.features?.map(feature => `- ${feature}`).join('\n') || '- Professional photography services'}

PAYMENT TERMS:
- Total Amount: $${(mockBooking.amount / 100).toFixed(2)}
- Deposit: $${((mockBooking.paid_amount || 0) / 100).toFixed(2)}
- Balance Due: $${((mockBooking.amount - (mockBooking.paid_amount || 0)) / 100).toFixed(2)}

TERMS AND CONDITIONS:
1. The Photographer agrees to provide professional photography services for the specified event.
2. The Client agrees to pay the total amount as outlined in the payment schedule.
3. Cancellation policy: 30 days notice required for full refund of deposit.
4. The Photographer retains copyright to all images but grants usage rights to the Client.
5. Weather contingency plans will be discussed prior to the event.

By signing below, both parties agree to the terms outlined in this contract.`,
        signature: null,
        signed_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        status: 'pending'
      };

      const mockPayments: PaymentRecord[] = [
        {
          id: 'payment-1',
          amount: 125000,
          payment_type: 'Deposit',
          created_at: '2024-01-15T10:00:00Z',
          status: 'succeeded',
          stripe_payment_id: 'pi_mock123'
        }
      ];

      setBooking(mockBooking);
      setContract(mockContract);
      setPayments(mockPayments);
      setLoading(false);
      return;
    }

    try {
      // Get couple ID first
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) throw coupleError;

      // Fetch booking with all related data
      const { data: bookingData, error: bookingError } = await supabase
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
            profile,
            specialties
          ),
          service_packages(
            id,
            name,
            description,
            price,
            service_type,
            hour_amount,
            features,
            coverage
          ),
          venues(
            id,
            name,
            street_address,
            city,
            state,
            zip,
            contact_name,
            phone,
            email
          ),
          events(
            id,
            start_time,
            end_time,
            title,
            location,
            description
          ),
          couples!inner(
            id,
            name,
            partner1_name,
            partner2_name,
            email,
            phone,
            wedding_date
          )
        `)
        .eq('id', id)
        .eq('couple_id', coupleData.id)
        .single();

      if (bookingError) throw bookingError;

      // Fetch contract
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('booking_id', id)
        .maybeSingle();

      if (contractError && contractError.code !== 'PGRST116') {
        throw contractError;
      }

      // Fetch contract template if no contract exists
      let templateData = null;
      if (!contractData && bookingData.service_type) {
        const { data: template, error: templateError } = await supabase
          .from('contract_templates')
          .select('*')
          .eq('service_type', bookingData.service_type)
          .maybeSingle();

        if (templateError && templateError.code !== 'PGRST116') {
          throw templateError;
        }
        templateData = template;
      }

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      setBooking(bookingData);
      setContract(contractData);
      setContractTemplate(templateData);
      setPayments(paymentsData || []);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!contract || !signature.trim() || !booking) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Mock signing for demo
      setContract(prev => prev ? {
        ...prev,
        signature: signature.trim(),
        signed_at: new Date().toISOString(),
        status: 'signed'
      } : null);
      setIsSigningContract(false);
      setSignature('');
      return;
    }

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          signature: signature.trim(),
          signed_at: new Date().toISOString(),
          status: 'signed'
        })
        .eq('id', contract.id);

      if (error) throw error;

      // Refresh contract data
      await fetchBookingDetails();
      setIsSigningContract(false);
      setSignature('');
    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Failed to sign contract');
    }
  };

  const handleTimeEdit = () => {
    if (booking?.events?.start_time) {
      const startTime = new Date(booking.events.start_time).toTimeString().slice(0, 5);
      setNewStartTime(startTime);
      
      if (booking.events.end_time) {
        const endTime = new Date(booking.events.end_time).toTimeString().slice(0, 5);
        setNewEndTime(endTime);
      } else if (booking.service_packages?.hour_amount) {
        // Calculate end time based on package duration
        const start = new Date(`2000-01-01T${startTime}`);
        start.setHours(start.getHours() + booking.service_packages.hour_amount);
        setNewEndTime(start.toTimeString().slice(0, 5));
      }
    }
    setIsEditingTime(true);
  };

  const handleTimeUpdate = async () => {
    if (!booking?.events?.id || !newStartTime) return;

    setTimeUpdateLoading(true);
    setError(null);

    try {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock update for demo
        setBooking(prev => prev ? {
          ...prev,
          events: {
            ...prev.events!,
            start_time: `${booking.events!.start_time.split('T')[0]}T${newStartTime}:00Z`,
            end_time: newEndTime ? `${booking.events!.start_time.split('T')[0]}T${newEndTime}:00Z` : prev.events!.end_time
          }
        } : null);
        setIsEditingTime(false);
        setTimeUpdateLoading(false);
        return;
      }

      const eventDate = booking.events.start_time.split('T')[0];
      const updateData: any = {
        start_time: `${eventDate}T${newStartTime}:00Z`,
        updated_at: new Date().toISOString()
      };

      if (newEndTime) {
        updateData.end_time = `${eventDate}T${newEndTime}:00Z`;
      }

      const { error: updateError } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', booking.events.id);

      if (updateError) throw updateError;

      // Refresh booking data
      await fetchBookingDetails();
      setIsEditingTime(false);
    } catch (err) {
      console.error('Error updating event time:', err);
      setError('Failed to update event time');
    } finally {
      setTimeUpdateLoading(false);
    }
  };

  const handleCancelTimeEdit = () => {
    setIsEditingTime(false);
    setNewStartTime('');
    setNewEndTime('');
    setError(null);
  };

  const handlePackageUpgradeSuccess = () => {
    setShowUpgradeModal(false);
    fetchBookingDetails(); // Refresh booking data
  };

  const handleDownloadContract = () => {
    if (!contract || !booking) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SERVICE CONTRACT', 105, 20, { align: 'center' });

      // Contract content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      const lines = contract.content.split('\n');
      let yPos = 40;
      
      lines.forEach(line => {
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
        yPos += 6 * wrappedLines.length;
      });

      // Signature section
      if (contract.signature) {
        yPos += 20;
        if (yPos > 250) {
          doc.addPage();
          yPos = 40;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('SIGNATURES:', 20, yPos);
        yPos += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Client Signature: ${contract.signature}`, 20, yPos);
        yPos += 6;
        doc.text(`Date Signed: ${contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : ''}`, 20, yPos);
      }

      doc.save(`Contract_${booking.vendors?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      setError('Failed to download contract');
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount / 100);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✓';
      case 'pending': return '⏳';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const getPackageCoverage = (coverage: Record<string, any>) => {
    if (!coverage || typeof coverage !== 'object') return [];
    
    const events = [];
    if (coverage.events && Array.isArray(coverage.events)) {
      events.push(...coverage.events);
    }
    
    Object.keys(coverage).forEach(key => {
      if (key !== 'events' && coverage[key] === true) {
        events.push(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    });
    
    return events;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view booking details.</p>
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
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
          <Button variant="primary" onClick={() => navigate('/my-bookings')}>
            Back to My Bookings
          </Button>
        </Card>
      </div>
    );
  }

  const remainingBalance = booking.amount - (booking.paid_amount || 0);
  const packageCoverage = getPackageCoverage(booking.service_packages?.coverage || {});

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
                {booking.service_packages?.name || booking.service_type} with {booking.vendors?.name}
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                  <span className="mr-2">{getStatusIcon(booking.status)}</span>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Booking #{booking.id.substring(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-gray-600">
                    Created {formatDate(booking.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(booking.amount)}
                </div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'contract', label: 'Contract', icon: FileText },
              { key: 'payments', label: 'Payments', icon: CreditCard }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors
                    ${activeTab === tab.key
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Package Details */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Package Details</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{booking.service_packages?.name || booking.service_type}</h4>
                    <p className="text-gray-600">{booking.service_packages?.description}</p>
                  </div>
                  
                  {booking.service_packages?.features && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Features Included</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {booking.service_packages.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {packageCoverage.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Coverage Details</h5>
                      <div className="flex flex-wrap gap-2">
                        {packageCoverage.map((coverage, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            {coverage}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <span className="text-gray-600">Service Type:</span>
                      <div className="font-medium">{booking.service_type}</div>
                    </div>
                    {booking.service_packages?.hour_amount && (
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <div className="font-medium">{booking.service_packages.hour_amount} hours</div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Package Price:</span>
                      <div className="font-medium">{formatPrice(booking.service_packages?.price || booking.amount)}</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Event Details */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <span className="text-gray-600">Event Date:</span>
                        <div className="font-medium">
                          {booking.events?.start_time 
                            ? formatDate(booking.events.start_time)
                            : booking.couples?.wedding_date 
                              ? formatDate(booking.couples.wedding_date)
                              : 'Date TBD'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {booking.events?.start_time && !isEditingTime && (
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-green-600" />
                        <div>
                          <span className="text-gray-600">Event Time:</span>
                          <div className="font-medium">
                            {formatTime(booking.events.start_time)}
                            {booking.events.end_time && (
                              <span className="text-gray-500">
                                {' - '}
                                {formatTime(booking.events.end_time)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={handleTimeEdit}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                          >
                            Change time
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Time Editing Form */}
                    {isEditingTime && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-3">Update Event Time</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={newStartTime}
                              onChange={(e) => {
                                setNewStartTime(e.target.value);
                                // Auto-calculate end time if package has duration
                                if (booking?.service_packages?.hour_amount) {
                                  const start = new Date(`2000-01-01T${e.target.value}`);
                                  start.setHours(start.getHours() + booking.service_packages.hour_amount);
                                  setNewEndTime(start.toTimeString().slice(0, 5));
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={newEndTime}
                              onChange={(e) => setNewEndTime(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {booking?.service_packages?.hour_amount && (
                          <p className="text-sm text-blue-700 mb-4">
                            Package includes {booking.service_packages.hour_amount} hours of service
                          </p>
                        )}
                        <div className="flex space-x-3">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleTimeUpdate}
                            disabled={!newStartTime || timeUpdateLoading}
                            loading={timeUpdateLoading}
                            icon={Save}
                          >
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelTimeEdit}
                            icon={X}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {booking.events?.title && (
                      <div>
                        <span className="text-gray-600">Event Title:</span>
                        <div className="font-medium">{booking.events.title}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {booking.venues && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-purple-600 mt-1" />
                        <div>
                          <span className="text-gray-600">Venue:</span>
                          <div className="font-medium">{booking.venues.name}</div>
                          {booking.venues.street_address && (
                            <div className="text-sm text-gray-600">
                              {booking.venues.street_address}
                              <br />
                              {booking.venues.city}, {booking.venues.state} {booking.venues.zip}
                            </div>
                          )}
                          {booking.venues.contact_name && (
                            <div className="text-sm text-gray-600 mt-2">
                              Contact: {booking.venues.contact_name}
                              {booking.venues.phone && (
                                <span className="ml-2">📞 {booking.venues.phone}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {booking.events?.description && (
                      <div>
                        <span className="text-gray-600">Description:</span>
                        <div className="font-medium">{booking.events.description}</div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Vendor Details */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Vendor Information</h3>
                {booking.vendors && (
                  <div className="flex items-start space-x-6">
                    <img
                      src={booking.vendors.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={booking.vendors.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{booking.vendors.name}</h4>
                      <div className="flex items-center space-x-4 text-gray-600 mb-4">
                        {booking.vendors.rating && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span>{booking.vendors.rating} rating</span>
                          </div>
                        )}
                        <span>{booking.vendors.years_experience} years experience</span>
                        {booking.vendors.phone && (
                          <span>📞 {booking.vendors.phone}</span>
                        )}
                      </div>
                      
                      {booking.vendors.profile && (
                        <p className="text-gray-600 mb-4">{booking.vendors.profile}</p>
                      )}

                      {booking.vendors.specialties && booking.vendors.specialties.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Specialties</h5>
                          <div className="flex flex-wrap gap-2">
                            {booking.vendors.specialties.map((specialty, index) => (
                              <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      icon={MessageCircle}
                      onClick={() => navigate('/profile?tab=messages')}
                    >
                      Message Vendor
                    </Button>
                  </div>
                )}
              </Card>

              {/* Package Upgrade Section */}
              {booking.service_packages && booking.status === 'confirmed' && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Package Upgrade</h3>
                    <Button
                      variant="outline"
                      icon={TrendingUp}
                      onClick={() => setShowUpgradeModal(true)}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      Upgrade Package
                    </Button>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Current Package</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Package:</strong> {booking.service_packages.name}</p>
                      <p><strong>Price:</strong> {formatPrice(booking.service_packages.price)}</p>
                      {booking.service_packages.hour_amount && (
                        <p><strong>Duration:</strong> {booking.service_packages.hour_amount} hours</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">{formatPrice(booking.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">{formatPrice(booking.paid_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-3">
                    <span>Remaining Balance:</span>
                    <span className={remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatPrice(remainingBalance)}
                    </span>
                  </div>
                </div>
                
                {remainingBalance > 0 && (
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => navigate('/profile?tab=payments')}
                      icon={CreditCard}
                    >
                      Make Payment
                    </Button>
                  </div>
                )}
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab('contract')}
                    icon={FileText}
                  >
                    View Contract
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/profile?tab=messages')}
                    icon={MessageCircle}
                  >
                    Message Vendor
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/profile?tab=timeline')}
                    icon={Calendar}
                  >
                    View Timeline
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/profile?tab=gallery')}
                    icon={Eye}
                  >
                    View Gallery
                  </Button>
                  {booking.status === 'completed' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowReviewModal(true)}
                      icon={Star}
                    >
                      Leave Review
                    </Button>
                  )}
                </div>
              </Card>

              {/* Trust Indicators */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Protection & Support</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Verified vendor</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Secure payments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Quality guarantee</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">24/7 support</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Service Contract</h3>
                {contract && contract.signature && (
                  <Button
                    variant="outline"
                    icon={Download}
                    onClick={handleDownloadContract}
                  >
                    Download PDF
                  </Button>
                )}
              </div>

              {contract ? (
                <div className="space-y-6">
                  {/* Contract Status */}
                  <div className={`p-4 rounded-lg border ${
                    contract.signature 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {contract.signature ? (
                        <>
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">Contract Signed</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium text-yellow-900">Signature Required</span>
                        </>
                      )}
                    </div>
                    {contract.signed_at && (
                      <p className="text-sm text-green-700 mt-1">
                        Signed on {formatDate(contract.signed_at)} by {contract.signature}
                      </p>
                    )}
                  </div>

                  {/* Contract Content */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {contract.content}
                    </div>
                  </div>

                  {/* Signature Section */}
                  {!contract.signature && (
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-900 mb-4">Digital Signature</h4>
                      {isSigningContract ? (
                        <div className="space-y-4">
                          <Input
                            label="Type your full name to sign"
                            value={signature}
                            onChange={(e) => setSignature(e.target.value)}
                            placeholder="Enter your full legal name"
                          />
                          <div className="flex space-x-3">
                            <Button
                              variant="primary"
                              onClick={handleSignContract}
                              disabled={!signature.trim()}
                            >
                              Sign Contract
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsSigningContract(false);
                                setSignature('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            By typing your name and clicking "Sign Contract", you agree to be legally bound by this contract.
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-600 mb-4">
                            Please review the contract above and sign to confirm your booking.
                          </p>
                          <Button
                            variant="primary"
                            onClick={() => setIsSigningContract(true)}
                          >
                            Sign Contract
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : contractTemplate ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Contract Available</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      A contract template is available for this service type. The contract will be generated when you proceed to checkout.
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Contract Preview</h4>
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto">
                      {contractTemplate.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Contract Available</h4>
                  <p className="text-gray-600">
                    No contract has been generated for this booking yet.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payment Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Total Amount</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(booking.amount)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Amount Paid</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(booking.paid_amount || 0)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    remainingBalance > 0 ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {remainingBalance > 0 ? (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <Check className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Remaining Balance</h3>
                    <p className={`text-2xl font-bold ${
                      remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatPrice(remainingBalance)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment History */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment History</h3>
              
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h4>
                  <p className="text-gray-600">Payment history will appear here once payments are made.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{payment.payment_type}</h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(payment.created_at)}
                          </p>
                          {payment.stripe_payment_id && (
                            <p className="text-xs text-gray-500">
                              ID: {payment.stripe_payment_id}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(payment.amount)}
                        </p>
                        {payment.tip && payment.tip > 0 && (
                          <p className="text-sm text-green-600">
                            +{formatPrice(payment.tip)} tip
                          </p>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'succeeded' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {remainingBalance > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-900">Payment Due</h4>
                      <p className="text-red-700 text-sm">
                        {formatPrice(remainingBalance)} remaining balance
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => navigate('/profile?tab=payments')}
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {error && (
          <Card className="p-4 bg-red-50 border border-red-200 mt-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

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
        {booking && (
          <PackageUpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            booking={booking}
            onUpgradeSuccess={handlePackageUpgradeSuccess}
          />
        )}
      </div>
    </div>
  );
};