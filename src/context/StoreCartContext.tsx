import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
}

interface StoreCartContextType {
  cartState: CartState;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
}

const StoreCartContext = createContext<StoreCartContextType | undefined>(undefined);

export const StoreCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartState, setCartState] = useState<CartState>({ items: [], totalAmount: 0 });

  const addToCart = (item: CartItem) => {
    setCartState((prev) => {
      const existingItem = prev.items.find((i) => i.id === item.id);
      let newItems: CartItem[];
      if (existingItem) {
        newItems = prev.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        newItems = [...prev.items, item];
      }
      const totalAmount = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      return { items: newItems, totalAmount };
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    setCartState((prev) => {
      const newItems = prev.items.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      );
      const totalAmount = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      return { items: newItems, totalAmount };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartState((prev) => {
      const newItems = prev.items.filter((i) => i.id !== itemId);
      const totalAmount = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      return { items: newItems, totalAmount };
    });
  };

  const clearCart = () => {
    setCartState({ items: [], totalAmount: 0 });
  };

  return (
    <StoreCartContext.Provider value={{ cartState, addToCart, updateCartQuantity, removeFromCart, clearCart }}>
      {children}
    </StoreCartContext.Provider>
  );
};

export const useStoreCart = (): StoreCartContextType => {
  const context = useContext(StoreCartContext);
  if (!context) {
    throw new Error('useStoreCart must be used within a StoreCartProvider');
  }
  return context;
};