export type HostPage =
  | 'login'
  | 'dashboard'
  | 'properties'
  | 'property-form'
  | 'property-detail'
  | 'room-types'
  | 'room-type-form'
  | 'reservation-list'
  | 'reservation-detail'
  | 'account';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PropertyStatus = 'ACTIVE' | 'INACTIVE';

export type Property = {
  id: number;
  name: string;
  region: string;
  address: string;
  contact: string;
  status: PropertyStatus;
  checkInTime: string;
  checkOutTime: string;
  info: string;
  roomTypeCount: number;
  roomCount: number;
  pendingReservations: number;
};

export type RoomType = {
  id: number;
  propertyId: number;
  name: string;
  baseCapacity: number;
  maxCapacity: number;
  basePrice: number;
  status: PropertyStatus;
};

export type Reservation = {
  id: number;
  reservationNo: string;
  propertyId: number;
  propertyName: string;
  roomTypeId: number;
  roomTypeName: string;
  guestName: string;
  people: number;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  requestNote?: string;
};

export type Room = {
  id: string;
  propertyId: number;
  roomTypeId: number;
  roomNo: string;
};
