import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { useNavigate, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { Camera, Calendar, Star, Image, Package, Share2, Menu, X, Sparkles, Check, ArrowRight, Clock, Music } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const ThemeContext = createContext();

const ThemeProvider = ({ children, vendor }) => {
  const [theme, setTheme] = useState({
    layout: 'modern',
    font_family: 'Inter',
    primary_color: '#ef4444', // Default rose
  });

  useEffect(() => {
    if (vendor.pro_studio && vendor.theme_preferences) {
      setTheme(vendor.theme_preferences);
    }
  }, [vendor.theme_preferences]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${theme.font_family.replace(' ', '+')}:wght@400;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    document.documentElement.style.setProperty('--primary-color', theme.primary_color);
    document.documentElement.style.setProperty('--font-family', theme.font_family);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
};

const useTheme = () => useContext(ThemeContext);

const localizer = momentLocalizer(moment);

const CustomVideoPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play().catch(() => setError(true));
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden">
      {error ? (
        <img src={poster} alt="Video unavailable" className="w-full h-full object-cover" />
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            className="w-full h-full object-cover"
            controls={false}
            onClick={togglePlay}
            onError={() => setError(true)}
          />
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg hover:bg-opacity-20 transition-opacity"
          >
            <span className="text-white text-4xl">{isPlaying ? '❚❚' : '▶'}</span>
          </button>
        </>
      )}
    </div>
  );
};

