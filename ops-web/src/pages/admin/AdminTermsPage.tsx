import { useEffect, useState } from 'react';

import { SectionCard } from '../../components/ops/SectionCard';
import { formatTermCategory, formatTermStatus, formatTimestamp } from '../../lib/format';
import type { AdminTermDetail, AdminTermSummary } from '../../lib/types';

type AdminTermsPageProps = {
  adminTerms: AdminTermSummary[];
  selectedAdminTermId: number | null;
  adminTermDetail: AdminTermDetail | null;
  loadingAdminTerms: boolean;
  loadingAdminTermDetail: boolean;
  creatingTermDraftId: number | null;
  savingAdminTermId: number | null;
  publishingAdminTermId: number | null;
  onRefreshTerms: () => void;
  onOpenTerm: (termId: number) => void;
  onCreateDraft: (sourceTermId: number, version: string) => void;
  onUpdateDraft: (
    termId: number,
    form: { title: string; content: string; version: string; required: boolean; effectiveAt: string }
  ) => void;
  onPublish: (termId: number) => void;
};

export function AdminTermsPage({
  adminTerms,
  selectedAdminTermId,
  adminTermDetail,
  loadingAdminTerms,
  loadingAdminTermDetail,
  creatingTermDraftId,
  savingAdminTermId,
  publishingAdminTermId,
  onRefreshTerms,
  onOpenTerm,
  onCreateDraft,
  onUpdateDraft,
  onPublish
}: AdminTermsPageProps) {
  const [draftVersion, setDraftVersion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState('');
  const [required, setRequired] = useState(true);
  const [effectiveAt, setEffectiveAt] = useState('');

  useEffect(() => {
    if (!adminTermDetail) {
      setDraftVersion('');
      setTitle('');
      setContent('');
      setVersion('');
      setRequired(true);
      setEffectiveAt('');
      return;
    }

    setDraftVersion(suggestNextVersion(adminTermDetail.version));
    setTitle(adminTermDetail.title);
    setContent(adminTermDetail.content);
    setVersion(adminTermDetail.version);
    setRequired(adminTermDetail.required);
    setEffectiveAt(toDateTimeLocalValue(adminTermDetail.effectiveAt));
  }, [adminTermDetail]);

  const selectedSummary =
    selectedAdminTermId === null ? null : adminTerms.find((term) => term.termId === selectedAdminTermId) ?? null;
  const isDraft = adminTermDetail?.status === 'DRAFT';

  return (
    <SectionCard
      title="Signup terms"
      subtitle="Create a draft from the current version, edit it safely, then publish it for guest signup."
      actions={
        <button type="button" className="secondary-button" onClick={onRefreshTerms} disabled={loadingAdminTerms}>
          {loadingAdminTerms ? 'Refreshing...' : 'Refresh terms'}
        </button>
      }
    >
      <div className="admin-grid admin-grid-wide">
        <section className="detail-card">
          {adminTerms.length === 0 ? (
            <p className="empty-state">No term rows are available yet.</p>
          ) : (
            <div className="admin-list">
              {adminTerms.map((term) => (
                <button
                  key={term.termId}
                  type="button"
                  className={`result-card ${term.termId === selectedAdminTermId ? 'result-card-active' : ''}`}
                  onClick={() => onOpenTerm(term.termId)}
                >
                  <div className="result-card-header">
                    <div>
                      <strong>{term.title}</strong>
                      <p>
                        {formatTermCategory(term.category)} / v{term.version}
                      </p>
                    </div>
                    <span className={`status-pill status-${term.status.toLowerCase()}`}>{formatTermStatus(term.status)}</span>
                  </div>
                  <div className="result-metrics">
                    <span>{term.required ? 'Required' : 'Optional'}</span>
                    <span>Effective {formatTimestamp(term.effectiveAt)}</span>
                    <span>Updated {formatTimestamp(term.updatedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="detail-card">
          {loadingAdminTermDetail ? <p className="empty-state">Loading term detail...</p> : null}
          {!loadingAdminTermDetail && !adminTermDetail ? (
            <p className="empty-state">Choose one term row to inspect, draft, edit, or publish it.</p>
          ) : adminTermDetail ? (
            <div className="detail-stack">
              <div>
                <h4>{adminTermDetail.title}</h4>
                <p className="detail-line">
                  {formatTermCategory(adminTermDetail.category)} / {formatTermStatus(adminTermDetail.status)} / v
                  {adminTermDetail.version}
                </p>
                <p className="detail-line">Created {formatTimestamp(adminTermDetail.createdAt)}</p>
                <p className="detail-line">Updated {formatTimestamp(adminTermDetail.updatedAt)}</p>
              </div>

              {!isDraft ? (
                <div className="detail-stack">
                  <label>
                    New draft version
                    <input
                      value={draftVersion}
                      placeholder="1.1"
                      onChange={(event) => setDraftVersion(event.target.value)}
                    />
                  </label>
                  <div className="action-group">
                    <button
                      type="button"
                      disabled={creatingTermDraftId === adminTermDetail.termId}
                      onClick={() => onCreateDraft(adminTermDetail.termId, draftVersion)}
                    >
                      {creatingTermDraftId === adminTermDetail.termId ? 'Creating...' : 'Create draft from this version'}
                    </button>
                  </div>
                </div>
              ) : null}

              <label>
                Title
                <input value={title} disabled={!isDraft} onChange={(event) => setTitle(event.target.value)} />
              </label>

              <label>
                Version
                <input value={version} disabled={!isDraft} onChange={(event) => setVersion(event.target.value)} />
              </label>

              <label>
                Effective at
                <input
                  type="datetime-local"
                  value={effectiveAt}
                  disabled={!isDraft}
                  onChange={(event) => setEffectiveAt(event.target.value)}
                />
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={required}
                  disabled={!isDraft}
                  onChange={(event) => setRequired(event.target.checked)}
                />
                <span style={{ marginLeft: 8 }}>Required at signup</span>
              </label>

              <label>
                Content
                <textarea rows={12} value={content} disabled={!isDraft} onChange={(event) => setContent(event.target.value)} />
              </label>

              {isDraft ? (
                <div className="action-group">
                  <button
                    type="button"
                    disabled={savingAdminTermId === adminTermDetail.termId}
                    onClick={() =>
                      onUpdateDraft(adminTermDetail.termId, {
                        title,
                        content,
                        version,
                        required,
                        effectiveAt
                      })
                    }
                  >
                    {savingAdminTermId === adminTermDetail.termId ? 'Saving...' : 'Save draft'}
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    disabled={publishingAdminTermId === adminTermDetail.termId}
                    onClick={() => onPublish(adminTermDetail.termId)}
                  >
                    {publishingAdminTermId === adminTermDetail.termId ? 'Publishing...' : 'Publish draft'}
                  </button>
                </div>
              ) : selectedSummary ? (
                <p className="detail-line">Published and archived rows are read-only. Create a draft to make changes safely.</p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </SectionCard>
  );
}

function suggestNextVersion(version: string) {
  const match = version.match(/^(.*?)(\d+)$/);
  if (!match) {
    return `${version}-next`;
  }

  const prefix = match[1];
  const numeric = Number(match[2]);
  return `${prefix}${numeric + 1}`;
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
