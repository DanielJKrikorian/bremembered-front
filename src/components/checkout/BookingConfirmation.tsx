import React from 'react';
import { Check, Calendar, Users, CreditCard } from 'lucide-react';
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
  cartItems,
  totalAmount,
  depositAmount,
  onCreateAccount
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  return (
    <Card className="p-8 text-center max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-3xl font-semibold text-gray-900 mb-4">Booking Confirmed!</h2>
      <p className="text-xl text-gray-600 mb-6">
        Thank you for choosing B. Remembered! Your wedding booking has been successfully confirmed.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Booking ID:</span>
            <span className="font-medium">#BR-{Date.now().toString().slice(-6)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Services:</span>
            <span className="font-medium">{cartItems.length} service{cartItems.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Deposit Paid:</span>
            <span className="font-medium">{formatPrice(depositAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Remaining Balance:</span>
            <span className="font-medium">{formatPrice(totalAmount - depositAmount)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button 
          variant="primary" 
          className="w-full"
          onClick={() => navigate('/my-bookings')}
          icon={Calendar}
        >
          View My Bookings
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </Button>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• You'll receive a confirmation email within 5 minutes</li>
          <li>• Your vendors will contact you within 24 hours</li>
          <li>• The remaining balance will be due 7 days before your event</li>
          <li>• {!isAuthenticated ? 'Create an account to message vendors and track progress' : 'Use your dashboard to track progress and message vendors'}</li>
        </ul>
      </div>

      {!isAuthenticated && (
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={onCreateAccount}
            className="w-full"
            icon={Users}
          >
            Create Account to Message Vendors
          </Button>
        </div>
      )}
    </Card>
  );
};