import { useMemo } from 'react'

/**
 * Gantt-style timeline showing connection state transitions over time
 */
function ConnectionHealthTimeline({ events, qualityLimitation, duration }) {
  const lanes = useMemo(() => {
    if (!events || events.length === 0) return []

    // Get time range - filter out invalid times
    const times = events.map(e => e.time).filter(t => t != null && !isNaN(t) && isFinite(t))
    if (times.length === 0) return []

    const minTime = Math.min(...times)
    const maxTime = duration ? minTime + duration : Math.max(...times)
    const timeRange = maxTime - minTime || 1

    // Group events by type
    const iceConnectionEvents = events.filter(e =>
      e.type?.toLowerCase().includes('iceconnectionstate')
    )
    const iceGatheringEvents = events.filter(e =>
      e.type?.toLowerCase().includes('icegatheringstate')
    )
    const signalingEvents = events.filter(e =>
      e.type?.toLowerCase().includes('signalingstate')
    )
    const connectionEvents = events.filter(e =>
      e.type?.toLowerCase().includes('connectionstate') &&
      !e.type?.toLowerCase().includes('ice')
    )

    const lanesData = []

    // ICE Connection State lane
    if (iceConnectionEvents.length > 0) {
      lanesData.push({
        label: 'ICE Conn',
        segments: buildSegments(iceConnectionEvents, minTime, maxTime, timeRange)
      })
    }

    // ICE Gathering State lane
    if (iceGatheringEvents.length > 0) {
      lanesData.push({
        label: 'ICE Gather',
        segments: buildSegments(iceGatheringEvents, minTime, maxTime, timeRange)
      })
    }

    // Signaling State lane
    if (signalingEvents.length > 0) {
      lanesData.push({
        label: 'Signaling',
        segments: buildSegments(signalingEvents, minTime, maxTime, timeRange)
      })
    }

    // Connection State lane (DTLS)
    if (connectionEvents.length > 0) {
      lanesData.push({
        label: 'DTLS',
        segments: buildSegments(connectionEvents, minTime, maxTime, timeRange)
      })
    }

    // Quality Limitation lane
    if (qualityLimitation && qualityLimitation.length > 0) {
      lanesData.push({
        label: 'Quality',
        segments: buildQualitySegments(qualityLimitation, minTime, maxTime, timeRange)
      })
    }

    return { lanes: lanesData, minTime, maxTime, timeRange }
  }, [events, qualityLimitation, duration])

  if (!lanes.lanes || lanes.lanes.length === 0) {
    return null
  }

  const formatTime = (ms) => {
    if (ms == null || isNaN(ms) || !isFinite(ms)) return '—'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="health-timeline">
      {lanes.lanes.map((lane, i) => (
        <div key={i} className="timeline-lane">
          <div className="timeline-lane-label">{lane.label}</div>
          <div className="timeline-lane-track">
            {lane.segments.map((segment, j) => (
              <div
                key={j}
                className={`timeline-segment ${segment.className}`}
                style={{
                  left: `${segment.start}%`,
                  width: `${Math.max(segment.width, 0.5)}%`
                }}
                title={`${segment.state}: ${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`}
              >
                {segment.width > 12 ? segment.label : ''}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="timeline-time-axis">
        <span>0:00</span>
        <span>{formatTime((lanes.maxTime - lanes.minTime) / 4)}</span>
        <span>{formatTime((lanes.maxTime - lanes.minTime) / 2)}</span>
        <span>{formatTime((lanes.maxTime - lanes.minTime) * 3 / 4)}</span>
        <span>{formatTime(lanes.maxTime - lanes.minTime)}</span>
      </div>
    </div>
  )
}

function buildSegments(events, minTime, maxTime, timeRange) {
  const segments = []
  if (events.length === 0) return segments

  // Sort events by time and normalize state for comparison
  const sortedEvents = [...events].sort((a, b) => a.time - b.time)
  const normalizeState = (s) => (s || 'unknown').toString().trim().toLowerCase()

  let currentState = null
  let currentStateRaw = null
  let segmentStart = null

  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i]
    const stateRaw = event.value || 'unknown'
    const stateNorm = normalizeState(stateRaw)

    if (stateNorm !== currentState) {
      // Close previous segment
      if (currentState !== null && segmentStart !== null) {
        const endTime = event.time
        const startPercent = ((segmentStart - minTime) / timeRange) * 100
        const widthPercent = ((endTime - segmentStart) / timeRange) * 100

        segments.push({
          state: currentStateRaw,
          label: formatStateLabel(currentStateRaw),
          className: `state-${currentState.replace(/[^a-z]/g, '-')}`,
          start: startPercent,
          width: widthPercent,
          startTime: segmentStart - minTime,
          endTime: endTime - minTime
        })
      }

      // Start new segment
      currentState = stateNorm
      currentStateRaw = stateRaw
      segmentStart = event.time
    }
  }

  // Close final segment
  if (currentState !== null && segmentStart !== null) {
    const startPercent = ((segmentStart - minTime) / timeRange) * 100
    const widthPercent = ((maxTime - segmentStart) / timeRange) * 100

    segments.push({
      state: currentStateRaw,
      label: formatStateLabel(currentStateRaw),
      className: `state-${currentState.replace(/[^a-z]/g, '-')}`,
      start: startPercent,
      width: widthPercent,
      startTime: segmentStart - minTime,
      endTime: maxTime - minTime
    })
  }

  return segments
}

function buildQualitySegments(qualityData, minTime, maxTime, timeRange) {
  const segments = []
  let currentReason = null
  let segmentStart = null

  for (let i = 0; i < qualityData.length; i++) {
    const point = qualityData[i]
    const reason = point.reason || 'none'

    if (reason !== currentReason) {
      // Close previous segment
      if (currentReason !== null && segmentStart !== null) {
        const endTime = point.time
        const startPercent = ((segmentStart - minTime) / timeRange) * 100
        const widthPercent = ((endTime - segmentStart) / timeRange) * 100

        segments.push({
          state: currentReason,
          label: currentReason === 'none' ? '' : currentReason.toUpperCase(),
          className: `limit-${currentReason.toLowerCase()}`,
          start: startPercent,
          width: widthPercent,
          startTime: segmentStart - minTime,
          endTime: endTime - minTime
        })
      }

      // Start new segment
      currentReason = reason
      segmentStart = point.time
    }
  }

  // Close final segment
  if (currentReason !== null && segmentStart !== null) {
    const startPercent = ((segmentStart - minTime) / timeRange) * 100
    const widthPercent = ((maxTime - segmentStart) / timeRange) * 100

    segments.push({
      state: currentReason,
      label: currentReason === 'none' ? '' : currentReason.toUpperCase(),
      className: `limit-${currentReason.toLowerCase()}`,
      start: startPercent,
      width: widthPercent,
      startTime: segmentStart - minTime,
      endTime: maxTime - minTime
    })
  }

  return segments
}

function formatStateLabel(state) {
  // Use readable state names
  const stateMap = {
    'new': 'new',
    'checking': 'checking',
    'connected': 'connected',
    'completed': 'completed',
    'disconnected': 'disconnected',
    'failed': 'failed',
    'closed': 'closed',
    'gathering': 'gathering',
    'complete': 'complete',
    'stable': 'stable',
    'have-local-offer': 'local-offer',
    'have-remote-offer': 'remote-offer',
    'have-local-pranswer': 'local-pranswer',
    'have-remote-pranswer': 'remote-pranswer',
    'connecting': 'connecting'
  }
  return stateMap[state.toLowerCase()] || state
}

export default ConnectionHealthTimeline
