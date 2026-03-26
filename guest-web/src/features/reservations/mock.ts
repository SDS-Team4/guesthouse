import { GuestReservationStatus } from './types';

export type GuestReservationDraft = {
  id: number;
  reservationNo: string;
  accommodationName: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  status: GuestReservationStatus;
  specialRequest?: string;
};

export const guestReservationDrafts: GuestReservationDraft[] = [
  {
    id: 1,
    reservationNo: 'R-2026-0001',
    accommodationName: 'Draft Guesthouse One',
    roomTypeName: 'Double Room',
    checkInDate: '2026-04-12',
    checkOutDate: '2026-04-14',
    guestCount: 2,
    status: 'PENDING',
    specialRequest: 'Late check-in expected.'
  },
  {
    id: 2,
    reservationNo: 'R-2026-0002',
    accommodationName: 'Draft Guesthouse Two',
    roomTypeName: 'Ocean Twin',
    checkInDate: '2026-05-03',
    checkOutDate: '2026-05-05',
    guestCount: 2,
    status: 'CONFIRMED',
    specialRequest: 'High floor requested.'
  },
  {
    id: 3,
    reservationNo: 'R-2026-0003',
    accommodationName: 'Draft Hanok Stay',
    roomTypeName: 'Ondol Double',
    checkInDate: '2026-03-20',
    checkOutDate: '2026-03-21',
    guestCount: 2,
    status: 'CANCELLED'
  }
];
