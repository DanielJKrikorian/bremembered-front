import React from 'react';
import { ArrowLeft, Shield, Eye, Lock, Mail, MapPin, Users, Database, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  React.useEffect(() => {
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Privacy Policy
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
              This Privacy Policy describes how B. Remembered Inc. ("Company," "we," "our," or "us") collects, uses, and shares information when you use our website bremembered.io (the "Site") and related services (collectively, the "Services"). By using our Services, you agree to the practices described in this Privacy Policy.
            </p>
          </div>
        </Card>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>We collect the following categories of information when you use our Services:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Personal Information</h4>
                  </div>
                  <p className="text-sm text-blue-800">Name, email address, phone number, event details, and other contact information you voluntarily provide.</p>
                </div>
                
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-semibold text-emerald-900">Account Information</h4>
                  </div>
                  <p className="text-sm text-emerald-800">Information you provide when creating an account or booking a Vendor through our platform.</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Payment Information</h4>
                  </div>
                  <p className="text-sm text-purple-800">Payment card details are collected and processed by Stripe. We do not store full payment card information. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline">Stripe's Privacy Policy</a> governs their use of your payment data.</p>
                </div>
                
                <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Eye className="w-5 h-5 text-rose-600" />
                    <h4 className="font-semibold text-rose-900">Photos and Media</h4>
                  </div>
                  <p className="text-sm text-rose-800">Any photos, videos, or media files uploaded to our platform (e.g., for event planning or vendor portfolios).</p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 md:col-span-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Globe className="w-5 h-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">Technical Information</h4>
                  </div>
                  <p className="text-sm text-amber-800">IP address, browser type, device identifiers, cookies, and usage data.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-600">2</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>We use collected information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>To provide, operate, and improve our Services.</li>
                <li>To facilitate bookings and payments between Clients and Vendors.</li>
                <li>To communicate with you about your account, bookings, and support inquiries.</li>
                <li>To send promotional emails, newsletters, or marketing communications (you may opt out at any time).</li>
                <li>To comply with legal obligations and enforce our Terms of Service.</li>
              </ul>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-6">
                <h4 className="font-semibold text-amber-900 mb-2">Advertising Use of Photos</h4>
                <p className="text-amber-800">
                  By uploading photos or media to our Site, you grant B. Remembered Inc. a non-exclusive, royalty-free, worldwide license to use, reproduce, modify, and display such photos for marketing, advertising, and promotional purposes.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 3 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-purple-600">3</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sharing of Information</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>We may share your information in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><strong>With Vendors:</strong> Information necessary to complete bookings and enable communication between Clients and Vendors.</li>
                <li><strong>With Stripe:</strong> For payment processing and fraud prevention.</li>
                <li><strong>With Service Providers:</strong> Third-party partners that help us with hosting, analytics, communications, or advertising.</li>
                <li><strong>For Legal Reasons:</strong> If required by law, legal process, or to protect our rights, safety, or property.</li>
              </ul>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <p className="text-green-800 font-medium">
                  We do not sell your personal information to third parties.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 4 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-amber-600">4</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Data Retention</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                We retain your personal information as long as necessary to provide the Services, comply with legal obligations, resolve disputes, and enforce agreements.
              </p>
            </div>
          </Card>

          {/* Section 5 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-rose-600">5</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Access, update, or delete your personal information.</li>
                <li>Opt out of marketing communications.</li>
                <li>Request a copy of the information we hold about you.</li>
              </ul>
              <p className="mt-4">
                Requests can be made by contacting us at <a href="mailto:hello@bremembered.io" className="text-blue-600 hover:text-blue-700">hello@bremembered.io</a>.
              </p>
            </div>
          </Card>

          {/* Section 6 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-green-600">6</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Security</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                We take reasonable measures to protect your personal information against loss, theft, and unauthorized use or disclosure. However, no online transmission or storage system is 100% secure, and we cannot guarantee absolute security.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-900 text-sm">SSL Encryption</h4>
                  <p className="text-xs text-green-700">All data transmitted securely</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Lock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-900 text-sm">Secure Storage</h4>
                  <p className="text-xs text-blue-700">Data protected at rest</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Database className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-purple-900 text-sm">Access Controls</h4>
                  <p className="text-xs text-purple-700">Limited authorized access</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 7 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-indigo-600">7</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Children's Privacy</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                Our Services are not directed to individuals under the age of 13. We do not knowingly collect information from children under 13.
              </p>
            </div>
          </Card>

          {/* Section 8 */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">8</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Changes to This Policy</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                We may update this Privacy Policy from time to time. Updates will be posted with a revised "Last Updated" date. Continued use of the Services constitutes acceptance of the updated policy.
              </p>
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
              <p className="mb-4">If you have questions about this Privacy Policy, please contact us:</p>
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