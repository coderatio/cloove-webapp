export interface HotelImage {
  id: string;
  url: string;
  isPrimary: boolean;
  alt?: string;
}

export interface HotelRoomType {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  capacity: number;
  amenities: string[];
  images: HotelImage[];
  baseNightlyRate: number;
  currency: string;
  isActive: boolean;
  catalogSyncEnabled: boolean;
  rooms: HotelRoom[];
}

export interface HotelRoom {
  id: string;
  storeId: string;
  roomTypeId: string;
  number: string;
  status: "available" | "occupied" | "out_of_service";
  notes: string | null;
  roomType?: HotelRoomType;
}

export type HotelReservationStatus =
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

export interface HotelReservation {
  id: string;
  storeId: string;
  customerId: string;
  roomTypeId: string;
  roomId: string | null;
  confirmationCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  nightlyRate: number;
  totalAmount: number;
  listedNightlyRate?: number;
  currency: string;
  saleId?: string | null;
  paymentPlan?: "deposit" | "full" | null;
  paymentStatus?: "unpaid" | "partially_paid" | "paid";
  amountPaid?: number;
  balance?: number;
  holdExpiresAt?: string | null;
  status: HotelReservationStatus;
  customer?: { id: string; name: string };
  roomType?: HotelRoomType;
  room?: HotelRoom | null;
}

export type HotelServiceRequestStatus =
  | "new"
  | "acknowledged"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface HotelServiceRequest {
  id: string;
  category: string;
  status: HotelServiceRequestStatus;
  details: string | null;
  customer?: { id: string; name: string };
  room?: HotelRoom | null;
  service?: { id: string; name: string } | null;
  createdAt: string;
}

export interface AvailableRoomUnit {
  id: string;
  number: string;
}

export interface AvailabilityOption {
  roomType: HotelRoomType;
  availableUnits: number;
  availableRooms: AvailableRoomUnit[];
  total: number;
  nights: number;
}
