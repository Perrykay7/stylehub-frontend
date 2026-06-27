const BASE_URL = "https://stylehub-backend-42fh.onrender.com";

export type OwnerSalon = {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  address: string;
  imageUrl: string;
  openTime: string;
  closeTime: string;
  services: { id: string; name: string; durationMins: number; price: number }[];
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
  professionalName: string | null;
  customerVisitCount: number;
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

export async function fetchOwnerSalons(token: string): Promise<OwnerSalon[]> {
  const response = await fetch(`${BASE_URL}/owner/salons`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch your salons");
  return response.json();
}

export async function createOwnerSalon(
  payload: {
    name: string;
    category: string;
    address: string;
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
  payload: { name: string; durationMins: number; price: number },
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

export async function fetchOwnerBookings(token: string): Promise<OwnerBooking[]> {
  const response = await fetch(`${BASE_URL}/owner/bookings`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch bookings");
  return response.json();
}

export async function updateOwnerSalon(
  salonId: string,
  payload: {
    name: string;
    category: string;
    address: string;
    openTime: string;
    closeTime: string;
    imageUrl?: string;
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

export async function createOwnerPromoCode(
  salonId: string,
  payload: {
    code: string;
    discountPercent: number;
    expiresAt?: string;
    userIds?: string[];
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

export async function deleteOwnerPromoCode(promoCodeId: string, token: string) {
  const response = await fetch(`${BASE_URL}/owner/promo-codes/${promoCodeId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete promo code");
  return response.json();
}