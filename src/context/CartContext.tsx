import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { ServicePackage, Vendor } from '../types/booking';

export interface CartItem {
  id: string;
  package: ServicePackage;
  vendor?: Vendor;
  eventDate?: string;
  eventTime?: string;
  endTime?: string;
  venue?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  addOns?: any[];
  notes?: string;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  totalAmount: number;
}

// Local storage key for cart persistence
const CART_STORAGE_KEY = 'bremembered_cart';

// Calculate total amount including package, premium, and travel fees
const calculateTotalAmount = (items: CartItem[]): number => {
  const total = items.reduce((sum, item) => {
    const packagePrice = item.package.price / 100;
    const premium = item.vendor && item.vendor.premium_amount && item.vendor.premium_amount > 0 ? item.vendor.premium_amount / 100 : 0;
    const travel = item.vendor && item.vendor.travel_fee && item.vendor.travel_fee > 0 ? item.vendor.travel_fee / 100 : 0;
    console.log(`Calculating for item ${item.id}: Package=${packagePrice}, Premium=${premium}, Travel=${travel}, Item Total=${packagePrice + premium + travel}`);
    return sum + packagePrice + premium + travel;
  }, 0);
  const totalCents = total * 100;
  console.log(`Calculated totalAmount: ${totalCents} cents for ${items.length} items`);
  return totalCents;
};

// Default empty cart state
const DEFAULT_EMPTY_CART: CartState = {
  items: [],
  isOpen: false,
  totalAmount: 0
};

// Load cart from localStorage
const loadCartFromStorage = (): CartState => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the structure
      if (parsed && Array.isArray(parsed.items)) {
        const totalAmount = calculateTotalAmount(parsed.items);
        console.log('Loaded cart from storage:', {
          items: parsed.items.map((item: CartItem) => ({
            id: item.id,
            packagePrice: item.package.price,
            vendor: item.vendor ? { name: item.vendor.name, premium_amount: item.vendor.premium_amount, travel_fee: item.vendor.travel_fee } : null
          })),
          storedTotal: parsed.totalAmount,
          recalculatedTotal: totalAmount
        });
        return {
          ...DEFAULT_EMPTY_CART,
          ...parsed,
          totalAmount
        };
      }
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
  }
  console.log('Returning default empty cart');
  return DEFAULT_EMPTY_CART;
};

// Save cart to localStorage
const saveCartToStorage = (state: CartState) => {
  try {
    const stateToSave = {
      ...state,
      items: state.items.map(item => ({
        ...item,
        vendor: item.vendor ? { ...item.vendor } : undefined
      }))
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stateToSave));
    console.log('Saved cart to storage:', {
      items: stateToSave.items.map((item: CartItem) => ({
        id: item.id,
        packagePrice: item.package.price,
        vendor: item.vendor ? { name: item.vendor.name, premium_amount: item.vendor.premium_amount, travel_fee: item.vendor.travel_fee } : null
      })),
      totalAmount: stateToSave.totalAmount
    });
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'addedAt'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<CartItem> } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' };

const initialState: CartState = loadCartFromStorage();

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const newItem: CartItem = {
        ...action.payload,
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        addedAt: new Date().toISOString()
      };
      const newItems = [...state.items, newItem];
      console.log('ADD_ITEM:', { newItem: { id: newItem.id, packagePrice: newItem.package.price, vendor: newItem.vendor } });
      return {
        ...state,
        items: newItems,
        totalAmount: calculateTotalAmount(newItems)
      };
    
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      console.log('REMOVE_ITEM:', { removedId: action.payload, remainingItems: filteredItems.length });
      return {
        ...state,
        items: filteredItems,
        totalAmount: calculateTotalAmount(filteredItems)
      };
    
    case 'UPDATE_ITEM':
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.updates }
          : item
      );
      console.log('UPDATE_ITEM:', { id: action.payload.id, updates: action.payload.updates });
      return {
        ...state,
        items: updatedItems,
        totalAmount: calculateTotalAmount(updatedItems)
      };
    
    case 'CLEAR_CART':
      console.log('CLEAR_CART');
      return {
        ...state,
        items: [],
        totalAmount: 0
      };
    
    case 'TOGGLE_CART':
      console.log('TOGGLE_CART:', { isOpen: !state.isOpen });
      return {
        ...state,
        isOpen: !state.isOpen
      };
    
    case 'OPEN_CART':
      console.log('OPEN_CART');
      return {
        ...state,
        isOpen: true
      };
    
    case 'CLOSE_CART':
      console.log('CLOSE_CART');
      return {
        ...state,
        isOpen: false
      };
    
    default:
      console.log('Unknown action:', action);
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Save to localStorage whenever cart state changes
  useEffect(() => {
    saveCartToStorage(state);
  }, [state]);

  // Validate totalAmount on state change
  useEffect(() => {
    const recalculatedTotal = calculateTotalAmount(state.items);
    if (recalculatedTotal !== state.totalAmount) {
      console.warn(`Total amount mismatch! State: ${state.totalAmount}, Recalculated: ${recalculatedTotal}`);
      dispatch({
        type: 'UPDATE_ITEM',
        payload: { id: state.items[0]?.id || '', updates: {} } // Trigger recalculation
      });
    }
  }, [state.items, state.totalAmount]);

  const addItem = (item: Omit<CartItem, 'id' | 'addedAt'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateItem = (id: string, updates: Partial<CartItem>) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { id, updates } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      removeItem,
      updateItem,
      clearCart,
      toggleCart,
      openCart,
      closeCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};