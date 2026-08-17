const BASE_URL = "https://stylehub-backend-42fh.onrender.com";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export type MyProfessionalProfile = {
  id: string;
  salonId: string;
  salonName: string | null;
  name: string;
  photoUrl: string | null;
  services: { id: string; name: string; durationMins: number; price: number }[];
};

export type MyProfessionalBooking = {
  id: string;
  salonName: string;
  serviceName: string;
  date: string;
  dateLabel: string;
  time: string;
  price: number;
  tipAmount: number;
  customerName: string;
  customerPhone: string;
};

export type MyProfessionalRatings = {
  average: number;
  count: number;
  ratings: { rating: number; comment: string | null; createdAt: string }[];
};

export type AvailableBooking = {
  id: string;
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  dateLabel: string;
  time: string;
  price: number;
};

function statusError(message: string, status: number) {
  const err = new Error(message) as any;
  err.status = status;
  return err;
}

export async function fetchMyProfessionalProfile(token: string): Promise<MyProfessionalProfile> {
  const response = await fetch(`${BASE_URL}/professional/profile`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw statusError("Failed to load your professional profile", response.status);
  return response.json();
}

export async function fetchMyProfessionalBookings(
  token: string
): Promise<MyProfessionalBooking[]> {
  const response = await fetch(`${BASE_URL}/professional/bookings`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw statusError("Failed to load your bookings", response.status);
  return response.json();
}

export async function fetchMyProfessionalRatings(token: string): Promise<MyProfessionalRatings> {
  const response = await fetch(`${BASE_URL}/professional/ratings`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw statusError("Failed to load your ratings", response.status);
  return response.json();
}

export async function fetchAvailableBookings(token: string): Promise<AvailableBooking[]> {
  const response = await fetch(`${BASE_URL}/professional/available-bookings`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw statusError("Failed to load open bookings", response.status);
  return response.json();
}

export async function acceptBooking(bookingId: string, token: string) {
  const response = await fetch(
    `${BASE_URL}/professional/available-bookings/${bookingId}/accept`,
    {
      method: "POST",
      headers: authHeaders(token),
    }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Could not accept this booking");
  return data;
}
