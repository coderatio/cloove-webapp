"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export interface ExtractedRoomType {
  name: string;
  nightlyRate: number | null;
  maxGuests: number | null;
  amenities: string[];
  currency: string | null;
  confidence: number;
}

export interface ExtractedRoom {
  number: string;
  roomTypeName: string | null;
  confidence: number;
}

export interface ExtractedInventory {
  roomTypes: ExtractedRoomType[];
  rooms: ExtractedRoom[];
}

export interface BulkImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ index: number; name: string; error: string }>;
}

export interface InventoryImportResult {
  roomTypes: BulkImportResult | null;
  rooms: BulkImportResult | null;
}

export interface InventoryImportPayload {
  storeId: string;
  roomTypes?: Array<{
    name: string;
    nightlyRate: number;
    maxGuests?: number | null;
    amenities?: string[];
    currency?: string | null;
  }>;
  rooms?: Array<{ number: string; roomTypeName?: string | null }>;
}

export interface ExtractedReservation {
  guestName: string;
  guestPhone: string | null;
  roomTypeName: string | null;
  roomNumber: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  adults: number | null;
  children: number | null;
  status: string | null;
  confidence: number;
}

export interface ReservationImportResult {
  total: number;
  created: number;
  failed: number;
  guestsCreated: number;
  errors: Array<{ index: number; guest: string; error: string }>;
  warnings: Array<{ index: number; guest: string; message: string }>;
}

export interface ReservationImportPayload {
  storeId: string;
  reservations: Array<{
    guestName: string;
    guestPhone?: string | null;
    roomTypeName?: string | null;
    roomNumber?: string | null;
    checkInDate?: string | null;
    checkOutDate?: string | null;
    adults?: number | null;
    children?: number | null;
    status?: string | null;
  }>;
}

export function useHotelImport() {
  const queryClient = useQueryClient();

  const extract = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.request<ExtractedInventory>("/hotel/rooms/import-extract", {
        method: "POST",
        body: formData,
        headers: { "Content-Type": undefined as unknown as string },
      });
    },
    onError: (error: ApiError) =>
      toast.error(error?.message ?? "Could not read that file."),
  });

  const bulkImport = useMutation({
    mutationFn: (payload: InventoryImportPayload) =>
      apiClient.post<InventoryImportResult>("/hotel/rooms/bulk-import", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotel"] }),
    onError: (error: ApiError) =>
      toast.error(error?.message ?? "Import failed."),
  });

  const extractReservations = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.request<{ reservations: ExtractedReservation[] }>(
        "/hotel/reservations/import-extract",
        {
          method: "POST",
          body: formData,
          headers: { "Content-Type": undefined as unknown as string },
        },
      );
    },
    onError: (error: ApiError) =>
      toast.error(error?.message ?? "Could not read that file."),
  });

  const bulkImportReservations = useMutation({
    mutationFn: (payload: ReservationImportPayload) =>
      apiClient.post<ReservationImportResult>("/hotel/reservations/bulk-import", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotel"] }),
    onError: (error: ApiError) => toast.error(error?.message ?? "Import failed."),
  });

  return { extract, bulkImport, extractReservations, bulkImportReservations };
}
