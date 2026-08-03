import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../data/authContext";
import {
    addOwnerService,
    addServiceImage,
    removeServiceImage,
    uploadServicePhoto,
    announceToCustomers,
    blockSlot,
    createManualBooking,
    fetchSalonHours,
    SalonHour,
    updateSalonHours,
    createOwnerProfessional,
    createOwnerPromoCode,
    createOwnerSalon,
    Customer,
    deleteOwnerProfessional,
    deleteOwnerPromoCode,
    deleteOwnerSalon,
    deleteOwnerService,
    updateOwnerPromoCode,
    fetchBlockedSlots,
    fetchOwnerBookings,
    fetchOwnerCustomers,
    fetchOwnerProfessionals,
    fetchOwnerPromoCodes,
    fetchOwnerSalons,
    fetchProfessionalUnavailability,
    fetchLoyaltySettings,
    updateLoyaltySettings,
    markProfessionalUnavailable,
    removeProfessionalUnavailability,
    LoyaltySettings,
    OwnerBooking,
    OwnerSalon,
    Professional,
    PromoCode,
    UnavailabilityBlock,
    unblockSlot,
    updateOwnerSalon,
    updateOwnerService,
    uploadProfessionalPhoto,
    uploadSalonPhoto,
} from "../api/ownerClient";

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getNextDays(count: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DATE_PICKER_DAYS = getNextDays(60);

function DatePickerRow({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (isoDate: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {DATE_PICKER_DAYS.map((date) => {
          const iso = toIsoDate(date);
          const isSelected = iso === selectedDate;
          const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
          return (
            <Pressable
              key={iso}
              style={[styles.datePickerChip, isSelected && styles.datePickerChipSelected]}
              onPress={() => onSelect(iso)}
            >
              <Text style={[styles.datePickerWeekday, isSelected && styles.datePickerTextSelected]}>
                {weekday}
              </Text>
              <Text style={[styles.datePickerDay, isSelected && styles.datePickerTextSelected]}>
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function MySalonScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [salons, setSalons] = useState<OwnerSalon[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSalonForm, setShowSalonForm] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [salonCategory, setSalonCategory] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonOpen, setSalonOpen] = useState("09:00");
  const [salonClose, setSalonClose] = useState("18:00");
  const [submittingSalon, setSubmittingSalon] = useState(false);

  const [serviceFormSalonId, setServiceFormSalonId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [submittingService, setSubmittingService] = useState(false);

  const [editingSalonId, setEditingSalonId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editOpen, setEditOpen] = useState("");
  const [editClose, setEditClose] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Service editing state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editServiceDuration, setEditServiceDuration] = useState("");
  const [editServicePrice, setEditServicePrice] = useState("");
  const [submittingServiceEdit, setSubmittingServiceEdit] = useState(false);
// Promo code state
  const [promoCodes, setPromoCodes] = useState<Record<string, PromoCode[]>>({});
  const [customersSectionSalonId, setCustomersSectionSalonId] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState("");
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [editPromoDiscount, setEditPromoDiscount] = useState("");
  const [editPromoExpiry, setEditPromoExpiry] = useState("");
  const [submittingPromoEdit, setSubmittingPromoEdit] = useState(false);
  const [promoExpiry, setPromoExpiry] = useState("");
  const [submittingPromo, setSubmittingPromo] = useState(false);
 const [customers, setCustomers] = useState<Record<string, Customer[]>>({});
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Professional state
  const [professionals, setProfessionals] = useState<Record<string, Professional[]>>({});
  const [proFormSalonId, setProFormSalonId] = useState<string | null>(null);
  const [proName, setProName] = useState("");
 const [proPhotoUrl, setProPhotoUrl] = useState("");
 const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSalonPhotoId, setUploadingSalonPhotoId] = useState<string | null>(null);
  const [uploadingServicePhotoId, setUploadingServicePhotoId] = useState<string | null>(null);

  // Manual booking state
  const [manualBookingSalonId, setManualBookingSalonId] = useState<string | null>(null);
  const [manualServiceId, setManualServiceId] = useState<string | null>(null);
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualGuestName, setManualGuestName] = useState("");
  const [manualGuestPhone, setManualGuestPhone] = useState("");
  const [submittingManualBooking, setSubmittingManualBooking] = useState(false);
  const [proSelectedServiceIds, setProSelectedServiceIds] = useState<string[]>([]);
  const [submittingPro, setSubmittingPro] = useState(false);

  // Announce state
  const [announceSalonId, setAnnounceSalonId] = useState<string | null>(null);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [sendingAnnounce, setSendingAnnounce] = useState(false);

  async function handleAnnounce(salonId: string) {
    if (!token || !announceTitle.trim() || !announceMessage.trim()) {
      Alert.alert("Missing info", "Please enter a title and message.");
      return;
    }
    setSendingAnnounce(true);
    try {
      const result = await announceToCustomers(salonId, announceTitle.trim(), announceMessage.trim(), token);
      Alert.alert("Sent!", `Announcement sent to ${result.sent} customer${result.sent !== 1 ? "s" : ""}.`);
      setAnnounceSalonId(null);
      setAnnounceTitle("");
      setAnnounceMessage("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not send announcement.");
    } finally {
      setSendingAnnounce(false);
    }
  }

  // Working hours state
  const [hoursSalonId, setHoursSalonId] = useState<string | null>(null);
  const [salonHours, setSalonHours] = useState<SalonHour[]>([]);
  const [editingHours, setEditingHours] = useState<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[]>([]);
  const [savingHours, setSavingHours] = useState(false);

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  async function loadSalonHours(salonId: string) {
    if (!token) return;
    try {
      const data = await fetchSalonHours(salonId, token);
      setSalonHours(data);
      // Build editable state — fill missing days with defaults from salon open/close
      const salon = salons.find((s) => s.id === salonId);
      const defaults = Array.from({ length: 7 }, (_, i) => {
        const found = data.find((h) => h.dayOfWeek === i);
        return {
          dayOfWeek: i,
          openTime: found?.openTime || salon?.openTime || "09:00",
          closeTime: found?.closeTime || salon?.closeTime || "18:00",
          isClosed: found ? found.isClosed === 1 : false,
        };
      });
      setEditingHours(defaults);
    } catch {
      Alert.alert("Error", "Could not load working hours.");
    }
  }

  async function handleSaveHours(salonId: string) {
    if (!token) return;
    setSavingHours(true);
    try {
      await updateSalonHours(salonId, editingHours, token);
      Alert.alert("Saved", "Working hours updated.");
      setHoursSalonId(null);
    } catch {
      Alert.alert("Error", "Could not save hours.");
    } finally {
      setSavingHours(false);
    }
  }

  // Blocked slots state
  const [availabilitySalonId, setAvailabilitySalonId] = useState<string | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [blockedSlots, setBlockedSlots] = useState<{ id: string; time: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  // Professional time-off state
  const [timeOffProfessionalId, setTimeOffProfessionalId] = useState<string | null>(null);
  const [timeOffDate, setTimeOffDate] = useState("");
  const [timeOffBlocks, setTimeOffBlocks] = useState<UnavailabilityBlock[]>([]);
  const [loadingTimeOff, setLoadingTimeOff] = useState(false);
  const [togglingTimeOff, setTogglingTimeOff] = useState<string | null>(null);

  // Loyalty program state
  const [loyaltySalonId, setLoyaltySalonId] = useState<string | null>(null);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyVisits, setLoyaltyVisits] = useState("5");
  const [loyaltyDiscount, setLoyaltyDiscount] = useState("10");
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [savingLoyalty, setSavingLoyalty] = useState(false);

  async function loadData() {
    if (!token) return;
    try {
      const [salonData, bookingData] = await Promise.all([
        fetchOwnerSalons(token),
        fetchOwnerBookings(token),
      ]);
      setSalons(salonData);
      setBookings(bookingData);
      salonData.forEach((s) => {
        loadPromoCodes(s.id);
        loadProfessionals(s.id);
      });
    } catch (err: any) {
      if (err?.status === 403) {
        router.replace({ pathname: "/reverify", params: { role: "owner" } } as any);
        return;
      }
      Alert.alert("Error", "Could not load your salon data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  async function handleCreateSalon() {
    if (!token) return;
    if (!salonName || !salonCategory || !salonAddress) {
      Alert.alert("Missing info", "Please fill in all salon fields.");
      return;
    }
    setSubmittingSalon(true);
    try {
      await createOwnerSalon(
        {
          name: salonName,
          category: salonCategory,
          address: salonAddress,
          openTime: salonOpen,
          closeTime: salonClose,
        },
        token
      );
      setSalonName("");
      setSalonCategory("");
      setSalonAddress("");
      setShowSalonForm(false);
      await loadData();
    } catch {
      Alert.alert("Error", "Could not create salon.");
    } finally {
      setSubmittingSalon(false);
    }
  }

  function startEditing(salon: OwnerSalon) {
    setEditingSalonId(salon.id);
    setEditName(salon.name);
    setEditCategory(salon.category);
    setEditAddress(salon.address);
    setEditOpen(salon.openTime);
    setEditClose(salon.closeTime);
  }

  async function handleSaveEdit(salonId: string) {
    if (!token) return;
    if (!editName || !editCategory || !editAddress) {
      Alert.alert("Missing info", "Please fill in all salon fields.");
      return;
    }
    setSubmittingEdit(true);
    try {
      await updateOwnerSalon(
        salonId,
        {
          name: editName,
          category: editCategory,
          address: editAddress,
          openTime: editOpen,
          closeTime: editClose,
        },
        token
      );
      setEditingSalonId(null);
      await loadData();
    } catch {
      Alert.alert("Error", "Could not update salon.");
    } finally {
      setSubmittingEdit(false);
    }
  }

  function handleDeleteSalon(salonId: string, salonName: string) {
    Alert.alert(
      "Delete Salon",
      `Are you sure you want to delete "${salonName}"? This also removes its services and bookings. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            try {
              await deleteOwnerSalon(salonId, token);
              await loadData();
            } catch {
              Alert.alert("Error", "Could not delete salon.");
            }
          },
        },
      ]
    );
  }

  async function handleAddService(salonId: string) {
    if (!token) return;
    const duration = parseInt(serviceDuration, 10);
    const price = parseFloat(servicePrice);
    if (!serviceName || !duration || !price) {
      Alert.alert("Missing info", "Please fill in all service fields.");
      return;
    }
    setSubmittingService(true);
    try {
      await addOwnerService(
        salonId,
        { name: serviceName, durationMins: duration, price, category: serviceCategory || undefined },
        token
      );
      setServiceName("");
      setServiceDuration("");
      setServicePrice("");
      setServiceCategory("");
      setServiceFormSalonId(null);
      await loadData();
    } catch {
      Alert.alert("Error", "Could not add service.");
    } finally {
      setSubmittingService(false);
    }
  }

  async function handleDeleteService(serviceId: string) {
    if (!token) return;
    try {
      await deleteOwnerService(serviceId, token);
      await loadData();
    } catch {
      Alert.alert("Error", "Could not delete service.");
    }
  }

  function startEditingService(service: {
    id: string;
    name: string;
    durationMins: number;
    price: number;
  }) {
    setEditingServiceId(service.id);
    setEditServiceName(service.name);
    setEditServiceDuration(String(service.durationMins));
    setEditServicePrice(String(service.price));
  }

  async function handleSaveServiceEdit(serviceId: string) {
    if (!token) return;
    const duration = parseInt(editServiceDuration, 10);
    const price = parseFloat(editServicePrice);
    if (!editServiceName || !duration || !price) {
      Alert.alert("Missing info", "Please fill in all service fields.");
      return;
    }
    setSubmittingServiceEdit(true);
    try {
      await updateOwnerService(
        serviceId,
        { name: editServiceName, durationMins: duration, price },
        token
      );
      setEditingServiceId(null);
      await loadData();
    } catch {
      Alert.alert("Error", "Could not update service.");
    } finally {
      setSubmittingServiceEdit(false);
    }
  }
  async function loadPromoCodes(salonId: string) {
    if (!token) return;
    try {
      const codes = await fetchOwnerPromoCodes(salonId, token);
      setPromoCodes((prev) => ({ ...prev, [salonId]: codes }));
    } catch {
      Alert.alert("Error", "Could not load promo codes.");
    }
  }

  async function loadCustomers(salonId: string) {
    if (!token) return;
    try {
      const data = await fetchOwnerCustomers(salonId, token);
      setCustomers((prev) => ({ ...prev, [salonId]: data }));
    } catch {
      // Silently fail - customer list is only needed when creating a targeted promo
    }
  }
  async function loadProfessionals(salonId: string) {
    if (!token) return;
    try {
      const data = await fetchOwnerProfessionals(salonId, token);
      setProfessionals((prev) => ({ ...prev, [salonId]: data }));
    } catch {
      Alert.alert("Error", "Could not load professionals.");
    }
  }

  function toggleProServiceSelection(serviceId: string) {
    setProSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }
  
  async function handlePickSalonPhoto(salon: OwnerSalon) {
    if (!token) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access to upload a picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingSalonPhotoId(salon.id);
    try {
      const photoUrl = await uploadSalonPhoto(result.assets[0].uri, token);
      await updateOwnerSalon(
        salon.id,
        {
          name: salon.name,
          category: salon.category,
          address: salon.address,
          openTime: salon.openTime,
          closeTime: salon.closeTime,
          imageUrl: photoUrl,
        },
        token
      );
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not upload photo.");
    } finally {
      setUploadingSalonPhotoId(null);
    }
  }

  async function handlePickServicePhoto(serviceId: string, existingCount: number) {
    if (!token) return;
    if (existingCount >= 3) {
      Alert.alert("Limit reached", "You can add up to 3 photos per service.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access to upload a picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingServicePhotoId(serviceId);
    try {
      const photoUrl = await uploadServicePhoto(result.assets[0].uri, token);
      await addServiceImage(serviceId, photoUrl, token);
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not upload photo.");
    } finally {
      setUploadingServicePhotoId(null);
    }
  }

  async function handleRemoveServicePhoto(serviceId: string, imageId: string) {
    if (!token) return;
    try {
      await removeServiceImage(serviceId, imageId, token);
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not remove photo.");
    }
  }

  async function handlePickProfessionalPhoto() {
    if (!token) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access to upload a picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    try {
      const photoUrl = await uploadProfessionalPhoto(result.assets[0].uri, token);
      setProPhotoUrl(photoUrl);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleCreateProfessional(salonId: string) {
    if (!token) return;
    if (!proName || proSelectedServiceIds.length === 0) {
      Alert.alert("Missing info", "Please enter a name and select at least one service.");
      return;
    }
    setSubmittingPro(true);
    try {
      await createOwnerProfessional(
        salonId,
        {
          name: proName,
          photoUrl: proPhotoUrl || undefined,
          serviceIds: proSelectedServiceIds,
        },
        token
      );
      setProName("");
      setProPhotoUrl("");
      setProSelectedServiceIds([]);
      setProFormSalonId(null);
      await loadProfessionals(salonId);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not add professional.");
    } finally {
      setSubmittingPro(false);
    }
  }

  async function handleDeleteProfessional(professionalId: string, salonId: string) {
    if (!token) return;
    try {
      await deleteOwnerProfessional(professionalId, token);
      await loadProfessionals(salonId);
    } catch {
      Alert.alert("Error", "Could not delete professional.");
    }
  }

  function toggleCustomerSelection(userId: string) {
    setSelectedCustomerIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  function getActivePromoForCustomer(salonId: string, customerId: string) {
    const now = new Date();
    return (
      (promoCodes[salonId] || []).find(
        (promo) =>
          promo.recipients.some((r) => r.id === customerId) &&
          (!promo.expiresAt || new Date(promo.expiresAt) > now)
      ) || null
    );
  }

  async function handleCreatePromoCode(salonId: string) {
    if (!token) return;
    const discount = parseInt(promoDiscount, 10);
    if (!discount) {
      Alert.alert("Missing info", "Please enter a discount percent.");
      return;
    }
    if (selectedCustomerIds.length === 0) {
      Alert.alert("Select customers", "Please select at least one customer to give a promo to.");
      return;
    }
    let expiresAtIso: string | undefined;
    if (promoExpiry) {
      const parsed = new Date(promoExpiry);
      if (isNaN(parsed.getTime())) {
        Alert.alert("Invalid date", "Please enter the expiry date as YYYY-MM-DD.");
        return;
      }
      expiresAtIso = parsed.toISOString();
    }
    setSubmittingPromo(true);
    try {
      await createOwnerPromoCode(
        salonId,
        {
          discountPercent: discount,
          expiresAt: expiresAtIso,
          userIds: selectedCustomerIds,
        },
        token
      );
      setPromoDiscount("");
      setPromoExpiry("");
      setSelectedCustomerIds([]);
      await loadPromoCodes(salonId);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not give promo.");
    } finally {
      setSubmittingPromo(false);
    }
  }

  async function handleRemoveCustomerPromo(customerId: string, salonId: string) {
    const promo = getActivePromoForCustomer(salonId, customerId);
    if (!promo) return;
    await handleDeletePromoCode(promo.id, salonId);
  }

  function startEditingPromo(promo: PromoCode) {
    setEditingPromoId(promo.id);
    setEditPromoDiscount(String(promo.discountPercent));
    setEditPromoExpiry(promo.expiresAt ? promo.expiresAt.slice(0, 10) : "");
  }

  async function handleSavePromoEdit(promoId: string, salonId: string) {
    if (!token) return;
    const discount = parseInt(editPromoDiscount, 10);
    if (!discount) {
      Alert.alert("Missing info", "Please enter a discount percent.");
      return;
    }
    let expiresAtIso: string | undefined;
    if (editPromoExpiry) {
      const parsed = new Date(editPromoExpiry);
      if (isNaN(parsed.getTime())) {
        Alert.alert("Invalid date", "Please enter the expiry date as YYYY-MM-DD.");
        return;
      }
      expiresAtIso = parsed.toISOString();
    }
    setSubmittingPromoEdit(true);
    try {
      await updateOwnerPromoCode(
        promoId,
        { discountPercent: discount, expiresAt: expiresAtIso },
        token
      );
      setEditingPromoId(null);
      await loadPromoCodes(salonId);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not update promo.");
    } finally {
      setSubmittingPromoEdit(false);
    }
  }

  async function handleCreateManualBooking(salon: OwnerSalon) {
    if (!token || !manualServiceId) return;
    if (!manualDate || !manualTime || !manualGuestName) {
      Alert.alert("Missing info", "Please fill in the date, time, and customer name.");
      return;
    }

    const service = salon.services.find((s) => s.id === manualServiceId);
    if (!service) return;

    const parsedDate = new Date(manualDate);
    if (isNaN(parsedDate.getTime())) {
      Alert.alert("Invalid date", "Please enter the date as YYYY-MM-DD.");
      return;
    }
    const dateLabel = parsedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    setSubmittingManualBooking(true);
    try {
      await createManualBooking(
        salon.id,
        {
          serviceId: service.id,
          serviceName: service.name,
          date: manualDate,
          dateLabel,
          time: manualTime,
          price: service.price,
          guestName: manualGuestName,
          guestPhone: manualGuestPhone || undefined,
        },
        token
      );
      setManualServiceId(null);
      setManualDate("");
      setManualTime("");
      setManualGuestName("");
      setManualGuestPhone("");
      setManualBookingSalonId(null);
      await loadData();
      Alert.alert("Success", "Booking added.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not create booking.");
    } finally {
      setSubmittingManualBooking(false);
    }
  }
  
  async function handleDeletePromoCode(promoCodeId: string, salonId: string) {
    if (!token) return;
    try {
      await deleteOwnerPromoCode(promoCodeId, token);
      await loadPromoCodes(salonId);
    } catch {
      Alert.alert("Error", "Could not delete promo code.");
    }
  }

  function generateTimeSlots(openTime: string, closeTime: string): string[] {
    const slots: string[] = [];
    const [startH, startM] = openTime.split(":").map(Number);
    const [endH, endM] = closeTime.split(":").map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (current < end) {
      const h = Math.floor(current / 60).toString().padStart(2, "0");
      const m = (current % 60).toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
      current += 30;
    }
    return slots;
  }

  async function handleLoadBlockedSlots(salonId: string, date: string) {
    if (!token || !date) return;
    setLoadingSlots(true);
    try {
      const data = await fetchBlockedSlots(salonId, date, token);
      setBlockedSlots(data);
    } catch {
      Alert.alert("Error", "Could not load blocked slots.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleToggleSlot(salonId: string, time: string) {
    if (!token || !availabilityDate) return;
    setTogglingSlot(time);
    try {
      const isBlocked = blockedSlots.some((s) => s.time === time);
      if (isBlocked) {
        await unblockSlot(salonId, availabilityDate, time, token);
        setBlockedSlots((prev) => prev.filter((s) => s.time !== time));
      } else {
        const result = await blockSlot(salonId, availabilityDate, time, token);
        setBlockedSlots((prev) => [...prev, result]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not update slot.");
    } finally {
      setTogglingSlot(null);
    }
  }

  async function handleLoadTimeOff(professionalId: string, date: string) {
    if (!token || !date) return;
    setLoadingTimeOff(true);
    try {
      const data = await fetchProfessionalUnavailability(professionalId, date, token);
      setTimeOffBlocks(data);
    } catch {
      Alert.alert("Error", "Could not load time off.");
    } finally {
      setLoadingTimeOff(false);
    }
  }

  async function handleToggleTimeOffSlot(professionalId: string, time: string) {
    if (!token || !timeOffDate) return;
    setTogglingTimeOff(time);
    try {
      const existing = timeOffBlocks.find((b) => b.time === time);
      if (existing) {
        await removeProfessionalUnavailability(professionalId, existing.id, token);
        setTimeOffBlocks((prev) => prev.filter((b) => b.id !== existing.id));
      } else {
        const result = await markProfessionalUnavailable(professionalId, { date: timeOffDate, time }, token);
        setTimeOffBlocks((prev) => [...prev, result]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not update time off.");
    } finally {
      setTogglingTimeOff(null);
    }
  }

  async function handleToggleWholeDayOff(professionalId: string) {
    if (!token || !timeOffDate) return;
    setTogglingTimeOff("WHOLE_DAY");
    try {
      const wholeDayBlock = timeOffBlocks.find((b) => !b.time);
      if (wholeDayBlock) {
        await removeProfessionalUnavailability(professionalId, wholeDayBlock.id, token);
        setTimeOffBlocks((prev) => prev.filter((b) => b.id !== wholeDayBlock.id));
      } else {
        const result = await markProfessionalUnavailable(professionalId, { date: timeOffDate }, token);
        setTimeOffBlocks((prev) => [...prev, result]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not update time off.");
    } finally {
      setTogglingTimeOff(null);
    }
  }

  async function handleLoadLoyalty(salonId: string) {
    if (!token) return;
    setLoadingLoyalty(true);
    try {
      const data = await fetchLoyaltySettings(salonId, token);
      setLoyaltyEnabled(!!data.enabled);
      setLoyaltyVisits(String(data.visitsRequired));
      setLoyaltyDiscount(String(data.discountPercent));
    } catch {
      Alert.alert("Error", "Could not load loyalty program settings.");
    } finally {
      setLoadingLoyalty(false);
    }
  }

  async function handleSaveLoyalty(salonId: string) {
    if (!token) return;
    const visitsRequired = parseInt(loyaltyVisits, 10);
    const discountPercent = loyaltyDiscount.trim() === "" ? NaN : parseFloat(loyaltyDiscount);
    if (!visitsRequired || visitsRequired < 2) {
      Alert.alert("Invalid value", "Visits required must be at least 2.");
      return;
    }
    if (Number.isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      Alert.alert(
        "Invalid value",
        "Discount must be between 0 and 100 (0 = no discount, badges only)."
      );
      return;
    }
    setSavingLoyalty(true);
    try {
      await updateLoyaltySettings(salonId, { enabled: loyaltyEnabled, visitsRequired, discountPercent }, token);
      Alert.alert("Saved", "Loyalty program settings updated.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not save loyalty program settings.");
    } finally {
      setSavingLoyalty(false);
    }
  }

 const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.loading} size="large" color="#C1683C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "My Salon" }} />
     <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsCard}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>GHS {totalRevenue}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Salons</Text>

        {salons.map((salon) => (
          <View key={salon.id} style={styles.salonCard}>
            {editingSalonId === salon.id ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.formTitle}>Edit Salon</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Salon name"
                  placeholderTextColor="#A89D8F"
                  value={editName}
                  onChangeText={setEditName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Category"
                  placeholderTextColor="#A89D8F"
                  value={editCategory}
                  onChangeText={setEditCategory}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Address"
                  placeholderTextColor="#A89D8F"
                  value={editAddress}
                  onChangeText={setEditAddress}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Open time"
                  placeholderTextColor="#A89D8F"
                  value={editOpen}
                  onChangeText={setEditOpen}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Close time"
                  placeholderTextColor="#A89D8F"
                  value={editClose}
                  onChangeText={setEditClose}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    style={[styles.smallButton, { flex: 1 }]}
                    onPress={() => handleSaveEdit(salon.id)}
                    disabled={submittingEdit}
                  >
                    <Text style={styles.smallButtonText}>
                      {submittingEdit ? "Saving..." : "Save Changes"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.smallButton, styles.cancelButton, { flex: 1 }]}
                    onPress={() => setEditingSalonId(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
              <Pressable
                  style={styles.salonPhotoWrapper}
                  onPress={() => handlePickSalonPhoto(salon)}
                  disabled={uploadingSalonPhotoId === salon.id}
                >
                  {uploadingSalonPhotoId === salon.id ? (
                    <View style={styles.salonPhotoPlaceholder}>
                      <ActivityIndicator color="#C1683C" />
                    </View>
                  ) : salon.imageUrl ? (
                    <Image source={{ uri: salon.imageUrl }} style={styles.salonPhoto} />
                  ) : (
                    <View style={styles.salonPhotoPlaceholder}>
                      <Text style={styles.salonPhotoPlaceholderText}>+ Add Salon Photo</Text>
                    </View>
                  )}
                  <View style={styles.salonPhotoOverlay}>
                    <Text style={styles.salonPhotoOverlayText}>
                      {salon.imageUrl ? "Change Photo" : "Add Photo"}
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.salonHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.salonName}>{salon.name}</Text>
                    <Text style={styles.salonMeta}>
                      {salon.category} · {salon.address}
                    </Text>
                    <Text style={styles.salonMeta}>
                      Open {salon.openTime} – {salon.closeTime}
                    </Text>
                  </View>
                </View>

                <View style={styles.salonActionsRow}>
                  <Pressable onPress={() => startEditing(salon)}>
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteSalon(salon.id, salon.name)}
                  >
                    <Text style={styles.deleteText}>Delete Salon</Text>
                  </Pressable>
                </View>

                <Text style={styles.servicesLabel}>Services</Text>
                {salon.services.length === 0 && (
                  <Text style={styles.noServices}>No services yet.</Text>
                )}
                {salon.services.map((service) =>
                  editingServiceId === service.id ? (
                    <View key={service.id} style={styles.serviceEditForm}>
                      <TextInput
                        style={styles.input}
                        placeholder="Service name"
                        placeholderTextColor="#A89D8F"
                        value={editServiceName}
                        onChangeText={setEditServiceName}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Duration (minutes)"
                        placeholderTextColor="#A89D8F"
                        keyboardType="numeric"
                        value={editServiceDuration}
                        onChangeText={setEditServiceDuration}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Price (GHS)"
                        placeholderTextColor="#A89D8F"
                        keyboardType="numeric"
                        value={editServicePrice}
                        onChangeText={setEditServicePrice}
                      />
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Pressable
                          style={[styles.smallButton, { flex: 1 }]}
                          onPress={() => handleSaveServiceEdit(service.id)}
                          disabled={submittingServiceEdit}
                        >
                          <Text style={styles.smallButtonText}>
                            {submittingServiceEdit ? "Saving..." : "Save"}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.smallButton, styles.cancelButton, { flex: 1 }]}
                          onPress={() => setEditingServiceId(null)}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View key={service.id} style={styles.serviceRowWrapper}>
                      <View style={styles.serviceRow}>
                        <View style={styles.serviceInfo}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            {service.category ? (
                              <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>{service.category}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.serviceMeta}>
                            {service.durationMins} min · GHS {service.price}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 14 }}>
                          <Pressable onPress={() => startEditingService(service)}>
                            <Text style={styles.editText}>Edit</Text>
                          </Pressable>
                          <Pressable onPress={() => handleDeleteService(service.id)}>
                            <Text style={styles.deleteText}>Remove</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.servicePhotosRow}>
                        {service.images.map((image) => (
                          <View key={image.id} style={styles.servicePhotoThumbWrap}>
                            <Image source={{ uri: image.url }} style={styles.servicePhotoThumb} />
                            <Pressable
                              style={styles.servicePhotoRemoveBtn}
                              onPress={() =>
                                Alert.alert("Remove photo", "Remove this photo from the service?", [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Remove",
                                    style: "destructive",
                                    onPress: () => handleRemoveServicePhoto(service.id, image.id),
                                  },
                                ])
                              }
                            >
                              <Text style={styles.servicePhotoRemoveBtnText}>×</Text>
                            </Pressable>
                          </View>
                        ))}
                        {service.images.length < 3 &&
                          (uploadingServicePhotoId === service.id ? (
                            <View style={styles.servicePhotoAddBtn}>
                              <ActivityIndicator size="small" color={CLAY} />
                            </View>
                          ) : (
                            <Pressable
                              style={styles.servicePhotoAddBtn}
                              onPress={() => handlePickServicePhoto(service.id, service.images.length)}
                            >
                              <Text style={styles.servicePhotoAddBtnText}>+ Photo</Text>
                            </Pressable>
                          ))}
                      </View>
                    </View>
                  )
                )}

                {serviceFormSalonId === salon.id ? (
                  <View style={styles.serviceForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Service name"
                      placeholderTextColor="#A89D8F"
                      value={serviceName}
                      onChangeText={setServiceName}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Duration (minutes)"
                      placeholderTextColor="#A89D8F"
                      keyboardType="numeric"
                      value={serviceDuration}
                      onChangeText={setServiceDuration}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Price (GHS)"
                      placeholderTextColor="#A89D8F"
                      keyboardType="numeric"
                      value={servicePrice}
                      onChangeText={setServicePrice}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Category (e.g. Hair, Nails) — optional"
                      placeholderTextColor="#A89D8F"
                      value={serviceCategory}
                      onChangeText={setServiceCategory}
                    />
                    <Pressable
                      style={[
                        styles.smallButton,
                        submittingService && styles.buttonDisabled,
                      ]}
                      onPress={() => handleAddService(salon.id)}
                      disabled={submittingService}
                    >
                      <Text style={styles.smallButtonText}>
                        {submittingService ? "Adding..." : "Add Service"}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.addServiceLink}
                    onPress={() => setServiceFormSalonId(salon.id)}
                  >
                    <Text style={styles.addServiceLinkText}>+ Add a service</Text>
                  </Pressable>
                )}

<Text style={styles.servicesLabel}>Walk-in / Phone Booking</Text>
                {manualBookingSalonId === salon.id ? (
                  <View style={styles.serviceForm}>
                    <Text style={styles.promoTargetLabel}>Select a service</Text>
                    {salon.services.length === 0 ? (
                      <Text style={styles.noServices}>Add a service to this salon first.</Text>
                    ) : (
                      salon.services.map((service) => {
                        const isSelected = manualServiceId === service.id;
                        return (
                          <Pressable
                            key={service.id}
                            style={styles.customerRow}
                            onPress={() => setManualServiceId(service.id)}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                isSelected && styles.checkboxSelected,
                              ]}
                            >
                              {isSelected && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.customerName}>
                              {service.name} · GHS {service.price}
                            </Text>
                          </Pressable>
                        );
                      })
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder="Date (YYYY-MM-DD)"
                      placeholderTextColor="#A89D8F"
                      value={manualDate}
                      onChangeText={setManualDate}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Time (e.g. 14:30)"
                      placeholderTextColor="#A89D8F"
                      value={manualTime}
                      onChangeText={setManualTime}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Customer's name"
                      placeholderTextColor="#A89D8F"
                      value={manualGuestName}
                      onChangeText={setManualGuestName}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Customer's phone (optional)"
                      placeholderTextColor="#A89D8F"
                      value={manualGuestPhone}
                      onChangeText={setManualGuestPhone}
                      keyboardType="phone-pad"
                    />
                    <Pressable
                      style={[
                        styles.smallButton,
                        submittingManualBooking && styles.buttonDisabled,
                      ]}
                      onPress={() => handleCreateManualBooking(salon)}
                      disabled={submittingManualBooking}
                    >
                      <Text style={styles.smallButtonText}>
                        {submittingManualBooking ? "Booking..." : "Add Booking"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setManualBookingSalonId(null)}>
                      <Text style={[styles.cancelButtonText, { textAlign: "center", marginTop: 4 }]}>
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.addServiceLink}
                    onPress={() => setManualBookingSalonId(salon.id)}
                  >
                    <Text style={styles.addServiceLinkText}>
                      + Add a booking for a walk-in customer
                    </Text>
                  </Pressable>
                )}

                <Text style={styles.servicesLabel}>Professionals</Text>
                {(professionals[salon.id] || []).map((pro) => (
                  <View key={pro.id}>
                    <View style={styles.serviceRow}>
                      {pro.photoUrl ? (
                        <Image source={{ uri: pro.photoUrl }} style={styles.proThumbnail} />
                      ) : (
                        <View style={styles.proThumbnailPlaceholder}>
                          <Text style={styles.proThumbnailInitial}>
                            {pro.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{pro.name}</Text>
                        <Text style={styles.serviceMeta}>
                          {pro.services.map((s) => s.name).join(", ") || "No services assigned"}
                        </Text>
                        {pro.userId ? (
                          <Text style={styles.promoBadge}>✓ Account claimed</Text>
                        ) : pro.claimCode ? (
                          <Text style={styles.serviceMeta}>
                            Claim code: <Text style={{ fontFamily: "Manrope_700Bold" }}>{pro.claimCode}</Text>
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        onPress={() => handleDeleteProfessional(pro.id, salon.id)}
                      >
                        <Text style={styles.deleteText}>Remove</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      style={styles.addServiceLink}
                      onPress={() => {
                        if (timeOffProfessionalId === pro.id) {
                          setTimeOffProfessionalId(null);
                        } else {
                          setTimeOffProfessionalId(pro.id);
                          setTimeOffDate("");
                          setTimeOffBlocks([]);
                        }
                      }}
                    >
                      <Text style={styles.addServiceLinkText}>
                        {timeOffProfessionalId === pro.id ? "▲ Hide Time Off" : "🚫 Time Off"}
                      </Text>
                    </Pressable>

                    {timeOffProfessionalId === pro.id && (
                      <View style={styles.serviceForm}>
                        <Text style={styles.promoTargetLabel}>Mark {pro.name} unavailable</Text>
                        <DatePickerRow
                          selectedDate={timeOffDate}
                          onSelect={(iso) => {
                            setTimeOffDate(iso);
                            handleLoadTimeOff(pro.id, iso);
                          }}
                        />
                        {loadingTimeOff && <ActivityIndicator color="#C1683C" />}

                        {timeOffDate !== "" && !loadingTimeOff && (
                          <>
                            <Pressable
                              style={[
                                styles.slotChip,
                                { alignSelf: "flex-start", marginTop: 10 },
                                timeOffBlocks.some((b) => !b.time) && styles.slotChipBlocked,
                              ]}
                              onPress={() => handleToggleWholeDayOff(pro.id)}
                              disabled={!!togglingTimeOff}
                            >
                              <Text
                                style={[
                                  styles.slotChipText,
                                  timeOffBlocks.some((b) => !b.time) && styles.slotChipTextBlocked,
                                ]}
                              >
                                {togglingTimeOff === "WHOLE_DAY" ? "..." : "Whole day off"}
                              </Text>
                            </Pressable>

                            {!timeOffBlocks.some((b) => !b.time) && (
                              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                                {generateTimeSlots(salon.openTime, salon.closeTime).map((time) => {
                                  const isBlocked = timeOffBlocks.some((b) => b.time === time);
                                  const isToggling = togglingTimeOff === time;
                                  return (
                                    <Pressable
                                      key={time}
                                      style={[styles.slotChip, isBlocked && styles.slotChipBlocked]}
                                      onPress={() => handleToggleTimeOffSlot(pro.id, time)}
                                      disabled={!!togglingTimeOff}
                                    >
                                      <Text style={[styles.slotChipText, isBlocked && styles.slotChipTextBlocked]}>
                                        {isToggling ? "..." : time}
                                      </Text>
                                    </Pressable>
                                  );
                                })}
                              </View>
                            )}
                          </>
                        )}
                        <Text style={styles.slotHint}>
                          Tap "Whole day off" to block the entire day, or tap individual times. Tap again to undo.
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                {proFormSalonId === salon.id ? (
                  <View style={styles.serviceForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Professional's name"
                      placeholderTextColor="#A89D8F"
                      value={proName}
                      onChangeText={setProName}
                    />
                    <Pressable
                      style={styles.photoPickerButton}
                      onPress={handlePickProfessionalPhoto}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <ActivityIndicator color="#C1683C" />
                      ) : proPhotoUrl ? (
                        <Image source={{ uri: proPhotoUrl }} style={styles.photoPreview} />
                      ) : (
                        <Text style={styles.photoPickerText}>+ Add a Photo</Text>
                      )}
                    </Pressable>
                    <Text style={styles.promoTargetLabel}>
                      Services this person performs
                    </Text>
                    {salon.services.length === 0 ? (
                      <Text style={styles.noServices}>
                        Add a service to this salon first.
                      </Text>
                    ) : (
                      salon.services.map((service) => {
                        const isSelected = proSelectedServiceIds.includes(service.id);
                        return (
                          <Pressable
                            key={service.id}
                            style={styles.customerRow}
                            onPress={() => toggleProServiceSelection(service.id)}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                isSelected && styles.checkboxSelected,
                              ]}
                            >
                              {isSelected && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.customerName}>{service.name}</Text>
                          </Pressable>
                        );
                      })
                    )}
                    <Pressable
                      style={[
                        styles.smallButton,
                        submittingPro && styles.buttonDisabled,
                      ]}
                      onPress={() => handleCreateProfessional(salon.id)}
                      disabled={submittingPro}
                    >
                      <Text style={styles.smallButtonText}>
                        {submittingPro ? "Adding..." : "Add Professional"}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.addServiceLink}
                    onPress={() => {
                      setProFormSalonId(salon.id);
                      setProSelectedServiceIds([]);
                    }}
                  >
                    <Text style={styles.addServiceLinkText}>+ Add a professional</Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.addServiceLink}
                  onPress={() => {
                    if (customersSectionSalonId === salon.id) {
                      setCustomersSectionSalonId(null);
                    } else {
                      setCustomersSectionSalonId(salon.id);
                      setSelectedCustomerIds([]);
                      loadCustomers(salon.id);
                      loadPromoCodes(salon.id);
                    }
                  }}
                >
                  <Text style={styles.addServiceLinkText}>
                    {customersSectionSalonId === salon.id ? "▲ Hide Customers" : "👥 Customers & Promos"}
                  </Text>
                </Pressable>

                {customersSectionSalonId === salon.id && (
                  <View style={styles.serviceForm}>
                    <Text style={styles.promoTargetLabel}>
                      Select customers, then give them a discount — it's applied automatically
                      the next time they book here. No code to share.
                    </Text>
                    {(customers[salon.id] || []).length === 0 ? (
                      <Text style={styles.noServices}>
                        No customers have booked at this salon yet.
                      </Text>
                    ) : (
                      (customers[salon.id] || []).map((customer) => {
                        const isSelected = selectedCustomerIds.includes(customer.id);
                        const activePromo = getActivePromoForCustomer(salon.id, customer.id);
                        const isEditingThisPromo =
                          activePromo && editingPromoId === activePromo.id;
                        return (
                          <View key={customer.id}>
                            <Pressable
                              style={styles.customerRow}
                              onPress={() => toggleCustomerSelection(customer.id)}
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  isSelected && styles.checkboxSelected,
                                ]}
                              >
                                {isSelected && <Text style={styles.checkmark}>✓</Text>}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.customerName}>{customer.name}</Text>
                                <Text style={styles.customerPhone}>
                                  {customer.phone} · {customer.bookingCount} booking
                                  {customer.bookingCount !== 1 ? "s" : ""}
                                </Text>
                              </View>
                              {activePromo && !isEditingThisPromo && (
                                <View
                                  style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
                                >
                                  <Text style={styles.promoBadge}>
                                    🎁 {activePromo.discountPercent}% off
                                  </Text>
                                  <Pressable onPress={() => startEditingPromo(activePromo)}>
                                    <Text style={styles.editText}>Edit</Text>
                                  </Pressable>
                                  <Pressable
                                    onPress={() =>
                                      handleRemoveCustomerPromo(customer.id, salon.id)
                                    }
                                  >
                                    <Text style={styles.deleteText}>Remove</Text>
                                  </Pressable>
                                </View>
                              )}
                            </Pressable>

                            {isEditingThisPromo && (
                              <View style={styles.serviceForm}>
                                <TextInput
                                  style={styles.input}
                                  placeholder="Discount percent (e.g. 20)"
                                  placeholderTextColor="#A89D8F"
                                  keyboardType="numeric"
                                  value={editPromoDiscount}
                                  onChangeText={setEditPromoDiscount}
                                />
                                <TextInput
                                  style={styles.input}
                                  placeholder="Expiry date (YYYY-MM-DD, optional)"
                                  placeholderTextColor="#A89D8F"
                                  value={editPromoExpiry}
                                  onChangeText={setEditPromoExpiry}
                                />
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                  <Pressable
                                    style={[
                                      styles.smallButton,
                                      { flex: 1 },
                                      submittingPromoEdit && styles.buttonDisabled,
                                    ]}
                                    onPress={() => handleSavePromoEdit(activePromo!.id, salon.id)}
                                    disabled={submittingPromoEdit}
                                  >
                                    <Text style={styles.smallButtonText}>
                                      {submittingPromoEdit ? "Saving..." : "Save"}
                                    </Text>
                                  </Pressable>
                                  <Pressable
                                    style={[styles.smallButton, styles.cancelButton, { flex: 1 }]}
                                    onPress={() => setEditingPromoId(null)}
                                  >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                  </Pressable>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}

                    {selectedCustomerIds.length > 0 && (
                      <>
                        <TextInput
                          style={styles.input}
                          placeholder="Discount percent (e.g. 20)"
                          placeholderTextColor="#A89D8F"
                          keyboardType="numeric"
                          value={promoDiscount}
                          onChangeText={setPromoDiscount}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Expiry date (YYYY-MM-DD, optional)"
                          placeholderTextColor="#A89D8F"
                          value={promoExpiry}
                          onChangeText={setPromoExpiry}
                        />
                        <Pressable
                          style={[
                            styles.smallButton,
                            submittingPromo && styles.buttonDisabled,
                          ]}
                          onPress={() => handleCreatePromoCode(salon.id)}
                          disabled={submittingPromo}
                        >
                          <Text style={styles.smallButtonText}>
                            {submittingPromo
                              ? "Giving Promo..."
                              : `Give ${selectedCustomerIds.length} Customer${
                                  selectedCustomerIds.length > 1 ? "s" : ""
                                } a Promo`}
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Announce to Customers */}
            <Pressable
              style={styles.addServiceLink}
              onPress={() => {
                if (announceSalonId === salon.id) {
                  setAnnounceSalonId(null);
                } else {
                  setAnnounceSalonId(salon.id);
                  setAnnounceTitle("");
                  setAnnounceMessage("");
                }
              }}
            >
              <Text style={styles.addServiceLinkText}>
                {announceSalonId === salon.id ? "▲ Hide Announcement" : "📢 Announce to Customers"}
              </Text>
            </Pressable>

            {announceSalonId === salon.id && (
              <View style={styles.serviceForm}>
                <Text style={styles.promoTargetLabel}>Send a message to all your customers</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Title (e.g. Closed this weekend)"
                  placeholderTextColor="#A89D8F"
                  value={announceTitle}
                  onChangeText={setAnnounceTitle}
                />
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                  placeholder="Message..."
                  placeholderTextColor="#A89D8F"
                  value={announceMessage}
                  onChangeText={setAnnounceMessage}
                  multiline
                />
                <Pressable
                  style={[styles.smallButton, sendingAnnounce && styles.buttonDisabled]}
                  onPress={() => handleAnnounce(salon.id)}
                  disabled={sendingAnnounce}
                >
                  <Text style={styles.smallButtonText}>{sendingAnnounce ? "Sending..." : "Send Announcement"}</Text>
                </Pressable>
              </View>
            )}

            {/* Working Hours */}
            <Pressable
              style={styles.addServiceLink}
              onPress={() => {
                if (hoursSalonId === salon.id) {
                  setHoursSalonId(null);
                } else {
                  setHoursSalonId(salon.id);
                  loadSalonHours(salon.id);
                }
              }}
            >
              <Text style={styles.addServiceLinkText}>
                {hoursSalonId === salon.id ? "▲ Hide Working Hours" : "🕐 Working Hours"}
              </Text>
            </Pressable>

            {hoursSalonId === salon.id && (
              <View style={styles.serviceForm}>
                <Text style={styles.promoTargetLabel}>Set open/close times per day</Text>
                {editingHours.map((h) => (
                  <View key={h.dayOfWeek} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <Text style={[styles.promoTargetLabel, { marginBottom: 0 }]}>{DAY_NAMES[h.dayOfWeek]}</Text>
                      <Pressable
                        onPress={() =>
                          setEditingHours((prev) =>
                            prev.map((d) => d.dayOfWeek === h.dayOfWeek ? { ...d, isClosed: !d.isClosed } : d)
                          )
                        }
                        style={[styles.smallButton, { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: h.isClosed ? "#888" : "#C1683C" }]}
                      >
                        <Text style={styles.smallButtonText}>{h.isClosed ? "Closed" : "Open"}</Text>
                      </Pressable>
                    </View>
                    {!h.isClosed && (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TextInput
                          style={[styles.input, { flex: 1, marginBottom: 0 }]}
                          placeholder="Open (09:00)"
                          placeholderTextColor="#A89D8F"
                          value={h.openTime}
                          onChangeText={(v) =>
                            setEditingHours((prev) =>
                              prev.map((d) => d.dayOfWeek === h.dayOfWeek ? { ...d, openTime: v } : d)
                            )
                          }
                        />
                        <TextInput
                          style={[styles.input, { flex: 1, marginBottom: 0 }]}
                          placeholder="Close (18:00)"
                          placeholderTextColor="#A89D8F"
                          value={h.closeTime}
                          onChangeText={(v) =>
                            setEditingHours((prev) =>
                              prev.map((d) => d.dayOfWeek === h.dayOfWeek ? { ...d, closeTime: v } : d)
                            )
                          }
                        />
                      </View>
                    )}
                  </View>
                ))}
                <Pressable
                  style={[styles.smallButton, savingHours && styles.buttonDisabled]}
                  onPress={() => handleSaveHours(salon.id)}
                  disabled={savingHours}
                >
                  <Text style={styles.smallButtonText}>{savingHours ? "Saving..." : "Save Hours"}</Text>
                </Pressable>
              </View>
            )}

            {/* Manage Availability */}
            <Pressable
              style={styles.addServiceLink}
              onPress={() => {
                if (availabilitySalonId === salon.id) {
                  setAvailabilitySalonId(null);
                } else {
                  setAvailabilitySalonId(salon.id);
                  setAvailabilityDate("");
                  setBlockedSlots([]);
                }
              }}
            >
              <Text style={styles.addServiceLinkText}>
                {availabilitySalonId === salon.id ? "▲ Hide Availability" : "🗓 Manage Availability"}
              </Text>
            </Pressable>

            {availabilitySalonId === salon.id && (
              <View style={styles.serviceForm}>
                <Text style={styles.promoTargetLabel}>Block / unblock time slots</Text>
                <DatePickerRow
                  selectedDate={availabilityDate}
                  onSelect={(iso) => {
                    setAvailabilityDate(iso);
                    handleLoadBlockedSlots(salon.id, iso);
                  }}
                />
                {loadingSlots && <ActivityIndicator color="#C1683C" />}

                {availabilityDate !== "" && !loadingSlots && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    {generateTimeSlots(salon.openTime, salon.closeTime).map((time) => {
                      const isBlocked = blockedSlots.some((s) => s.time === time);
                      const isToggling = togglingSlot === time;
                      return (
                        <Pressable
                          key={time}
                          style={[
                            styles.slotChip,
                            isBlocked && styles.slotChipBlocked,
                          ]}
                          onPress={() => handleToggleSlot(salon.id, time)}
                          disabled={!!togglingSlot}
                        >
                          <Text style={[styles.slotChipText, isBlocked && styles.slotChipTextBlocked]}>
                            {isToggling ? "..." : time}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                <Text style={styles.slotHint}>Tap a slot to block it. Tap again to unblock.</Text>
              </View>
            )}

            {/* Loyalty Program */}
            <Pressable
              style={styles.addServiceLink}
              onPress={() => {
                if (loyaltySalonId === salon.id) {
                  setLoyaltySalonId(null);
                } else {
                  setLoyaltySalonId(salon.id);
                  handleLoadLoyalty(salon.id);
                }
              }}
            >
              <Text style={styles.addServiceLinkText}>
                {loyaltySalonId === salon.id ? "▲ Hide Loyalty Program" : "🎁 Loyalty Program"}
              </Text>
            </Pressable>

            {loyaltySalonId === salon.id && (
              <View style={styles.serviceForm}>
                {loadingLoyalty ? (
                  <ActivityIndicator color="#C1683C" />
                ) : (
                  <>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <Text style={styles.promoTargetLabel}>Enable loyalty rewards</Text>
                      <Switch
                        value={loyaltyEnabled}
                        onValueChange={setLoyaltyEnabled}
                        trackColor={{ false: "#EFE6D9", true: "#C1683C" }}
                        thumbColor="#fff"
                      />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Every how many visits?"
                      placeholderTextColor="#A89D8F"
                      keyboardType="numeric"
                      value={loyaltyVisits}
                      onChangeText={setLoyaltyVisits}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Discount % earned (0 = badges only)"
                      placeholderTextColor="#A89D8F"
                      keyboardType="numeric"
                      value={loyaltyDiscount}
                      onChangeText={setLoyaltyDiscount}
                    />
                    <Pressable
                      style={[styles.smallButton, savingLoyalty && styles.buttonDisabled]}
                      onPress={() => handleSaveLoyalty(salon.id)}
                      disabled={savingLoyalty}
                    >
                      <Text style={styles.smallButtonText}>
                        {savingLoyalty ? "Saving..." : "Save"}
                      </Text>
                    </Pressable>
                    <Text style={styles.slotHint}>
                      {loyaltyDiscount.trim() === "0"
                        ? "Customers earn a tier badge (Bronze/Silver/Gold) once they hit this visit count — no discount, just recognition."
                        : "Customers automatically earn a discount code for their next visit once they hit this visit count. It applies itself at checkout — no code to enter."}
                    </Text>
                  </>
                )}
              </View>
            )}

            {/* Messages */}
            <Pressable
              style={styles.addServiceLink}
              onPress={() =>
                router.push({ pathname: "/owner-chat/[salonId]", params: { salonId: salon.id } } as any)
              }
            >
              <Text style={styles.addServiceLinkText}>💬 Messages</Text>
            </Pressable>
          </View>
        ))}

        {showSalonForm ? (
          <View style={styles.salonForm}>
            <Text style={styles.formTitle}>New Salon</Text>
            <TextInput
              style={styles.input}
              placeholder="Salon name"
              placeholderTextColor="#A89D8F"
              value={salonName}
              onChangeText={setSalonName}
            />
            <TextInput
              style={styles.input}
              placeholder="Category (e.g. Hair Salon, Spa)"
              placeholderTextColor="#A89D8F"
              value={salonCategory}
              onChangeText={setSalonCategory}
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor="#A89D8F"
              value={salonAddress}
              onChangeText={setSalonAddress}
            />
            <TextInput
              style={styles.input}
              placeholder="Open time (e.g. 09:00)"
              placeholderTextColor="#A89D8F"
              value={salonOpen}
              onChangeText={setSalonOpen}
            />
            <TextInput
              style={styles.input}
              placeholder="Close time (e.g. 18:00)"
              placeholderTextColor="#A89D8F"
              value={salonClose}
              onChangeText={setSalonClose}
            />
            <Pressable
              style={[styles.button, submittingSalon && styles.buttonDisabled]}
              onPress={handleCreateSalon}
              disabled={submittingSalon}
            >
              <Text style={styles.buttonText}>
                {submittingSalon ? "Creating..." : "Create Salon"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.button}
            onPress={() => setShowSalonForm(true)}
          >
            <Text style={styles.buttonText}>+ Add a Salon</Text>
          </Pressable>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
          Bookings for Your Salons
        </Text>
        {bookings.length === 0 ? (
          <Text style={styles.noServices}>No bookings yet.</Text>
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <Text style={styles.salonName}>{booking.salonName}</Text>
              <Text style={styles.serviceName}>{booking.serviceName}</Text>
            <Text style={styles.customerBookingInfo}>
                {booking.customerName} · {booking.customerPhone} ·{" "}
                {getOrdinal(booking.customerVisitCount)} visit
              </Text>
              {booking.professionalId ? (
                <Text style={styles.salonMeta}>With {booking.professionalName}</Text>
              ) : (
                booking.noPreference ? (
                  <Text style={styles.salonMeta}>Finding a professional…</Text>
                ) : null
              )}
              <View style={styles.bookingRow}>
                <Text style={styles.salonMeta}>
                  {booking.dateLabel} · {booking.time}
                </Text>
                <Text style={styles.serviceMeta}>GHS {booking.price}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CLAY = "#C1683C";
const RUST = "#A8442B";
const INK = "#2B2622";
const PAPER = "#FBF7F2";
const MUTED = "#8C8378";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  loading: { marginTop: 60 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    color: INK,
    marginBottom: 14,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    color: CLAY,
  },
  statLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#F3ECE2",
    marginHorizontal: 12,
  },
  salonCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  salonHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  salonActionsRow: {
    flexDirection: "row",
    gap: 18,
    marginTop: 12,
    marginBottom: 4,
  },
  editText: { fontFamily: "Manrope_700Bold", fontSize: 13, color: INK },
  salonName: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 18, color: INK },
  salonMeta: { fontFamily: "Manrope_500Medium", fontSize: 13, color: MUTED, marginTop: 2 },
  servicesLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: INK,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  noServices: { fontFamily: "Manrope_500Medium", fontSize: 13, color: MUTED, marginBottom: 8 },
  serviceRowWrapper: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3ECE2",
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontFamily: "Manrope_700Bold", fontSize: 15, color: INK },
  serviceMeta: { fontFamily: "Manrope_500Medium", fontSize: 13, color: MUTED, marginTop: 2 },
  servicePhotosRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  servicePhotoThumbWrap: {
    position: "relative",
    width: 64,
    height: 64,
  },
  servicePhotoThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  servicePhotoRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: RUST,
    alignItems: "center",
    justifyContent: "center",
  },
  servicePhotoRemoveBtnText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 14,
    fontFamily: "Manrope_700Bold",
  },
  servicePhotoAddBtn: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E4D9C9",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  servicePhotoAddBtnText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    color: CLAY,
    textAlign: "center",
  },
  deleteText: { fontFamily: "Manrope_700Bold", fontSize: 13, color: RUST },
  promoBadge: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    color: "#3D8B5F",
  },
  expiredBadge: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    color: RUST,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  promoTargetLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: MUTED,
    marginTop: 6,
    marginBottom: 4,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D8CDBF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: CLAY,
    borderColor: CLAY,
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  customerName: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: INK,
  },
  customerPhone: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: MUTED,
  },
  photoPickerButton: {
    height: 90,
    width: 90,
    borderRadius: 45,
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: "#EFE6D9",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
    overflow: "hidden",
  },
  photoPickerText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: CLAY,
    textAlign: "center",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  proThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  proThumbnailPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3ECE2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  proThumbnailInitial: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: CLAY,
  },
  addServiceLink: { marginTop: 12 },
  addServiceLinkText: { fontFamily: "Manrope_700Bold", fontSize: 14, color: CLAY },
  serviceForm: { marginTop: 12, gap: 8 },
  serviceEditForm: {
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3ECE2",
  },
  salonForm: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    gap: 8,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  formTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 17,
    color: INK,
    marginBottom: 4,
  },
  input: {
    fontFamily: "Manrope_500Medium",
    backgroundColor: PAPER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: INK,
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  button: {
    backgroundColor: CLAY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: "Manrope_700Bold", color: "#fff", fontSize: 15 },
  smallButton: {
    backgroundColor: CLAY,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  smallButtonText: { fontFamily: "Manrope_700Bold", color: "#fff", fontSize: 13 },
  cancelButton: { backgroundColor: "#F3ECE2" },
  cancelButtonText: { fontFamily: "Manrope_700Bold", color: INK, fontSize: 13 },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  bookingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  salonPhotoWrapper: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    height: 140,
  },
  salonPhoto: {
    width: "100%",
    height: "100%",
  },
  salonPhotoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: PAPER,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  salonPhotoPlaceholderText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: CLAY,
  },
  salonPhotoOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(43,38,34,0.7)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  salonPhotoOverlayText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    color: "#fff",
  },
  customerBookingInfo: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: CLAY,
    marginTop: 6,
  },
  categoryBadge: {
    backgroundColor: "#FBF0E8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#E8C9A8",
  },
  categoryBadgeText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    color: "#C1683C",
  },
  datePickerChip: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#EFE6D9",
    minWidth: 52,
  },
  datePickerChipSelected: {
    backgroundColor: "#C1683C",
    borderColor: "#C1683C",
  },
  datePickerWeekday: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    color: "#8C8378",
  },
  datePickerDay: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: "#2B2622",
    marginTop: 2,
  },
  datePickerTextSelected: {
    color: "#fff",
  },
  slotChip: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  slotChipBlocked: {
    backgroundColor: "#FFEBEE",
    borderColor: "#EF9A9A",
  },
  slotChipText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: "#2E7D32",
  },
  slotChipTextBlocked: {
    color: "#C62828",
  },
  slotHint: {
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    color: "#A89D8F",
    marginTop: 8,
  },
});