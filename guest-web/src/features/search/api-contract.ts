export type GuestSearchRequestContract = {
  regions?: string[];
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
};

export type GuestAccommodationRegionsResponseContract = string[];

export type GuestSearchResultResponseContract = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  availabilityCategory: 'AVAILABLE' | 'CONDITION_MISMATCH' | 'SOLD_OUT';
  matchingRoomTypeCount: number;
  availableRoomTypeCount: number;
  lowestBasePrice: number | null;
  lowestPreviewPrice: number | null;
};

export type GuestAccommodationDetailResponseContract = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  address: string;
  infoText: string | null;
  checkInTime: string;
  checkOutTime: string;
  availabilityCategory: 'AVAILABLE' | 'CONDITION_MISMATCH' | 'SOLD_OUT';
  roomTypes: Array<{
    roomTypeId: number;
    roomTypeName: string;
    baseCapacity: number;
    maxCapacity: number;
    basePrice: number;
    previewPrice: number;
    totalRoomCount: number;
    availableRoomCount: number;
    matchesGuestCount: boolean;
    availabilityCategory: 'AVAILABLE' | 'CONDITION_MISMATCH' | 'SOLD_OUT';
  }>;
};

export type GuestRoomTypeCalendarResponseContract = {
  accommodationId: number;
  roomTypeId: number;
  roomTypeName: string;
  startDate: string;
  endDate: string;
  days: Array<{
    stayDate: string;
    availableRoomCount: number;
    soldOut: boolean;
  }>;
};
