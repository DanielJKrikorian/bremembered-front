import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, Star, MessageCircle, Download, Eye, Plus, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { AuthModal } from '../components/auth/AuthModal';
import { useCreateConversation } from '../hooks/useMessaging';
import { VendorReviewModal } from '../components/reviews/VendorReviewModal';
import { trackPageView } from '../utils/analytics'; // Import trackPageView

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth(); // Add authLoading
  const { bookings, loading, error } = useBookings();
  const { createConversation } = useCreateConversation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);
  const [expandedPayments, setExpandedPayments] = useState<{ [key: string]: boolean }>({});
  const analyticsTracked = useRef(false); // Add ref to prevent duplicate calls

  // Track analytics only once on mount
  useEffect(() => {
    if (!authLoading && !analyticsTracked.current) {
      console.log('Tracking analytics for my-bookings:', new Date().toISOString());
      trackPageView('my-bookings', 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [authLoading, user?.id]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Utility to format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  // Toggle payment summary for a booking
  const togglePaymentSummary = (bookingId: string) => {
    setExpandedPayments((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-12 text-center max-w-md">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In to View Your Bookings</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to your account to view and manage your wedding bookings.
            </p>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          </Card>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">Error loading bookings: {error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const filteredBookings = bookings.filter(booking => {
    const packageName = booking.service_packages?.name || booking.service_type;
    const vendorName = booking.vendors?.name || '';
    const matchesSearch = packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    const eventDate = booking.events?.start_time ? new Date(booking.events.start_time) : new Date(booking.created_at);
    
    switch (activeTab) {
      case 'upcoming':
        return matchesSearch && eventDate >= now;
      case 'past':
        return matchesSearch && eventDate < now;
      default:
        return matchesSearch;
    }
  });

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

  const upcomingCount = bookings.filter(b => {
    const eventDate = b.events?.start_time ? new Date(b.events.start_time) : new Date(b.created_at);
    return eventDate >= new Date();
  }).length;
  const pastCount = bookings.filter(b => {
    const eventDate = b.events?.start_time ? new Date(b.events.start_time) : new Date(b.created_at);
    return eventDate < new Date();
  }).length;

  const handleMessageVendor = async (booking: any) => {
    console.log('handleMessageVendor called with booking:', booking);
    console.log('Vendor user_id:', booking.vendors?.user_id);
    
    if (!booking.vendors?.user_id) {
      console.error('No vendor user_id found for booking:', booking);
      alert('Unable to message vendor - missing vendor information');
      return;
    }

    try {
      console.log('Creating conversation with vendor user_id:', booking.vendors.user_id);
      const conversation = await createConversation(booking.vendors.user_id);
      console.log('Conversation created:', conversation);
      
      if (!conversation) {
        console.error('Failed to create conversation');
        alert('Failed to create conversation with vendor');
        return;
      }
      
      console.log('Navigating to messages tab with conversation:', conversation.id);
      navigate('/profile?tab=messages', {
        state: {
          selectedConversationId: conversation.id,
          vendor: booking.vendors
        }
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Error creating conversation: ' + (error instanceof Error ? error.message : 'Unknown error'));
      navigate('/profile?tab=messages');
    }
  };

  const handleLeaveReview = (booking: any) => {
    setSelectedBookingForReview(booking);
    setShowReviewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
              <p className="text-gray-600">Manage your wedding service bookings and track your special day</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="primary" 
                icon={Plus}
                onClick={() => navigate('/search')}
              >
                Book New Service
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings by service or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
            <Button
              variant="outline"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input
                  type="date"
                  placeholder="From Date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <input
                  type="date"
                  placeholder="To Date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
              { key: 'past', label: 'Past Events', count: pastCount },
              { key: 'all', label: 'All Bookings', count: bookings.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${activeTab === tab.key
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'upcoming' ? 'No upcoming bookings' : 
                 activeTab === 'past' ? 'No past bookings' : 'No bookings found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms.' : 
                 'Start browsing our amazing wedding services to book your perfect day!'}
              </p>
              {!searchTerm && (
                <Button 
                  variant="primary"
                  onClick={() => navigate('/search')}
                >
                  Browse Services
                </Button>
              )}
            </Card>
          ) : (
            filteredBookings.map((booking) => {
              const totalAmount = (booking.initial_payment || 0) + (booking.final_payment || 0) + (booking.platform_fee || 0);
              const successfulPayments = booking.payments?.filter((p: any) => p.status === 'succeeded') || [];
              const paidAmount = successfulPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
              const remainingBalance = booking.final_payment_status === 'paid' ? 0 : (booking.vendor_final_share || 0) + (booking.platform_final_share || 0);
              return (
                <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Booking Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {booking.service_packages?.name || booking.service_type}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span className="font-medium">
                                  {booking.events?.start_time 
                                    ? new Date(booking.events.start_time).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })
                                    : 'Date TBD'
                                  }
                                </span>
                              </div>
                              {booking.events?.location && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  <span>{booking.events.location}</span>
                                </div>
                              )}
                              {booking.service_packages?.hour_amount && (
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  <span>{booking.service_packages.hour_amount}h service</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                  <span className="mr-1">{getStatusIcon(booking.status)}</span>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatPrice(totalAmount)}
                            </div>
                            {remainingBalance > 0 && (
                              <div className="text-sm text-red-600">
                                Owed: {formatPrice(remainingBalance)}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              Booked {new Date(booking.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="mb-4">
                          <button
                            onClick={() => togglePaymentSummary(booking.id)}
                            className="flex items-center w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-expanded={!!expandedPayments[booking.id]}
                            aria-controls={`payment-summary-${booking.id}`}
                          >
                            <span className="font-medium text-gray-900 mr-2">Payment Summary</span>
                            {expandedPayments[booking.id] ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          {expandedPayments[booking.id] && (
                            <div id={`payment-summary-${booking.id}`} className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <div className="space-y-2 text-sm">
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
                                  <span className="text-gray-600">Paid:</span>
                                  <span className="font-medium text-green-600">{formatPrice(paidAmount)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                  <span className="text-gray-600">Remaining Balance:</span>
                                  <span className="text-red-600">{formatPrice(remainingBalance)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Vendor Info */}
                        {booking.vendors && (
                          <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                            <img
                              src={booking.vendors.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                              alt={booking.vendors.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{booking.vendors.name}</h4>
                              <div className="flex items-center text-sm text-gray-600">
                                {booking.vendors.rating && (
                                  <>
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                                    <span>{booking.vendors.rating} rating</span>
                                    <span className="mx-2">•</span>
                                  </>
                                )}
                                <span>{booking.vendors.years_experience} years experience</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Vendor Message button clicked!', booking);
                                handleMessageVendor(booking);
                              }}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </button>
                          </div>
                        )}

                        {/* Package Info */}
                        {booking.service_packages && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <h5 className="font-medium text-blue-900 mb-1">Package Details</h5>
                            <p className="text-sm text-blue-800">
                              <strong>Package:</strong> {booking.service_packages.name}
                            </p>
                            {booking.service_packages.hour_amount && (
                              <p className="text-sm text-blue-800">
                                <strong>Duration:</strong> {booking.service_packages.hour_amount} hours
                              </p>
                            )}
                            {booking.service_packages.description && (
                              <p className="text-sm text-blue-800">
                                <strong>Description:</strong> {booking.service_packages.description}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Features */}
                        {booking.service_packages?.features && booking.service_packages.features.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-900 mb-2">Features Included:</h5>
                            <div className="flex flex-wrap gap-2">
                              {booking.service_packages.features.slice(0, 3).map((feature: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-rose-100 text-rose-800">
                                  {feature}
                                </span>
                              ))}
                              {booking.service_packages.features.length > 3 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                  +{booking.service_packages.features.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Venue Info */}
                        {booking.venues && (
                          <div className="mb-4 p-3 bg-green-50 rounded-lg">
                            <h5 className="font-medium text-green-900 mb-1">Venue Details</h5>
                            <p className="text-sm text-green-800">
                              <strong>Venue:</strong> {booking.venues.name}
                            </p>
                            {booking.venues.street_address && (
                              <p className="text-sm text-green-800">
                                <strong>Address:</strong> {booking.venues.street_address}, {booking.venues.city}, {booking.venues.state}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Service Type Badge */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                              {booking.service_type}
                            </span>
                            {booking.vibe && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                                {booking.vibe} vibe
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            variant="primary" 
                            icon={Eye} 
                            size="sm"
                            onClick={() => navigate(`/booking/${booking.id}`)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            icon={Eye} 
                            size="sm"
                            onClick={() => navigate('/profile?tab=gallery')}
                          >
                            View Gallery
                          </Button>
                          <button
                            onClick={() => {
                              console.log('Message button clicked!', booking);
                              handleMessageVendor(booking);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message Vendor
                          </button>
                          {booking.status === 'confirmed' && (
                            booking.events?.start_time ? new Date(booking.events.start_time) > new Date() : true
                          ) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/booking/${booking.id}`)}
                            >
                              Modify Booking
                            </Button>
                          )}
                          {booking.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Cancel Booking
                            </Button>
                          )}
                          {booking.status === 'completed' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              onClick={() => handleLeaveReview(booking)}
                            >
                              Leave Review
                            </Button>
                          )}
                          {activeTab === 'past' && booking.status !== 'cancelled' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              onClick={() => handleLeaveReview(booking)}
                              icon={Star}
                            >
                              Leave Review
                            </Button>
                          )}
                          {(booking.status === 'confirmed' || booking.status === 'pending') && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => navigate('/profile?tab=payments')}
                            >
                              Make Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Vision Form CTA */}
        <Card className="p-8 mt-12 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💝</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Complete Wedding Timeline
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Create and share your detailed wedding timeline with your vendors. This helps ensure everyone is coordinated and your special day runs smoothly from start to finish.
            </p>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/profile?tab=timeline')}
            >
              Complete Wedding Timeline
            </Button>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-rose-500 mb-2">{bookings.length}</div>
            <div className="text-gray-600">Total Bookings</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-amber-500 mb-2">{upcomingCount}</div>
            <div className="text-gray-600">Upcoming Events</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-emerald-500 mb-2">
              {formatPrice(bookings.reduce((sum, b) => sum + (b.initial_payment || 0) + (b.final_payment || 0) + (b.platform_fee || 0), 0))}
            </div>
            <div className="text-gray-600">Total Invested</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {bookings.length > 0 
                ? Math.round(bookings.reduce((sum, b) => sum + (b.vendors?.rating || 4.5), 0) / bookings.length * 10) / 10
                : 0
              }
            </div>
            <div className="text-gray-600">Avg Vendor Rating</div>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      {selectedBookingForReview && (
        <VendorReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBookingForReview(null);
          }}
          vendor={{
            id: selectedBookingForReview.vendors?.id || '',
            name: selectedBookingForReview.vendors?.name || '',
            profile_photo: selectedBookingForReview.vendors?.profile_photo,
            service_type: selectedBookingForReview.service_type
          }}
          booking={{
            id: selectedBookingForReview.id,
            service_packages: selectedBookingForReview.service_packages
          }}
          onReviewSubmitted={() => {
            setShowReviewModal(false);
            setSelectedBookingForReview(null);
          }}
        />
      )}
    </div>
  );
};

export default MyBookings;