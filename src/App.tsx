import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { BookingProvider } from './context/BookingContext';
import { AppContent } from './components/AppContent';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BookingProvider>
          <Router>
            <AppContent />
          </Router>
        </BookingProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;