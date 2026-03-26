export type GuestAccommodationAvailabilityCategory = 'AVAILABLE' | 'CONDITION_MISMATCH' | 'SOLD_OUT';

export type GuestAccommodationCard = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  availabilityCategory: GuestAccommodationAvailabilityCategory;
};

export type GuestRoomTypeCard = {
  roomTypeId: number;
  roomTypeName: string;
  baseCapacity: number;
  maxCapacity: number;
  basePrice: number;
  soldOut?: boolean;
};
