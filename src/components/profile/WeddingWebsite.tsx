import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useWebsiteGallery } from '../../hooks/useWebsiteGallery';
import { useWeddingTimeline } from '../../hooks/useWeddingTimeline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { RsvpModal } from '../../components/profile/RsvpModal';
import { Lock, Check, User, Calendar, Image } from 'lucide-react';

interface WebsiteSettings {
  couple_id: string;
  slug: string;
  password: string;
  layout: 'classic' | 'modern' | 'romantic';
  about_us?: string;
  love_story?: string;
  accommodations?: { name: string; website: string; room_block?: string }[];
  couple: {
    partner1_name: string;
    partner2_name: string;
    profile_photo?: string;
    wedding_date?: string;
  };
}

export const WeddingWebsite: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { photos, loading: galleryLoading } = useWebsiteGallery();
  const { events, loading: timelineLoading } = useWeddingTimeline();
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch website settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!slug || !supabase || !isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('wedding_websites')
          .select(`
            *,
            couple: couples (
              partner1_name,
              partner2_name,
              profile_photo,
              wedding_date
            )
          `)
          .eq('slug', slug)
          .single();
        if (error) throw error;
        setSettings(data);
      } catch (err) {
        setError('Website not found');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [slug]);

  // Handle password verification
  const handlePasswordSubmit = () => {
    if (settings && password === settings.password) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Incorrect password');
    }
  };

  // Format time for display
  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not set';
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Layout styles
  const layoutStyles = {
    classic: {
      container: 'bg-white',
      header: 'bg-rose-100 text-rose-800',
      section: 'border-rose-200',
      button: 'bg-rose-500 hover:bg-rose-600 text-white'
    },
    modern: {
      container: 'bg-gray-900 text-white',
      header: 'bg-gray-800 text-gray-100',
      section: 'border-gray-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    romantic: {
      container: 'bg-pink-50',
      header: 'bg-pink-200 text-pink-800',
      section: 'border-pink-200',
      button: 'bg-pink-500 hover:bg-pink-600 text-white'
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Not Found</h2>
          <p className="text-gray-600">The wedding website you are looking for does not exist.</p>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Enter Password</h2>
          <p className="text-gray-600 mb-6">Please enter the password to view this wedding website.</p>
          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              icon={Lock}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button
              variant="primary"
              onClick={handlePasswordSubmit}
              className="w-full"
            >
              Submit
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const styles = layoutStyles[settings.layout];

  return (
    <div className={`min-h-screen ${styles.container}`}>
      <header className={`py-12 ${styles.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {settings.couple.partner1_name} & {settings.couple.partner2_name}
          </h1>
          {settings.couple.wedding_date && (
            <p className="text-lg">
              {new Date(settings.couple.wedding_date).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
            </p>
          )}
          {settings.couple.profile_photo && (
            <img
              src={settings.couple.profile_photo}
              alt="Couple"
              className="w-32 h-32 rounded-full object-cover mx-auto mt-4"
            />
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* About Us */}
        {settings.about_us && (
          <section className={`mb-12 border-t pt-8 ${styles.section}`}>
            <h2 className="text-2xl font-semibold mb-4">About Us</h2>
            <p className="text-gray-700">{settings.about_us}</p>
          </section>
        )}
        {/* How We Met / Our Love Story */}
        {settings.love_story && (
          <section className={`mb-12 border-t pt-8 ${styles.section}`}>
            <h2 className="text-2xl font-semibold mb-4">Our Love Story</h2>
            <p className="text-gray-700">{settings.love_story}</p>
          </section>
        )}
        {/* Accommodations */}
        {settings.accommodations && settings.accommodations.length > 0 && (
          <section className={`mb-12 border-t pt-8 ${styles.section}`}>
            <h2 className="text-2xl font-semibold mb-4">Accommodations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings.accommodations.map((hotel, index) => (
                <Card key={index} className="p-4">
                  <h3 className="font-medium text-lg">{hotel.name}</h3>
                  <a
                    href={hotel.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit Website
                  </a>
                  {hotel.room_block && (
                    <p className="text-sm text-gray-600 mt-2">{hotel.room_block}</p>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}
        {/* Timeline Section */}
        <section className={`mb-12 border-t pt-8 ${styles.section}`}>
          <h2 className="text-2xl font-semibold mb-4">Our Wedding Day</h2>
          {timelineLoading ? (
            <p>Loading timeline...</p>
          ) : events.length === 0 ? (
            <p>No timeline events available.</p>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <Card key={event.id} className="p-4">
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm">
                    {formatTime(event.start_time)} {event.end_time ? `- ${formatTime(event.end_time)}` : ''}
                  </p>
                  {event.description && <p className="text-sm mt-1">{event.description}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>
        {/* Website Gallery Section */}
        <section className={`mb-12 border-t pt-8 ${styles.section}`}>
          <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
          {galleryLoading ? (
            <p>Loading gallery...</p>
          ) : photos.length === 0 ? (
            <p>No photos available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {photos.map(photo => (
                <Card key={photo.id} className="overflow-hidden">
                  <img
                    src={photo.public_url}
                    alt={photo.file_name}
                    className="w-full h-48 object-cover"
                  />
                </Card>
              ))}
            </div>
          )}
        </section>
        {/* RSVP Section */}
        <section className="text-center">
          <Button
            variant="primary"
            className={styles.button}
            onClick={() => setShowRsvpModal(true)}
          >
            RSVP Now
          </Button>
        </section>
      </main>
      <RsvpModal
        isOpen={showRsvpModal}
        onClose={() => setShowRsvpModal(false)}
        coupleId={settings.couple_id}
      />
    </div>
  );
};