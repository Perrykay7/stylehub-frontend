import { createContext, ReactNode, useContext, useState } from "react";

export type Booking = {
  id: string;
  salonName: string;
  serviceName: string;
  dateLabel: string;
  time: string;
  price: number;
};

type BookingsContextType = {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
};

const BookingsContext = createContext<BookingsContextType | undefined>(
  undefined
);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  function addBooking(booking: Booking) {
    setBookings((prev) => [booking, ...prev]);
  }

  return (
    <BookingsContext.Provider value={{ bookings, addBooking }}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  const context = useContext(BookingsContext);
  if (!context) {
    throw new Error("useBookings must be used within a BookingsProvider");
  }
  return context;
}