const BASE_URL = "https://stylehub-backend-42fh.onrender.com";
export const WS_BASE_URL = BASE_URL.replace(/^http/, "ws");

export type CustomerServiceContact = {
  id: string;
  label: string | null;
  phone: string | null;
  email: string | null;
};

export type OwnerSalon = {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  address: string | null;
  imageUrl: string;
  openTime: string;
  closeTime: string;
  latitude: number | null;
  longitude: number | null;
  customerServiceContacts: CustomerServiceContact[];
  services: {
    id: string;
    name: string;
    durationMins: number;
    price: number;
    images: { id: string; url: string }[];
  }[];
  images: { id: string; url: string }[];
};

export type OwnerBooking = {
  id: string;
  userId: string;
  salonId: string;
  serviceId: string;
  salonName: string;
  serviceName: string;
  dateLabel: string;
  time: string;
  price: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  professionalId: string | null;
  professionalName: string | null;
  noPreference: number;
  customerVisitCount: number;
  date: string;
  status: string | null;
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  bookingCount: number;
};

export type Professional = {
  id: string;
  salonId: string;
  name: string;
  photoUrl: string | null;
  createdAt: string;
  userId: string | null;
  claimCode: string | null;
  services: { id: string; name: string; durationMins: number; price: number }[];
};

export type PromoCode = {
  id: string;
  salonId: string;
  code: string;
  discountPercent: number;
  active: number;
  createdAt: string;
  expiresAt: string | null;
  recipients: Customer[];
};

export type OwnerStats = {
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  monthlyRevenue: number;
  monthlyBookings: number;
  avgRating: number;
  totalReviews: number;
  topServices: { serviceName: string; bookingCount: number; revenue: number }[];
  recentBookings: { salonName: string; serviceName: string; dateLabel: string; time: string; price: number; customerName: string }[];
  recentReviews: { customerName: string; rating: number; comment: string; date: string; salonName: string }[];
};

export type SalonAnalytics = {
  range: "week" | "month" | "all";
  revenueOverTime: { date: string; bookingCount: number; revenue: number }[];
  cancellationRate: number;
  cancelledCount: number;
  cancellationReasons: { reason: string; count: number }[];
  noShowRate: number;
  noShowCount: number;
  perProfessional: { professionalId: string; name: string; bookingCount: number; revenue: number; tips: number; avgRating: number }[];
  topServices: { serviceName: string; bookingCount: number; revenue: number }[];
  totalTips: number;
};

export async function fetchSalonAnalytics(
  salonId: string,
  range: "week" | "month" | "all",
  token: string
): Promise<SalonAnalytics> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/analytics?range=${range}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch analytics");
  return response.json();
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function uploadSalonPhoto(
  fileUri: string,
  token: string
): Promise<string> {
  const formData = new FormData();
  formData.append("photo", {
    uri: fileUri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as any);

  const response = await fetch(`${BASE_URL}/upload/salon-photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to upload photo");
  }
  return data.photoUrl;
}

export async function uploadProfessionalPhoto(
  fileUri: string,
  token: string
): Promise<string> {
  const formData = new FormData();
  formData.append("photo", {
    uri: fileUri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as any);

  const response = await fetch(`${BASE_URL}/upload/professional-photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type manually for FormData - fetch sets the correct multipart boundary automatically
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to upload photo");
  }
  return data.photoUrl;
}

export async function uploadServicePhoto(
  fileUri: string,
  token: string
): Promise<string> {
  const formData = new FormData();
  formData.append("photo", {
    uri: fileUri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as any);

  const response = await fetch(`${BASE_URL}/upload/service-photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to upload photo");
  }
  return data.photoUrl;
}

export type ServiceImage = {
  id: string;
  serviceId: string;
  imageUrl: string;
  position: number;
  createdAt: string;
};

export async function addServiceImage(
  serviceId: string,
  imageUrl: string,
  token: string
): Promise<ServiceImage> {
  const response = await fetch(`${BASE_URL}/owner/services/${serviceId}/images`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ imageUrl }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to add photo");
  }
  return data;
}

export async function removeServiceImage(
  serviceId: string,
  imageId: string,
  token: string
) {
  const response = await fetch(
    `${BASE_URL}/owner/services/${serviceId}/images/${imageId}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  );
  if (!response.ok) throw new Error("Failed to remove photo");
  return response.json();
}

export async function addProfessionalImage(
  professionalId: string,
  imageUrl: string,
  token: string
): Promise<ServiceImage> {
  const response = await fetch(`${BASE_URL}/owner/professionals/${professionalId}/images`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ imageUrl }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to add photo");
  }
  return data;
}

export async function removeProfessionalImage(
  professionalId: string,
  imageId: string,
  token: string
) {
  const response = await fetch(
    `${BASE_URL}/owner/professionals/${professionalId}/images/${imageId}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  );
  if (!response.ok) throw new Error("Failed to remove photo");
  return response.json();
}

export async function addSalonImage(
  salonId: string,
  imageUrl: string,
  token: string
): Promise<ServiceImage> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/images`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ imageUrl }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to add photo");
  }
  return data;
}

