import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
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