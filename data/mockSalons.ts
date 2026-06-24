export type Service = {
  id: string;
  name: string;
  durationMins: number;
  price: number; // in GHS
};

export type Review = {
  id: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO date string
};

export type Salon = {
  id: string;
  name: string;
  category: string; // e.g. "Hair Salon", "Spa", "Nail Studio"
  address: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  openTime: string; // e.g. "09:00"
  closeTime: string; // e.g. "19:00"
  services: Service[];
  reviews: Review[];
};

export const mockSalons: Salon[] = [
  {
    id: "1",
    name: "Glow Studio Accra",
    category: "Hair Salon",
    address: "12 Oxford Street, Osu, Accra",
    distanceKm: 1.2,
    rating: 4.8,
    reviewCount: 132,
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
    openTime: "09:00",
    closeTime: "19:00",
    services: [
      { id: "s1", name: "Haircut & Style", durationMins: 45, price: 80 },
      { id: "s2", name: "Braids (Box Braids)", durationMins: 180, price: 250 },
      { id: "s3", name: "Wash & Blow Dry", durationMins: 30, price: 50 },
    ],
    reviews: [
      {
        id: "r1",
        customerName: "Akosua M.",
        rating: 5,
        comment: "Best braiding service in Accra, very neat work.",
        date: "2026-06-10",
      },
      {
        id: "r2",
        customerName: "Yaw B.",
        rating: 4,
        comment: "Great haircut, friendly staff. Slightly long wait.",
        date: "2026-06-02",
      },
    ],
  },
  {
    id: "2",
    name: "Serenity Spa & Wellness",
    category: "Spa",
    address: "45 Ring Road Central, Accra",
    distanceKm: 2.7,
    rating: 4.9,
    reviewCount: 87,
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    openTime: "10:00",
    closeTime: "20:00",
    services: [
      { id: "s4", name: "Full Body Massage", durationMins: 60, price: 200 },
      { id: "s5", name: "Facial Treatment", durationMins: 50, price: 150 },
      { id: "s6", name: "Hot Stone Therapy", durationMins: 75, price: 280 },
    ],
    reviews: [
      {
        id: "r3",
        customerName: "Linda K.",
        rating: 5,
        comment: "So relaxing, the hot stone massage was amazing.",
        date: "2026-06-15",
      },
    ],
  },
  {
    id: "3",
    name: "Nailed It Studio",
    category: "Nail Studio",
    address: "8 Spintex Road, Accra",
    distanceKm: 3.5,
    rating: 4.6,
    reviewCount: 64,
    imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800",
    openTime: "09:30",
    closeTime: "18:30",
    services: [
      { id: "s7", name: "Gel Manicure", durationMins: 40, price: 90 },
      { id: "s8", name: "Pedicure", durationMins: 45, price: 100 },
      { id: "s9", name: "Nail Art (Custom)", durationMins: 60, price: 130 },
    ],
    reviews: [
      {
        id: "r4",
        customerName: "Esi A.",
        rating: 5,
        comment: "Loved my nail art, very detailed and clean.",
        date: "2026-06-18",
      },
      {
        id: "r5",
        customerName: "Joana T.",
        rating: 4,
        comment: "Good service, slightly pricey but worth it.",
        date: "2026-05-28",
      },
    ],
  },
];

export function getSalonById(id: string): Salon | undefined {
  return mockSalons.find((salon) => salon.id === id);
}