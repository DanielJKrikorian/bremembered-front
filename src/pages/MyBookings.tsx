import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Star, MessageCircle, Download, Eye, Plus, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { mockBookings } from '../lib/mockData';

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const bookings = mockBookings; // In a real app, this would be filtered by user

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.bundle.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    const eventDate = new Date(booking.eventDate);
    
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

  const upcomingCount = bookings.filter(b => new Date(b.eventDate) >= new Date()).length;
  const pastCount = bookings.filter(b => new Date(b.eventDate) < new Date()).length;

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
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Booking Image */}
                    <div className="lg:w-1/4">
                      <div className="relative">
                        <img
                          src={booking.bundle.images[0]}
                          alt={booking.bundle.name}
                          className="w-full h-48 lg:h-full object-cover rounded-lg"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                            <span className="mr-1">{getStatusIcon(booking.status)}</span>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="lg:w-3/4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {booking.bundle.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span className="font-medium">{booking.eventDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{booking.eventLocation}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{booking.bundle.duration}h service</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-gray-900">
                            ${booking.totalPrice.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Booked {booking.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Vendor Info */}
                      <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={booking.bundle.vendor.avatar}
                          alt={booking.bundle.vendor.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{booking.bundle.vendor.name}</h4>
                          <div className="flex items-center text-sm text-gray-600">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                            <span>{booking.bundle.vendor.rating} rating</span>
                            <span className="mx-2">•</span>
                            <span>{booking.bundle.vendor.experience} years experience</span>
                          </div>
                        </div>
                        <Button variant="outline" icon={MessageCircle} size="sm">
                          Message
                        </Button>
                      </div>

                      {/* Couple Info */}
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-1">Event Details</h5>
                        <p className="text-sm text-blue-800">
                          <strong>Couple:</strong> {booking.coupleInfo.bride} & {booking.coupleInfo.groom}
                        </p>
                        <p className="text-sm text-blue-800">
                          <strong>Contact:</strong> {booking.coupleInfo.email} • {booking.coupleInfo.phone}
                        </p>
                      </div>

                      {/* Services Included */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Services Included:</h5>
                        <div className="flex flex-wrap gap-2">
                          {booking.bundle.services.slice(0, 3).map((service) => (
                            <span key={service.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-rose-100 text-rose-800">
                              {service.name}
                            </span>
                          ))}
                          {booking.bundle.services.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              +{booking.bundle.services.length - 3} more
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
                          onClick={() => navigate(`/bundle/${booking.bundleId}`)}
                        >
                          View Details
                        </Button>
                        <Button variant="outline" icon={Download} size="sm">
                          Download Contract
                        </Button>
                        {booking.status === 'confirmed' && new Date(booking.eventDate) > new Date() && (
                          <Button variant="outline" size="sm">
                            Modify Booking
                          </Button>
                        )}
                        {booking.status === 'pending' && (
                          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                            Cancel Booking
                          </Button>
                        )}
                        {booking.status === 'completed' && (
                          <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Vision Form CTA */}
        <Card className="p-8 mt-12 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💝</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Share Your Wedding Vision
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Help your vendors create the perfect experience by sharing your wedding vision, style preferences, and must-have moments. This helps ensure your special day is exactly as you've dreamed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg">
                Complete Vision Form
              </Button>
              <Button variant="outline" size="lg">
                View Examples
              </Button>
            </div>
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
              ${bookings.reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Total Invested</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {Math.round(bookings.reduce((sum, b) => sum + b.bundle.rating, 0) / bookings.length * 10) / 10}
            </div>
            <div className="text-gray-600">Avg Vendor Rating</div>
          </Card>
        </div>
      </div>
    </div>
  );
};