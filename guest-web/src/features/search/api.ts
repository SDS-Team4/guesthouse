import {
  AccommodationDetail,
  AccommodationSearchResult,
  RoomTypeCalendar
} from '../guest-api-types';
import {
  GuestAccommodationDetailResponseContract,
  GuestRoomTypeCalendarResponseContract,
  GuestSearchResultResponseContract
} from './api-contract';
import { apiRequest } from '../../shared/api/apiRequest';

type SearchFormState = {
  regions: string[];
  guestCount: string;
  checkInDate: string;
  checkOutDate: string;
};

function buildSearchParams(searchForm: SearchFormState) {
  const params = new URLSearchParams({
    checkInDate: searchForm.checkInDate,
    checkOutDate: searchForm.checkOutDate,
    guestCount: searchForm.guestCount
  });

  const normalizedRegions = searchForm.regions
    .map((region) => region.trim().toUpperCase())
    .filter((region) => region.length > 0);

  if (normalizedRegions.length > 0) {
    params.set('region', normalizedRegions.join(','));
  }

  return params;
}

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekSunday(date: Date) {
  return addDays(date, -date.getDay());
}

function laterDate(left: Date, right: Date) {
  return left >= right ? left : right;
}

function buildCalendarParams(searchForm: SearchFormState) {
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const checkIn = toDateOnly(searchForm.checkInDate);
  const checkOut = toDateOnly(searchForm.checkOutDate);

  const startDate = laterDate(todayDateOnly, startOfWeekSunday(checkIn));
  const minimumEndDateExclusive = addDays(startDate, 21);
  const endDate = laterDate(checkOut, minimumEndDateExclusive);

  return new URLSearchParams({
    startDate: formatIsoDate(startDate),
    endDate: formatIsoDate(endDate)
  });
}

function normalizeSearchResult(
  contract: GuestSearchResultResponseContract
): AccommodationSearchResult {
  return {
    accommodationId: contract.accommodationId,
    accommodationName: contract.accommodationName,
    region: contract.region,
    availabilityCategory: contract.availabilityCategory,
    matchingRoomTypeCount: contract.matchingRoomTypeCount,
    availableRoomTypeCount: contract.availableRoomTypeCount,
    lowestBasePrice: contract.lowestBasePrice,
    lowestPreviewPrice: contract.lowestPreviewPrice
  };
}

function normalizeAccommodationDetail(
  contract: GuestAccommodationDetailResponseContract
): AccommodationDetail {
  return {
    accommodationId: contract.accommodationId,
    accommodationName: contract.accommodationName,
    region: contract.region,
    address: contract.address,
    infoText: contract.infoText,
    checkInTime: contract.checkInTime,
    checkOutTime: contract.checkOutTime,
    availabilityCategory: contract.availabilityCategory,
    roomTypes: contract.roomTypes.map((roomType) => ({
      roomTypeId: roomType.roomTypeId,
      roomTypeName: roomType.roomTypeName,
      baseCapacity: roomType.baseCapacity,
      maxCapacity: roomType.maxCapacity,
      basePrice: roomType.basePrice,
      previewPrice: roomType.previewPrice,
      totalRoomCount: roomType.totalRoomCount,
      availableRoomCount: roomType.availableRoomCount,
      matchesGuestCount: roomType.matchesGuestCount,
      availabilityCategory: roomType.availabilityCategory
    }))
  };
}

function normalizeRoomTypeCalendar(
  contract: GuestRoomTypeCalendarResponseContract
): RoomTypeCalendar {
  return {
    accommodationId: contract.accommodationId,
    roomTypeId: contract.roomTypeId,
    roomTypeName: contract.roomTypeName,
    startDate: contract.startDate,
    endDate: contract.endDate,
    days: contract.days.map((day) => ({
      date: day.stayDate,
      availableRoomCount: day.availableRoomCount,
      soldOut: day.soldOut
    }))
  };
}

export async function searchAccommodations(searchForm: SearchFormState) {
  const response = await apiRequest<GuestSearchResultResponseContract[]>(
    `/api/v1/accommodations/search?${buildSearchParams(searchForm).toString()}`,
    { method: 'GET' }
  );
  return response.map(normalizeSearchResult);
}

export async function fetchAccommodationDetail(searchForm: SearchFormState, accommodationId: number) {
  const response = await apiRequest<GuestAccommodationDetailResponseContract>(
    `/api/v1/accommodations/${accommodationId}?${buildSearchParams(searchForm).toString()}`,
    { method: 'GET' }
  );
  return normalizeAccommodationDetail(response);
}

export async function fetchRoomTypeCalendar(
  searchForm: SearchFormState,
  accommodationId: number,
  roomTypeId: number
) {
  const params = buildCalendarParams(searchForm);

  const response = await apiRequest<GuestRoomTypeCalendarResponseContract>(
    `/api/v1/accommodations/${accommodationId}/room-types/${roomTypeId}/calendar?${params.toString()}`,
    { method: 'GET' }
  );
  return normalizeRoomTypeCalendar(response);
}
