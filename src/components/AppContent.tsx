import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import { VendorProfile } from '../pages/VendorProfile';
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
import { Cart } from '../pages/Cart';
import { useCart } from '../context/CartContext';

export const AppContent: React.FC = () => {
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any>(null);
  const { updateItem } = useCart();

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
        venue: eventDetails.venue
      });
    }
    setShowVendorModal(false);
    setSelectedCartItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
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
          <Route path="/support" element={<Support />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Inspiration Routes */}
          <Route path="/inspiration/:slug" element={<BlogPost />} />
          
          {/* Package Details */}
          <Route path="/package/:id" element={<PackageDetails />} />
          
          {/* Vendor Profile */}
          <Route path="/vendor/:id" element={<VendorProfile />} />
          
          {/* New Booking Flow Routes */}
          <Route path="/booking/services" element={<ServiceSelection />} />
          <Route path="/booking/packages" element={<PackageSelection />} />
          <Route path="/booking/congratulations" element={<PackageCongratulations />} />
          <Route path="/booking/vendor-recommendation" element={<VendorRecommendation />} />
          
          {/* Vendor Onboarding */}
          <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
          <Route path="/vendor-application" element={<VendorApplication />} />
          
          {/* Legal Pages */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cancellation" element={<CancellationPolicy />} />
        </Routes>
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
  );
};