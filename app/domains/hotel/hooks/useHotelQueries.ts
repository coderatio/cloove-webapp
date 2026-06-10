"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useBusiness } from "@/app/components/BusinessProvider";
import type {
  AvailabilityOption,
  HotelReservation,
  HotelRoom,
  HotelRoomType,
  HotelServiceRequest,
} from "@/app/domains/hotel/types";

export function useHotelRoomTypes(storeId?: string) {
  const { activeBusiness } = useBusiness();
  return useQuery<HotelRoomType[]>({
    queryKey: ["hotel", "room-types", activeBusiness?.id, storeId],
    queryFn: () =>
      apiClient.get("/hotel/room-types", storeId ? { storeId } : {}),
    enabled: !!activeBusiness?.id,
  });
}

export function useHotelRooms(storeId?: string) {
  const { activeBusiness } = useBusiness();
  return useQuery<HotelRoom[]>({
    queryKey: ["hotel", "rooms", activeBusiness?.id, storeId],
    queryFn: () => apiClient.get("/hotel/rooms", storeId ? { storeId } : {}),
    enabled: !!activeBusiness?.id,
  });
}

export function useHotelReservations() {
  const { activeBusiness } = useBusiness();
  return useQuery<HotelReservation[]>({
    queryKey: ["hotel", "reservations", activeBusiness?.id],
    queryFn: () => apiClient.get("/hotel/reservations"),
    enabled: !!activeBusiness?.id,
  });
}

export function useHotelServiceRequests() {
  const { activeBusiness } = useBusiness();
  return useQuery<HotelServiceRequest[]>({
    queryKey: ["hotel", "service-requests", activeBusiness?.id],
    queryFn: () => apiClient.get("/hotel/service-requests"),
    enabled: !!activeBusiness?.id,
  });
}

export async function checkHotelAvailability(
  input: Record<string, string | number>,
) {
  return apiClient.get<AvailabilityOption[]>(
    "/hotel/availability",
    Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, String(value)]),
    ),
  );
}
