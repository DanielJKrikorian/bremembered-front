import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Home } from './pages/Home';
import { SearchResults } from './pages/SearchResults';
import { ServiceBundle } from './pages/ServiceBundle';
import { ServiceDetails } from './pages/ServiceDetails';
import { Checkout } from './pages/Checkout';
import { MyBookings } from './pages/MyBookings';
import { Inspiration } from './pages/Inspiration';
import { HowItWorks } from './pages/HowItWorks';
import { Support } from './pages/Support';
import { Profile } from './pages/Profile';
import { ServiceSelection } from './pages/booking/ServiceSelection';
import { PackageSelection } from './pages/booking/PackageSelection';
import { EventDetails } from './pages/booking/EventDetails';
import { PackageCongratulations } from './pages/booking/PackageCongratulations';
import { VendorRecommendation } from './pages/booking/VendorRecommendation';
import { PackageDetails } from './pages/PackageDetails';
import { VendorOnboarding } from './pages/VendorOnboarding';
import { VendorApplication } from './pages/VendorApplication';
import { ChatBot } from './components/chat/ChatBot';
import { CartSidebar } from './components/cart/CartSidebar';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BookingProvider>
          <Router>
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
                  <Route path="/inspiration" element={<Inspiration />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/profile" element={<Profile />} />
                  
                  {/* Inspiration Routes */}
                  <Route path="/inspiration/:slug" element={<BlogPost />} />
                  
                  {/* Package Details */}
                  <Route path="/package/:id" element={<PackageDetails />} />
                  
                  {/* New Booking Flow Routes */}
                  <Route path="/booking/services" element={<ServiceSelection />} />
                  <Route path="/booking/packages" element={<PackageSelection />} />
                  <Route path="/booking/congratulations" element={<PackageCongratulations />} />
                  <Route path="/booking/vendor-recommendation" element={<VendorRecommendation />} />
                  
                  {/* Vendor Onboarding */}
                  <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
                  <Route path="/vendor-application" element={<VendorApplication />} />
                </Routes>
              </main>
              <Footer />
              <ChatBot />
              <CartSidebar />
            </div>
          </Router>
        </BookingProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;