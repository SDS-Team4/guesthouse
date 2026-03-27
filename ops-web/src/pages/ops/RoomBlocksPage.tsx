import type { FormEvent } from 'react';

import { SectionCard } from '../../components/ops/SectionCard';
import { formatBlockReasonType, formatTimestamp } from '../../lib/format';
import type { RoomBlockManagement, RoomBlockReasonType } from '../../lib/types';

type RoomBlocksPageProps = {
  roomBlockManagement: RoomBlockManagement | null;
  loadingRoomBlocks: boolean;
  creatingRoomBlock: boolean;
  deactivatingBlockId: number | null;
  blockAccommodationId: string;
  blockRoomFilterId: string;
  newBlockRoomId: string;
  newBlockStartDate: string;
  newBlockEndDate: string;
  newBlockReasonType: RoomBlockReasonType;
  newBlockReasonText: string;
  roomBlockReasonChoices: Array<{ value: RoomBlockReasonType; label: string }>;
  onRefresh: () => void;
  onAccommodationChange: (value: string) => void;
  onRoomFilterChange: (value: string) => void;
  onNewBlockRoomIdChange: (value: string) => void;
  onNewBlockStartDateChange: (value: string) => void;
  onNewBlockEndDateChange: (value: string) => void;
  onNewBlockReasonTypeChange: (value: RoomBlockReasonType) => void;
  onNewBlockReasonTextChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDeactivate: (blockId: number) => void;
};

export function RoomBlocksPage({
  roomBlockManagement,
  loadingRoomBlocks,
  creatingRoomBlock,
  deactivatingBlockId,
  blockAccommodationId,
  blockRoomFilterId,
  newBlockRoomId,
  newBlockStartDate,
  newBlockEndDate,
  newBlockReasonType,
  newBlockReasonText,
  roomBlockReasonChoices,
  onRefresh,
  onAccommodationChange,
  onRoomFilterChange,
  onNewBlockRoomIdChange,
  onNewBlockStartDateChange,
  onNewBlockEndDateChange,
  onNewBlockReasonTypeChange,
  onNewBlockReasonTextChange,
  onSubmit,
  onDeactivate
}: RoomBlocksPageProps) {
  return (
    <SectionCard
      title="Room block management"
      subtitle="Create and deactivate room-level blocks without changing room-type inventory rules."
      actions={
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={loadingRoomBlocks}>
          {loadingRoomBlocks ? 'Refreshing...' : 'Refresh room blocks'}
        </button>
      }
    >
      {!roomBlockManagement || roomBlockManagement.accommodations.length === 0 ? (
        <p className="empty-state">No accessible accommodations are available for room-block management.</p>
      ) : (
        <div className="detail-stack">
          <div className="field-grid">
            <label>
              Accommodation
              <select value={blockAccommodationId} onChange={(event) => onAccommodationChange(event.target.value)}>
                {roomBlockManagement.accommodations.map((accommodation) => (
                  <option key={accommodation.accommodationId} value={accommodation.accommodationId}>
                    {accommodation.accommodationName} / {accommodation.region}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Room filter
              <select value={blockRoomFilterId} onChange={(event) => onRoomFilterChange(event.target.value)}>
                <option value="ALL">All rooms</option>
                {roomBlockManagement.rooms.map((room) => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.roomCode} / {room.roomTypeName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <form className="detail-card" onSubmit={onSubmit}>
            <h4>Create room block</h4>
            <div className="field-grid">
              <label>
                Room
                <select value={newBlockRoomId} onChange={(event) => onNewBlockRoomIdChange(event.target.value)}>
                  <option value="">Select a room</option>
                  {roomBlockManagement.rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.roomCode} / {room.roomTypeName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Start date
                <input type="date" value={newBlockStartDate} onChange={(event) => onNewBlockStartDateChange(event.target.value)} />
              </label>
              <label>
                End date
                <input type="date" value={newBlockEndDate} onChange={(event) => onNewBlockEndDateChange(event.target.value)} />
              </label>
              <label>
                Reason type
                <select value={newBlockReasonType} onChange={(event) => onNewBlockReasonTypeChange(event.target.value as RoomBlockReasonType)}>
                  {roomBlockReasonChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Reason text
              <textarea rows={3} value={newBlockReasonText} onChange={(event) => onNewBlockReasonTextChange(event.target.value)} />
            </label>

            <div className="block-actions">
              <button type="submit" disabled={creatingRoomBlock}>
                {creatingRoomBlock ? 'Creating...' : 'Create room block'}
              </button>
            </div>
          </form>

          {roomBlockManagement.blocks.length === 0 ? (
            <p className="empty-state">No room blocks match the current accommodation or room filter.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Block</th>
                    <th>Room</th>
                    <th>Date range</th>
                    <th>Reason</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roomBlockManagement.blocks.map((block) => (
                    <tr key={block.blockId}>
                      <td>
                        <strong>Block {block.blockId}</strong>
                        <div className="row-subtext">{block.accommodationName}</div>
                        <span className={`status-pill status-${block.status.toLowerCase()}`}>{block.status}</span>
                      </td>
                      <td>
                        {block.roomCode}
                        <div className="row-subtext">{block.roomTypeName}</div>
                      </td>
                      <td>
                        {block.startDate} to {block.endDate}
                      </td>
                      <td>
                        <div>{formatBlockReasonType(block.reasonType)}</div>
                        {block.reasonText ? <div className="row-subtext">{block.reasonText}</div> : null}
                      </td>
                      <td>
                        {formatTimestamp(block.createdAt)}
                        <div className="row-subtext">
                          By {block.createdByName} ({block.createdByLoginId})
                        </div>
                      </td>
                      <td>
                        {block.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            className="danger-button"
                            disabled={deactivatingBlockId === block.blockId}
                            onClick={() => onDeactivate(block.blockId)}
                          >
                            {deactivatingBlockId === block.blockId ? 'Working...' : 'Deactivate'}
                          </button>
                        ) : (
                          <span className="row-subtext">Already inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
