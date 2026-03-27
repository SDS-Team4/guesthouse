import { useEffect, useState } from 'react';

import { SectionCard } from '../../components/ops/SectionCard';
import { StatusPill } from '../../components/ops/StatusPill';
import { formatAssetStatus } from '../../lib/format';
import type { AccommodationDetail, AccommodationSummary, RoomStatus } from '../../lib/types';

type AccommodationForm = {
  name: string;
  region: string;
  address: string;
  infoText: string;
  checkInTime: string;
  checkOutTime: string;
};

type RoomTypeForm = {
  name: string;
  baseCapacity: string;
  maxCapacity: string;
  basePrice: string;
};

type RoomCreateForm = {
  roomTypeId: string;
  roomCode: string;
  status: RoomStatus;
  memo: string;
};

type RoomUpdateForm = {
  roomCode: string;
  status: RoomStatus;
  memo: string;
};

type HostPropertiesPageProps = {
  accommodations: AccommodationSummary[];
  selectedAccommodationId: number | null;
  accommodationDetail: AccommodationDetail | null;
  creatingAccommodation: boolean;
  loadingAccommodations: boolean;
  loadingAccommodationDetail: boolean;
  mutatingAssetId: string | null;
  onRefresh: () => void;
  onStartCreateAccommodation: () => void;
  onSelectAccommodation: (accommodationId: number) => void;
  onCreateAccommodation: (form: AccommodationForm) => void;
  onUpdateAccommodation: (accommodationId: number, form: AccommodationForm) => void;
  onDeactivateAccommodation: (accommodationId: number) => void;
  onCreateRoomType: (accommodationId: number, form: RoomTypeForm) => void;
  onUpdateRoomType: (roomTypeId: number, form: RoomTypeForm) => void;
  onDeactivateRoomType: (roomTypeId: number) => void;
  onCreateRoom: (accommodationId: number, form: RoomCreateForm) => void;
  onUpdateRoom: (roomId: number, form: RoomUpdateForm) => void;
  onDeactivateRoom: (roomId: number) => void;
  onOpenCalendar: (accommodationId: number) => void;
  onOpenPricing: (accommodationId: number) => void;
  onOpenBlocks: (accommodationId: number) => void;
};

const emptyAccommodationForm: AccommodationForm = {
  name: '',
  region: '',
  address: '',
  infoText: '',
  checkInTime: '15:00',
  checkOutTime: '11:00'
};

const emptyRoomTypeForm: RoomTypeForm = {
  name: '',
  baseCapacity: '2',
  maxCapacity: '2',
  basePrice: '0'
};

const emptyRoomUpdateForm: RoomUpdateForm = {
  roomCode: '',
  status: 'ACTIVE',
  memo: ''
};

const emptyRoomCreateForm: RoomCreateForm = {
  roomTypeId: '',
  roomCode: '',
  status: 'ACTIVE',
  memo: ''
};

