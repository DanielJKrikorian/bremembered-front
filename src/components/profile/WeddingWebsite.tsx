import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useWebsiteGallery } from '../../hooks/useWebsiteGallery';
import { useWeddingTimeline } from '../../hooks/useWeddingTimeline';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { RsvpModal } from '../../components/profile/RsvpModal';
import { AuthModal } from '../../components/auth/AuthModal';
import { Heart, Lock, Eye, EyeOff, Calendar, MapPin, Home, Users, Book, Image, Hotel, Megaphone, Bus } from 'lucide-react';

interface WebsiteSettings {
  couple_id: string;
  slug: string;
  password: string;
  layout: 'classic' | 'modern' | 'romantic';
  about_us?: string;
  love_story?: string;
  accommodations?: { name: string; website: string; room_block?: string }[];
  transportation?: { name: string; description?: string; stops: string[]; frequency: string; start_time: string }[];
  dress_code?: { title: string; description: string };
  couple: {
    partner1_name: string;
    partner2_name: string;
    profile_photo?: string;
    cover_photo?: string;
    wedding_date?: string;
    venue_name?: string;
  };
  announcements?: string[];
}

export const WeddingWebsite: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const vendorToken = searchParams.get('vendorToken') || undefined;
  const { photos, loading: galleryLoading, error: galleryError } = useWebsiteGallery(slug);
  const { events, loading: timelineLoading, error: timelineError } = useWeddingTimeline(true, slug, vendorToken);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedEvents, setLikedEvents] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchSettings = async () => {
      if (!slug || !supabase || !isSupabaseConfigured()) {
        setLoading(false);
        setError('Supabase not configured or slug missing');
        return;
      }
      try {
        console.log('Fetching website settings for slug:', slug);
        const { data, error } = await supabase
          .from('wedding_websites')
          .select(`
            *,
            couple: couples (
              partner1_name,
              partner2_name,
              profile_photo,
              cover_photo,
              wedding_date,
              venue_name
            )
          `)
          .eq('slug', slug)
          .single();
        if (error) {
          console.error('Supabase fetch error:', error);
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

  useEffect(() => {
    console.log('Timeline state:', { timelineLoading, events, timelineError, vendorToken });
    console.log('Gallery state:', { galleryLoading, photos, galleryError });
  }, [timelineLoading, events, timelineError, galleryLoading, photos, galleryError, vendorToken]);

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

  const handleLikeEvent = (eventId: string) => {
    setLikedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const handleSignup = () => {
    setShowAuthModal(true);
  };

  const formatDateTime = (event: { event_date: string; event_time: string }) => {
    try {
      const date = parseISO(event.event_date);
      const time = parseISO(`2000-01-01T${event.event_time}`);
      const formattedDate = formatInTimeZone(date, 'America/New_York', 'MMMM d, yyyy');
      const formattedTime = format(time, 'h:mm a');
      return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting date/time:', error, 'Event:', event);
      return 'Invalid date/time';
    }
  };

  const layoutStyles = {
    classic: {
      container: 'bg-white text-gray-800',
      header: 'bg-ivory-100 text-rose-900',
      nav: 'bg-ivory-50 border-b border-rose-200',
      section: 'py-12 px-4 min-h-0 overflow-auto',
      button: 'bg-rose-600 hover:bg-rose-700 text-white',
      font: 'font-serif',
      galleryGrid: 'columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0',
      timelineClass: 'space-y-6 max-w-2xl mx-auto',
      accommodationClass: 'grid-cols-1 sm:grid-cols-2 gap-6',
      card: 'bg-white border border-rose-200 shadow-md rounded-lg',
      accentColor: 'text-rose-600',
    },
    modern: {
      container: 'bg-gray-50 text-gray-900',
      header: 'bg-gradient-to-b from-indigo-900 to-indigo-700 text-white',
      nav: 'bg-white shadow-md',
      section: 'py-16 px-4 min-h-0 overflow-auto',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      font: 'font-sans',
      galleryGrid: 'columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0',
      timelineClass: 'space-y-6 max-w-md mx-auto',
      accommodationClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      card: 'bg-white shadow-lg hover:shadow-xl transition duration-300 rounded-xl',
      accentColor: 'text-indigo-600',
    },
    romantic: {
      container: 'bg-pink-50 text-pink-900',
      header: 'bg-gradient-to-b from-pink-300 to-pink-100 text-pink-800',
      nav: 'bg-pink-50 border-b border-pink-200',
      section: 'py-12 px-4 min-h-0 overflow-auto',
      button: 'bg-pink-500 hover:bg-pink-600 text-white',
      font: 'font-serif italic',
      galleryGrid: 'columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0',
      timelineClass: 'space-y-8 max-w-3xl mx-auto',
      accommodationClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8',
      card: 'bg-white border border-pink-100 shadow-sm rounded-lg',
      accentColor: 'text-pink-500',
    }
  };

  const memoizedSettings = useMemo(() => settings, [settings]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!memoizedSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center shadow-xl rounded-xl animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-sans">Website Not Found</h2>
          <p className="text-gray-600">{error || 'The wedding website you are looking for does not exist.'}</p>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated && memoizedSettings.password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
        <Card className="p-8 w-full max-w-sm shadow-xl rounded-xl animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center font-sans">Private Celebration</h2>
          <p className="text-gray-600 mb-6 text-center">Enter the password to join our special day.</p>
          <div className="space-y-6">
            <div className="relative flex items-center">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                icon={Lock}
                className="pr-12 py-3 text-lg rounded-full border-gray-300 focus:ring-rose-600 focus:border-rose-600"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-rose-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
              variant="primary"
              onClick={handlePasswordSubmit}
              className={`${layoutStyles[memoizedSettings.layout || 'modern'].button} w-full py-3 rounded-full text-lg font-medium transition duration-300 transform hover:scale-105`}
            >
              Unlock
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const styles = layoutStyles[memoizedSettings.layout] || layoutStyles.modern;

  return (
    <div className={`min-h-screen ${styles.container} ${styles.font}`}>
      <header className={`relative h-[60vh] ${styles.header}`}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${memoizedSettings.couple.cover_photo || '/default-cover.jpg'})` }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        <div className="relative flex flex-col items-center justify-center h-full text-center px-4">
          <img
            src={memoizedSettings.couple.profile_photo || '/default-profile.jpg'}
            alt="Couple"
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4 animate-fade-in"
          />
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight animate-fade-in">
            {memoizedSettings.couple.partner1_name} & {memoizedSettings.couple.partner2_name}
          </h1>
          <div className="flex flex-col md:flex-row gap-4 text-lg text-white animate-fade-in">
            {memoizedSettings.couple.wedding_date && (
              <p className="flex items-center justify-center">
                <Calendar className="w-5 h-5 mr-2" />
                {formatInTimeZone(parseISO(memoizedSettings.couple.wedding_date), 'America/New_York', 'MMMM d, yyyy')}
              </p>
            )}
            {memoizedSettings.couple.venue_name && (
              <p className="flex items-center justify-center">
                <MapPin className="w-5 h-5 mr-2" />
                {memoizedSettings.couple.venue_name}
              </p>
            )}
          </div>
          <Button
            variant="primary"
            className={`${styles.button} mt-6 py-3 px-8 text-lg font-medium rounded-full transition duration-300 transform hover:scale-105`}
            onClick={() => setShowRsvpModal(true)}
          >
            RSVP
          </Button>
        </div>
      </header>
      <nav className={`sticky top-0 ${styles.nav} z-10 py-4 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto flex justify-center gap-4 sm:gap-6 flex-wrap">
          <a href="#home" className={`text-sm font-medium ${styles.accentColor} hover:underline`}><Home className="w-5 h-5 inline mr-1" /> Home</a>
          <a href="#about" className={`text-sm font-medium ${styles.accentColor} hover:underline`}><Users className="w-5 h-5 inline mr-1" /> About</a>
          <a href="#story" className={`text-sm font-medium ${styles.accentColor} hover:underline`}><Book className="w-5 h-5 inline mr-1" /> Story</a>
          <a href="#accommodations" className={`text-sm font-medium ${styles.accentColor} hover:underline`}><Hotel className="w-5 h-5 inline mr-1" /> Accommodations</a>
          <a href="#transportation" className={`text-sm font-medium ${styles.accentColor} hover:underline`}><Bus className="w-5 h-5 inline mr-1" /> Transportation</a>
          <a href="#timeline" className={`text-sm font-medium ${styles.accentColor} hover:underline`}><Calendar className="w-5 h-5 inline mr-1" /> Timeline</a>
          <a href="#gallery" className={`text-sm font-medium ${styles.accentColor} hover:underline`}><Image className="w-5 h-5 inline mr-1" /> Gallery</a>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section id="home" className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">Welcome to Our Day</h2>
          <p className="text-gray-600 max-w-2xl mx-auto animate-fade-in">Join us as we celebrate our love and commitment.</p>
          <div className="mt-6 space-y-6 max-w-2xl mx-auto">
            {memoizedSettings.announcements && memoizedSettings.announcements.length > 0 && (
              <div>
                <h3 className={`text-lg font-medium ${styles.accentColor} mb-2`}>Announcements</h3>
                <div className="space-y-4">
                  {memoizedSettings.announcements.map((announcement, index) => (
                    <Card key={index} className={`${styles.card} p-4 flex items-start animate-fade-in`}>
                      <Megaphone className={`w-5 h-5 mr-3 ${styles.accentColor}`} />
                      <p className="text-gray-700 text-left">{announcement}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {memoizedSettings.dress_code && memoizedSettings.dress_code.title && (
              <div>
                <h3 className={`text-lg font-medium ${styles.accentColor} mb-2`}>Dress Code</h3>
                <Card className={`${styles.card} p-4 flex items-start animate-fade-in`}>
                  <Bus className={`w-5 h-5 mr-3 ${styles.accentColor}`} />
                  <div className="text-left">
                    <p className="text-gray-700 font-medium">{memoizedSettings.dress_code.title}</p>
                    <p className="text-gray-700 text-sm">{memoizedSettings.dress_code.description}</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </section>
        {memoizedSettings.about_us && (
          <section id="about" className={`${styles.section} animate-fade-in`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">About Us</h2>
            <Card className={`${styles.card} p-6`}>
              <p className="text-gray-700 leading-relaxed">{memoizedSettings.about_us}</p>
            </Card>
          </section>
        )}
        {memoizedSettings.love_story && (
          <section id="story" className={`${styles.section} animate-fade-in`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center flex items-center justify-center">
              Our Love Story {memoizedSettings.layout === 'romantic' && <Heart className={`w-6 h-6 ml-2 ${styles.accentColor}`} />}
            </h2>
            <Card className={`${styles.card} p-6`}>
              <p className="text-gray-700 leading-relaxed">{memoizedSettings.love_story}</p>
            </Card>
          </section>
        )}
        {memoizedSettings.accommodations && memoizedSettings.accommodations.length > 0 && (
          <section id="accommodations" className={`${styles.section} animate-fade-in`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Accommodations</h2>
            <div className={`grid ${styles.accommodationClass}`}>
              {memoizedSettings.accommodations.map((hotel, index) => (
                <Card key={index} className={`${styles.card} p-6 hover:scale-105 transition duration-300`}>
                  <h3 className="font-medium text-lg mb-2">{hotel.name}</h3>
                  <a
                    href={hotel.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.accentColor} hover:underline font-medium`}
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
        {memoizedSettings.transportation && memoizedSettings.transportation.length > 0 && (
          <section id="transportation" className={`${styles.section} animate-fade-in`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Transportation</h2>
            <div className={`grid ${styles.accommodationClass}`}>
              {memoizedSettings.transportation.map((trans, index) => (
                <Card key={index} className={`${styles.card} p-6 hover:scale-105 transition duration-300`}>
                  <h3 className="font-medium text-lg mb-2">{trans.name}</h3>
                  {trans.description && (
                    <p className="text-sm text-gray-600 mb-2">{trans.description}</p>
                  )}
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Stops:</strong> {trans.stops.filter(stop => stop.trim()).join(', ') || 'Not specified'}
                  </p>
                  {trans.frequency && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Frequency:</strong> {trans.frequency}
                    </p>
                  )}
                  {trans.start_time && (
                    <p className="text-sm text-gray-600">
                      <strong>Start Time:</strong> {trans.start_time}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}
        <section id="timeline" className={`${styles.section} animate-fade-in`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Timeline</h2>
          {timelineError && <p className="text-red-600 text-center">Error: {timelineError}</p>}
          {timelineLoading ? (
            <p className="text-center">Loading timeline...</p>
          ) : events.length === 0 ? (
            <p className="text-center">No timeline events available.</p>
          ) : (
            <div className={styles.timelineClass}>
              {events.map(event => (
                <Card key={event.id} className={`${styles.card} p-6 hover:shadow-xl transition duration-300`}>
                  <div className="flex items-center mb-2">
                    <img
                      src={memoizedSettings.couple.profile_photo || '/default-profile.jpg'}
                      alt="Couple"
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <h3 className="font-medium text-lg">{event.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{formatDateTime(event)}</p>
                  {event.description && <p className="text-sm mt-2 text-gray-700">{event.description}</p>}
                  {event.location && (
                    <p className="text-sm mt-2 text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" /> {event.location}
                    </p>
                  )}
                  <button
                    onClick={() => handleLikeEvent(event.id)}
                    className={`mt-4 ${likedEvents[event.id] ? styles.accentColor : 'text-gray-500'} hover:${styles.accentColor} transition duration-200`}
                  >
                    <Heart className={`w-5 h-5 ${likedEvents[event.id] ? 'fill-current' : ''}`} />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </section>
        <section id="gallery" className={`${styles.section} animate-fade-in`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Gallery</h2>
          {galleryError && <p className="text-red-600 text-center">Error: {galleryError}</p>}
          {galleryLoading ? (
            <p className="text-center">Loading gallery...</p>
          ) : photos.length === 0 ? (
            <p className="text-center">No photos available.</p>
          ) : (
            <div className={styles.galleryGrid}>
              {photos.map(photo => (
                <Card key={photo.id} className={`${styles.card} overflow-hidden break-inside-avoid hover:scale-105 transition duration-300`}>
                  <img
                    src={photo.public_url}
                    alt={photo.file_name}
                    className="w-full h-auto object-cover rounded-lg"
                  />
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 text-center">
        <Button
          variant="primary"
          className={`${styles.button} py-3 px-8 text-lg font-medium rounded-full transition duration-300 transform hover:scale-105`}
          onClick={() => setShowAuthModal(true)}
        >
          Build Your Wedding Website
        </Button>
        <p className="text-gray-600 text-sm mt-4">
          Powered by B. Remembered
        </p>
      </footer>
      <RsvpModal
        isOpen={showRsvpModal}
        onClose={() => setShowRsvpModal(false)}
        coupleId={memoizedSettings.couple_id}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />
    </div>
  );
};