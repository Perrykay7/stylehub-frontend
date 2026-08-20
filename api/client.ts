const BASE_URL = "https://stylehub-backend-42fh.onrender.com";
export const WS_BASE_URL = BASE_URL.replace(/^http/, "ws");

export type ServiceImage = { id: string; url: string };

export type Service = {
  id: string;
  salonId: string;
  name: string;
  durationMins: number;
  price: number;
  images: ServiceImage[];
};

export type Review = {
  id: string;
  salonId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
};

export type CustomerServiceContact = {
  id: string;
  label: string | null;
  phone: string | null;
  email: string | null;
};

export type Salon = {
  id: string;
  name: string;
  category: string;
  address: string | null;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  openTime: string;
  closeTime: string;
  latitude: number | null;
  longitude: number | null;
  customerServiceContacts: CustomerServiceContact[];
  services: Service[];
  reviews: Review[];
  images: ServiceImage[];
};

export type Professional = {
  id: string;
  salonId: string;
  name: string;
  photoUrl: string | null;
  avgRating: number | null;
  ratingCount: number;
  unavailableAllDay?: boolean;
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
  professionalId: string | null;
  professionalName: string | null;
  noPreference: number;
  hasRating: number;
  tipAmount: number;
  notes: string | null;
};

export type ProfessionalDetail = {
  id: string;
  salonId: string;
  salonName: string | null;
  name: string;
  photoUrl: string | null;
  createdAt: string;
  images: ServiceImage[];
  avgRating: number | null;
  ratingCount: number;
  reviews: { rating: number; comment: string; createdAt: string }[];
};

export async function fetchProfessionalById(id: string): Promise<ProfessionalDetail> {
  const response = await fetch(`${BASE_URL}/professionals/${id}`);
  if (!response.ok) throw new Error("Failed to fetch professional");
  return response.json();
}

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
export type MyPromo = {
  code: string;
  discountPercent: number;
  expiresAt: string | null;
};

