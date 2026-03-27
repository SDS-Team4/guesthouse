import { SectionCard } from '../../components/ops/SectionCard';
import { formatHostRoleRequestStatusFilter, formatTimestamp, hostRoleRequestStatusFilters } from '../../lib/format';
import type { AdminHostRoleRequest, HostRoleRequestStatusFilter } from '../../lib/types';

type AdminRoleRequestsPageProps = {
  hostRoleRequestFilter: HostRoleRequestStatusFilter;
  adminHostRoleRequests: AdminHostRoleRequest[];
  selectedHostRoleRequestId: number | null;
  hostRoleRequestDetail: AdminHostRoleRequest | null;
  loadingHostRoleRequests: boolean;
  loadingHostRoleRequestDetail: boolean;
  reviewingHostRoleRequestId: number | null;
  adminReviewReason: string;
  onRefreshRequests: () => void;
  onFilterChange: (filter: HostRoleRequestStatusFilter) => void;
  onOpenRequest: (requestId: number) => void;
  onReviewReasonChange: (value: string) => void;
  onApprove: (request: AdminHostRoleRequest) => void;
  onReject: (request: AdminHostRoleRequest) => void;
};

export function AdminRoleRequestsPage({
  hostRoleRequestFilter,
  adminHostRoleRequests,
  selectedHostRoleRequestId,
  hostRoleRequestDetail,
  loadingHostRoleRequests,
  loadingHostRoleRequestDetail,
  reviewingHostRoleRequestId,
  adminReviewReason,
  onRefreshRequests,
  onFilterChange,
  onOpenRequest,
  onReviewReasonChange,
  onApprove,
  onReject
}: AdminRoleRequestsPageProps) {
  return (
    <SectionCard
      title="Host role requests"
      subtitle="Approve or reject guest-to-host role requests."
      actions={
        <button type="button" className="secondary-button" onClick={onRefreshRequests} disabled={loadingHostRoleRequests}>
          {loadingHostRoleRequests ? 'Refreshing...' : 'Refresh requests'}
        </button>
      }
    >
      <div className="filter-row">
        {hostRoleRequestStatusFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={filter === hostRoleRequestFilter ? 'filter-chip filter-chip-active' : 'filter-chip'}
            onClick={() => onFilterChange(filter)}
          >
            {formatHostRoleRequestStatusFilter(filter)}
          </button>
        ))}
      </div>

      <div className="admin-grid admin-grid-wide">
        <section className="detail-card">
          {adminHostRoleRequests.length === 0 ? (
            <p className="empty-state">No host role requests match the current filter.</p>
          ) : (
            <div className="admin-list">
              {adminHostRoleRequests.map((request) => (
                <button
                  key={request.requestId}
                  type="button"
                  className={`result-card ${request.requestId === selectedHostRoleRequestId ? 'result-card-active' : ''}`}
                  onClick={() => onOpenRequest(request.requestId)}
                >
                  <div className="result-card-header">
                    <div>
                      <strong>{request.userLoginId}</strong>
                      <p>{request.userName}</p>
                    </div>
                    <span className={`status-pill status-${request.status.toLowerCase()}`}>{request.status}</span>
                  </div>
                  <div className="result-metrics">
                    <span>User role: {request.userRole}</span>
                    <span>User status: {request.userStatus}</span>
                    <span>Requested: {formatTimestamp(request.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="detail-card">
          {loadingHostRoleRequestDetail ? <p className="empty-state">Loading request detail...</p> : null}
          {!loadingHostRoleRequestDetail && !hostRoleRequestDetail ? (
            <p className="empty-state">Choose one request to inspect or review it.</p>
          ) : hostRoleRequestDetail ? (
            <div className="detail-stack">
              <div>
                <h4>{hostRoleRequestDetail.userLoginId}</h4>
                <p className="detail-line">{hostRoleRequestDetail.userName}</p>
                <p className="detail-line">{hostRoleRequestDetail.requestReason}</p>
                <p className="detail-line">
                  Status {hostRoleRequestDetail.status} / Requested {formatTimestamp(hostRoleRequestDetail.createdAt)}
                </p>
                {hostRoleRequestDetail.reviewedAt ? (
                  <p className="detail-line">Reviewed {formatTimestamp(hostRoleRequestDetail.reviewedAt)}</p>
                ) : null}
                {hostRoleRequestDetail.reviewedByLoginId ? (
                  <p className="detail-line">
                    Reviewer {hostRoleRequestDetail.reviewedByName} ({hostRoleRequestDetail.reviewedByLoginId})
                  </p>
                ) : null}
                {hostRoleRequestDetail.reviewReason ? (
                  <p className="detail-line history-reason">{hostRoleRequestDetail.reviewReason}</p>
                ) : null}
              </div>

              <label>
                Review reason
                <textarea
                  rows={4}
                  value={adminReviewReason}
                  placeholder="Optional on approve, required on reject."
                  onChange={(event) => onReviewReasonChange(event.target.value)}
                />
              </label>

              <div className="action-group">
                <button
                  type="button"
                  disabled={
                    hostRoleRequestDetail.status !== 'PENDING' || reviewingHostRoleRequestId === hostRoleRequestDetail.requestId
                  }
                  onClick={() => onApprove(hostRoleRequestDetail)}
                >
                  {reviewingHostRoleRequestId === hostRoleRequestDetail.requestId ? 'Working...' : 'Approve host role'}
                </button>
                <button
                  type="button"
                  className="danger-button"
                  disabled={
                    hostRoleRequestDetail.status !== 'PENDING' || reviewingHostRoleRequestId === hostRoleRequestDetail.requestId
                  }
                  onClick={() => onReject(hostRoleRequestDetail)}
                >
                  {reviewingHostRoleRequestId === hostRoleRequestDetail.requestId ? 'Working...' : 'Reject request'}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </SectionCard>
  );
}
