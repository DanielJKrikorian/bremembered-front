// src/components/checkout/BookingConfirmation.tsx
import React from 'react';
import { Check, Calendar, Users, MapPin, Camera, Clock, Package, DollarSign, Mail, Phone, Video, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';

interface BookingConfirmationProps {
  cartItems: any[];
  totalAmount: number;
  depositAmount: number;
  onCreateAccount: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  cartItems = [],
  totalAmount = 0,
  depositAmount = 0,
  onCreateAccount,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const PLATFORM_FEE = 5000;
  const grandTotal = totalAmount + PLATFORM_FEE;
  const remainingBalance = Math.max(0, grandTotal - depositAmount);

  const formatPrice = (price: number): string => {
    const cents = Number(price) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  // CORRECT: eventDate is "2026-05-24" → treat as local EDT date
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // CORRECT: eventTime is "14:00" → convert to EDT 12-hour
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Check className="w-14 h-14 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Booking Confirmed!</h1>
          <p className="text-xl text-gray-600">
            Congratulations! Your wedding services are officially booked.
          </p>
        </div>

        <Card className="p-8 shadow-xl">
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-6 h-6 mr-2 text-rose-600" />
              Booking Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Services:</span>
                <span className="font-medium">{cartItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Deposit Paid:</span>
                <span className="font-bold text-green-600">{formatPrice(depositAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Balance:</span>
                <span className="font-medium text-amber-700">{formatPrice(remainingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-bold text-rose-600">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Booked Services</h3>
            {cartItems.map((item, index) => (
              <div key={item.id || index} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                      {item.package.service_type === 'Photography' && <Camera className="w-6 h-6 text-rose-600" />}
                      {item.package.service_type === 'Videography' && <Video className="w-6 h-6 text-rose-600" />}
                      {item.package.service_type.includes('DJ') && <Music className="w-6 h-6 text-rose-600" />}
                      {item.package.service_type.includes('Musician') && <Music className="w-6 h-6 text-rose-600" />}
                      {item.package.service_type.includes('Coordination') && <Users className="w-6 h-6 text-rose-600" />}
                      {item.package.service_type.includes('Planning') && <Calendar className="w-6 h-6 text-rose-600" />}
                      {!['Photography','Videography','DJ','Musician','Coordination','Planning'].some(t => item.package.service_type.includes(t)) && 
                        <Package className="w-6 h-6 text-rose-600" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.package.name}</h4>
                      <p className="text-sm text-gray-600">{item.vendor.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-rose-600">{formatPrice(item.package.price)}</div>
                    <div className="text-xs text-gray-500">50% deposit paid</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 text-rose-500" />
                    <span><strong>Date:</strong> {formatDate(item.eventDate)}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-4 h-4 mr-2 text-rose-500" />
                    <span><strong>Time:</strong> {formatTime(item.eventTime)} - {formatTime(item.endTime)}</span>
                  </div>
                  {item.venue && (
                    <div className="flex items-center text-gray-700 md:col-span-2">
                      <MapPin className="w-4 h-4 mr-2 text-rose-500" />
                      <span><strong>Venue:</strong> {item.venue.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* NEXT STEPS */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-blue-900 mb-3">What Happens Next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <Mail className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                <span>You'll receive a detailed confirmation email within 5 minutes</span>
              </li>
              <li className="flex items-start">
                <Phone className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                <span>Your vendors will contact you within 24 hours to confirm details</span>
              </li>
              <li className="flex items-start">
                <DollarSign className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                <span>Remaining balance of {formatPrice(remainingBalance)} due 7 days before your event</span>
              </li>
              <li className="flex items-start">
                <Users className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                <span>
                  {isAuthenticated 
                    ? 'Use your dashboard to message vendors and track progress' 
                    : 'Create an account to message vendors and manage your wedding'}
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" className="flex-1" onClick={() => navigate('/my-bookings')} icon={Calendar}>
              View My Bookings
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </div>

          {!isAuthenticated && (
            <div className="mt-6 p-5 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-amber-900 font-medium mb-2">
                Unlock full access to your wedding dashboard
              </p>
              <Button variant="outline" className="w-full" onClick={onCreateAccount} icon={Users}>
                Create Account to Message Vendors
              </Button>
            </div>
          )}
        </Card>

        <div className="text-center mt-10 text-sm text-gray-500">
          <p>Questions? Contact us at <a href="mailto:hello@bremembered.io" className="text-rose-600 hover:underline">hello@bremembered.io</a></p>
          <p className="mt-1">Booking ID: #BR-{Date.now().toString().slice(-6)}</p>
        </div>
      </div>
    </div>
  );
};