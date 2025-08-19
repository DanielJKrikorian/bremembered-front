import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Clock, Check, AlertCircle, Calendar, User, Star, Plus, Receipt, Download, Eye, X, FileText } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, DollarSign, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';

interface BookingBalance {
  id: string;
  vendor_name: string;
  vendor_id: string;
  vendor_photo?: string;
  service_type: string;
  package_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_balance: number;
  event_date?: string;
  venue_name?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payments: PaymentRecord[];
  booking_intent_id?: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_type: string;
  created_at: string;
  tip?: number;
  status: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingBalance;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, booking }) => {
  const { couple } = useCouple();
  const [isDownloading, setIsDownloading] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadInvoicePDF = () => {
    setIsDownloading(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('INVOICE', 105, 25, { align: 'center' });

      // Company info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('B. Remembered', 20, 45);
      doc.text('Wedding Booking Platform', 20, 52);
      doc.text('hello@bremembered.io', 20, 59);

      // Invoice details
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details:', 20, 75);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice #: BR-${booking.id.slice(-8).toUpperCase()}`, 20, 85);
      doc.text(`Date: ${formatDate(new Date().toISOString())}`, 20, 92);
      doc.text(`Due Date: ${booking.event_date ? formatDate(booking.event_date) : 'Upon booking'}`, 20, 99);

      // Bill to
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, 115);
      doc.setFont('helvetica', 'normal');
      doc.text(couple?.name || 'Wedding Couple', 20, 125);
      if (couple?.email) {
        doc.text(couple.email, 20, 132);
      }
      if (couple?.phone) {
        doc.text(couple.phone, 20, 139);
      }

      // Service provider
      doc.setFont('helvetica', 'bold');
      doc.text('Service Provider:', 120, 115);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.vendor_name, 120, 125);
      doc.text(booking.service_type, 120, 132);

      // Service details
      doc.setFont('helvetica', 'bold');
      doc.text('SERVICE DETAILS', 20, 160);
      
      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(20, 170, 170, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Description', 25, 177);
      doc.text('Amount', 160, 177);

      // Service line
      doc.setFont('helvetica', 'normal');
      doc.text(booking.package_name, 25, 190);
      doc.text(booking.service_type, 25, 197);
      doc.text(formatPrice(booking.total_amount), 160, 190);

      // Event details if available
      if (booking.event_date) {
        doc.text(`Event Date: ${formatDate(booking.event_date)}`, 25, 207);
      }
      if (booking.venue_name) {
        doc.text(`Venue: ${booking.venue_name}`, 25, 214);
      }

      // Payment summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('PAYMENT SUMMARY', 20, 235);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Service Total:', 120, 250);
      doc.text(formatPrice(booking.total_amount), 160, 250);
      
      if (booking.paid_amount > 0) {
        doc.text('Amount Paid:', 120, 260);
        doc.text(`-${formatPrice(booking.paid_amount)}`, 160, 260);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Balance Due:', 120, 270);
        doc.text(formatPrice(booking.remaining_balance), 160, 270);
      }

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Thank you for choosing B. Remembered for your special day!', 105, 280, { align: 'center' });
      doc.text('Questions? Contact us at hello@bremembered.io or (555) 123-WEDDING', 105, 287, { align: 'center' });

      // Save the PDF
      doc.save(`Invoice_${booking.vendor_name.replace(/\s+/g, '_')}_${booking.id.slice(-6)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Invoice</h3>
            <p className="text-gray-600 mt-1">#{booking.id.slice(-8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{couple?.name || 'Wedding Couple'}</p>
                {couple?.email && <p>{couple.email}</p>}
                {couple?.phone && <p>{couple.phone}</p>}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Service Provider:</h4>
              <div className="flex items-center space-x-3">
                {booking.vendor_photo ? (
                  <img
                    src={booking.vendor_photo}
                    alt={booking.vendor_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{booking.vendor_name}</p>
                  <p className="text-gray-600">{booking.service_type}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Service Details</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-lg font-medium text-gray-900">{booking.package_name}</h5>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Service Type:</p>
                  <p className="font-medium">{booking.service_type}</p>
                </div>
                {booking.event_date && (
                  <div>
                    <p className="text-gray-600">Event Date:</p>
                    <p className="font-medium">{formatDate(booking.event_date)}</p>
                  </div>
                )}
                {booking.venue_name && (
                  <div>
                    <p className="text-gray-600">Venue:</p>
                    <p className="font-medium">{booking.venue_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Booking Date:</p>
                  <p className="font-medium">{formatDate(new Date().toISOString())}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Payment Summary</h4>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center font-medium text-gray-900">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{booking.package_name}</span>
                  <span className="font-medium">{formatPrice(booking.total_amount)}</span>
                </div>
              </div>
              
              {booking.paid_amount > 0 && (
                <>
                  <div className="px-4 py-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Amount Paid</span>
                      <span className="font-medium text-green-600">-{formatPrice(booking.paid_amount)}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Balance Due</span>
                      <span className="font-bold text-lg text-red-600">{formatPrice(booking.remaining_balance)}</span>
                    </div>
                  </div>
                </>
              )}
              
              {booking.remaining_balance === 0 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-green-50">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-900">Status</span>
                    <span className="font-bold text-green-600">PAID IN FULL</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          {booking.payments.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Payment History</h4>
              <div className="space-y-2">
                {booking.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{payment.payment_type}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(payment.amount)}
                      </p>
                      {payment.tip && (
                        <p className="text-sm text-green-600">
                          +{formatPrice(payment.tip)} tip
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              variant="primary"
              icon={Download}
              onClick={downloadInvoicePDF}
              disabled={isDownloading}
              loading={isDownloading}
              className="flex-1"
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>Thank you for choosing B. Remembered for your special day!</p>
            <p className="mt-1">Questions? Contact us at hello@bremembered.io</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface VendorPaymentInput {
  vendor_id: string;
  booking_id: string;
  booking_id: string;
  amount: number;
  tip: number;
  vendor_name: string;
}

const SinglePaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  booking: BookingBalance;
  onSuccess: () => void;
}> = ({ isOpen, onClose, booking, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    if (stripe && elements) {
      const cardElement = elements.getElement(CardElement);
      if (cardElement) {
        cardElement.on('ready', () => setCardReady(true));
        cardElement.on('change', (event) => {
          setCardError(event.error ? event.error.message : null);
        });
      }
    }

    return () => {
      if (elements) {
        const cardElement = elements.getElement(CardElement);
        if (cardElement) {
          cardElement.off('ready');
          cardElement.off('change');
        }
      }
    };
  }, [stripe, elements]);

  const handlePercentageSelect = (percentage: number) => {
    const tipAmount = (booking.remaining_balance / 100 * percentage) / 100;
    setTip(Math.round(tipAmount * 100) / 100);
  };

  const totalPayment = (booking.remaining_balance / 100) + tip;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !user) {
      setError('Payment system not ready');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card information not found');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(totalPayment * 100), // Convert to cents
            currency: 'usd',
            vendor_payments: [{
              vendor_id: booking.vendor_id,
              booking_id: booking.id,
              amount: booking.remaining_balance,
              tip: Math.round(tip * 100), // Convert to cents
              vendor_name: booking.vendor_name
            }]
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const { client_secret } = data;

      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.user_metadata?.name || 'Wedding Customer',
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess();
        onClose();
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Pay {booking.vendor_name}</h3>
          <p className="text-gray-600 mt-1">{booking.package_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Vendor Info */}
          <div className="flex items-center space-x-3">
            {booking.vendor_photo ? (
              <img
                src={booking.vendor_photo}
                alt={booking.vendor_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-900">{booking.vendor_name}</h4>
              <p className="text-sm text-gray-600">{booking.service_type}</p>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Remaining Balance:</span>
              <span className="text-lg font-semibold text-gray-900">
                ${(booking.remaining_balance / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Tip Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Tip (Optional)
            </label>
            <div className="space-y-3">
              <div className="flex space-x-2">
                {[10, 15, 20].map(percentage => (
                  <button
                    key={percentage}
                    type="button"
                    onClick={() => handlePercentageSelect(percentage)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={tip.toFixed(2)}
                onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                placeholder="Custom tip amount"
                icon={DollarSign}
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-900">Total Payment:</span>
              <span className="text-xl font-bold text-blue-900">
                ${totalPayment.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Card Element */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Information
            </label>
            <div className="p-4 border border-gray-300 rounded-lg bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#1f2937',
                      '::placeholder': {
                        color: '#6b7280',
                      },
                    },
                    invalid: {
                      color: '#dc2626',
                    },
                  },
                }}
              />
            </div>
            {cardError && (
              <p className="text-sm text-red-600 mt-1">{cardError}</p>
            )}
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 text-rose-500 focus:ring-rose-500"
                required
              />
              <span className="text-xs text-gray-600">
                I agree to process this payment securely through Stripe.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !stripe || !elements || !agreedToTerms || !cardReady}
              loading={loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : `Pay $${totalPayment.toFixed(2)}`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingBalance[];
  onSuccess: () => void;
}> = ({ isOpen, onClose, bookings, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorPayments, setVendorPayments] = useState<VendorPaymentInput[]>([]);

  useEffect(() => {
    if (isOpen && bookings.length > 0) {
      const initialPayments = bookings
        .filter(booking => booking.remaining_balance > 0)
        .map(booking => ({
          vendor_id: booking.vendor_id,
          booking_id: booking.id,
          booking_id: booking.id,
          amount: booking.remaining_balance / 100, // Convert from cents
          tip: 0,
          vendor_name: booking.vendor_name
        }));
      setVendorPayments(initialPayments);
    }
  }, [isOpen, bookings]);

  const handleTipChange = (vendorId: string, bookingId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setVendorPayments(prev =>
      prev.map(vp => 
        vp.vendor_id === vendorId && vp.booking_id === bookingId
          ? { ...vp, tip: Math.round(numValue * 100) / 100 }
          : vp
      )
    );
  };

  const handlePercentageSelect = (vendorId: string, bookingId: string, percentage: number) => {
    const vendorPayment = vendorPayments.find(vp => vp.vendor_id === vendorId && vp.booking_id === bookingId);
    if (vendorPayment) {
      const tipAmount = (vendorPayment.amount * percentage) / 100;
      setVendorPayments(prev =>
        prev.map(vp => 
          vp.vendor_id === vendorId && vp.booking_id === bookingId
            ? { ...vp, tip: Math.round(tipAmount * 100) / 100 }
            : vp
        )
      );
    }
  };

  const totalBasePayment = vendorPayments.reduce((sum, vp) => sum + vp.amount, 0);
  const totalTip = vendorPayments.reduce((sum, vp) => sum + vp.tip, 0);
  const totalPayment = totalBasePayment + totalTip;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setError('Stripe not initialized');
      return;
    }

    if (vendorPayments.length === 0 || totalPayment <= 0) {
      setError('No payments to process');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Payment form not loaded');
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment intent for the total amount
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(totalPayment * 100), // Convert to cents
            currency: 'usd',
            vendor_payments: vendorPayments.map(vp => ({
              ...vp,
              amount: Math.round(vp.amount * 100), // Convert to cents
              tip: Math.round(vp.tip * 100) // Convert to cents
            }))
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const { client_secret } = data;

      if (!client_secret) {
        throw new Error('No client secret returned');
      }

      // Confirm payment
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: bookings[0]?.vendor_name || 'Wedding Customer',
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess();
        onClose();
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Complete Payment</h3>
          <p className="text-gray-600 mt-1">Pay remaining balances and add tips for your vendors</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Vendor Payments */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Payment Breakdown</h4>
            {vendorPayments.map((vp) => {
              const booking = bookings.find(b => b.vendor_id === vp.vendor_id && b.id === vp.booking_id);
              return (
                <div key={`${vp.vendor_id}-${vp.booking_id}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    {booking?.vendor_photo ? (
                      <img
                        src={booking.vendor_photo}
                        alt={vp.vendor_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h5 className="font-medium text-gray-900">{vp.vendor_name}</h5>
                      <p className="text-sm text-gray-600">{booking?.package_name}</p>
                      <p className="text-sm text-gray-600">{booking?.service_type}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remaining Balance
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        ${vp.amount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Tip (Optional)
                      </label>
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          {[10, 15, 20].map(percentage => (
                            <button
                              key={percentage}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePercentageSelect(vp.vendor_id, vp.booking_id, percentage);
                              }}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                            >
                              {percentage}%
                            </button>
                          ))}
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={vp.tip.toFixed(2)}
                          onChange={(e) => handleTipChange(vp.vendor_id, vp.booking_id, e.target.value)}
                          placeholder="Custom tip amount"
                          icon={DollarSign}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total for this service:</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${(vp.amount + vp.tip).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Balance:</span>
                <span className="font-medium">${totalBasePayment.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tips:</span>
                <span className="font-medium">${totalTip.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total Payment:</span>
                <span>${totalPayment.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Card Element */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Information
            </label>
            <div className="p-4 border border-gray-300 rounded-lg bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#1f2937',
                      '::placeholder': {
                        color: '#6b7280',
                      },
                    },
                    invalid: {
                      color: '#dc2626',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isProcessing || !stripe || !elements || totalPayment <= 0}
              loading={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : `Pay $${totalPayment.toFixed(2)}`}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Payments are processed securely through Stripe. Your card information is never stored.
          </div>
        </form>
      </Card>
    </div>
  );
};

export const PaymentsSection: React.FC = () => {
  const { user } = useAuth();
  const { couple } = useCouple();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const [bookings, setBookings] = useState<BookingBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSinglePaymentModal, setShowSinglePaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<BookingBalance | null>(null);
  const [selectedTab, setSelectedTab] = useState<'outstanding' | 'paid' | 'all'>('outstanding');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<BookingBalance | null>(null);

  useEffect(() => {
    if (couple?.id) {
      fetchBookingBalances();
    }
  }, [couple]);

  const fetchBookingBalances = async () => {
    if (!couple?.id) {
      setLoading(false);
      return;
    }

    if (!supabase || !isSupabaseConfigured()) {
      // Mock data for demo
      const mockBookings: BookingBalance[] = [
        {
          id: 'mock-booking-1',
          vendor_name: 'Elegant Moments Photography',
          vendor_id: 'mock-vendor-1',
          vendor_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
          service_type: 'Photography',
          package_name: 'Premium Wedding Photography',
          total_amount: 250000, // $2,500 in cents
          paid_amount: 125000, // $1,250 in cents (50% deposit)
          remaining_balance: 125000, // $1,250 remaining
          event_date: '2024-08-15',
          venue_name: 'Sunset Gardens',
          status: 'confirmed',
          payments: [
            {
              id: 'payment-1',
              amount: 125000,
              payment_type: 'Deposit',
              created_at: '2024-01-15T10:00:00Z',
              status: 'succeeded'
            }
          ]
        },
        {
          id: 'mock-booking-2',
          vendor_name: 'Perfect Harmony Events',
          vendor_id: 'mock-vendor-2',
          vendor_photo: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
          service_type: 'Coordination',
          package_name: 'Day-of Coordination',
          total_amount: 80000, // $800 in cents
          paid_amount: 80000, // Fully paid
          remaining_balance: 0,
          event_date: '2024-08-15',
          venue_name: 'Sunset Gardens',
          status: 'confirmed',
          payments: [
            {
              id: 'payment-2',
              amount: 80000,
              payment_type: 'Full Payment',
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredBookings = bookings.filter(booking => {
    switch (selectedTab) {
      case 'outstanding':
        return booking.remaining_balance > 0;
      case 'paid':
        return booking.remaining_balance === 0;
      default:
        return true;
    }
  });

  const totalOutstanding = bookings.reduce((sum, booking) => sum + booking.remaining_balance, 0);
  const totalPaid = bookings.reduce((sum, booking) => sum + booking.paid_amount, 0);
  const outstandingCount = bookings.filter(b => b.remaining_balance > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Outstanding Balance</h3>
              <p className="text-2xl font-bold text-red-600">
                {formatPrice(totalOutstanding)}
              </p>
              <p className="text-sm text-gray-500">
                {outstandingCount} booking{outstandingCount !== 1 ? 's' : ''}
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
              <h3 className="text-lg font-medium text-gray-900">Total Paid</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(totalPaid)}
              </p>
              <p className="text-sm text-gray-500">
                {bookings.length - outstandingCount} booking{(bookings.length - outstandingCount) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Investment</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatPrice(totalOutstanding + totalPaid)}
              </p>
              <p className="text-sm text-gray-500">
                {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Pay Button */}
      {outstandingCount > 0 && (
        <Card className="p-6 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Complete Your Payments?
              </h3>
              <p className="text-gray-600">
                Pay all outstanding balances at once and add tips for your amazing vendors
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              icon={CreditCard}
              onClick={() => setShowPaymentModal(true)}
            >
              Pay {formatPrice(totalOutstanding)}
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'outstanding', label: 'Outstanding', count: outstandingCount },
            { key: 'paid', label: 'Paid', count: bookings.length - outstandingCount },
            { key: 'all', label: 'All Payments', count: bookings.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${selectedTab === tab.key
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
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedTab === 'outstanding' ? 'No outstanding payments' : 
               selectedTab === 'paid' ? 'No completed payments' : 'No bookings found'}
            </h3>
            <p className="text-gray-600">
              {selectedTab === 'outstanding' 
                ? 'All your payments are up to date!' 
                : 'Payment history will appear here once you make payments.'}
            </p>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  {booking.vendor_photo ? (
                    <img
                      src={booking.vendor_photo}
                      alt={booking.vendor_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {booking.package_name}
                    </h3>
                    <p className="text-gray-600 mb-2">by {booking.vendor_name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{booking.event_date ? formatDate(booking.event_date) : 'Date TBD'}</span>
                      </div>
                      {booking.venue_name && (
                        <div className="flex items-center">
                          <span>{booking.venue_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatPrice(booking.total_amount)}
                  </div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-lg font-semibold text-green-600">
                    {formatPrice(booking.paid_amount)}
                  </div>
                  <div className="text-sm text-green-700">Paid</div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  booking.remaining_balance > 0 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-lg font-semibold ${
                    booking.remaining_balance > 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {formatPrice(booking.remaining_balance)}
                  </div>
                  <div className={`text-sm ${
                    booking.remaining_balance > 0 ? 'text-red-700' : 'text-gray-700'
                  }`}>
                    Remaining
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-lg font-semibold text-blue-600">
                    {Math.round((booking.paid_amount / booking.total_amount) * 100)}%
                  </div>
                  <div className="text-sm text-blue-700">Complete</div>
                </div>
              </div>

              {/* Payment History */}
              {booking.payments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {booking.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{payment.payment_type}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(payment.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(payment.amount)}
                          </p>
                          {payment.tip && (
                            <p className="text-sm text-green-600">
                              +{formatPrice(payment.tip)} tip
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {booking.remaining_balance > 0 && (
                  <>
                    <Button
                      variant="primary"
                      icon={CreditCard}
                      onClick={() => handleSinglePayment(booking)}
                    >
                      Pay {formatPrice(booking.remaining_balance)}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  icon={Receipt}
                  onClick={() => handleViewInvoice(booking)}
                >
                  View Invoice
                </Button>
                <Button
                  variant="outline"
                  icon={Download}
                >
                  Download Receipt
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Payment Modal */}
      <Elements stripe={stripePromise}>
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookings={bookings.filter(b => b.remaining_balance > 0)}
          onSuccess={handlePaymentSuccess}
        />
        {selectedBookingForPayment && (
          <SinglePaymentModal
            isOpen={showSinglePaymentModal}
            onClose={() => {
              setShowSinglePaymentModal(false);
              setSelectedBookingForPayment(null);
            }}
            booking={selectedBookingForPayment}
            onSuccess={handlePaymentSuccess}
          />
        )}
        {selectedBookingForInvoice && (
          <InvoiceModal
            isOpen={showInvoiceModal}
            onClose={() => {
              setShowInvoiceModal(false);
              setSelectedBookingForInvoice(null);
            }}
            booking={selectedBookingForInvoice}
          />
        )}
      </Elements>
    </div>
  );
};