export function HostPropertiesPage({
  accommodations,
  selectedAccommodationId,
  accommodationDetail,
  creatingAccommodation,
  loadingAccommodations,
  loadingAccommodationDetail,
  mutatingAssetId,
  onRefresh,
  onStartCreateAccommodation,
  onSelectAccommodation,
  onCreateAccommodation,
  onUpdateAccommodation,
  onDeactivateAccommodation,
  onCreateRoomType,
  onUpdateRoomType,
  onDeactivateRoomType,
  onCreateRoom,
  onUpdateRoom,
  onDeactivateRoom,
  onOpenCalendar,
  onOpenPricing,
  onOpenBlocks
}: HostPropertiesPageProps) {
  const [editingAccommodation, setEditingAccommodation] = useState(accommodationDetail === null);
  const [accommodationForm, setAccommodationForm] = useState<AccommodationForm>(emptyAccommodationForm);
  const [editingRoomTypeId, setEditingRoomTypeId] = useState<number | null>(null);
  const [roomTypeForm, setRoomTypeForm] = useState<RoomTypeForm>(emptyRoomTypeForm);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [roomCreateForm, setRoomCreateForm] = useState<RoomCreateForm>(emptyRoomCreateForm);
  const [roomUpdateForm, setRoomUpdateForm] = useState<RoomUpdateForm>(emptyRoomUpdateForm);

  useEffect(() => {
    if (!accommodationDetail) {
      setEditingAccommodation(true);
      setAccommodationForm(emptyAccommodationForm);
      setEditingRoomTypeId(null);
      setRoomTypeForm(emptyRoomTypeForm);
      setEditingRoomId(null);
      setRoomCreateForm(emptyRoomCreateForm);
      setRoomUpdateForm(emptyRoomUpdateForm);
      return;
    }

    setAccommodationForm({
      name: accommodationDetail.name,
      region: accommodationDetail.region,
      address: accommodationDetail.address,
      infoText: accommodationDetail.infoText ?? '',
      checkInTime: accommodationDetail.checkInTime,
      checkOutTime: accommodationDetail.checkOutTime
    });
    setEditingRoomTypeId((current) =>
      current !== null && accommodationDetail.roomTypes.some((item) => item.roomTypeId === current) ? current : null
    );
    setEditingRoomId((current) =>
      current !== null && accommodationDetail.rooms.some((item) => item.roomId === current) ? current : null
    );
    setRoomCreateForm({
      roomTypeId: String(accommodationDetail.roomTypes[0]?.roomTypeId ?? ''),
      roomCode: '',
      status: 'ACTIVE',
      memo: ''
    });
  }, [accommodationDetail]);

  useEffect(() => {
    if (!accommodationDetail) {
      return;
    }

    if (editingRoomTypeId === null) {
      setRoomTypeForm(emptyRoomTypeForm);
      return;
    }

    const roomType = accommodationDetail.roomTypes.find((item) => item.roomTypeId === editingRoomTypeId);
    if (!roomType) {
      setEditingRoomTypeId(null);
      setRoomTypeForm(emptyRoomTypeForm);
      return;
    }

    setRoomTypeForm({
      name: roomType.name,
      baseCapacity: String(roomType.baseCapacity),
      maxCapacity: String(roomType.maxCapacity),
      basePrice: String(roomType.basePrice)
    });
  }, [accommodationDetail, editingRoomTypeId]);

  useEffect(() => {
    if (!accommodationDetail) {
      return;
    }

    if (editingRoomId === null) {
      setRoomUpdateForm(emptyRoomUpdateForm);
      return;
    }

    const room = accommodationDetail.rooms.find((item) => item.roomId === editingRoomId);
    if (!room) {
      setEditingRoomId(null);
      setRoomUpdateForm(emptyRoomUpdateForm);
      return;
    }

    setRoomUpdateForm({
      roomCode: room.roomCode,
      status: room.status,
      memo: room.memo ?? ''
    });
  }, [accommodationDetail, editingRoomId]);

  const selectedAccommodation =
    accommodationDetail ?? accommodations.find((item) => item.accommodationId === selectedAccommodationId) ?? null;
  const isCreatingAccommodation = creatingAccommodation || (!selectedAccommodation && editingAccommodation);

  return (
    <div className="ops-page-grid">
      <SectionCard
        title="Properties"
        subtitle="Manage accommodations, room types, and physical rooms from one host workspace."
        actions={
          <button type="button" className="secondary-button" onClick={onRefresh} disabled={loadingAccommodations}>
            {loadingAccommodations ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      >
        <div className="asset-layout">
          <div className="asset-sidebar">
            <button type="button" className="secondary-button" onClick={() => {
              onStartCreateAccommodation();
              setEditingAccommodation(true);
              setAccommodationForm(emptyAccommodationForm);
              setEditingRoomTypeId(null);
              setRoomTypeForm(emptyRoomTypeForm);
              setEditingRoomId(null);
              setRoomCreateForm(emptyRoomCreateForm);
              setRoomUpdateForm(emptyRoomUpdateForm);
            }}>
              New property
            </button>

            <div className="asset-list">
              {accommodations.length === 0 ? (
                <p className="empty-state">Create the first accommodation to unlock room, pricing, and block management.</p>
              ) : (
                accommodations.map((item) => (
                  <button
                    key={item.accommodationId}
                    type="button"
                    className={[
                      'result-card',
                      selectedAccommodationId === item.accommodationId ? 'result-card-selected' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      setEditingAccommodation(false);
                      setEditingRoomTypeId(null);
                      setRoomTypeForm(emptyRoomTypeForm);
                      setEditingRoomId(null);
                      setRoomCreateForm(emptyRoomCreateForm);
                      setRoomUpdateForm(emptyRoomUpdateForm);
                      onSelectAccommodation(item.accommodationId);
                    }}
                  >
                    <div className="result-card-header">
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.region}</p>
                      </div>
                      <StatusPill tone={item.status === 'ACTIVE' ? 'success' : 'default'}>{item.status}</StatusPill>
                    </div>
                    <div className="result-metrics">
                      <span>Room types {item.roomTypeCount}</span>
                      <span>Rooms {item.roomCount}</span>
                      <span>Pending {item.pendingReservationCount}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="asset-main">
            <SectionCard
              title={isCreatingAccommodation ? 'Create property' : 'Property profile'}
              subtitle="Accommodation basics become the anchor for calendar, room, pricing, and block operations."
              actions={
                selectedAccommodation && !editingAccommodation && !isCreatingAccommodation ? (
                  <button type="button" className="secondary-button" onClick={() => setEditingAccommodation(true)}>
                    Edit
                  </button>
                ) : null
              }
            >
              <div className="asset-form-grid">
                <label>
                  Name
                  <input
                    value={accommodationForm.name}
                    disabled={Boolean(selectedAccommodation && !editingAccommodation)}
                    onChange={(event) => setAccommodationForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label>
                  Region
                  <input
                    value={accommodationForm.region}
                    disabled={Boolean(selectedAccommodation && !editingAccommodation)}
                    onChange={(event) => setAccommodationForm((current) => ({ ...current, region: event.target.value }))}
                  />
                </label>
                <label className="asset-form-grid-wide">
                  Address
                  <input
                    value={accommodationForm.address}
                    disabled={Boolean(selectedAccommodation && !editingAccommodation)}
                    onChange={(event) => setAccommodationForm((current) => ({ ...current, address: event.target.value }))}
                  />
                </label>
                <label>
                  Check-in
                  <input
                    type="time"
                    value={accommodationForm.checkInTime}
                    disabled={Boolean(selectedAccommodation && !editingAccommodation)}
                    onChange={(event) => setAccommodationForm((current) => ({ ...current, checkInTime: event.target.value }))}
                  />
                </label>
                <label>
                  Check-out
                  <input
                    type="time"
                    value={accommodationForm.checkOutTime}
                    disabled={Boolean(selectedAccommodation && !editingAccommodation)}
                    onChange={(event) => setAccommodationForm((current) => ({ ...current, checkOutTime: event.target.value }))}
                  />
                </label>
                <label className="asset-form-grid-wide">
                  Info
                  <textarea
                    rows={4}
                    value={accommodationForm.infoText}
                    disabled={Boolean(selectedAccommodation && !editingAccommodation)}
                    onChange={(event) => setAccommodationForm((current) => ({ ...current, infoText: event.target.value }))}
                  />
                </label>
              </div>

              <div className="action-group">
                {!selectedAccommodation || editingAccommodation ? (
                  <button
                    type="button"
                    disabled={mutatingAssetId === 'accommodation-new'}
                    onClick={() => {
                      if (selectedAccommodation && editingAccommodation && !isCreatingAccommodation) {
                        onUpdateAccommodation(selectedAccommodation.accommodationId, accommodationForm);
                        setEditingAccommodation(false);
                        return;
                      }
                      onCreateAccommodation(accommodationForm);
                    }}
                  >
                    {selectedAccommodation && editingAccommodation && !isCreatingAccommodation ? 'Save property' : 'Create property'}
                  </button>
                ) : null}
                {selectedAccommodation ? (
                  <button
                    type="button"
                    className="danger-button"
                    disabled={mutatingAssetId === `accommodation-${selectedAccommodation.accommodationId}`}
                    onClick={() => onDeactivateAccommodation(selectedAccommodation.accommodationId)}
                  >
                    Deactivate property
                  </button>
                ) : null}
              </div>
            </SectionCard>

            {selectedAccommodation && accommodationDetail ? (
              <>
                <SectionCard
                  title="Property operations hub"
                  subtitle="Move directly into the operational tools for the selected accommodation."
                >
                  <div className="ops-shortcut-grid">
                    <button type="button" className="ops-shortcut" onClick={() => onOpenCalendar(selectedAccommodation.accommodationId)}>
                      <strong>Reservation calendar</strong>
                      <span>Open nightly assignment grid for this property</span>
                    </button>
                    <button type="button" className="ops-shortcut" onClick={() => onOpenPricing(selectedAccommodation.accommodationId)}>
                      <strong>Pricing</strong>
                      <span>{accommodationDetail.activePricePolicyCount} active policies</span>
                    </button>
                    <button type="button" className="ops-shortcut" onClick={() => onOpenBlocks(selectedAccommodation.accommodationId)}>
                      <strong>Room blocks</strong>
                      <span>{accommodationDetail.activeBlockCount} active blocks</span>
                    </button>
                  </div>
                  <div className="result-metrics">
                    <span>Room types {accommodationDetail.roomTypeCount}</span>
                    <span>Rooms {accommodationDetail.roomCount}</span>
                    <span>Active rooms {accommodationDetail.activeRoomCount}</span>
                    <span>Pending reservations {accommodationDetail.pendingReservationCount}</span>
                  </div>
                </SectionCard>

                <SectionCard title="Room types" subtitle="Keep sales structure and base pricing aligned with the physical room inventory.">
                  <div className="asset-form-grid">
                    <label>
                      Name
                      <input
                        value={roomTypeForm.name}
                        onChange={(event) => setRoomTypeForm((current) => ({ ...current, name: event.target.value }))}
                      />
                    </label>
                    <label>
                      Base capacity
                      <input
                        type="number"
                        min={1}
                        value={roomTypeForm.baseCapacity}
                        onChange={(event) => setRoomTypeForm((current) => ({ ...current, baseCapacity: event.target.value }))}
                      />
                    </label>
                    <label>
                      Max capacity
                      <input
                        type="number"
                        min={1}
                        value={roomTypeForm.maxCapacity}
                        onChange={(event) => setRoomTypeForm((current) => ({ ...current, maxCapacity: event.target.value }))}
                      />
                    </label>
                    <label>
                      Base price
                      <input
                        type="number"
                        min={0}
                        value={roomTypeForm.basePrice}
                        onChange={(event) => setRoomTypeForm((current) => ({ ...current, basePrice: event.target.value }))}
                      />
                    </label>
                  </div>

                  <div className="action-group">
                    <button
                      type="button"
                      onClick={() => {
                        if (editingRoomTypeId !== null) {
                          onUpdateRoomType(editingRoomTypeId, roomTypeForm);
                          setEditingRoomTypeId(null);
                          return;
                        }
                        onCreateRoomType(selectedAccommodation.accommodationId, roomTypeForm);
                      }}
                    >
                      {editingRoomTypeId === null ? 'Create room type' : 'Save room type'}
                    </button>
                    {editingRoomTypeId !== null ? (
                      <button type="button" className="secondary-button" onClick={() => setEditingRoomTypeId(null)}>
                        Cancel edit
                      </button>
                    ) : null}
                  </div>

                  <div className="history-list">
                    {accommodationDetail.roomTypes.map((roomType) => (
                      <article key={roomType.roomTypeId} className="history-item">
                        <div className="history-header">
                          <strong>{roomType.name}</strong>
                          <StatusPill tone={roomType.status === 'ACTIVE' ? 'success' : 'default'}>
                            {roomType.status}
                          </StatusPill>
                        </div>
                        <p className="detail-line">
                          Capacity {roomType.baseCapacity} to {roomType.maxCapacity} / Base {roomType.basePrice.toLocaleString('ko-KR')} KRW
                        </p>
                        <p className="detail-line">
                          Rooms {roomType.roomCount} / Active rooms {roomType.activeRoomCount}
                        </p>
                        <div className="action-group">
                          <button type="button" className="secondary-button" onClick={() => setEditingRoomTypeId(roomType.roomTypeId)}>
                            Edit
                          </button>
                          <button type="button" className="danger-button" onClick={() => onDeactivateRoomType(roomType.roomTypeId)}>
                            Deactivate
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Rooms" subtitle="Manage physical room status without losing sight of future nightly assignments.">
                  <div className="asset-form-grid">
                    <label>
                      Room type
                      <select
                        value={roomCreateForm.roomTypeId}
                        onChange={(event) => setRoomCreateForm((current) => ({ ...current, roomTypeId: event.target.value }))}
                      >
                        {accommodationDetail.roomTypes.map((roomType) => (
                          <option key={roomType.roomTypeId} value={roomType.roomTypeId}>
                            {roomType.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Room code
                      <input
                        value={editingRoomId === null ? roomCreateForm.roomCode : roomUpdateForm.roomCode}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (editingRoomId === null) {
                            setRoomCreateForm((current) => ({ ...current, roomCode: value }));
                          } else {
                            setRoomUpdateForm((current) => ({ ...current, roomCode: value }));
                          }
                        }}
                      />
                    </label>
                    <label>
                      Status
                      <select
                        value={editingRoomId === null ? roomCreateForm.status : roomUpdateForm.status}
                        onChange={(event) => {
                          const value = event.target.value as RoomStatus;
                          if (editingRoomId === null) {
                            setRoomCreateForm((current) => ({ ...current, status: value }));
                          } else {
                            setRoomUpdateForm((current) => ({ ...current, status: value }));
                          }
                        }}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </label>
                    <label className="asset-form-grid-wide">
                      Memo
                      <textarea
                        rows={3}
                        value={editingRoomId === null ? roomCreateForm.memo : roomUpdateForm.memo}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (editingRoomId === null) {
                            setRoomCreateForm((current) => ({ ...current, memo: value }));
                          } else {
                            setRoomUpdateForm((current) => ({ ...current, memo: value }));
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="action-group">
                    <button
                      type="button"
                      onClick={() => {
                        if (editingRoomId !== null) {
                          onUpdateRoom(editingRoomId, roomUpdateForm);
                          setEditingRoomId(null);
                          return;
                        }
                        onCreateRoom(selectedAccommodation.accommodationId, roomCreateForm);
                      }}
                    >
                      {editingRoomId === null ? 'Create room' : 'Save room'}
                    </button>
                    {editingRoomId !== null ? (
                      <button type="button" className="secondary-button" onClick={() => setEditingRoomId(null)}>
                        Cancel edit
                      </button>
                    ) : null}
                  </div>

                  <div className="history-list">
                    {accommodationDetail.rooms.map((room) => (
                      <article key={room.roomId} className="history-item">
                        <div className="history-header">
                          <strong>
                            {room.roomCode} / {room.roomTypeName}
                          </strong>
                          <StatusPill tone={room.status === 'ACTIVE' ? 'success' : room.status === 'MAINTENANCE' ? 'warning' : 'default'}>
                            {formatAssetStatus(room.status)}
                          </StatusPill>
                        </div>
                        {room.memo ? <p className="detail-line">{room.memo}</p> : null}
                        <p className="detail-line">
                          {room.hasFutureAssignments ? 'Future nightly assignments exist.' : 'No future nightly assignments.'}
                        </p>
                        <div className="action-group">
                          <button type="button" className="secondary-button" onClick={() => setEditingRoomId(room.roomId)}>
                            Edit
                          </button>
                          <button type="button" className="danger-button" onClick={() => onDeactivateRoom(room.roomId)}>
                            Deactivate
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </SectionCard>
              </>
            ) : loadingAccommodationDetail ? (
              <SectionCard title="Property detail" subtitle="Loading the selected property.">
                <p className="empty-state">Loading accommodation detail...</p>
              </SectionCard>
            ) : null}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
