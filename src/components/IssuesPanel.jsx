import { useState } from 'react'

function IssuesPanel({ issues }) {
  const [expandedId, setExpandedId] = useState(null)

  if (issues.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Issues Detected</h2>
        </div>
        <div className="empty-state" style={{ padding: '24px' }}>
          <svg className="empty-state-icon" style={{ width: '48px', height: '48px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3 style={{ color: 'var(--success-green)' }}>No issues detected</h3>
          <p>This call appears to have good quality metrics.</p>
        </div>
      </div>
    )
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Issues Detected</h2>
        <span className={`issues-count ${issues.some(i => i.severity === 'critical') ? 'critical' : 'warning'}`}>
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="issues-list">
        {issues.map(issue => (
          <div
            key={issue.id}
            className="issue-card"
            onClick={() => toggleExpand(issue.id)}
          >
            <div className={`issue-icon ${issue.severity}`}>
              {issue.severity === 'critical' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>

            <div className="issue-content">
              <div className="issue-title">{issue.title}</div>
              <div className="issue-description">{issue.description}</div>
              {issue.timestamp && (
                <div className="issue-time">
                  {issue.timeRange || issue.timestamp}
                </div>
              )}

              {expandedId === issue.id && issue.details && (
                <div className="issue-details">
                  <strong>Recommendation:</strong> {issue.details}
                </div>
              )}
            </div>

            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: expandedId === issue.id ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s',
                flexShrink: 0,
                color: 'var(--text-muted)'
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IssuesPanel
