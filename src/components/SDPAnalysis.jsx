import { useState, useMemo } from 'react'

function SDPAnalysis({ updateLog }) {
  const [expandedSections, setExpandedSections] = useState({})

  const sdpEvents = useMemo(() => {
    if (!updateLog || !Array.isArray(updateLog)) return []

    return updateLog
      .filter(entry => {
        const type = entry.type?.toLowerCase() || ''
        return type.includes('description') ||
               type.includes('createoffer') ||
               type.includes('createanswer')
      })
      .map((entry, idx) => {
        let sdp = null
        let sdpType = null

        // Parse the value to extract SDP
        if (entry.value) {
          try {
            const parsed = typeof entry.value === 'string'
              ? JSON.parse(entry.value)
              : entry.value
            sdp = parsed.sdp
            sdpType = parsed.type
          } catch {
            // Try legacy format: "type: offer, sdp: ..."
            if (typeof entry.value === 'string' && entry.value.includes('sdp:')) {
              const parts = entry.value.split(', sdp: ')
              if (parts.length >= 2) {
                sdpType = parts[0].replace('type: ', '')
                sdp = parts.slice(1).join(', sdp: ')
              }
            }
          }
        }

        return {
          id: idx,
          timestamp: entry.time,
          eventType: entry.type,
          sdpType,
          sdp,
          sections: sdp ? parseSDP(sdp) : []
        }
      })
      .filter(event => event.sdp)
  }, [updateLog])

  if (sdpEvents.length === 0) {
    return null
  }

  const toggleSection = (eventId, sectionIdx) => {
    const key = `${eventId}-${sectionIdx}`
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleEvent = (eventId) => {
    const key = `event-${eventId}`
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>SDP Analysis</h3>
        <span className="badge badge-info">{sdpEvents.length} descriptions</span>
      </div>

      <div className="sdp-events">
        {sdpEvents.map(event => (
          <SDPEvent
            key={event.id}
            event={event}
            expanded={expandedSections}
            toggleEvent={toggleEvent}
            toggleSection={toggleSection}
          />
        ))}
      </div>
    </div>
  )
}

function SDPEvent({ event, expanded, toggleEvent, toggleSection }) {
  const isExpanded = expanded[`event-${event.id}`]

  return (
    <div className={`sdp-event ${event.sdpType}`}>
      <div className="sdp-event-header" onClick={() => toggleEvent(event.id)}>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className={`sdp-event-type ${event.eventType}`}>
          {formatEventType(event.eventType)}
        </span>
        <span className={`sdp-type-badge ${event.sdpType}`}>
          {event.sdpType}
        </span>
        <span className="sdp-sections-count">
          {event.sections.length} media sections
        </span>
        {event.timestamp && (
          <span className="sdp-timestamp">
            {formatTime(event.timestamp)}
          </span>
        )}
        <CopyButton text={JSON.stringify({ type: event.sdpType, sdp: event.sdp })} />
      </div>

      {isExpanded && (
        <div className="sdp-sections">
          {event.sections.map((section, idx) => (
            <SDPSection
              key={idx}
              section={section}
              eventId={event.id}
              sectionIdx={idx}
              expanded={expanded[`${event.id}-${idx}`]}
              toggleSection={toggleSection}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SDPSection({ section, eventId, sectionIdx, expanded, toggleSection }) {
  const isSession = section.type === 'session'

  return (
    <div className={`sdp-section ${section.type} ${section.direction || ''}`}>
      <div
        className="sdp-section-header"
        onClick={() => toggleSection(eventId, sectionIdx)}
      >
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
        <span className="sdp-section-title">
          {isSession ? 'Session' : section.mediaLine}
        </span>
        {section.mid && <span className="sdp-mid">mid={section.mid}</span>}
        {section.direction && (
          <span className={`sdp-direction ${section.direction}`}>
            {section.direction}
          </span>
        )}
        {section.rejected && <span className="sdp-rejected">rejected</span>}
        {section.codec && (
          <span className="sdp-codec">{section.codec}</span>
        )}
        <span className="sdp-line-count">
          {section.lines.length} lines
        </span>
      </div>

      {expanded && (
        <pre className="sdp-content">
          {section.lines.map((line, idx) => (
            <SDPLine key={idx} line={line} />
          ))}
        </pre>
      )}
    </div>
  )
}

function SDPLine({ line }) {
  const lineType = line.charAt(0)
  const className = getLineClassName(line)

  return (
    <div className={`sdp-line ${className}`}>
      <span className="sdp-line-type">{lineType}=</span>
      <span className="sdp-line-value">{line.substring(2)}</span>
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button className="sdp-copy-btn" onClick={handleCopy} title="Copy SDP">
      {copied ? '✓' : '📋'}
    </button>
  )
}

function parseSDP(sdp) {
  if (!sdp) return []

  const lines = sdp.split('\n').map(line => line.trim()).filter(Boolean)
  const sections = []
  let currentSection = null

  lines.forEach(line => {
    if (line.startsWith('m=')) {
      // New media section
      if (currentSection) {
        sections.push(currentSection)
      }

      const mediaLine = line.substring(2)
      const parts = mediaLine.split(' ')
      const mediaType = parts[0]
      const port = parseInt(parts[1], 10)

      currentSection = {
        type: 'media',
        mediaType,
        mediaLine,
        rejected: port === 0,
        lines: [line],
        mid: null,
        direction: null,
        codec: null
      }
    } else if (currentSection === null) {
      // Session section
      if (sections.length === 0) {
        currentSection = {
          type: 'session',
          lines: []
        }
      }
      if (currentSection) {
        currentSection.lines.push(line)
      }
    } else {
      currentSection.lines.push(line)

      // Extract mid
      if (line.startsWith('a=mid:')) {
        currentSection.mid = line.substring(6)
      }

      // Extract direction
      if (['a=sendrecv', 'a=sendonly', 'a=recvonly', 'a=inactive'].includes(line)) {
        currentSection.direction = line.substring(2)
      }

      // Extract primary codec
      if (line.startsWith('a=rtpmap:') && !currentSection.codec) {
        const codecMatch = line.match(/a=rtpmap:\d+\s+([^\/]+)/)
        if (codecMatch) {
          currentSection.codec = codecMatch[1]
        }
      }
    }
  })

  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

function formatEventType(type) {
  const typeMap = {
    'setLocalDescription': 'Set Local',
    'setRemoteDescription': 'Set Remote',
    'createOfferOnSuccess': 'Create Offer',
    'createAnswerOnSuccess': 'Create Answer',
    'setlocaldescription': 'Set Local',
    'setremotedescription': 'Set Remote',
    'createofferonsuccess': 'Create Offer',
    'createansweronsuccess': 'Create Answer'
  }
  return typeMap[type] || typeMap[type?.toLowerCase()] || type
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  } catch {
    return ''
  }
}

function getLineClassName(line) {
  if (line.startsWith('a=ice-')) return 'ice'
  if (line.startsWith('a=fingerprint')) return 'fingerprint'
  if (line.startsWith('a=rtpmap')) return 'codec'
  if (line.startsWith('a=fmtp')) return 'codec-params'
  if (line.startsWith('a=rtcp-fb')) return 'rtcp-feedback'
  if (line.startsWith('a=extmap')) return 'extension'
  if (line.startsWith('a=ssrc')) return 'ssrc'
  if (line.startsWith('a=candidate')) return 'candidate'
  if (line.startsWith('c=')) return 'connection'
  return ''
}

export default SDPAnalysis
