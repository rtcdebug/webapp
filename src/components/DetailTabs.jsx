import { useState, useMemo } from 'react'

function DetailTabs({ data, rawData }) {
  const [activeTab, setActiveTab] = useState('tracks')

  const devices = useMemo(() => extractUniqueDevices(rawData?.getUserMedia), [rawData])

  const tabs = [
    { id: 'tracks', label: 'Tracks & Codecs', badge: data.tracks?.length },
    { id: 'ice', label: 'ICE & Network', badge: (data.localCandidates?.length || 0) + (data.remoteCandidates?.length || 0) },
    { id: 'devices', label: 'Devices', badge: devices.length > 0 ? devices.length : null }
  ]

  return (
    <div className="detail-tabs">
      <div className="detail-tabs-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.badge != null && (
              <span className="detail-tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className="detail-tabs-content">
        {activeTab === 'tracks' && <TracksCodecsPanel data={data} />}
        {activeTab === 'ice' && <IceNetworkPanel data={data} />}
        {activeTab === 'devices' && <DevicesPanel devices={devices} />}
      </div>
    </div>
  )
}

// ============================================================
// Tracks & Codecs Panel
// ============================================================
function TracksCodecsPanel({ data }) {
  const { codecs, tracks } = data
  const outboundTracks = tracks?.filter(t => t.direction === 'outbound') || []
  const inboundTracks = tracks?.filter(t => t.direction === 'inbound') || []

  return (
    <div className="panel-content">
      {/* Codecs Table */}
      {codecs?.length > 0 && (
        <div className="panel-section">
          <h4 className="panel-section-title">Codecs</h4>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Direction</th>
                  <th>Type</th>
                  <th>Codec</th>
                  <th>Clock Rate</th>
                  <th>Channels</th>
                  <th>FMTP</th>
                </tr>
              </thead>
              <tbody>
                {codecs.map((codec, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`direction-badge ${codec.direction || 'unknown'}`}>
                        {codec.direction === 'send' ? '↑ Send' :
                         codec.direction === 'recv' ? '↓ Recv' :
                         codec.direction === 'both' ? '↕ Both' : '—'}
                      </span>
                    </td>
                    <td><span className="device-kind">{codec.mimeType?.startsWith('audio') ? '🎤' : '📹'} {codec.mimeType?.split('/')[0]}</span></td>
                    <td><code className="highlight">{codec.mimeType?.split('/')[1]}</code></td>
                    <td>{codec.clockRate}</td>
                    <td>{codec.channels || '—'}</td>
                    <td className="fmtp-cell"><code>{codec.sdpFmtpLine || '—'}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Outbound Tracks */}
      {outboundTracks.length > 0 && (
        <div className="panel-section">
          <h4 className="panel-section-title">Outbound Tracks</h4>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>RID</th>
                  <th>Resolution</th>
                  <th>FPS</th>
                  <th>Encoder</th>
                  <th>Scalability</th>
                  <th>Packets</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {outboundTracks.map((track, i) => (
                  <tr key={i}>
                    <td><span className="device-kind">{track.kind === 'audio' ? '🎤' : '📹'} {track.kind}</span></td>
                    <td>{track.rid || '—'}</td>
                    <td>{track.frameWidth && track.frameHeight ? `${track.frameWidth}×${track.frameHeight}` : '—'}</td>
                    <td>{track.framesPerSecond?.toFixed(1) || '—'}</td>
                    <td><code>{track.encoderImplementation || '—'}</code></td>
                    <td><code>{track.scalabilityMode || '—'}</code></td>
                    <td>{formatNumber(track.packetsSent)}</td>
                    <td>
                      <span className={`quality-badge ${getQualityClass(track.qualityLimitationReason)}`}>
                        {track.qualityLimitationReason || 'none'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inbound Tracks */}
      {inboundTracks.length > 0 && (
        <div className="panel-section">
          <h4 className="panel-section-title">Inbound Tracks</h4>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Resolution</th>
                  <th>FPS</th>
                  <th>Decoder</th>
                  <th>Packets</th>
                  <th>Lost</th>
                  <th>Loss %</th>
                </tr>
              </thead>
              <tbody>
                {inboundTracks.map((track, i) => {
                  const lossPercent = track.packetsReceived > 0
                    ? ((track.packetsLost || 0) / track.packetsReceived * 100).toFixed(2)
                    : '0.00'
                  return (
                    <tr key={i}>
                      <td><span className="device-kind">{track.kind === 'audio' ? '🎤' : '📹'} {track.kind}</span></td>
                      <td>{track.frameWidth && track.frameHeight ? `${track.frameWidth}×${track.frameHeight}` : '—'}</td>
                      <td>{track.framesPerSecond?.toFixed(1) || '—'}</td>
                      <td><code>{track.decoderImplementation || '—'}</code></td>
                      <td>{formatNumber(track.packetsReceived)}</td>
                      <td>{formatNumber(track.packetsLost)}</td>
                      <td>
                        <span className={`loss-badge ${getLossClass(parseFloat(lossPercent))}`}>
                          {lossPercent}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!codecs?.length && !tracks?.length) && (
        <div className="panel-empty">No track or codec data available</div>
      )}
    </div>
  )
}

// ============================================================
// ICE & Network Panel
// ============================================================
function IceNetworkPanel({ data }) {
  const { localCandidates, remoteCandidates, selectedCandidatePair } = data

  // Look up the actual candidate details for the selected pair
  const selectedLocal = localCandidates?.find(c => c.id === selectedCandidatePair?.localCandidateId)
  const selectedRemote = remoteCandidates?.find(c => c.id === selectedCandidatePair?.remoteCandidateId)

  return (
    <div className="panel-content">
      {/* Selected Candidate Pair */}
      {selectedCandidatePair && (
        <div className="panel-section">
          <h4 className="panel-section-title">Selected Candidate Pair</h4>
          <div className="selected-pair-card">
            <div className="pair-info">
              <div className="pair-side">
                <span className="pair-label">Local</span>
                <span className={`candidate-type type-${selectedLocal?.candidateType || 'unknown'}`}>
                  {selectedLocal?.candidateType || 'unknown'}
                </span>
                <code className="pair-address">{selectedLocal?.protocol || '?'}://{selectedLocal?.address || '?'}:{selectedLocal?.port || '?'}</code>
              </div>
              <div className="pair-arrow">↔</div>
              <div className="pair-side">
                <span className="pair-label">Remote</span>
                <span className={`candidate-type type-${selectedRemote?.candidateType || 'unknown'}`}>
                  {selectedRemote?.candidateType || 'unknown'}
                </span>
                <code className="pair-address">{selectedRemote?.protocol || '?'}://{selectedRemote?.address || '?'}:{selectedRemote?.port || '?'}</code>
              </div>
            </div>
            <div className="pair-stats">
              <div className="pair-stat">
                <span className="pair-stat-label">State</span>
                <span className={`state-badge state-${selectedCandidatePair.state}`}>
                  {selectedCandidatePair.state}
                </span>
              </div>
              <div className="pair-stat">
                <span className="pair-stat-label">RTT</span>
                <span>{selectedCandidatePair.currentRoundTripTime ? `${(selectedCandidatePair.currentRoundTripTime * 1000).toFixed(0)}ms` : '—'}</span>
              </div>
              <div className="pair-stat">
                <span className="pair-stat-label">Bandwidth</span>
                <span>{selectedCandidatePair.availableOutgoingBitrate ? formatBitrate(selectedCandidatePair.availableOutgoingBitrate) : '—'}</span>
              </div>
              {selectedLocal?.networkType && (
                <div className="pair-stat">
                  <span className="pair-stat-label">Network</span>
                  <span>{selectedLocal.networkType}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Local Candidates */}
      {localCandidates?.length > 0 && (
        <div className="panel-section">
          <h4 className="panel-section-title">Local Candidates ({localCandidates.length})</h4>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Protocol</th>
                  <th>Address</th>
                  <th>Port</th>
                  <th>Priority</th>
                  <th>Network</th>
                </tr>
              </thead>
              <tbody>
                {localCandidates.map((candidate, i) => (
                  <tr key={i} className={selectedCandidatePair?.localCandidateId === candidate.id ? 'row-selected' : ''}>
                    <td>
                      <span className={`candidate-type type-${candidate.candidateType}`}>
                        {candidate.candidateType}
                      </span>
                    </td>
                    <td>{candidate.protocol}</td>
                    <td><code>{candidate.address}</code></td>
                    <td>{candidate.port}</td>
                    <td>{candidate.priority}</td>
                    <td>{candidate.networkType || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Remote Candidates */}
      {remoteCandidates?.length > 0 && (
        <div className="panel-section">
          <h4 className="panel-section-title">Remote Candidates ({remoteCandidates.length})</h4>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Protocol</th>
                  <th>Address</th>
                  <th>Port</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {remoteCandidates.map((candidate, i) => (
                  <tr key={i} className={selectedCandidatePair?.remoteCandidateId === candidate.id ? 'row-selected' : ''}>
                    <td>
                      <span className={`candidate-type type-${candidate.candidateType}`}>
                        {candidate.candidateType}
                      </span>
                    </td>
                    <td>{candidate.protocol}</td>
                    <td><code>{candidate.address}</code></td>
                    <td>{candidate.port}</td>
                    <td>{candidate.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!localCandidates?.length && !remoteCandidates?.length) && (
        <div className="panel-empty">No ICE candidate data available</div>
      )}
    </div>
  )
}

// ============================================================
// Devices Panel
// ============================================================
function DevicesPanel({ devices }) {
  if (!devices || devices.length === 0) {
    return <div className="panel-empty">No devices recorded</div>
  }

  return (
    <div className="panel-content">
      <div className="panel-section">
        <h4 className="panel-section-title">Media Devices</h4>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Label</th>
                <th>Constraints</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, i) => (
                <tr key={i}>
                  <td>
                    <span className="device-kind">
                      {device.kind === 'audio' ? '🎤' : '📹'} {device.kind}
                    </span>
                  </td>
                  <td>
                    {device.label || <span className="text-muted">default</span>}
                  </td>
                  <td className="constraints-cell">
                    {device.constraints.length > 0 ? (
                      device.constraints.map((c, j) => (
                        <span key={j} className="constraint-tag">
                          {c.key}: {c.value}
                        </span>
                      ))
                    ) : (
                      <span className="constraint-tag default">default</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function extractUniqueDevices(getUserMedia) {
  if (!getUserMedia || !Array.isArray(getUserMedia)) return []

  // First pass: pair requests with responses to get device labels
  const requestMap = {}
  getUserMedia.forEach(event => {
    const key = `${event.pid}-${event.rid}-${event.request_id}`
    if (event.origin) {
      // Request
      requestMap[key] = {
        audio: event.audio,
        video: event.video,
        audioLabel: null,
        videoLabel: null
      }
    } else {
      // Response - extract device label from track info
      if (requestMap[key]) {
        requestMap[key].audioLabel = extractLabelFromTrackInfo(event.audio_track_info)
        requestMap[key].videoLabel = extractLabelFromTrackInfo(event.video_track_info)
      }
    }
  })

  // Second pass: dedupe devices
  const seen = new Set()
  const devices = []

  Object.values(requestMap).forEach(req => {
    // Process audio
    if (req.audio) {
      const parsed = parseConstraints(req.audio)
      const label = req.audioLabel || parsed.deviceId
      const key = `audio|${label || 'default'}|${JSON.stringify(parsed.constraints)}`
      if (!seen.has(key)) {
        seen.add(key)
        devices.push({
          kind: 'audio',
          label: label,
          constraints: parsed.constraints
        })
      }
    }

    // Process video
    if (req.video) {
      const parsed = parseConstraints(req.video)
      const label = req.videoLabel || parsed.deviceId
      const key = `video|${label || 'default'}|${JSON.stringify(parsed.constraints)}`
      if (!seen.has(key)) {
        seen.add(key)
        devices.push({
          kind: 'video',
          label: label,
          constraints: parsed.constraints
        })
      }
    }
  })

  return devices
}

function extractLabelFromTrackInfo(trackInfo) {
  if (!trackInfo) return null

  // Try parsing as JSON first
  if (typeof trackInfo === 'string') {
    try {
      const parsed = JSON.parse(trackInfo)
      if (parsed.label) return parsed.label
    } catch {
      // Not JSON, use as-is
    }
  }

  if (typeof trackInfo === 'object' && trackInfo.label) {
    return trackInfo.label
  }

  return typeof trackInfo === 'string' ? trackInfo : null
}

function parseConstraints(value) {
  if (value === true || value === 'true') {
    return { deviceId: null, constraints: [] }
  }

  let obj = value
  if (typeof value === 'string') {
    try {
      obj = JSON.parse(value)
    } catch {
      return { deviceId: null, constraints: [] }
    }
  }

  if (typeof obj !== 'object' || obj === null) {
    return { deviceId: null, constraints: [] }
  }

  const deviceId = extractDeviceId(obj.deviceId)
  const constraints = []

  Object.entries(obj).forEach(([key, val]) => {
    if (key === 'deviceId') return
    constraints.push({ key, value: formatConstraintValue(val) })
  })

  return { deviceId, constraints }
}

function extractDeviceId(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return value.exact || value.ideal || null
  }
  return null
}

function formatConstraintValue(value) {
  if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'object' && value !== null) {
    if (value.exact !== undefined) return String(value.exact)
    if (value.ideal !== undefined) return `~${value.ideal}`
    if (value.min !== undefined && value.max !== undefined) return `${value.min}-${value.max}`
    if (value.min !== undefined) return `≥${value.min}`
    if (value.max !== undefined) return `≤${value.max}`
    return JSON.stringify(value)
  }
  return String(value)
}

// ============================================================
// Utility Functions
// ============================================================
function formatNumber(num) {
  if (num === undefined || num === null) return '—'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

function formatBitrate(bps) {
  if (bps >= 1000000) return `${(bps / 1000000).toFixed(1)} Mbps`
  if (bps >= 1000) return `${(bps / 1000).toFixed(0)} kbps`
  return `${bps} bps`
}

function getQualityClass(reason) {
  if (!reason || reason === 'none') return 'good'
  if (reason === 'cpu') return 'warning'
  if (reason === 'bandwidth') return 'bad'
  return 'warning'
}

function getLossClass(percent) {
  if (percent <= 1) return 'good'
  if (percent <= 3) return 'warning'
  return 'bad'
}

export default DetailTabs
