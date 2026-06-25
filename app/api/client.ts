const BASE_URL = "https://stylehub-backend-42fh.onrender.com";

export type Service = {
  id: string;
  salonId: string;
  name: string;
  durationMins: number;
  price: number;
};

export type Review = {
  id: string;
  salonId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
};

export type Salon = {
  id: string;
  name: string;
  category: string;
  address: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  openTime: string;
  closeTime: string;
  services: Service[];
  reviews: Review[];
};

export type Booking = {
  id: string;
  userId: string;
  salonId: string;
  serviceId: string;
  salonName: string;
  serviceName: string;
  date: string;
  dateLabel: string;
  time: string;
  price: number;
  originalPrice: number;
  discountAmount: number;
  createdAt: string;
};

export async function fetchSalons(): Promise<Salon[]> {
  const response = await fetch(`${BASE_URL}/salons`);
  if (!response.ok) {
    throw new Error("Failed to fetch salons");
  }
  return response.json();
}

export async function fetchSalonById(id: string): Promise<Salon> {
  const response = await fetch(`${BASE_URL}/salons/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch salon");
  }
  return response.json();
}
export type PromoValidation = {
  code: string;
  discountPercent: number;
};

export async function validatePromoCode(
  salonId: string,
  code: string,
  token: string
): Promise<PromoValidation> {
  const response = await fetch(`${BASE_URL}/promo-codes/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ salonId, code }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Invalid promo code");
  }
  return response.json();
}

export async function createBooking(
  payload: {
    salonId: string;
    serviceId: string;
    salonName: string;
    serviceName: string;
    date: string;
    dateLabel: string;
    time: string;
    price: number;
    promoCode?: string;
  },
  token: string
): Promise<Booking> {
  const response = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create booking");
  }
  return response.json();
}

export async function fetchBookings(token: string): Promise<Booking[]> {
  const response = await fetch(`${BASE_URL}/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }
  return response.json();
}

export async function fetchBookedSlots(
  salonId: string,
  date: string
): Promise<string[]> {
  const response = await fetch(
    `${BASE_URL}/salons/${salonId}/booked-slots?date=${date}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch booked slots");
  }
  return response.json();
}

export async function cancelBooking(bookingId: string, token: string) {
  const response = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to cancel booking");
  }
  return response.json();
}

export async function forgotPassword(phone: string) {
  const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Could not request a reset code");
  }
  return data;
}

export async function resetPassword(
  phone: string,
  code: string,
  newPassword: string
) {
  const response = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code, newPassword }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Could not reset password");
  }
  return data;
}

export async function deleteAccount(token: string) {
  const response = await fetch(`${BASE_URL}/auth/account`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Could not delete account");
  }
  return data;
}