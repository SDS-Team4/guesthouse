import { GuestAccommodationAvailabilityCategory } from './types';

export type GuestAccommodationListItemContract = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  availabilityCategory: GuestAccommodationAvailabilityCategory;
  matchingRoomTypeCount: number;
  availableRoomTypeCount: number;
  lowestBasePrice: number | null;
  lowestPreviewPrice: number | null;
};

export type GuestAccommodationDetailContract = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  address: string;
  infoText: string | null;
  checkInTime: string;
  checkOutTime: string;
  availabilityCategory: GuestAccommodationAvailabilityCategory;
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
    availabilityCategory: GuestAccommodationAvailabilityCategory;
  }>;
};
