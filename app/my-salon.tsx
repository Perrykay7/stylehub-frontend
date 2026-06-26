import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../data/authContext";
import {
    addOwnerService,
    createOwnerProfessional,
    createOwnerPromoCode,
    createOwnerSalon,
    Customer,
    deleteOwnerProfessional,
    deleteOwnerPromoCode,
    deleteOwnerSalon,
    deleteOwnerService,
    fetchOwnerBookings,
    fetchOwnerCustomers,
    fetchOwnerProfessionals,
    fetchOwnerPromoCodes,
    fetchOwnerSalons,
    OwnerBooking,
    OwnerSalon,
    Professional,
    PromoCode,
    updateOwnerSalon,
    updateOwnerService,
    uploadProfessionalPhoto,
} from "./api/ownerClient";
 export default function MySalonScreen() {
  const { token } = useAuth();
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
  const [promoFormSalonId, setPromoFormSalonId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
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
  const [proSelectedServiceIds, setProSelectedServiceIds] = useState<string[]>([]);
  const [submittingPro, setSubmittingPro] = useState(false);
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
    } catch {
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
        { name: serviceName, durationMins: duration, price },
        token
      );
      setServiceName("");
      setServiceDuration("");
      setServicePrice("");
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

  async function handleCreatePromoCode(salonId: string) {
    if (!token) return;
    const discount = parseInt(promoDiscount, 10);
    if (!promoCode || !discount) {
      Alert.alert("Missing info", "Please enter a code and discount percent.");
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
          code: promoCode.toUpperCase(),
          discountPercent: discount,
          expiresAt: expiresAtIso,
          userIds: selectedCustomerIds,
        },
        token
      );
      setPromoCode("");
      setPromoDiscount("");
      setPromoExpiry("");
      setSelectedCustomerIds([]);
      setPromoFormSalonId(null);
      await loadPromoCodes(salonId);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not create promo code.");
    } finally {
      setSubmittingPromo(false);
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
                    <View key={service.id} style={styles.serviceRow}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
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

<Text style={styles.servicesLabel}>Professionals</Text>
                {(professionals[salon.id] || []).map((pro) => (
                  <View key={pro.id} style={styles.serviceRow}>
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
                    </View>
                    <Pressable
                      onPress={() => handleDeleteProfessional(pro.id, salon.id)}
                    >
                      <Text style={styles.deleteText}>Remove</Text>
                    </Pressable>
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

                <Text style={styles.servicesLabel}>Promo Codes</Text>
                {(promoCodes[salon.id] || []).length === 0 && (
                  <Text style={styles.noServices}>No promo codes yet.</Text>
                )}
                {(promoCodes[salon.id] || []).map((promo) => {
                  const isExpired =
                    promo.expiresAt && new Date(promo.expiresAt) < new Date();
                  return (
                    <View key={promo.id} style={styles.serviceRow}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{promo.code}</Text>
                        <Text style={styles.serviceMeta}>
                          {promo.discountPercent}% off
                          {promo.expiresAt
                            ? ` · Expires ${new Date(promo.expiresAt).toLocaleDateString()}`
                            : ""}
                        </Text>
                        <Text style={styles.serviceMeta}>
                          {promo.recipients.length > 0
                            ? `Limited to ${promo.recipients.length} customer${
                                promo.recipients.length > 1 ? "s" : ""
                              }`
                            : "Public"}
                        </Text>
                        {isExpired && (
                          <Text style={styles.expiredBadge}>Expired</Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => handleDeletePromoCode(promo.id, salon.id)}
                      >
                        <Text style={styles.deleteText}>Remove</Text>
                      </Pressable>
                    </View>
                  );
                })}

                {promoFormSalonId === salon.id ? (
                  <View style={styles.serviceForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Promo code (e.g. SUMMER20)"
                      placeholderTextColor="#A89D8F"
                      autoCapitalize="characters"
                      value={promoCode}
                      onChangeText={setPromoCode}
                    />
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

                    <Text style={styles.promoTargetLabel}>
                      Limit to specific customers (optional)
                    </Text>
                    {(customers[salon.id] || []).length === 0 ? (
                      <Text style={styles.noServices}>
                        No customers have booked at this salon yet.
                      </Text>
                    ) : (
                      (customers[salon.id] || []).map((customer) => {
                        const isSelected = selectedCustomerIds.includes(customer.id);
                        return (
                          <Pressable
                            key={customer.id}
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
                            <View>
                              <Text style={styles.customerName}>{customer.name}</Text>
                              <Text style={styles.customerPhone}>{customer.phone}</Text>
                            </View>
                          </Pressable>
                        );
                      })
                    )}

                    <Pressable
                      style={[
                        styles.smallButton,
                        submittingPromo && styles.buttonDisabled,
                      ]}
                      onPress={() => handleCreatePromoCode(salon.id)}
                      disabled={submittingPromo}
                    >
                      <Text style={styles.smallButtonText}>
                        {submittingPromo ? "Adding..." : "Add Promo Code"}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.addServiceLink}
                    onPress={() => {
                      setPromoFormSalonId(salon.id);
                      setSelectedCustomerIds([]);
                      loadCustomers(salon.id);
                    }}
                  >
                    <Text style={styles.addServiceLinkText}>+ Add a promo code</Text>
                  </Pressable>
                )}
              </>
            )}
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
                {booking.customerName} · {booking.customerPhone}
              </Text>
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
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3ECE2",
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontFamily: "Manrope_700Bold", fontSize: 15, color: INK },
  serviceMeta: { fontFamily: "Manrope_500Medium", fontSize: 13, color: MUTED, marginTop: 2 },
  deleteText: { fontFamily: "Manrope_700Bold", fontSize: 13, color: RUST },
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
  customerBookingInfo: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: CLAY,
    marginTop: 6,
  },
});