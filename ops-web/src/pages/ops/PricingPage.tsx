import type { FormEvent } from 'react';

import { SectionCard } from '../../components/ops/SectionCard';
import { formatPricingDayMask, formatPriceDelta, formatTimestamp, pricingWeekdayOptions } from '../../lib/format';
import type { PricePolicyManagement } from '../../lib/types';

type PricingPageProps = {
  pricePolicyManagement: PricePolicyManagement | null;
  loadingPricePolicies: boolean;
  creatingPricePolicy: boolean;
  deactivatingPolicyId: number | null;
  pricingAccommodationId: string;
  pricingRoomTypeFilterId: string;
  newPolicyRoomTypeId: string;
  newPolicyName: string;
  newPolicyStartDate: string;
  newPolicyEndDate: string;
  newPolicyDeltaAmount: string;
  newPolicyDayBits: number[];
  onRefresh: () => void;
  onAccommodationChange: (value: string) => void;
  onRoomTypeFilterChange: (value: string) => void;
  onNewPolicyRoomTypeIdChange: (value: string) => void;
  onNewPolicyNameChange: (value: string) => void;
  onNewPolicyStartDateChange: (value: string) => void;
  onNewPolicyEndDateChange: (value: string) => void;
  onNewPolicyDeltaAmountChange: (value: string) => void;
  onToggleDayBit: (bit: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDeactivate: (policyId: number) => void;
};

export function PricingPage({
  pricePolicyManagement,
  loadingPricePolicies,
  creatingPricePolicy,
  deactivatingPolicyId,
  pricingAccommodationId,
  pricingRoomTypeFilterId,
  newPolicyRoomTypeId,
  newPolicyName,
  newPolicyStartDate,
  newPolicyEndDate,
  newPolicyDeltaAmount,
  newPolicyDayBits,
  onRefresh,
  onAccommodationChange,
  onRoomTypeFilterChange,
  onNewPolicyRoomTypeIdChange,
  onNewPolicyNameChange,
  onNewPolicyStartDateChange,
  onNewPolicyEndDateChange,
  onNewPolicyDeltaAmountChange,
  onToggleDayBit,
  onSubmit,
  onDeactivate
}: PricingPageProps) {
  return (
    <SectionCard
      title="Pricing management"
      subtitle="Create and deactivate room-type additive delta policies. Overlapping active policies stay allowed and additive."
      actions={
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={loadingPricePolicies}>
          {loadingPricePolicies ? 'Refreshing...' : 'Refresh pricing'}
        </button>
      }
    >
      {!pricePolicyManagement || pricePolicyManagement.accommodations.length === 0 ? (
        <p className="empty-state">No accessible accommodations are available for pricing management.</p>
      ) : (
        <div className="detail-stack">
          <div className="field-grid">
            <label>
              Accommodation
              <select value={pricingAccommodationId} onChange={(event) => onAccommodationChange(event.target.value)}>
                {pricePolicyManagement.accommodations.map((accommodation) => (
                  <option key={accommodation.accommodationId} value={accommodation.accommodationId}>
                    {accommodation.accommodationName} / {accommodation.region}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Room type filter
              <select value={pricingRoomTypeFilterId} onChange={(event) => onRoomTypeFilterChange(event.target.value)}>
                <option value="ALL">All room types</option>
                {pricePolicyManagement.roomTypes.map((roomType) => (
                  <option key={roomType.roomTypeId} value={roomType.roomTypeId}>
                    {roomType.roomTypeName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <form className="detail-card" onSubmit={onSubmit}>
            <h4>Create price policy</h4>
            <div className="field-grid">
              <label>
                Room type
                <select value={newPolicyRoomTypeId} onChange={(event) => onNewPolicyRoomTypeIdChange(event.target.value)}>
                  <option value="">Select a room type</option>
                  {pricePolicyManagement.roomTypes.map((roomType) => (
                    <option key={roomType.roomTypeId} value={roomType.roomTypeId}>
                      {roomType.roomTypeName} / Base {roomType.basePrice.toLocaleString('ko-KR')} KRW
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Policy name
                <input value={newPolicyName} onChange={(event) => onNewPolicyNameChange(event.target.value)} />
              </label>
              <label>
                Start date
                <input type="date" value={newPolicyStartDate} onChange={(event) => onNewPolicyStartDateChange(event.target.value)} />
              </label>
              <label>
                End date
                <input type="date" value={newPolicyEndDate} onChange={(event) => onNewPolicyEndDateChange(event.target.value)} />
              </label>
            </div>

            <div className="field-grid">
              <label>
                Additive delta amount (KRW)
                <input
                  type="number"
                  step="1000"
                  value={newPolicyDeltaAmount}
                  onChange={(event) => onNewPolicyDeltaAmountChange(event.target.value)}
                />
              </label>
            </div>

            <div className="weekday-picker">
              <span className="weekday-label">Weekday mask</span>
              <div className="weekday-options">
                {pricingWeekdayOptions.map((option) => (
                  <label key={option.bit} className="weekday-option">
                    <input
                      type="checkbox"
                      checked={newPolicyDayBits.includes(option.bit)}
                      onChange={() => onToggleDayBit(option.bit)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <p className="row-subtext">
                Leave all days unchecked to apply the additive delta every day. If multiple active policies overlap,
                their deltas are summed.
              </p>
            </div>

            <div className="block-actions">
              <button type="submit" disabled={creatingPricePolicy}>
                {creatingPricePolicy ? 'Creating...' : 'Create price policy'}
              </button>
            </div>
          </form>

          {pricePolicyManagement.policies.length === 0 ? (
            <p className="empty-state">No price policies match the current accommodation or room-type filter.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>Room type</th>
                    <th>Date range</th>
                    <th>Delta</th>
                    <th>Weekdays</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pricePolicyManagement.policies.map((policy) => (
                    <tr key={policy.policyId}>
                      <td>
                        <strong>{policy.policyName}</strong>
                        <div className="row-subtext">Policy {policy.policyId}</div>
                        <div className="row-subtext">{policy.accommodationName}</div>
                        <span className={`status-pill status-${policy.status.toLowerCase()}`}>{policy.status}</span>
                      </td>
                      <td>
                        {policy.roomTypeName}
                        <div className="row-subtext">Room type ID {policy.roomTypeId}</div>
                      </td>
                      <td>
                        {policy.startDate} to {policy.endDate}
                      </td>
                      <td>{formatPriceDelta(policy.deltaAmount)}</td>
                      <td>{formatPricingDayMask(policy.dayOfWeekMask)}</td>
                      <td>{formatTimestamp(policy.createdAt)}</td>
                      <td>
                        {policy.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            className="danger-button"
                            disabled={deactivatingPolicyId === policy.policyId}
                            onClick={() => onDeactivate(policy.policyId)}
                          >
                            {deactivatingPolicyId === policy.policyId ? 'Working...' : 'Deactivate'}
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
