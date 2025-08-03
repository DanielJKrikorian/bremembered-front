import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { BookingFlow, ServicePackage, Vendor, Venue } from '../types/booking';

interface BookingState extends BookingFlow {}

type BookingAction =
  | { type: 'SET_SELECTED_SERVICES'; payload: string[] }
  | { type: 'SET_SELECTED_PACKAGES'; payload: ServicePackage[] }
  | { type: 'SET_EVENT_DATE'; payload: string }
  | { type: 'SET_EVENT_TIME'; payload: string }
  | { type: 'SET_VENUE'; payload: Venue }
  | { type: 'SET_VENDOR'; payload: { serviceType: string; vendor: Vendor } }
  | { type: 'ADD_ADD_ON'; payload: { serviceType: string; addOn: any } }
  | { type: 'REMOVE_ADD_ON'; payload: { serviceType: string; addOnId: string } }
  | { type: 'SET_DISCOUNT_CODE'; payload: string }
  | { type: 'TOGGLE_EVENT_INSURANCE'; payload: boolean }
  | { type: 'UPDATE_TOTAL_COST'; payload: number }
  | { type: 'RESET_BOOKING' };

const initialState: BookingState = {
  selectedServices: [],
  selectedPackages: [],
  selectedVendors: {},
  addOns: {},
  totalCost: 0,
  depositAmount: 0,
  eventInsurance: false
};

const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_SELECTED_SERVICES':
      return { ...state, selectedServices: action.payload };
    
    case 'SET_SELECTED_PACKAGES':
      const totalCost = action.payload.reduce((sum, pkg) => sum + pkg.price, 0);
      return { 
        ...state, 
        selectedPackages: action.payload,
        totalCost,
        depositAmount: Math.round(totalCost * 0.5)
      };
    
    case 'SET_EVENT_DATE':
      return { ...state, eventDate: action.payload };
    
    case 'SET_EVENT_TIME':
      return { ...state, eventTime: action.payload };
    
    case 'SET_VENUE':
      return { ...state, venue: action.payload };
    
    case 'SET_VENDOR':
      return {
        ...state,
        selectedVendors: {
          ...state.selectedVendors,
          [action.payload.serviceType]: action.payload.vendor
        }
      };
    
    case 'ADD_ADD_ON':
      const currentAddOns = state.addOns[action.payload.serviceType] || [];
      return {
        ...state,
        addOns: {
          ...state.addOns,
          [action.payload.serviceType]: [...currentAddOns, action.payload.addOn]
        }
      };
    
    case 'REMOVE_ADD_ON':
      const filteredAddOns = (state.addOns[action.payload.serviceType] || [])
        .filter(addOn => addOn.id !== action.payload.addOnId);
      return {
        ...state,
        addOns: {
          ...state.addOns,
          [action.payload.serviceType]: filteredAddOns
        }
      };
    
    case 'SET_DISCOUNT_CODE':
      return { ...state, discountCode: action.payload };
    
    case 'TOGGLE_EVENT_INSURANCE':
      const insuranceCost = action.payload ? Math.round(state.totalCost * 0.05) : 0;
      return { 
        ...state, 
        eventInsurance: action.payload,
        totalCost: action.payload 
          ? state.totalCost + insuranceCost 
          : state.totalCost - Math.round(state.totalCost * 0.05 / 1.05)
      };
    
    case 'UPDATE_TOTAL_COST':
      return { 
        ...state, 
        totalCost: action.payload,
        depositAmount: Math.round(action.payload * 0.5)
      };
    
    case 'RESET_BOOKING':
      return initialState;
    
    default:
      return state;
  }
};

interface BookingContextType {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  setSelectedServices: (services: string[]) => void;
  setSelectedPackages: (packages: ServicePackage[]) => void;
  setEventDetails: (date: string, time: string, venue: Venue) => void;
  setVendor: (serviceType: string, vendor: Vendor) => void;
  addAddOn: (serviceType: string, addOn: any) => void;
  removeAddOn: (serviceType: string, addOnId: string) => void;
  setDiscountCode: (code: string) => void;
  toggleEventInsurance: (enabled: boolean) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const setSelectedServices = (services: string[]) => {
    dispatch({ type: 'SET_SELECTED_SERVICES', payload: services });
  };

  const setSelectedPackages = (packages: ServicePackage[]) => {
    dispatch({ type: 'SET_SELECTED_PACKAGES', payload: packages });
  };

  const setEventDetails = (date: string, time: string, venue: Venue) => {
    dispatch({ type: 'SET_EVENT_DATE', payload: date });
    dispatch({ type: 'SET_EVENT_TIME', payload: time });
    dispatch({ type: 'SET_VENUE', payload: venue });
  };

  const setVendor = (serviceType: string, vendor: Vendor) => {
    dispatch({ type: 'SET_VENDOR', payload: { serviceType, vendor } });
  };

  const addAddOn = (serviceType: string, addOn: any) => {
    dispatch({ type: 'ADD_ADD_ON', payload: { serviceType, addOn } });
  };

  const removeAddOn = (serviceType: string, addOnId: string) => {
    dispatch({ type: 'REMOVE_ADD_ON', payload: { serviceType, addOnId } });
  };

  const setDiscountCode = (code: string) => {
    dispatch({ type: 'SET_DISCOUNT_CODE', payload: code });
  };

  const toggleEventInsurance = (enabled: boolean) => {
    dispatch({ type: 'TOGGLE_EVENT_INSURANCE', payload: enabled });
  };

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
  };

  return (
    <BookingContext.Provider value={{
      state,
      dispatch,
      setSelectedServices,
      setSelectedPackages,
      setEventDetails,
      setVendor,
      addAddOn,
      removeAddOn,
      setDiscountCode,
      toggleEventInsurance,
      resetBooking
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};