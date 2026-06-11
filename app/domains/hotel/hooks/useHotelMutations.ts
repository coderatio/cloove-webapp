"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export function useHotelMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["hotel"] });

  const useHotelMutation = <T>(
    fn: (payload: T) => Promise<unknown>,
    success: string,
  ) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(success);
        void invalidate();
      },
      onError: (error: ApiError) =>
        toast.error(error?.message ?? "Hotel operation failed"),
    });

  const createRoomType = useHotelMutation<Record<string, unknown>>(
    (payload) => apiClient.post("/hotel/room-types", payload),
    "Room type created",
  );
  const updateRoomType = useHotelMutation<{
    id: string;
    payload: Record<string, unknown>;
  }>(
    ({ id, payload }) => apiClient.patch(`/hotel/room-types/${id}`, payload),
    "Room type updated",
  );
  const archiveRoomType = useHotelMutation<{ id: string }>(
    ({ id }) => apiClient.delete(`/hotel/room-types/${id}`),
    "Room type deactivated",
  );
  const createRoom = useHotelMutation<Record<string, unknown>>(
    (payload) => apiClient.post("/hotel/rooms", payload),
    "Room created",
  );
  const updateRoom = useHotelMutation<{
    id: string;
    payload: Record<string, unknown>;
  }>(
    ({ id, payload }) => apiClient.patch(`/hotel/rooms/${id}`, payload),
    "Room updated",
  );
  const archiveRoom = useHotelMutation<{ id: string }>(
    ({ id }) => apiClient.delete(`/hotel/rooms/${id}`),
    "Room removed",
  );
  const createReservation = useHotelMutation<Record<string, unknown>>(
    (payload) => apiClient.post("/hotel/reservations", payload),
    "Reservation confirmed",
  );
  const reservationAction = useHotelMutation<{
    id: string;
    action: "check-in" | "check-out" | "cancel";
    payload?: Record<string, unknown>;
  }>(
    ({ id, action, payload }) =>
      apiClient.post(`/hotel/reservations/${id}/${action}`, payload ?? {}),
    "Reservation updated",
  );
  const assignRoom = useHotelMutation<{ id: string; roomId: string }>(
    ({ id, roomId }) =>
      apiClient.post(`/hotel/reservations/${id}/assign-room`, { roomId }),
    "Room assigned",
  );
  const recordPayment = useHotelMutation<{
    id: string;
    amount: number;
    paymentMethod: "CASH" | "TRANSFER" | "POS";
  }>(
    ({ id, amount, paymentMethod }) =>
      apiClient.post(`/hotel/reservations/${id}/payments`, {
        amount,
        paymentMethod,
      }),
    "Payment recorded",
  );
  const updateRequest = useHotelMutation<{ id: string; status: string }>(
    ({ id, status }) =>
      apiClient.patch(`/hotel/service-requests/${id}`, { status }),
    "Request updated",
  );

  return {
    createRoomType,
    updateRoomType,
    archiveRoomType,
    createRoom,
    updateRoom,
    archiveRoom,
    createReservation,
    reservationAction,
    assignRoom,
    recordPayment,
    updateRequest,
  };
}