const BookingModal = ({ isOpen, onClose, vendor, selectedPackage, setSelectedPackage, selectedDate, setSelectedDate, availability, setAvailability, checkingAvailability, setCheckingAvailability }) => {
  const navigate = useNavigate();

  const checkAvailability = () => {
    if (!selectedDate) return alert('Please select a date');
    setCheckingAvailability(true);
    setTimeout(() => {
      const mockAvailable = new Date(selectedDate).getDate() % 2 === 0;
      setAvailability(mockAvailable);
      setCheckingAvailability(false);
    }, 1000);
  };

  const handleBook = () => {
    if (!selectedPackage) return alert('Please select a package');
    const pkg = vendor.packages.find((p) => p.id === selectedPackage);
    alert(`Added ${pkg?.name} to cart! Price: ${formatPrice((pkg?.price || 0) + (vendor.premium_amount || 0))}`);
    onClose();
  };

  const formatPrice = (amount) => {
    if (amount === 0) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount / 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Book with {vendor.name}</h3>
          <button onClick={onClose} className="text-gray-900 hover:text-rose-600"><X className="w-6 h-6" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Package</label>
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:ring-rose-500 focus:border-rose-500 text-gray-900"
            >
              <option value="">Choose a package</option>
              {vendor.packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - {formatPrice((pkg?.price || 0) + (vendor.premium_amount || 0))}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:ring-rose-500 focus:border-rose-500"
              />
              <Calendar className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
          {availability !== null && (
            <p className={`text-sm ${availability ? 'text-green-600' : 'text-red-600'}`}>
              {availability ? '✅ Available' : '❌ Not Available'} on {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select a date'}
            </p>
          )}
          <Button
            variant="primary"
            className="w-full"
            onClick={selectedDate && availability === null ? checkAvailability : handleBook}
            disabled={checkingAvailability || (!selectedPackage && !selectedDate)}
          >
            {checkingAvailability ? 'Checking...' : selectedDate && availability === null ? 'Check Availability' : 'Book Now'}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/search')}
          >
            View More Vendors
          </Button>
        </div>
      </div>
    </div>
  );
};

const InquiryModal = ({ isOpen, onClose, inquiryForm, setInquiryForm }) => {
  const handleInquirySubmit = (e) => {
    e.preventDefault();
    alert('Inquiry sent! We will get back to you soon.');
    setInquiryForm({ name: '', email: '', message: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Send an Inquiry</h3>
          <button onClick={onClose} className="text-gray-900 hover:text-rose-600"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleInquirySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={inquiryForm.name}
              onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
              placeholder="Your Name"
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={inquiryForm.email}
              onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
              placeholder="Your Email"
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={inquiryForm.message}
              onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
              placeholder="Your Inquiry"
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:ring-rose-500 focus:border-rose-500"
              rows={4}
            />
          </div>
          <Button variant="primary" className="w-full">
            Submit Inquiry
          </Button>
        </form>
      </div>
    </div>
  );
};

const ServiceAreasModal = ({ isOpen, onClose, serviceAreas }) => {
  const formatPrice = (amount) => {
    if (amount === 0) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount / 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Our Service Areas</h3>
          <button onClick={onClose} className="text-gray-900 hover:text-rose-600"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex flex-wrap gap-4">
          {serviceAreas.map((area, index) => (
            <span
              key={index}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                area.travel_fee > 0 ? 'bg-rose-100 text-rose-800' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {area.region} {area.travel_fee > 0 ? `(${formatPrice(area.travel_fee)})` : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const TeamMemberPage = ({ vendor }) => {
  const { memberSlug } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const location = useLocation();

  const member = vendor.team_members.find((m) => m.slug === memberSlug);

  if (!member) {
    return <div className="text-center py-12 text-red-600">Team member not found</div>;
  }

  const mockMemberVideos = [
    'https://archive.org/download/BigBuckBunny_124/BigBuckBunny_124.mp4',
  ];

  return (
    <div className={`min-h-screen bg-white text-gray-900 font-sans layout-${theme.layout}`} style={{ fontFamily: theme.font_family }}>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: theme.primary_color }}>
              {member.name[0]}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
          </div>
          <Button variant="outline" onClick={() => navigate(`/v/${vendor.slug}`)}>Back to Vendor</Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <section className="py-12 text-center bg-gradient-to-b from-rose-50 to-white">
          <img src={member.photo_url} alt={member.name} className="w-64 h-64 rounded-full mx-auto mb-4 object-cover shadow-lg" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{member.name}</h1>
          <p className="text-xl text-gray-600 mb-4">{member.testimonials.length} {member.testimonials.length === 1 ? 'Review' : 'Reviews'}</p>
          <Button
            variant="outline"
            className="px-6 py-3 text-lg bg-white text-rose-600 hover:bg-rose-500 hover:text-white"
            onClick={() => navigate(`/v/${vendor.slug}`)}
          >
            Back to Vendor
          </Button>
        </section>
        <section className="py-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">About {member.name}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{member.bio}</p>
        </section>
        {member.gallery_photos?.length > 0 && (
          <section className="py-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Photo Gallery</h2>
            <p className="text-xl text-gray-600 text-center mb-12">Explore {member.name}'s photography work</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {member.gallery_photos.map((photo, index) => (
                <Card key={index} className="overflow-hidden hover:scale-105 transition-transform">
                  <img src={photo} alt={`Portfolio ${index + 1}`} className="w-full h-64 object-cover" />
                </Card>
              ))}
            </div>
          </section>
        )}
        {mockMemberVideos.length > 0 && (
          <section className="py-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Video Gallery</h2>
            <p className="text-xl text-gray-600 text-center mb-12">Watch {member.name}'s video highlights</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockMemberVideos.map((video, index) => (
                <Card key={`video-${index}`} className="overflow-hidden">
                  <CustomVideoPlayer src={video} poster={member.gallery_photos?.[0]} />
                </Card>
              ))}
            </div>
          </section>
        )}
        {member.soundcloud_url && (
          <section className="py-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Listen on SoundCloud</h2>
            <p className="text-xl text-gray-600 text-center mb-12">Hear {member.name}'s music and mixes</p>
            <div className="max-w-2xl mx-auto">
              <Card className="overflow-hidden">
                <iframe width="100%" height="166" scrolling="no" frameBorder="no" allow="autoplay" src={member.soundcloud_url}></iframe>
                <div className="p-4">
                  <a href={member.soundcloud_url} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline text-sm">
                    View on SoundCloud
                  </a>
                </div>
              </Card>
            </div>
          </section>
        )}
        {member.testimonials?.length > 0 && (
          <section className="py-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Testimonials</h2>
            <p className="text-xl text-gray-600 text-center mb-12">What clients say about {member.name}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {member.testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="p-6">
                  <p className="text-gray-600 mb-4 italic">"{testimonial.feedback}"</p>
                  <p className="text-sm text-gray-600">{testimonial.author}</p>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white text-center">
        <p className="text-gray-600">
          Powered by{' '}
          <a href="https://bremembered.io" className="text-rose-600 hover:underline font-medium">
            B. Remembered
          </a>
        </p>
      </footer>
    </div>
  );
};

const VendorWebsite = () => {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState({ isOpen: false, initialMode: 'signup' });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showServiceAreasModal, setShowServiceAreasModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', message: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [availabilityEvents, setAvailabilityEvents] = useState([
    { id: 'a1', start: new Date('2025-11-01T09:00:00'), end: new Date('2025-11-01T17:00:00'), status: 'available' },
    { id: 'a2', start: new Date('2025-11-02T09:00:00'), end: new Date('2025-11-02T17:00:00'), status: 'booked' },
    { id: 'a3', start: new Date('2025-11-03T09:00:00'), end: new Date('2025-11-03T17:00:00'), status: 'available' },
  ]);

  const vendor = {
    id: 'vendor1',
    name: 'Daniel Krikorian Photography',
    slug: 'daniel-krikorian',
    pro_studio: true,
    theme_preferences: {
      layout: 'modern',
      font_family: 'Inter',
      primary_color: '#ef4444',
    },
    profile: 'We specialize in capturing the magic of your wedding day with timeless elegance. With over 5 years of experience, our team ensures every moment is beautifully preserved for you to cherish forever.',
    profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    hero_photo: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg',
    hero_text: 'Your Love Story, Captured with Passion',
    years_experience: 5,
    service_types: ['Photography'],
    premium_amount: 50000,
    service_areas: ['New York', 'Los Angeles'],
    service_areas_with_fees: [
      { region: 'New York', travel_fee: 0 },
      { region: 'Los Angeles', travel_fee: 10000 },
    ],
    portfolio_photos: [
      'https://images.pexels.com/photos/256737/pexels-photo-256737.jpeg',
      'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg',
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    ],
    portfolio_videos: [
      'https://archive.org/download/BigBuckBunny_124/BigBuckBunny_124.mp4',
      'https://archive.org/download/BigBuckBunny_124/BigBuckBunny_124.mp4',
    ],
    intro_video: 'https://archive.org/download/BigBuckBunny_124/BigBuckBunny_124.mp4',
    instagram: 'danielkrikorian_photography',
    soundcloud: 'danielkrikorian',
    soundcloud_tracks: [
      { id: 'track1', title: 'Wedding Waltz', embed_url: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123456789' },
      { id: 'track2', title: 'First Dance Melody', embed_url: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/987654321' },
      { id: 'track3', title: 'Reception Mix', embed_url: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/456789123' },
    ],
    packages: [
      { id: 'pkg1', name: 'Classic Package', service_type: 'Photography', price: 200000, description: '6 hours of coverage, 200 edited photos, online gallery', duration_hours: 6 },
      { id: 'pkg2', name: 'Premium Package', service_type: 'Photography', price: 350000, description: '10 hours of coverage, 400 edited photos, premium album', duration_hours: 10 },
      { id: 'pkg3', name: 'Deluxe Package', service_type: 'Photography', price: 500000, description: '12 hours of coverage, 600 edited photos, album, and highlight video', duration_hours: 12 },
    ],
    team_members: [
      {
        id: 'member1',
        name: 'Alice Smith',
        slug: 'alice-smith',
        vendor_slug: 'daniel-krikorian',
        bio: 'Lead photographer with a passion for capturing candid moments. Alice brings warmth and creativity to every shoot, ensuring your special moments are beautifully preserved.',
        photo_url: 'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundcloud_url: '',
        gallery_photos: [
          'https://images.pexels.com/photos/256737/pexels-photo-256737.jpeg',
          'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg',
        ],
        testimonials: [
          { id: 't1', feedback: 'Alice made us feel so comfortable! Her photos captured the essence of our day.', author: 'Jane & John' },
          { id: 't2', feedback: 'Her creativity is unmatched, and the results were stunning!', author: 'Emma & Liam' },
        ],
      },
      {
        id: 'member2',
        name: 'Bob Johnson',
        slug: 'bob-johnson',
        vendor_slug: 'daniel-krikorian',
        bio: 'Expert in lighting and composition, Bob creates dramatic and timeless images that tell your love story.',
        photo_url: 'https://images.pexels.com/photos/789456/pexels-photo-789456.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundcloud_url: '',
        gallery_photos: [
          'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
        ],
        testimonials: [],
      },
      {
        id: 'member3',
        name: 'Clara Lee',
        slug: 'clara-lee',
        vendor_slug: 'daniel-krikorian',
        bio: 'Specializes in creative wedding photography, Clara brings an artistic flair to every moment.',
        photo_url: 'https://images.pexels.com/photos/654321/pexels-photo-654321.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundcloud_url: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/456789123',
        gallery_photos: [
          'https://images.pexels.com/photos/256737/pexels-photo-256737.jpeg',
        ],
        testimonials: [
          { id: 't3', feedback: 'Clara’s creativity is unmatched! Our photos are works of art.', author: 'Emma & Liam' },
        ],
      },
    ],
  };

  const reviews = [
    { id: 'rev1', couples: { name: 'Jane & John', wedding_date: '2025-06-15' }, overall_rating: 4.5, feedback: 'Daniel’s photography was breathtaking. He captured every moment perfectly!', vendor_response: 'Thank you for the kind words!' },
    { id: 'rev2', couples: { name: 'Emma & Liam', wedding_date: '2025-08-20' }, overall_rating: 5, feedback: 'Professional, creative, and a joy to work with. Highly recommend!' },
  ];

  const mockStats = { eventsCompleted: 50, averageRating: 4.8, responseTime: 'Within 2 hours' };
  const instagramFeed = [
    { id: 'ig1', image: 'https://images.pexels.com/photos/256737/pexels-photo-256737.jpeg', caption: 'A moment of love captured forever' },
    { id: 'ig2', image: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg', caption: 'Stunning wedding portrait' },
    { id: 'ig3', image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg', caption: 'Joyful memories in focus' },
  ];
  const deal = { title: 'Limited Time Offer', description: 'Book the Deluxe Package by November 30, 2025, and get a free engagement session!', packageId: 'pkg3' };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Check out ${vendor.name}`, url: shareUrl }).catch((err) => console.error('Share failed:', err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const formatPrice = (amount) => {
    if (amount === 0) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount / 100);
  };

  const renderStars = (rating) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <ThemeProvider vendor={vendor}>
      <Routes>
        <Route path="/" element={
          <div className={`min-h-screen bg-white text-gray-900 font-sans layout-${vendor.theme_preferences?.layout || 'modern'}`} style={{ fontFamily: vendor.theme_preferences?.font_family || 'Inter' }}>
            <header className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 py-4 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: vendor.theme_preferences?.primary_color || '#ef4444' }}>
                    DK
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <nav className="flex gap-6">
                    {['Home', 'About', 'Gallery', 'Packages', 'Reviews'].map((item) => (
                      <a
                        key={item}
                        href={`#${item.toLowerCase()}`}
                        className="text-base font-medium text-gray-900 hover:text-rose-600"
                      >
                        {item}
                      </a>
                    ))}
                    {vendor.pro_studio && vendor.team_members?.length > 0 && (
                      <a href="#team" className="text-base font-medium text-gray-900 hover:text-rose-600">
                        Team
                      </a>
                    )}
                  </nav>
                  <button onClick={handleShare} className="text-gray-900 hover:text-rose-600">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <Button
                    variant="outline"
                    className="px-4 py-2"
                    onClick={() => setShowAuthModal({ isOpen: true, initialMode: 'login' })}
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={() => setShowAuthModal({ isOpen: true, initialMode: 'signup' })}
                  >
                    Sign Up
                  </Button>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-900">
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
              {isMobileMenuOpen && (
                <nav className="md:hidden bg-white shadow-lg py-4 px-4 mt-4 flex flex-col space-y-4">
                  {['Home', 'About', 'Gallery', 'Packages', 'Reviews', ...(vendor.pro_studio && vendor.team_members?.length > 0 ? ['Team'] : [])].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      className="text-base font-medium text-gray-900 hover:text-rose-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item}
                    </a>
                  ))}
                  <Button
                    variant="outline"
                    className="px-4 py-2"
                    onClick={() => { setShowAuthModal({ isOpen: true, initialMode: 'login' }); setIsMobileMenuOpen(false); }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={() => { setShowAuthModal({ isOpen: true, initialMode: 'signup' }); setIsMobileMenuOpen(false); }}
                  >
                    Sign Up
                  </Button>
                </nav>
              )}
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
              {/* Hero Section */}
              <section
                className="relative min-h-[600px] flex items-center justify-center text-center bg-cover bg-center overflow-hidden"
                style={{ backgroundImage: `url(${vendor.hero_photo})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20"></div>
                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
                    {vendor.hero_text}
                  </h1>
                  <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                    {vendor.name} • {vendor.service_types[0]} • {vendor.years_experience} Years of Excellence
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      variant="primary"
                      className="px-8 py-4 text-lg"
                      onClick={() => setShowBookingModal(true)}
                    >
                      Book Now <ArrowRight className="w-5 h-5 ml-2 inline" />
                    </Button>
                    <Button
                      variant="outline"
                      className="px-8 py-4 text-lg border-white text-white hover:bg-rose-500 hover:text-white"
                      onClick={() => setShowInquiryModal(true)}
                    >
                      Inquire <Sparkles className="w-5 h-5 ml-2 inline" />
                    </Button>
                  </div>
                </div>
              </section>

              {/* Stats Section */}
              <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                      <Star className="w-8 h-8 text-rose-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{mockStats.averageRating}/5</div>
                    <div className="text-base text-gray-600">Average Rating</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8 text-rose-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{mockStats.eventsCompleted}+</div>
                    <div className="text-base text-gray-600">Events Completed</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-rose-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{mockStats.responseTime}</div>
                    <div className="text-base text-gray-600">Response Time</div>
                  </div>
                </div>
              </section>

              {/* Deal of the Week Section */}
              <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-500 to-rose-600 text-white">
                <div className="max-w-7xl mx-auto text-center">
                  <div className="inline-flex items-center space-x-2 bg-white text-rose-600 px-6 py-2 rounded-full mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold">{deal.title}</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Special Offer</h2>
                  <p className="text-xl mb-6 max-w-2xl mx-auto">{deal.description}</p>
                  <Button
                    variant="outline"
                    className="px-8 py-4 text-lg bg-white text-rose-600 hover:bg-rose-500 hover:text-white"
                    onClick={() => { setSelectedPackage(deal.packageId); setShowBookingModal(true); }}
                  >
                    Claim This Deal
                  </Button>
                </div>
              </section>

              {/* About Section */}
              <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">About {vendor.name}</h2>
                  <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">{vendor.profile}</p>
                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      className="px-6 py-3 text-lg"
                      onClick={() => setShowIntroVideo(true)}
                    >
                      Watch Our Intro Video
                    </Button>
                  </div>
                </div>
              </section>

              {/* Meet the Team Section */}
              {vendor.pro_studio && vendor.team_members?.length > 0 && (
                <section id="team" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                  <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Meet Our Team</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {vendor.team_members.slice(0, 3).map((member) => (
                        <Card key={member.id} className="text-center p-6">
                          <img src={member.photo_url} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                          <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                          <p className="text-gray-600 mb-4">{member.bio}</p>
                          <Button variant="outline" onClick={() => navigate(`/v/${vendor.slug}/team/${member.slug}`)}>
                            View Profile
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Availability Calendar Section */}
              {vendor.pro_studio && (
                <section id="calendar" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                  <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Availability Calendar</h2>
                    <div style={{ height: '500px' }}>
                      <BigCalendar
                        localizer={localizer}
                        events={availabilityEvents}
                        startAccessor="start"
                        endAccessor="end"
                        views={['month', 'day']}
                        style={{ height: 500 }}
                        eventPropGetter={(event) => ({
                          style: { backgroundColor: event.status === 'available' ? '#10b981' : '#ef4444' },
                        })}
                        onSelectSlot={(slotInfo) => {
                          setSelectedDate(moment(slotInfo.start).format('YYYY-MM-DD'));
                          setShowBookingModal(true);
                        }}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Gallery Section */}
              <section id="gallery" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Our Gallery</h2>
                  <p className="text-xl text-gray-600 text-center mb-12">Explore our stunning photography and videography</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vendor.portfolio_photos.map((photo, index) => (
                      <Card key={index} className="overflow-hidden hover:scale-105 transition-transform">
                        <img src={photo} alt={`Portfolio ${index + 1}`} className="w-full h-64 object-cover" />
                      </Card>
                    ))}
                    {vendor.portfolio_videos.map((video, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CustomVideoPlayer src={video} poster={vendor.portfolio_photos?.[index]} />
                      </Card>
                    ))}
                  </div>
                </div>
              </section>

              {/* SoundCloud Section */}
              {(vendor.service_types.includes('DJ Services') || vendor.service_types.includes('Live Musician')) && vendor.soundcloud_tracks?.length > 0 && (
                <section id="soundcloud" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                  <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Listen on SoundCloud</h2>
                    <p className="text-xl text-gray-600 text-center mb-12">Hear our music and mixes</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {vendor.soundcloud_tracks.map((track) => (
                        <Card key={track.id} className="overflow-hidden">
                          <iframe
                            width="100%"
                            height="166"
                            scrolling="no"
                            frameBorder="no"
                            allow="autoplay"
                            src={track.embed_url}
                            className="w-full"
                          ></iframe>
                          <div className="p-4">
                            <p className="text-sm text-gray-600 truncate">{track.title}</p>
                            <a
                              href={`https://soundcloud.com/${vendor.soundcloud}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-rose-600 hover:underline text-sm mt-2 inline-block"
                            >
                              View on SoundCloud
                            </a>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Packages Section */}
              <section id="packages" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Our Packages</h2>
                  <p className="text-xl text-gray-600 text-center mb-12">Choose the perfect package for your special day</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vendor.packages.map((pkg) => (
                      <Card key={pkg.id} className="p-6 hover:scale-105 transition-transform">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                        <p className="text-gray-600 mb-4 text-sm">{pkg.description}</p>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl font-bold text-rose-600">{formatPrice((pkg.price || 0) + (vendor.premium_amount || 0))}</span>
                          {vendor.premium_amount > 0 && (
                            <span className="text-xs text-gray-600">Includes {formatPrice(vendor.premium_amount)} premium</span>
                          )}
                        </div>
                        <Button
                          variant="primary"
                          className="w-full py-3"
                          onClick={() => { setSelectedPackage(pkg.id); setShowBookingModal(true); }}
                        >
                          Select Package
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>

              {/* Reviews Section */}
              <section id="reviews" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">What Our Couples Say</h2>
                  <p className="text-xl text-gray-600 text-center mb-12">Hear from those who trusted us with their special day</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reviews.map((review) => (
                      <Card key={review.id} className="p-6">
                        <div className="flex items-center mb-4">{renderStars(review.overall_rating)}</div>
                        <p className="text-gray-600 mb-4 italic">"{review.feedback}"</p>
                        {review.vendor_response && (
                          <div className="mb-4 p-3 bg-rose-50 rounded-lg">
                            <p className="text-rose-800 text-sm">{review.vendor_response}</p>
                          </div>
                        )}
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-base font-medium text-gray-700">{review.couples?.name?.[0] || 'A'}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{review.couples?.name || 'Happy Couple'}</h4>
                            {review.couples?.wedding_date && (
                              <p className="text-xs text-gray-400">{formatDate(review.couples.wedding_date)}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>

              {/* Instagram Section */}
              <section id="instagram" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Follow Us on Instagram</h2>
                  <p className="text-xl text-gray-600 text-center mb-12">See our latest moments and inspiration</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {instagramFeed.map((post) => (
                      <Card key={post.id} className="overflow-hidden hover:scale-105 transition-transform">
                        <img src={post.image} alt={post.caption} className="w-full h-48 object-cover" />
                        <div className="p-4">
                          <p className="text-sm text-gray-600 truncate">{post.caption}</p>
                          <a
                            href={`https://instagram.com/${vendor.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-600 hover:underline text-sm mt-2 inline-block"
                          >
                            View on Instagram
                          </a>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-500 to-rose-600 text-white">
                <div className="max-w-7xl mx-auto text-center">
                  <h2 className="text-3xl font-bold mb-4">Ready to Capture Your Special Day?</h2>
                  <p className="text-xl mb-12">Let’s make your wedding unforgettable with {vendor.name}</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      variant="outline"
                      className="px-8 py-4 text-lg bg-white text-rose-600 hover:bg-rose-500 hover:text-white"
                      onClick={() => setShowBookingModal(true)}
                    >
                      Book Now
                    </Button>
                    <Button
                      variant="outline"
                      className="px-8 py-4 text-lg bg-white text-rose-600 hover:bg-rose-500 hover:text-white"
                      onClick={() => setShowInquiryModal(true)}
                    >
                      Send Inquiry
                    </Button>
                    <Button
                      variant="outline"
                      className="px-8 py-4 text-lg bg-white text-rose-600 hover:bg-rose-500 hover:text-white"
                      onClick={() => setShowServiceAreasModal(true)}
                    >
                      View Service Areas
                    </Button>
                  </div>
                </div>
              </section>

              {/* Modals */}
              <BookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                vendor={vendor}
                selectedPackage={selectedPackage}
                setSelectedPackage={setSelectedPackage}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                availability={availability}
                setAvailability={setAvailability}
                checkingAvailability={checkingAvailability}
                setCheckingAvailability={setCheckingAvailability}
              />
              <InquiryModal
                isOpen={showInquiryModal}
                onClose={() => setShowInquiryModal(false)}
                inquiryForm={inquiryForm}
                setInquiryForm={setInquiryForm}
              />
              <ServiceAreasModal
                isOpen={showServiceAreasModal}
                onClose={() => setShowServiceAreasModal(false)}
                serviceAreas={vendor.service_areas_with_fees}
              />
              {showIntroVideo && vendor.intro_video && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Introduction Video</h3>
                      <button onClick={() => setShowIntroVideo(false)} className="text-gray-900 hover:text-rose-600"><X className="w-6 h-6" /></button>
                    </div>
                    <CustomVideoPlayer src={vendor.intro_video} poster={vendor.portfolio_photos?.[0]} />
                  </div>
                </div>
              )}
              {showAuthModal.isOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{showAuthModal.initialMode === 'login' ? 'Login' : 'Sign Up'}</h3>
                    <button onClick={() => setShowAuthModal({ isOpen: false, initialMode: 'signup' })} className="text-gray-900 hover:text-rose-600">Close</button>
                  </div>
                </div>
              )}
            </main>
            <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white text-center">
              <p className="text-gray-600">
                Powered by{' '}
                <a href="https://bremembered.io" className="text-rose-600 hover:underline font-medium">
                  B. Remembered
                </a>
              </p>
            </footer>
          </div>
        } />
        <Route path="team/:memberSlug" element={<TeamMemberPage vendor={vendor} />} />
      </Routes>
    </ThemeProvider>
  );
};

export default VendorWebsite;