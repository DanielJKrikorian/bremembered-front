import React, { useState } from 'react';
import { X, Mail, Save, Heart, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (email: string) => void;
  onSkip: () => void;
}

export const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSkip
}) => {
  const [email, setEmail] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      await onSave(email);
      onClose();
    } catch (error) {
      console.error('Error saving email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-md p-8 relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-rose-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Don't Lose Your Progress!
          </h3>
          <p className="text-gray-600">
            Save your wedding planning progress and we'll send you your personalized recommendations.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            icon={Mail}
            required
          />
          
          <Input
            label="Wedding Date (Optional)"
            type="date"
            value={weddingDate}
            onChange={(e) => setWeddingDate(e.target.value)}
            placeholder="Select your wedding date"
            icon={Calendar}
          />
          
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSave}
              disabled={!email || loading}
              loading={loading}
              icon={Save}
            >
              Save My Progress
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleSkip}
            >
              Continue Without Saving
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your personalized package recommendations</li>
            <li>• Vendor contact information</li>
            <li>• Wedding planning tips and inspiration</li>
            <li>• Exclusive offers and discounts</li>
          </ul>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          We respect your privacy. Unsubscribe anytime.
        </p>
      </Card>
    </div>
  );
};