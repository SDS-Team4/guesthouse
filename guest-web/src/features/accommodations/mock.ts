import { GuestAccommodationCard, GuestRoomTypeCard } from './types';

export const guestAccommodationDrafts: GuestAccommodationCard[] = [
  {
    accommodationId: 1,
    accommodationName: 'Draft Guesthouse One',
    region: 'SEOUL',
    availabilityCategory: 'AVAILABLE'
  },
  {
    accommodationId: 2,
    accommodationName: 'Draft Guesthouse Two',
    region: 'BUSAN',
    availabilityCategory: 'SOLD_OUT'
  }
];

export const guestRoomTypeDrafts: GuestRoomTypeCard[] = [
  {
    roomTypeId: 101,
    roomTypeName: 'Double Room',
    baseCapacity: 2,
    maxCapacity: 2,
    basePrice: 89000
  },
  {
    roomTypeId: 102,
    roomTypeName: 'Dormitory',
    baseCapacity: 1,
    maxCapacity: 4,
    basePrice: 32000,
    soldOut: true
  }
];
