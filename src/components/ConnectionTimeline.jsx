import { useState } from 'react'

function ConnectionTimeline({ events }) {
  const [hoveredEvent, setHoveredEvent] = useState(null)

  if (!events || events.length === 0) {
    return (
      <div className="card compact">
        <div className="card-header compact">
          <h2 className="card-title">Timeline</h2>
        </div>
        <div className="empty-state" style={{ padding: '16px' }}>
          <p>No connection events found.</p>
        </div>
      </div>
    )
  }

  // Filter to important state change events
  const stateEvents = events.filter(e =>
    e.type.includes('State') ||
    e.type === 'iceConnectionState' ||
    e.type === 'iceGatheringState' ||
    e.type === 'signalingState' ||
    e.type === 'connectionState'
  )

  if (stateEvents.length === 0) {
    return (
      <div className="card compact">
        <div className="card-header compact">
          <h2 className="card-title">Timeline</h2>
        </div>
        <div className="empty-state" style={{ padding: '16px' }}>
          <p>No state change events found.</p>
        </div>
      </div>
    )
  }

  const minTime = Math.min(...stateEvents.map(e => e.timestamp))
  const maxTime = Math.max(...stateEvents.map(e => e.timestamp))
  const timeRange = maxTime - minTime || 1

  const getMarkerClass = (value) => {
    if (value === 'gathering' || value === 'checking') return 'checking'
    if (value === 'connected' || value === 'complete' || value === 'succeeded' || value === 'stable') return 'connected'
    if (value === 'failed' || value === 'closed') return 'failed'
    return 'gathering'
  }

  const formatTimestamp = (ts) => {
    const offset = ts - minTime
    const seconds = Math.floor(offset / 1000)
    const ms = offset % 1000
    return `+${seconds}.${ms.toString().padStart(3, '0')}s`
  }

  const formatEventType = (type) => {
    return type
      .replace('iceConnectionState', 'ICE Connection')
      .replace('iceGatheringState', 'ICE Gathering')
      .replace('signalingState', 'Signaling')
      .replace('connectionState', 'Connection')
  }

  return (
    <div className="card compact">
      <div className="card-header compact">
        <h2 className="card-title">Timeline</h2>
      </div>

      <div className="timeline-container compact">
        <div className="timeline-track">
          {stateEvents.map((event, index) => {
            const position = ((event.timestamp - minTime) / timeRange) * 100

            return (
              <div
                key={index}
                className={`timeline-marker ${getMarkerClass(event.value)}`}
                style={{ left: `${Math.max(2, Math.min(98, position))}%` }}
                onMouseEnter={() => setHoveredEvent(index)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {hoveredEvent === index && (
                  <div className="timeline-tooltip">
                    <strong>{formatEventType(event.type)}</strong>
                    <br />
                    {event.value}
                    <br />
                    <span style={{ color: 'var(--text-muted)' }}>
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="timeline-labels">
          <span>0s</span>
          <span>{((maxTime - minTime) / 1000).toFixed(1)}s</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.75rem' }}>
        <LegendItem color="var(--warning-yellow)" label="Gathering" />
        <LegendItem color="var(--success-green)" label="Connected" />
        <LegendItem color="var(--error-red)" label="Failed" />
      </div>

      <div style={{ marginTop: '12px' }}>
        <div style={{ maxHeight: '120px', overflow: 'auto' }}>
          {stateEvents.map((event, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '8px',
                padding: '4px 0',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.75rem'
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '60px' }}>
                {formatTimestamp(event.timestamp)}
              </span>
              <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                {formatEventType(event.type)}
              </span>
              <span style={{
                color: getMarkerClass(event.value) === 'connected' ? 'var(--success-green)' :
                       getMarkerClass(event.value) === 'failed' ? 'var(--error-red)' :
                       'var(--text-primary)',
                fontWeight: 500
              }}>
                {event.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
      {label}
    </div>
  )
}

export default ConnectionTimeline
