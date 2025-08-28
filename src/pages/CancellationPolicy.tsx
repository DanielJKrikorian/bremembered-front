import React from 'react';
import { ArrowLeft, FileText, Shield, Scale, Mail, MapPin, AlertTriangle, Clock, CreditCard, Users, Calendar, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const CancellationPolicy: React.FC = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-red-600 to-orange-600 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              Back
            </Button>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cancellation Policy
            </h1>
            <p className="text-xl text-white/90">
              Last Updated: August 28, 2025
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <Card className="p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed">
              This Cancellation Policy ("Policy") explains how cancellations and related refunds are handled when booking through B. Remembered Inc. ("Company," "we," "our," or "us"). By making a booking through bremembered.io, you agree to this Policy in addition to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Client Responsibility</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>When booking services through our platform, you are entering into a direct agreement with the selected Vendor. Each Vendor may maintain their own cancellation and rescheduling terms. It is the Client's responsibility to review and understand a Vendor's cancellation policy prior to booking.</p>
            </div>
          </Card>

          {/* Section 2 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-red-600">2</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">B. Remembered Service Fee</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">Non-Refundable Fees</h4>
                </div>
                <p className="text-red-800">All B. Remembered service fees and platform percentage fees collected at checkout are non-refundable under all circumstances.</p>
              </div>
              <p>These fees cover platform use, payment processing, and administrative costs, and remain due regardless of whether the event is canceled, rescheduled, or disputed.</p>
            </div>
          </Card>

          {/* Section 3 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-purple-600">3</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Vendor Payments</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ul className="list-disc list-inside space-y-2">
                <li>Refunds for Vendor services (outside of our non-refundable service fees) are determined by the Vendor's individual cancellation policy.</li>
                <li>Any disputes, changes, or refund requests must be resolved directly with the Vendor.</li>
                <li>B. Remembered is not responsible for Vendor decisions regarding cancellations or refunds.</li>
              </ul>
            </div>
          </Card>

          {/* Section 4 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-600">4</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Booking Insurance (Optional)</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900">Insurance Coverage</h4>
                </div>
                <p className="text-emerald-800">If you purchase booking insurance (when available), you may be eligible for a refund of your down payment in the event of a covered cancellation.</p>
              </div>
              <ul className="list-disc list-inside space-y-2">
                <li>The insurance fee itself and our service fee remain non-refundable.</li>
                <li>Coverage and eligibility are determined by the terms of the insurance provider.</li>
              </ul>
            </div>
          </Card>

          {/* Section 5 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-amber-600">5</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Rescheduling</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">Rescheduling Requests</h4>
                  </div>
                  <p className="text-sm text-amber-800">Requests to reschedule are subject to Vendor availability and approval.</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-900">Service Fee Policy</h4>
                  </div>
                  <p className="text-sm text-red-800">Our service fee remains non-refundable in the event of rescheduling.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 6 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-orange-600">6</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">No-Show Policy</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-900">No-Show Policy</h4>
                </div>
                <p className="text-orange-800">If a Client fails to show up for a scheduled event without prior cancellation or rescheduling in accordance with the Vendor's policy, no refund will be issued.</p>
              </div>
            </div>
          </Card>

          {/* Section 7 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-indigo-600">7</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Force Majeure</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-indigo-900">Extraordinary Events</h4>
                </div>
                <p className="text-indigo-800">In cases of extraordinary events outside of either party's control (e.g., natural disasters, government restrictions, pandemics), cancellation and refund decisions will follow the Vendor's policy. Our service fee remains non-refundable.</p>
              </div>
            </div>
          </Card>

          {/* Contact Section */}
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">For questions about this Policy, please contact:</p>
              <div className="bg-white rounded-lg p-6 border border-blue-200">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">B. Remembered Inc.</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <div>276 Turnpike Rd.</div>
                      <div>Westborough, MA 01581</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <a href="mailto:hello@bremembered.io" className="text-blue-600 hover:text-blue-700">
                      hello@bremembered.io
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="primary"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/support')}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};