export async function removeSalonImage(salonId: string, imageId: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/images/${imageId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to remove photo");
  return response.json();
}

export type SalonHour = {
  id: string;
  salonId: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: number;
  breakStart: string | null;
  breakEnd: string | null;
};

export async function fetchSalonHours(salonId: string, token: string): Promise<SalonHour[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/hours`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch hours");
  return response.json();
}

export async function updateSalonHours(
  salonId: string,
  hours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
    breakStart?: string;
    breakEnd?: string;
  }[],
  token: string
): Promise<SalonHour[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/hours`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ hours }),
  });
  if (!response.ok) throw new Error("Failed to update hours");
  return response.json();
}

export async function announceToCustomers(
  salonId: string,
  title: string,
  message: string,
  token: string
): Promise<{ sent: number }> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/announce`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ title, message }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to send announcement");
  return data;
}

export async function fetchBlockedSlots(salonId: string, date: string, token: string): Promise<{ id: string; time: string }[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/blocked-slots?date=${date}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch blocked slots");
  return response.json();
}

export async function blockSlot(salonId: string, date: string, time: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/blocked-slots`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ date, time }),
  });
  const text = await response.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch {}
  if (!response.ok) throw new Error(`${response.status}: ${data?.error || text || "Failed to block slot"}`);
  return data;
}

export async function unblockSlot(salonId: string, date: string, time: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/blocked-slots`, {
    method: "DELETE",
    headers: authHeaders(token),
    body: JSON.stringify({ date, time }),
  });
  if (!response.ok) throw new Error("Failed to unblock slot");
}

export type SalonClosure = {
  id: string;
  salonId: string;
  date: string;
  reason: string | null;
  createdAt: string;
};

export async function fetchSalonClosures(salonId: string, token: string): Promise<SalonClosure[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/closures`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch closure dates");
  return response.json();
}

export async function addSalonClosure(
  salonId: string,
  date: string,
  reason: string,
  token: string
): Promise<SalonClosure> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/closures`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ date, reason: reason || undefined }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to close this date");
  return data;
}

export async function removeSalonClosure(salonId: string, closureId: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/closures/${closureId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to reopen this date");
  return response.json();
}

export async function fetchOwnerStats(token: string): Promise<OwnerStats> {
  const response = await fetch(`${BASE_URL}/owner/stats`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

export async function fetchOwnerSalons(token: string): Promise<OwnerSalon[]> {
  const response = await fetch(`${BASE_URL}/owner/salons`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const err = new Error("Failed to fetch your salons") as any;
    err.status = response.status;
    throw err;
  }
  return response.json();
}

export async function createOwnerSalon(
  payload: {
    name: string;
    category: string;
    address?: string;
    openTime: string;
    closeTime: string;
    imageUrl?: string;
  },
  token: string
): Promise<OwnerSalon> {
  const response = await fetch(`${BASE_URL}/owner/salons`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create salon");
  return response.json();
}

export async function addOwnerService(
  salonId: string,
  payload: { name: string; durationMins: number; price: number; category?: string },
  token: string
) {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/services`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to add service");
  return response.json();
}

export async function deleteOwnerService(serviceId: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/services/${serviceId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete service");
  return response.json();
}

export async function createManualBooking(
  salonId: string,
  payload: {
    serviceId: string;
    serviceName: string;
    date: string;
    dateLabel: string;
    time: string;
    price: number;
    guestName: string;
    guestPhone?: string;
    professionalId?: string;
  },
  token: string
): Promise<OwnerBooking> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/manual-booking`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to create booking");
  }
  return data;
}

export async function fetchOwnerBookings(token: string): Promise<OwnerBooking[]> {
  const response = await fetch(`${BASE_URL}/owner/bookings`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch bookings");
  return response.json();
}

export async function markBookingNoShow(
  bookingId: string,
  noShow: boolean,
  token: string
): Promise<{ id: string; status: string | null }> {
  const response = await fetch(`${BASE_URL}/owner/bookings/${bookingId}/no-show`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ noShow }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to update booking");
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

export type Conversation = {
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export async function fetchOwnerConversations(salonId: string, token: string): Promise<Conversation[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/conversations`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch conversations");
  return response.json();
}

export type OwnerConversation = Conversation & { salonId: string; salonName: string };

export async function fetchAllOwnerConversations(token: string): Promise<OwnerConversation[]> {
  const response = await fetch(`${BASE_URL}/owner/conversations`, {
    headers: authHeaders(token),
  });
  if (!response.ok) return [];
  return response.json();
}

export async function fetchOwnerThread(
  salonId: string,
  customerId: string,
  token: string
): Promise<ChatMessage[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/messages/${customerId}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch thread");
  return response.json();
}

export async function sendOwnerMessage(
  salonId: string,
  customerId: string,
  body: string,
  token: string
): Promise<ChatMessage> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/messages/${customerId}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ body }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to send message");
  return data;
}

