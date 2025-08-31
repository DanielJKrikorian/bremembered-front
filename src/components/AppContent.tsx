import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './common/Header';
import { Footer } from './common/Footer';
import { Home } from '../pages/Home';
import { SearchResults } from '../pages/SearchResults';
import { Checkout } from '../pages/Checkout';
import { MyBookings } from '../pages/MyBookings';
import { Inspiration } from '../pages/Inspiration';
import { HowItWorks } from '../pages/HowItWorks';
import { Support } from '../pages/Support';
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
import { BlogPost } from '../pages/BlogPost';
import { Cart } from '../pages/Cart';
import { ChatBot } from './chat/ChatBot';
import { CartSidebar } from './cart/CartSidebar';
import { VendorSelectionModal } from './cart/VendorSelectionModal';
import { useCart } from '../context/CartContext';

export const AppContent: React.FC = () => {
  const { isCartOpen, setIsCartOpen, showVendorModal, setShowVendorModal } = useCart();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/booking/:id" element={<BookingDetails />} />
          <Route path="/inspiration" element={<Inspiration />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/support" element={<Support />} />
          <Route path="/booking/services" element={<ServiceSelection />} />
          <Route path="/booking/packages" element={<PackageSelection />} />
          <Route path="/booking/event-details" element={<EventDetails />} />
          <Route path="/booking/congratulations" element={<PackageCongratulations />} />
          <Route path="/booking/vendor-recommendation" element={<VendorRecommendation />} />
          <Route path="/package/:id" element={<PackageDetails />} />
          <Route path="/vendor/:id" element={<VendorProfile />} />
          <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
          <Route path="/vendor-application" element={<VendorApplication />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cancellation" element={<CancellationPolicy />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </main>

      <Footer />
      
      {/* Global Components */}
      <ChatBot />
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
      <VendorSelectionModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
      />
    </div>
  );
};