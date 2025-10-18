import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { StoreCartProvider } from '../context/StoreCartContext';
import { useCart } from '../context/CartContext';
import { Header } from './common/Header';
import { Footer } from './common/Footer';
import { Home } from '../pages/Home';
import { SearchResults } from '../pages/SearchResults';
import { ServiceBundle } from '../pages/ServiceBundle';
import { ServiceDetails } from '../pages/ServiceDetails';
import { Checkout } from '../pages/Checkout';
import { MyBookings } from '../pages/MyBookings';
import { Inspiration } from '../pages/Inspiration';
import { HowItWorks } from '../pages/HowItWorks';
import { Support } from '../pages/Support';
import { Profile } from '../pages/Profile';
import { ServiceSelection } from '../pages/booking/ServiceSelection';
import { PackageSelection } from '../pages/booking/PackageSelection';
import { EventDetails } from '../pages/booking/EventDetails';
import { PackageCongratulations } from '../pages/booking/PackageCongratulations';
import { VendorRecommendation } from '../pages/booking/VendorRecommendation';
import { PackageDetails } from '../pages/PackageDetails';
import VendorProfile from '../pages/VendorProfile';
import { VendorOnboarding } from '../pages/VendorOnboarding';
import { VendorApplication } from '../pages/VendorApplication';
import { BookingDetails } from '../pages/BookingDetails';
import { TermsOfService } from '../pages/TermsOfService';
import { PrivacyPolicy } from '../pages/PrivacyPolicy';
import { CancellationPolicy } from '../pages/CancellationPolicy';
import { ChatBot } from './chat/ChatBot';
import { CartSidebar } from './cart/CartSidebar';
import { VendorSelectionModal } from './cart/VendorSelectionModal';
import { BlogPost } from '../pages/BlogPost';
import { ResetPassword } from '../pages/ResetPassword';
import { Cart } from '../pages/Cart';
import { AdvertiseSuccess } from '../pages/AdvertiseSuccess';
import { AdvertiseWithUs } from '../pages/AdvertiseWithUs';
import { WeddingStore } from '../pages/WeddingStore';
import { ProductDetail } from '../pages/ProductDetail';
import { OrderTracking } from '../pages/OrderTracking';
import VendorWebsite from '../pages/VendorWebsite';
import { StoreSuccess } from '../pages/StoreSuccess';
import { LocationServicePage } from '../pages/LocationServicePage';
import { WeddingWebsite } from '../components/profile/WeddingWebsite';
import { supabase } from '../lib/supabase';

const PackageRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSlug = async () => {
      if (!id || !supabase) {
        navigate('/search', { replace: true });
        return;
      }
      try {
        const { data, error } = await supabase
          .from('service_packages')
          .select('slug')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (data?.slug) {
          navigate(`/package/${data.slug}`, { replace: true });
        } else {
          console.error('No slug found for package_id:', id);
          navigate('/search', { replace: true });
        }
      } catch (err) {
        console.error('Error fetching slug for redirect:', err);
        navigate('/search', { replace: true });
      }
    };
    fetchSlug();
  }, [id, navigate]);

  return null;
};

const VendorRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSlug = async () => {
      if (!id || !supabase) {
        navigate('/search', { replace: true });
        return;
      }
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('slug')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (data?.slug) {
          navigate(`/vendor/${data.slug}`, { replace: true });
        } else {
          console.error('No slug found for vendor_id:', id);
          navigate('/search', { replace: true });
        }
      } catch (err) {
        console.error('Error fetching slug for redirect:', err);
        navigate('/search', { replace: true });
      }
    };
    fetchSlug();
  }, [id, navigate]);

  return null;
};

export const AppContent: React.FC = () => {
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any>(null);
  const { updateItem } = useCart();
  const location = useLocation();

  const handleChooseVendor = (cartItem: any) => {
    setSelectedCartItem(cartItem);
    setShowVendorModal(true);
  };

  const handleVendorSelected = (vendor: any, eventDetails: any) => {
    if (selectedCartItem) {
      updateItem(selectedCartItem.id, {
        vendor,
        eventDate: eventDetails.eventDate,
        eventTime: eventDetails.eventTime,
        endTime: eventDetails.endTime,
        venue: eventDetails.venue,
      });
    }
    setShowVendorModal(false);
    setSelectedCartItem(null);
  };

  // Hide header for /website/* routes
  const hideHeader = location.pathname.startsWith('/v/') || location.pathname.startsWith('/website/');

  return (
    <StoreCartProvider>
      <div className="min-h-screen bg-gray-50">
        {!hideHeader && <Header />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/bundle/:id" element={<ServiceBundle />} />
            <Route path="/bundle/:bundleId/service/:serviceId" element={<ServiceDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/booking/:id" element={<BookingDetails />} />
            <Route path="/inspiration" element={<Inspiration />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/support" element={<Support />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/advertise-success" element={<AdvertiseSuccess />} />
            <Route path="/inspiration/:slug" element={<BlogPost />} />
            <Route path="/package/:slug" element={<PackageDetails />} />
            <Route path="/package/:id" element={<PackageRedirect />} />
            <Route path="/vendor/:slug" element={<VendorProfile />} />
            <Route path="/vendor/:id" element={<VendorRedirect />} />
            <Route path="/booking/services" element={<ServiceSelection />} />
            <Route path="/booking/packages" element={<PackageSelection />} />
            <Route path="/booking/congratulations" element={<PackageCongratulations />} />
            <Route path="/booking/vendor-recommendation" element={<VendorRecommendation />} />
            <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
            <Route path="/vendor-application" element={<VendorApplication />} />
            <Route path="/advertise-with-us" element={<AdvertiseWithUs />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cancellation" element={<CancellationPolicy />} />
            <Route path="/v/:vendorSlug/*" element={<VendorWebsite />} />
            <Route path="/website/:vendorSlug/*" element={<VendorWebsite />} />
            <Route path="/store" element={<WeddingStore />} />
            <Route path="/store/product/:id" element={<ProductDetail />} />
            <Route path="/orders" element={<OrderTracking />} />
            <Route path="/orders/:orderId" element={<OrderTracking />} />
            <Route path="/wedding/:slug" element={<WeddingWebsite />} />
            <Route path="/store-success" element={<StoreSuccess />} />
            <Route path="/locations/:state/:city/:service" element={<LocationServicePage />} />
          </Routes>
          <Outlet />
        </main>
        <Footer />
        <ChatBot />
        <CartSidebar onChooseVendor={handleChooseVendor} />
        {selectedCartItem && (
          <VendorSelectionModal
            isOpen={showVendorModal}
            onClose={() => {
              setShowVendorModal(false);
              setSelectedCartItem(null);
            }}
            cartItem={selectedCartItem}
            onVendorSelected={handleVendorSelected}
          />
        )}
      </div>
    </StoreCartProvider>
  );
};

export default AppContent;