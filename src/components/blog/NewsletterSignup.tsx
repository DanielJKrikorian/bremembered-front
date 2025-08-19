import React, { useState } from 'react';
import { Mail, BookOpen, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useBlogSubscription } from '../../hooks/useBlogSubscription';

interface NewsletterSignupProps {
  source?: string;
  title?: string;
  description?: string;
  className?: string;
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  source = 'blog',
  title = 'Never Miss Wedding Inspiration',
  description = 'Get the latest wedding tips, real stories, and vendor spotlights delivered to your inbox weekly.',
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { subscribe, loading, error, success, clearMessages } = useBlogSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    const subscribed = await subscribe(email, name, source);
    
    if (subscribed) {
      setEmail('');
      setName('');
      // Clear success message after 5 seconds
      setTimeout(() => {
        clearMessages();
      }, 5000);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error || success) {
      clearMessages();
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error || success) {
      clearMessages();
    }
  };

  return (
    <div className={`bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200 rounded-xl p-8 ${className}`}>
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-8 h-8 text-rose-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h3>
        <p className="text-gray-600 mb-6">
          {description}
        </p>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-green-800">
              <Check className="w-5 h-5" />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={handleNameChange}
                className="flex-1"
                disabled={loading}
              />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                className="flex-1"
                required
                disabled={loading}
              />
            </div>
            <div className="flex justify-center">
              <Button 
                type="submit"
                variant="primary" 
                size="lg"
                loading={loading}
                disabled={!email.trim() || loading}
                icon={Mail}
              >
                Subscribe
              </Button>
            </div>
          </form>
        )}

        <p className="text-sm text-gray-500 mt-4">
          Join 10,000+ couples planning their perfect day. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
};