// Silently checks whether the logged-in customer has an active, owner-granted
// promo for this salon. Returns null if none — no code to type, ever.
export async function fetchMyPromo(salonId: string, token: string): Promise<MyPromo | null> {
  const response = await fetch(`${BASE_URL}/salons/${salonId}/my-promo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  return response.json();
}

export type LoyaltyStatus =
  | { enabled: false }
  | {
      enabled: true;
      visitsRequired: number;
      discountPercent: number;
      currentVisitCount: number;
      visitsUntilNextReward: number;
    };

export async function fetchMyLoyaltyStatus(
  salonId: string,
  token: string
): Promise<LoyaltyStatus> {
  const response = await fetch(`${BASE_URL}/salons/${salonId}/my-loyalty-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return { enabled: false };
  return response.json();
}

export type SalonLoyaltyOverview = {
  salonId: string;
  salonName: string;
  visitsRequired: number;
  discountPercent: number;
  currentVisitCount: number;
  visitsUntilNextReward: number;
};

export async function fetchMyLoyaltyOverview(token: string): Promise<SalonLoyaltyOverview[]> {
  const response = await fetch(`${BASE_URL}/my-loyalty`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  return response.json();
}

export type WaitlistEntry = {
  id: string;
  userId: string;
  salonId: string;
  serviceId: string;
  professionalId: string | null;
  date: string;
  time: string;
  dateLabel: string;
  salonName: string;
  serviceName: string;
  notified: number;
  createdAt: string;
};

export async function joinWaitlist(
  payload: {
    salonId: string;
    serviceId: string;
    professionalId?: string;
    date: string;
    time: string;
    dateLabel: string;
    salonName: string;
    serviceName: string;
  },
  token: string
): Promise<WaitlistEntry> {
  const response = await fetch(`${BASE_URL}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Could not join the waitlist");
  return data;
}

export async function fetchMyWaitlist(token: string): Promise<WaitlistEntry[]> {
  const response = await fetch(`${BASE_URL}/my-waitlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  return response.json();
}

export async function leaveWaitlist(waitlistId: string, token: string) {
  const response = await fetch(`${BASE_URL}/waitlist/${waitlistId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to leave the waitlist");
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
    professionalId?: string;
    tipAmount?: number;
    notes?: string;
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
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to create booking");
  }
  return data;
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

export async function fetchMyFavorites(token: string): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch favorites");
  return response.json();
}

export async function addFavorite(salonId: string, token: string) {
  const response = await fetch(`${BASE_URL}/favorites/${salonId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to save favorite");
}

export async function removeFavorite(salonId: string, token: string) {
  const response = await fetch(`${BASE_URL}/favorites/${salonId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to remove favorite");
}

export async function fetchProfessionalsForService(
  salonId: string,
  serviceId: string,
  date?: string
): Promise<Professional[]> {
  const url = date
    ? `${BASE_URL}/salons/${salonId}/professionals?serviceId=${serviceId}&date=${date}`
    : `${BASE_URL}/salons/${salonId}/professionals?serviceId=${serviceId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch professionals");
  return response.json();
}
export async function fetchBookedSlots(
  salonId: string,
  date: string,
  serviceId?: string,
  professionalId?: string
): Promise<string[]> {
  const params = new URLSearchParams({ date });
  if (serviceId) params.set("serviceId", serviceId);
  if (professionalId) params.set("professionalId", professionalId);
  const response = await fetch(`${BASE_URL}/salons/${salonId}/booked-slots?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch booked slots");
  }
  return response.json();
}

export async function rateProfessional(
  professionalId: string,
  payload: { bookingId: string; rating: number; comment?: string },
  token: string
) {
  const response = await fetch(`${BASE_URL}/professionals/${professionalId}/ratings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to submit rating");
  }
  return data;
}

export async function cancelBooking(bookingId: string, token: string, reason?: string) {
  const response = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    throw new Error("Failed to cancel booking");
  }
  return response.json();
}

export async function rescheduleBooking(
  bookingId: string,
  payload: { date: string; dateLabel: string; time: string; professionalId?: string },
  token: string
): Promise<Booking> {
  const response = await fetch(`${BASE_URL}/bookings/${bookingId}/reschedule`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Could not reschedule booking");
  }
  return data;
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

export async function submitSalonReview(
  salonId: string,
  rating: number,
  comment: string,
  token: string
) {
  const response = await fetch(`${BASE_URL}/salons/${salonId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating, comment }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Could not submit review");
  return data;
}

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, any> | null;
  read: number;
  createdAt: string;
};

export async function fetchNotifications(token: string): Promise<AppNotification[]> {
  const response = await fetch(`${BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
}

export async function markAllNotificationsRead(token: string) {
  const response = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to update notifications");
  return response.json();
}

export type NotificationPreferences = {
  smsAppointmentNotifications: boolean;
  whatsappAppointmentNotifications: boolean;
  smsMarketingNotifications: boolean;
  whatsappMarketingNotifications: boolean;
};

export async function fetchNotificationPreferences(
  token: string
): Promise<NotificationPreferences> {
  const response = await fetch(`${BASE_URL}/notification-preferences`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch notification preferences");
  return response.json();
}

export async function updateNotificationPreferences(
  payload: NotificationPreferences,
  token: string
) {
  const response = await fetch(`${BASE_URL}/notification-preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update notification preferences");
  return response.json();
}

export async function submitSupportTicket(
  category: string,
  message: string,
  token: string
): Promise<{ id: string }> {
  const response = await fetch(`${BASE_URL}/support/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ category, message }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Could not submit your report");
  return data;
}

export async function updateProfile(
  payload: { name?: string; phone?: string; currentPassword?: string; newPassword?: string },
  token: string
): Promise<{ token: string; user: { id: string; name: string; phone: string; role: string } }> {
  const response = await fetch(`${BASE_URL}/auth/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Could not update profile");
  return data;
}

export async function savePushToken(pushToken: string, authToken: string) {
  await fetch(`${BASE_URL}/users/push-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ token: pushToken }),
  });
}

export async function deleteAccount(token: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/account`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Could not delete account");
  }
  return data;
}

export type ChatMessage = {
  id: string;
  salonId: string;
  customerId: string;
  senderRole: "customer" | "owner";
  body: string;
  createdAt: string;
  readByCustomer: number;
  readByOwner: number;
  edited?: number;
};

export type SalonConversation = {
  salonId: string;
  salonName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export async function fetchMyConversations(token: string): Promise<SalonConversation[]> {
  const response = await fetch(`${BASE_URL}/my-conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  return response.json();
}

export async function fetchMyMessages(salonId: string, token: string): Promise<ChatMessage[]> {
  const response = await fetch(`${BASE_URL}/salons/${salonId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
}

export async function sendMyMessage(
  salonId: string,
  body: string,
  token: string
): Promise<ChatMessage> {
  const response = await fetch(`${BASE_URL}/salons/${salonId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ body }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to send message");
  return data;
}

export async function editMyMessage(
  messageId: string,
  body: string,
  token: string
): Promise<ChatMessage> {
  const response = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ body }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to edit message");
  return data;
}

export async function deleteMyMessage(messageId: string, token: string) {
  const response = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete message");
  return response.json();
}