import React, { useState } from 'react';
import { X, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAccept
}) => {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    
    if (isAtBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
      setHasReadTerms(true);
    }
  };

  const handleAccept = () => {
    if (hasReadTerms && agreedToTerms) {
      onAccept();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Terms & Conditions</h3>
              <p className="text-sm text-gray-600">Please read and accept to continue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Terms Content */}
        <div 
          className="flex-1 p-6 overflow-y-auto prose prose-sm max-w-none"
          onScroll={handleScroll}
        >
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">B. Remembered Vendor Terms & Conditions</h1>
              <p className="text-sm text-gray-600">Last Updated: January 2024</p>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By submitting an application to become a vendor on the B. Remembered 3.0 platform, you ("Vendor") agree to abide by these Terms & Conditions. These Terms govern your use of the platform and participation in the B. Remembered vendor network.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. About B. Remembered</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                B. Remembered is a nationwide wedding services platform connecting couples with trusted, pre-vetted vendors across photography, videography, DJ, and coordination. Our mission is to make wedding planning simple, transparent, and stress-free, while helping vendors grow their businesses with reliable bookings and the support they deserve.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We hold our vendors to high standards because our couples trust us to deliver excellence. By joining, you commit to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Professionalism:</strong> Timely communication, reliability, and respect for every client.</li>
                <li><strong>Quality of Service:</strong> Maintaining at least a 3.5-star rating to remain listed.</li>
                <li><strong>Transparency:</strong> Honest pricing and clear service descriptions.</li>
                <li><strong>Partnership:</strong> Working with our team to ensure couples enjoy a seamless experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Application & Onboarding</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Application Review:</strong> All vendor applications are reviewed by the B. Remembered team. Approval or rejection is at our sole discretion.</li>
                <li><strong>Acceptance:</strong> If approved, you will receive login credentials and onboarding instructions to activate your vendor profile.</li>
                <li><strong>Rejection:</strong> If not approved, you may reapply after 30 days. B. Remembered does not guarantee acceptance upon reapplication.</li>
                <li><strong>Profile Setup:</strong> Vendors must upload accurate business information, service descriptions, and portfolio content.</li>
                <li><strong>Authenticity of Content:</strong> Vendors may only upload photos, videos, and other materials they own or are licensed to use. Misrepresenting work or using false content is strictly prohibited.</li>
                <li><strong>Liability for Misrepresentation:</strong> Vendors are solely responsible for claims or damages arising from misrepresentation, including falsely presenting work that does not belong to them. Vendors agree to indemnify B. Remembered from such claims.</li>
                <li><strong>Ongoing Updates:</strong> Vendors must keep their profiles, pricing, and availability current.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Bookings & Performance</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Responsibility for Services:</strong> Vendors are solely responsible for delivering services as described in their profile and agreed upon at booking.</li>
                <li><strong>Direct Communication:</strong> Vendors must communicate directly with couples to confirm details, coordinate logistics, and resolve disputes.</li>
                <li><strong>Non-Performance:</strong> If unable to fulfill a booking, Vendors must immediately notify the couple and provide a full refund.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Payments & Refunds</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Payment Processing:</strong> Payments are handled via Stripe. Vendors authorize B. Remembered to process payments and distribute funds according to the platform's 50/50 split.</li>
                <li><strong>Vendor Share:</strong> Vendors receive 50% of the payment directly for services rendered.</li>
                <li><strong>Refunds:</strong> Vendors are responsible for issuing refunds if they cannot fulfill obligations.</li>
                <li><strong>Chargebacks:</strong> Vendors are liable for chargebacks or disputes related to their services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Reviews & Ratings</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Independent Feedback:</strong> Couples may leave reviews and ratings based on their experiences.</li>
                <li><strong>No Modification:</strong> B. Remembered does not alter, remove, or edit reviews except where required by law.</li>
                <li><strong>Vendor Responsibility:</strong> Vendors must manage their reputation through service quality and direct communication with couples.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Intellectual Property Rights</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Vendor Content:</strong> Vendors retain ownership of the content they upload but grant B. Remembered a worldwide, royalty-free, non-exclusive license to use, display, and promote such content (e.g., photos, videos, logos, service descriptions) for marketing and platform purposes.</li>
                <li><strong>B. Remembered Branding:</strong> Vendors may not use B. Remembered's name, logos, or trademarks without prior written consent, except where authorized for platform use.</li>
                <li><strong>Third-Party Rights:</strong> Vendors are responsible for ensuring their uploaded content does not infringe on third-party copyrights, trademarks, or intellectual property rights.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Confidentiality & Non-Solicitation</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Confidentiality:</strong> Vendors agree not to misuse or disclose any confidential information about B. Remembered, couples, or other vendors obtained through the platform.</li>
                <li><strong>Non-Solicitation:</strong> Vendors may not solicit, contact, or contract with couples outside the platform for future services obtained through B. Remembered, unless expressly permitted.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Prohibited Conduct</h2>
              <p className="text-gray-700 leading-relaxed mb-2">Vendors must not:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Engage in fraudulent, deceptive, or misleading practices.</li>
                <li>Harass, abuse, or discriminate against couples, staff, or other vendors.</li>
                <li>Attempt to manipulate reviews or ratings.</li>
                <li>Misuse the platform, including attempting to circumvent payment systems or exploit technical vulnerabilities.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Taxes & Compliance</h2>
              <p className="text-gray-700 leading-relaxed">
                Vendors are solely responsible for reporting and paying all federal, state, and local taxes related to earnings from the platform. B. Remembered does not withhold or remit taxes on behalf of vendors.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Independent Contractor Status</h2>
              <p className="text-gray-700 leading-relaxed">
                Vendors are independent contractors, not employees, agents, or representatives of B. Remembered. Vendors are solely responsible for their own insurance, licensing, equipment, and business expenses. Nothing in these Terms creates an employment, partnership, or joint venture relationship.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Liability & Indemnification</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Marketplace Role:</strong> B. Remembered acts solely as a connecting platform and does not guarantee the performance of vendors.</li>
                <li><strong>Vendor Liability:</strong> Vendors assume all liability for their services, including compliance, performance, safety, and quality.</li>
                <li><strong>Indemnification:</strong> Vendors agree to indemnify and hold harmless B. Remembered, its affiliates, and representatives from any claims, losses, or disputes arising from their services or misrepresentation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">13. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, B. Remembered's liability arising out of or relating to these Terms shall not exceed the total platform fee earned by B. Remembered in connection with the booking giving rise to such liability.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">14. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                B. Remembered reserves the right to suspend or terminate a Vendor's account at any time for violations of these Terms, poor performance, misrepresentation, or fraudulent activity.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">15. Dispute Resolution & Governing Law</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Good Faith Resolution:</strong> Vendors agree to first attempt to resolve disputes directly with B. Remembered through good faith communication.</li>
                <li><strong>Mediation/Arbitration:</strong> If a resolution cannot be reached, disputes shall be submitted to binding arbitration in Middlesex County, Massachusetts, in accordance with the rules of the American Arbitration Association (AAA).</li>
                <li><strong>No Class Actions:</strong> Vendors agree not to participate in any class action or collective lawsuit against B. Remembered.</li>
                <li><strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of the Commonwealth of Massachusetts, without regard to conflict of law principles.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">16. Updates to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms may be updated periodically. Continued participation constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* Scroll indicator */}
            {!scrolledToBottom && (
              <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4">
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Please scroll to the bottom to continue</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="space-y-4">
            {/* Read confirmation */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="read-terms"
                checked={hasReadTerms}
                onChange={(e) => setHasReadTerms(e.target.checked)}
                disabled={!scrolledToBottom}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="read-terms" className="text-sm text-gray-700">
                I have read and understood the Terms & Conditions
                {!scrolledToBottom && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>

            {/* Agreement confirmation */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={!hasReadTerms}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="agree-terms" className="text-sm text-gray-700">
                I agree to be bound by these Terms & Conditions
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAccept}
                disabled={!hasReadTerms || !agreedToTerms}
                icon={Check}
              >
                Accept Terms & Submit Application
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};