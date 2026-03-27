import { Property, Reservation, Room, RoomType } from './types';

export const hostProperties: Property[] = [
  {
    id: 1,
    name: 'Aurora Guesthouse',
    region: 'Seoul Mapo',
    address: '31 Daeyeosan-ro 12-gil, Mapo-gu, Seoul',
    contact: '02-123-4567',
    status: 'ACTIVE',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    info: 'Urban guesthouse with lounge and rooftop access.',
    roomTypeCount: 3,
    roomCount: 8,
    pendingReservations: 5
  },
  {
    id: 2,
    name: 'Blue Coast Stay',
    region: 'Busan Haeundae',
    address: '120 Dalmaji-gil, Haeundae-gu, Busan',
    contact: '051-555-7777',
    status: 'ACTIVE',
    checkInTime: '16:00',
    checkOutTime: '11:00',
    info: 'Ocean-view stay with breakfast service.',
    roomTypeCount: 2,
    roomCount: 6,
    pendingReservations: 1
  }
];

export const hostRoomTypes: RoomType[] = [
  {
    id: 101,
    propertyId: 1,
    name: 'Double Room',
    baseCapacity: 2,
    maxCapacity: 2,
    basePrice: 89000,
    status: 'ACTIVE'
  },
  {
    id: 102,
    propertyId: 1,
    name: '4 Bed Dorm',
    baseCapacity: 1,
    maxCapacity: 4,
    basePrice: 32000,
    status: 'ACTIVE'
  },
  {
    id: 201,
    propertyId: 2,
    name: 'Ocean Twin',
    baseCapacity: 2,
    maxCapacity: 3,
    basePrice: 119000,
    status: 'ACTIVE'
  }
];

export const hostRooms: Room[] = [
  { id: 'r101', propertyId: 1, roomTypeId: 101, roomNo: '101' },
  { id: 'r102', propertyId: 1, roomTypeId: 101, roomNo: '102' },
  { id: 'r201', propertyId: 1, roomTypeId: 102, roomNo: '201' },
  { id: 'r202', propertyId: 1, roomTypeId: 102, roomNo: '202' },
  { id: 'r301', propertyId: 2, roomTypeId: 201, roomNo: '301' }
];

export const hostReservations: Reservation[] = [
  {
    id: 1,
    reservationNo: 'R-2026-0001',
    propertyId: 1,
    propertyName: 'Aurora Guesthouse',
    roomTypeId: 101,
    roomTypeName: 'Double Room',
    guestName: 'Kim Mina',
    people: 2,
    checkInDate: '2026-04-12',
    checkOutDate: '2026-04-14',
    status: 'PENDING',
    requestNote: 'Early check-in if possible'
  },
  {
    id: 2,
    reservationNo: 'R-2026-0002',
    propertyId: 1,
    propertyName: 'Aurora Guesthouse',
    roomTypeId: 101,
    roomTypeName: 'Double Room',
    guestName: 'Park Sora',
    people: 2,
    checkInDate: '2026-04-14',
    checkOutDate: '2026-04-16',
    status: 'CONFIRMED'
  },
  {
    id: 3,
    reservationNo: 'R-2026-0003',
    propertyId: 2,
    propertyName: 'Blue Coast Stay',
    roomTypeId: 201,
    roomTypeName: 'Ocean Twin',
    guestName: 'Lee Junho',
    people: 2,
    checkInDate: '2026-05-03',
    checkOutDate: '2026-05-05',
    status: 'CONFIRMED'
  }
];
