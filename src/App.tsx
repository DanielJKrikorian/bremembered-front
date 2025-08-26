import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { BookingProvider } from './context/BookingContext';
import { AppContent } from './components/AppContent';
import { Checkout } from './pages/Checkout'; // Add Checkout import

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BookingProvider>
          <Router>
            <Routes>
              <Route path="/*" element={<AppContent />} />
              <Route path="/checkout" element={<Checkout />} /> {/* Add Checkout route */}
            </Routes>
          </Router>
        </BookingProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;