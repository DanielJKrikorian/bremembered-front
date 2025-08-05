import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { Header } from './components/common/Header';
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

function App() {
  // Mock authentication state - in a real app, this would come from context/state management
  const isAuthenticated = true; // Set to true to show authenticated state

  return (
    <BookingProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header isAuthenticated={isAuthenticated} />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/bundle/:id" element={<ServiceBundle />} />
              <Route path="/bundle/:bundleId/service/:serviceId" element={<ServiceDetails />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/inspiration" element={<Inspiration />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/support" element={<Support />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* New Booking Flow Routes */}
              <Route path="/booking/services" element={<ServiceSelection />} />
              <Route path="/booking/packages" element={<PackageSelection />} />
              <Route path="/booking/event-details" element={<EventDetails />} />
              <Route path="/booking/congratulations" element={<PackageCongratulations />} />
              <Route path="/booking/vendor-recommendation" element={<VendorRecommendation />} />
            </Routes>
          </main>
        </div>
      </Router>
    </BookingProvider>
  );
}

export default App;