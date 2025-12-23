import { useState } from 'react'

function ICECandidateGrid({ stats, localCandidates, remoteCandidates, selectedPair }) {
  const [expanded, setExpanded] = useState({})

  // Build hierarchical structure: Transport → Candidate Pairs → Candidates
  const hierarchy = buildHierarchy(stats, localCandidates, remoteCandidates, selectedPair)

  if (hierarchy.length === 0) {
    return null
  }

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>ICE Candidate Grid</h3>
        <span className="badge badge-info">Hierarchy View</span>
      </div>
      <div className="candidate-grid-table">
        <table className="ice-grid">
          <thead>
            <tr>
              <th>Transport / Pair / Candidate</th>
              <th>Type</th>
              <th>Address</th>
              <th>Port</th>
              <th>Protocol</th>
              <th>Priority</th>
              <th>Network</th>
              <th>Stats</th>
            </tr>
          </thead>
          <tbody>
            {hierarchy.map(transport => (
              <TransportRow
                key={transport.id}
                transport={transport}
                expanded={expanded}
                toggleExpand={toggleExpand}
                selectedPairId={selectedPair?.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransportRow({ transport, expanded, toggleExpand, selectedPairId }) {
  const isExpanded = expanded[transport.id] !== false // default expanded

  return (
    <>
      <tr className="transport-row" onClick={() => toggleExpand(transport.id)}>
        <td colSpan="8">
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          <strong>Transport:</strong> {transport.id}
          {transport.selectedPairId && (
            <span className="selected-badge">Selected: {transport.selectedPairId}</span>
          )}
          {transport.dtlsState && (
            <span className={`dtls-state ${transport.dtlsState}`}>
              DTLS: {transport.dtlsState}
            </span>
          )}
        </td>
      </tr>
      {isExpanded && transport.pairs.map(pair => (
        <CandidatePairRows
          key={pair.id}
          pair={pair}
          expanded={expanded}
          toggleExpand={toggleExpand}
          isSelected={pair.id === selectedPairId}
        />
      ))}
    </>
  )
}

function CandidatePairRows({ pair, expanded, toggleExpand, isSelected }) {
  const isExpanded = expanded[pair.id] !== false

  return (
    <>
      <tr
        className={`pair-row ${isSelected ? 'selected' : ''} ${pair.state}`}
        onClick={() => toggleExpand(pair.id)}
      >
        <td className="indent-1">
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          <span className="pair-icon">⟷</span>
          {pair.id}
          {isSelected && <span className="nominated-badge">✓ Active</span>}
        </td>
        <td>
          <span className={`state-badge ${pair.state}`}>{pair.state}</span>
        </td>
        <td colSpan="2">
          {pair.currentRoundTripTime != null && (
            <span className="rtt-value">
              RTT: {(pair.currentRoundTripTime * 1000).toFixed(0)}ms
            </span>
          )}
        </td>
        <td colSpan="2">
          {pair.availableOutgoingBitrate && (
            <span className="bitrate-value">
              ↑ {formatBitrate(pair.availableOutgoingBitrate)}
            </span>
          )}
        </td>
        <td colSpan="2">
          {pair.bytesReceived > 0 && (
            <span className="bytes-value">
              ↓ {formatBytes(pair.bytesReceived)}
            </span>
          )}
          {pair.bytesSent > 0 && (
            <span className="bytes-value">
              ↑ {formatBytes(pair.bytesSent)}
            </span>
          )}
        </td>
      </tr>
      {isExpanded && (
        <>
          {pair.localCandidate && (
            <CandidateRow candidate={pair.localCandidate} type="local" />
          )}
          {pair.remoteCandidate && (
            <CandidateRow candidate={pair.remoteCandidate} type="remote" />
          )}
        </>
      )}
    </>
  )
}

function CandidateRow({ candidate, type }) {
  return (
    <tr className={`candidate-row ${type}`}>
      <td className="indent-2">
        <span className={`candidate-type-icon ${type}`}>
          {type === 'local' ? '→' : '←'}
        </span>
        {candidate.id}
      </td>
      <td>
        <span className={`candidate-type ${candidate.candidateType}`}>
          {candidate.candidateType}
        </span>
      </td>
      <td className="address-cell">
        {candidate.address || 'N/A'}
        {candidate.relatedAddress && (
          <span className="related-address">
            (via {candidate.relatedAddress})
          </span>
        )}
      </td>
      <td>{candidate.port}</td>
      <td>
        {candidate.protocol}
        {candidate.relayProtocol && (
          <span className="relay-protocol"> ({candidate.relayProtocol})</span>
        )}
      </td>
      <td className="priority-cell">
        {candidate.priority ? formatPriority(candidate.priority) : 'N/A'}
      </td>
      <td>
        {candidate.networkType || '-'}
      </td>
      <td>
        {type === 'local' && candidate.url && (
          <span className="server-url" title={candidate.url}>
            {extractServerHost(candidate.url)}
          </span>
        )}
      </td>
    </tr>
  )
}

function buildHierarchy(stats, localCandidates, remoteCandidates, selectedPair) {
  const transports = {}
  const pairs = {}
  const candidates = {}

  if (!stats) return []

  // First pass: collect all stats
  Object.entries(stats).forEach(([statId, timeSeries]) => {
    if (!timeSeries || timeSeries.length === 0) return
    const latest = timeSeries[timeSeries.length - 1]

    if (latest.type === 'transport') {
      transports[statId] = {
        id: statId,
        selectedPairId: latest.selectedCandidatePairId,
        dtlsState: latest.dtlsState,
        dtlsCipher: latest.dtlsCipher,
        tlsVersion: latest.tlsVersion,
        pairs: []
      }
    }

    if (latest.type === 'candidate-pair') {
      pairs[statId] = {
        id: statId,
        transportId: latest.transportId,
        localCandidateId: latest.localCandidateId,
        remoteCandidateId: latest.remoteCandidateId,
        state: latest.state,
        nominated: latest.nominated,
        currentRoundTripTime: latest.currentRoundTripTime,
        availableOutgoingBitrate: latest.availableOutgoingBitrate,
        availableIncomingBitrate: latest.availableIncomingBitrate,
        bytesReceived: latest.bytesReceived,
        bytesSent: latest.bytesSent,
        requestsReceived: latest.requestsReceived,
        requestsSent: latest.requestsSent,
        responsesReceived: latest.responsesReceived,
        responsesSent: latest.responsesSent,
        priority: latest.priority
      }
    }

    if (latest.type === 'local-candidate' || latest.type === 'remote-candidate') {
      candidates[statId] = {
        id: statId,
        isRemote: latest.type === 'remote-candidate',
        candidateType: latest.candidateType,
        address: latest.address || latest.ip,
        port: latest.port,
        protocol: latest.protocol,
        priority: latest.priority,
        networkType: latest.networkType,
        relayProtocol: latest.relayProtocol,
        url: latest.url,
        relatedAddress: latest.relatedAddress,
        relatedPort: latest.relatedPort,
        foundation: latest.foundation
      }
    }
  })

  // Build hierarchy
  Object.values(pairs).forEach(pair => {
    pair.localCandidate = candidates[pair.localCandidateId]
    pair.remoteCandidate = candidates[pair.remoteCandidateId]

    if (pair.transportId && transports[pair.transportId]) {
      transports[pair.transportId].pairs.push(pair)
    }
  })

  // Sort pairs by state (succeeded first, then by priority)
  Object.values(transports).forEach(transport => {
    transport.pairs.sort((a, b) => {
      const stateOrder = { succeeded: 0, 'in-progress': 1, waiting: 2, frozen: 3, failed: 4 }
      const aOrder = stateOrder[a.state] ?? 5
      const bOrder = stateOrder[b.state] ?? 5
      if (aOrder !== bOrder) return aOrder - bOrder
      return (b.priority || 0) - (a.priority || 0)
    })
  })

  return Object.values(transports)
}

function formatBitrate(bps) {
  if (bps >= 1000000) {
    return (bps / 1000000).toFixed(1) + ' Mbps'
  }
  if (bps >= 1000) {
    return (bps / 1000).toFixed(0) + ' Kbps'
  }
  return bps + ' bps'
}

function formatBytes(bytes) {
  if (bytes >= 1000000000) {
    return (bytes / 1000000000).toFixed(1) + ' GB'
  }
  if (bytes >= 1000000) {
    return (bytes / 1000000).toFixed(1) + ' MB'
  }
  if (bytes >= 1000) {
    return (bytes / 1000).toFixed(0) + ' KB'
  }
  return bytes + ' B'
}

function formatPriority(priority) {
  // Extract type preference from priority (bits 24-31)
  const typePreference = priority >> 24
  return `${typePreference} (${priority})`
}

function extractServerHost(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url.replace('turn:', 'https://').replace('stun:', 'https://').replace('turns:', 'https://'))
    return parsed.hostname
  } catch {
    return url.substring(0, 20)
  }
}

export default ICECandidateGrid
