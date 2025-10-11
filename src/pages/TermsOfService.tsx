import React, { useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Shield, Scale, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { trackPageView } from '../utils/analytics'; // Import trackPageView

export const TermsOfService: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // Add useAuth
  const analyticsTracked = useRef(false); // Add ref to prevent duplicate calls

  // Track analytics only once on mount
  useEffect(() => {
    if (!authLoading && !analyticsTracked.current) {
      console.log('Tracking analytics for terms-of-service:', new Date().toISOString());
      trackPageView('terms-of-service', 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [authLoading, user?.id]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 px-4 sm:px-6 lg:px-8">
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms of Service
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
              Welcome to B. Remembered Inc. ("Company," "we," "our," or "us"). These Terms of Service ("Terms") govern your use of our website bremembered.io (the "Site"), our services, and any bookings made through our platform (collectively, the "Services"). By accessing or using our Services, you agree to these Terms.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed font-semibold">
              If you do not agree, please do not use the Services.
            </p>
          </div>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Our Role</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>B. Remembered Inc. provides an online platform that allows couples and individuals ("Clients") to discover, book, and pay independent vendors ("Vendors") for event services.</p>
              <p>We are not the provider of vendor services. Vendors are independent contractors who are solely responsible for the quality, safety, legality, and performance of the services they provide.</p>
              <p>Bookings are made between Clients and Vendors directly. We do not guarantee or warrant the performance of any Vendor.</p>
            </div>
          </Card>

          {/* Section 2 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-600">2</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payments and Stripe Connect</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>All payments are processed through Stripe Connect. By using our Services, you agree to comply with <a href="https://stripe.com/legal/connect-account" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Stripe's Terms of Service</a>.</p>
              <p>Vendors must register with Stripe Connect to receive payments. Payouts are handled by Stripe, not directly by B. Remembered.</p>
              <p>We may charge a platform service fee and/or percentage fee at checkout. These fees are non-refundable under all circumstances.</p>
            </div>
          </Card>

          {/* Section 3 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-red-600">3</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Fees, Refunds, and Insurance</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p><strong>Service Fees:</strong> Our percentage and service fees collected at checkout are non-refundable, even if the booking is canceled or disputed.</p>
              <p><strong>Booking Insurance (Optional):</strong> If you purchase booking insurance (when available), you may be eligible to receive a refund of your down payment in the event of a covered cancellation. The insurance fee itself and our platform service fee remain non-refundable.</p>
              <p><strong>Vendor Charges:</strong> Any disputes, refunds, or issues related to Vendor services must be resolved directly with the Vendor. We are not responsible for Vendor decisions, pricing, or actions.</p>
            </div>
          </Card>

          {/* Section 4 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-purple-600">4</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Vendor Selection and Recommendations</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>We may recommend or highlight packages, Vendors, or services based on our opinions, algorithms, or user preferences. These are recommendations only and do not constitute guarantees of quality or fit.</p>
              <p>Clients are solely responsible for choosing Vendors. We are not liable for dissatisfaction, misrepresentation, or disputes arising from Vendor selection or performance.</p>
            </div>
          </Card>

          {/* Section 5 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-amber-600">5</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Independent Contractors (Vendors)</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>Vendors using our platform are independent contractors (1099) and are not employees, agents, or representatives of B. Remembered.</p>
              <p>Vendors are responsible for their own taxes, licensing, and compliance with applicable laws.</p>
            </div>
          </Card>

          {/* Section 6 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-rose-600">6</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Cancellations and Changes</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>Cancellations and rescheduling policies may vary by Vendor. Clients should carefully review Vendor policies before booking. Our service fee and any applicable insurance fee remain non-refundable regardless of Vendor cancellation policies.</p>
            </div>
          </Card>

          {/* Section 7 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-indigo-600">7</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Data and Privacy</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>We collect and store personal information necessary to operate the Services (see forthcoming Privacy Policy).</p>
              <p>Payment card information is not stored by us. All card details are processed and stored securely by Stripe.</p>
              <p>By using our Services, you consent to the collection and use of your information in accordance with our Privacy Policy (to be published separately).</p>
            </div>
          </Card>

          {/* Section 8 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">8</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Limitation of Liability</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>To the maximum extent permitted by law:</p>
              <ul>
                <li>B. Remembered Inc. is not responsible for the acts, omissions, or performance of Vendors.</li>
                <li>We disclaim liability for disputes, damages, losses, cancellations, or unsatisfactory services arising from Vendor-client relationships.</li>
                <li>Our maximum liability for any claim related to the Services will not exceed the amount of service fees paid to us for the booking at issue.</li>
              </ul>
            </div>
          </Card>

          {/* Section 9 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Scale className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Governing Law</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>These Terms shall be governed by and construed under the laws of the Commonwealth of Massachusetts, without regard to conflict-of-law principles.</p>
            </div>
          </Card>

          {/* Section 10 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-yellow-600">10</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Changes to Terms</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>We may update these Terms at any time. Updated versions will be posted on the Site with a new "Last Updated" date. Continued use of the Services constitutes acceptance of any changes.</p>
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
              <p className="mb-4">For questions regarding these Terms, contact:</p>
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

export default TermsOfService;