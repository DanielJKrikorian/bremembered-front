import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useWebsiteGallery } from '../../hooks/useWebsiteGallery';
import { useWeddingTimeline } from '../../hooks/useWeddingTimeline';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { RsvpModal } from '../../components/profile/RsvpModal';
import { Lock, Eye, EyeOff, User, Calendar, MapPin } from 'lucide-react';

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
    venue_name?: string;
  };
}

export const WeddingWebsite: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { photos, loading: galleryLoading } = useWebsiteGallery();
  const { events, loading: timelineLoading } = useWeddingTimeline(true); // Fetch only website events
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!slug || !supabase || !isSupabaseConfigured()) {
        setLoading(false);
        setError('Supabase not configured or slug missing');
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
              wedding_date,
              venue_name
            )
          `)
          .eq('slug', slug)
          .single();
        if (error) {
          throw new Error(`Failed to fetch website settings: ${error.message}`);
        }
        if (!data) {
          throw new Error('No website found for this slug');
        }
        setSettings(data);
      } catch (err: any) {
        console.error('Error fetching website settings:', err);
        setError(err.message || 'Website not found');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [slug]);

  // Handle Supabase auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth event:', event);
    });
    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const handlePasswordSubmit = () => {
    if (settings && password === settings.password) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Incorrect password');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const formatDateTime = (event: { event_date: string; event_time: string }) => {
    try {
      const date = parseISO(event.event_date);
      const time = parseISO(`2000-01-01T${event.event_time}`);
      const formattedDate = formatInTimeZone(date, 'America/New_York', 'MM/dd/yyyy');
      const formattedTime = format(time, 'h:mm a');
      return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting date/time:', error, 'Event:', event);
      return 'Invalid date/time';
    }
  };

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

  const memoizedSettings = useMemo(() => settings, [settings]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!memoizedSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Not Found</h2>
          <p className="text-gray-600">{error || 'The wedding website you are looking for does not exist.'}</p>
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
            <div className="relative flex items-center">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                icon={Lock}
                className="pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-full text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
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

  const styles = layoutStyles[memoizedSettings.layout] || layoutStyles.classic;

  return (
    <div className={`min-h-screen ${styles.container}`}>
      <header className={`py-12 ${styles.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {memoizedSettings.couple.partner1_name} & {memoizedSettings.couple.partner2_name}
          </h1>
          <div className="space-y-2">
            {memoizedSettings.couple.wedding_date && (
              <p className="text-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 mr-2" />
                {formatInTimeZone(parseISO(memoizedSettings.couple.wedding_date), 'America/New_York', 'MM/dd/yyyy')}
              </p>
            )}
            {memoizedSettings.couple.venue_name && (
              <p className="text-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 mr-2" />
                Venue: {memoizedSettings.couple.venue_name}
              </p>
            )}
          </div>
          {memoizedSettings.couple.profile_photo && (
            <img
              src={memoizedSettings.couple.profile_photo}
              alt="Couple"
              className="w-32 h-32 rounded-full object-cover mx-auto mt-4"
            />
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="text-center mb-12">
          <Button
            variant="primary"
            className={`${styles.button} text-lg px-8 py-3`}
            onClick={() => setShowRsvpModal(true)}
          >
            RSVP Now
          </Button>
        </section>
        {memoizedSettings.about_us && (
          <section className={`mb-12 border-t pt-8 ${styles.section}`}>
            <h2 className="text-2xl font-semibold mb-4">About Us</h2>
            <p className="text-gray-700">{memoizedSettings.about_us}</p>
          </section>
        )}
        {memoizedSettings.love_story && (
          <section className={`mb-12 border-t pt-8 ${styles.section}`}>
            <h2 className="text-2xl font-semibold mb-4">Our Love Story</h2>
            <p className="text-gray-700">{memoizedSettings.love_story}</p>
          </section>
        )}
        {memoizedSettings.accommodations && memoizedSettings.accommodations.length > 0 && (
          <section className={`mb-12 border-t pt-8 ${styles.section}`}>
            <h2 className="text-2xl font-semibold mb-4">Accommodations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memoizedSettings.accommodations.map((hotel, index) => (
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
                  <p className="text-sm">{formatDateTime(event)}</p>
                  {event.description && <p className="text-sm mt-1">{event.description}</p>}
                  {event.location && <p className="text-sm mt-1">Location: {event.location}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>
        <section className={`mb-12 border-t pt-8 ${styles.section}`}>
          <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
          {galleryLoading ? (
            <p>Loading gallery...</p>
          ) : photos.length === 0 ? (
            <p>No photos available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map(photo => (
                <Card key={photo.id} className="overflow-hidden">
                  <img
                    src={photo.public_url}
                    alt={photo.file_name}
                    className="w-full max-h-96 object-contain aspect-auto"
                  />
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <RsvpModal
        isOpen={showRsvpModal}
        onClose={() => setShowRsvpModal(false)}
        coupleId={memoizedSettings.couple_id}
      />
    </div>
  );
};