export async function editOwnerMessage(
  messageId: string,
  body: string,
  token: string
): Promise<ChatMessage> {
  const response = await fetch(`${BASE_URL}/owner/messages/${messageId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ body }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to edit message");
  return data;
}

export async function deleteOwnerMessage(messageId: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/messages/${messageId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete message");
  return response.json();
}

export async function updateOwnerSalon(
  salonId: string,
  payload: {
    name: string;
    category: string;
    address?: string;
    openTime: string;
    closeTime: string;
    imageUrl?: string;
    latitude?: number;
    longitude?: number;
    clearLocation?: boolean;
  },
  token: string
): Promise<OwnerSalon> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update salon");
  return response.json();
}

export async function fetchCustomerServiceContacts(
  salonId: string,
  token: string
): Promise<CustomerServiceContact[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/customer-service`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch customer service contacts");
  return response.json();
}

export async function addCustomerServiceContact(
  salonId: string,
  payload: { label?: string; phone?: string; email?: string },
  token: string
): Promise<CustomerServiceContact> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/customer-service`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to add contact");
  return data;
}

export async function updateCustomerServiceContact(
  salonId: string,
  contactId: string,
  payload: { label?: string; phone?: string; email?: string },
  token: string
): Promise<CustomerServiceContact> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/customer-service/${contactId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to update contact");
  return data;
}

export async function deleteCustomerServiceContact(
  salonId: string,
  contactId: string,
  token: string
) {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/customer-service/${contactId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete contact");
  return response.json();
}

export async function deleteOwnerSalon(salonId: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete salon");
  return response.json();
}

export async function updateOwnerService(
  serviceId: string,
  payload: { name: string; durationMins: number; price: number },
  token: string
) {
  const response = await fetch(`${BASE_URL}/owner/services/${serviceId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update service");
  return response.json();
}
export async function fetchOwnerPromoCodes(
  salonId: string,
  token: string
): Promise<PromoCode[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/promo-codes`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch promo codes");
  return response.json();
}

export async function fetchOwnerCustomers(
  salonId: string,
  token: string
): Promise<Customer[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/customers`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch customers");
  return response.json();
}
export async function fetchOwnerProfessionals(
  salonId: string,
  token: string
): Promise<Professional[]> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/professionals`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch professionals");
  return response.json();
}

export async function createOwnerProfessional(
  salonId: string,
  payload: { name: string; photoUrl?: string; serviceIds: string[] },
  token: string
): Promise<Professional> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/professionals`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to add professional");
  }
  return response.json();
}

export async function deleteOwnerProfessional(professionalId: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/professionals/${professionalId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete professional");
  return response.json();
}

export type UnavailabilityBlock = {
  id: string;
  professionalId: string;
  date: string;
  time: string | null;
  createdAt: string;
};

export async function fetchProfessionalUnavailability(
  professionalId: string,
  date: string,
  token: string
): Promise<UnavailabilityBlock[]> {
  const response = await fetch(
    `${BASE_URL}/owner/professionals/${professionalId}/unavailability?date=${date}`,
    { headers: authHeaders(token) }
  );
  if (!response.ok) throw new Error("Failed to fetch time off");
  return response.json();
}

export async function markProfessionalUnavailable(
  professionalId: string,
  payload: { date: string; time?: string },
  token: string
): Promise<UnavailabilityBlock> {
  const response = await fetch(
    `${BASE_URL}/owner/professionals/${professionalId}/unavailability`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to mark unavailable");
  return data;
}

export async function removeProfessionalUnavailability(
  professionalId: string,
  blockId: string,
  token: string
) {
  const response = await fetch(
    `${BASE_URL}/owner/professionals/${professionalId}/unavailability/${blockId}`,
    { method: "DELETE", headers: authHeaders(token) }
  );
  if (!response.ok) throw new Error("Failed to remove time off");
  return response.json();
}

export async function createOwnerPromoCode(
  salonId: string,
  payload: {
    discountPercent: number;
    expiresAt?: string;
    userIds: string[];
  },
  token: string
): Promise<PromoCode> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/promo-codes`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to create promo code");
  }
  return response.json();
}

export async function updateOwnerPromoCode(
  promoCodeId: string,
  payload: {
    discountPercent: number;
    expiresAt?: string;
  },
  token: string
): Promise<PromoCode> {
  const response = await fetch(`${BASE_URL}/owner/promo-codes/${promoCodeId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to update promo code");
  }
  return response.json();
}

export async function deleteOwnerPromoCode(promoCodeId: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/promo-codes/${promoCodeId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete promo code");
  return response.json();
}

export type LoyaltySettings = {
  salonId: string;
  enabled: number;
  visitsRequired: number;
  discountPercent: number;
};

export async function fetchLoyaltySettings(
  salonId: string,
  token: string
): Promise<LoyaltySettings> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/loyalty`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch loyalty settings");
  return response.json();
}

export async function updateLoyaltySettings(
  salonId: string,
  payload: { enabled: boolean; visitsRequired: number; discountPercent: number },
  token: string
): Promise<LoyaltySettings> {
  const response = await fetch(`${BASE_URL}/owner/salons/${salonId}/loyalty`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to update loyalty settings");
  return data;
}