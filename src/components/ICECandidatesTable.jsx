function ICECandidatesTable({ localCandidates, remoteCandidates, selectedPair }) {
  const isSelected = (candidateId, isLocal) => {
    if (!selectedPair) return false
    if (isLocal) {
      return selectedPair.localCandidateId === candidateId
    }
    return selectedPair.remoteCandidateId === candidateId
  }

  const maskAddress = (address) => {
    if (!address || address === 'N/A') return 'N/A'
    // Mask the last octet for privacy
    const parts = address.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`
    }
    return address
  }

  const getBadgeClass = (type) => {
    switch (type) {
      case 'host': return 'host'
      case 'srflx': return 'srflx'
      case 'relay': return 'relay'
      default: return ''
    }
  }

  // Sort candidates with selected on top
  const sortCandidates = (candidates, isLocal) => {
    return [...candidates].sort((a, b) => {
      const aSelected = isSelected(a.id, isLocal)
      const bSelected = isSelected(b.id, isLocal)
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      return 0
    })
  }

  const sortedLocalCandidates = sortCandidates(localCandidates, true)
  const sortedRemoteCandidates = sortCandidates(remoteCandidates, false)

  return (
    <div className="card compact">
      <div className="card-header compact">
        <h2 className="card-title">ICE Candidates</h2>
      </div>

      <div className="ice-tables">
        <div className="ice-table-wrapper">
          <h3 className="ice-table-title">Local</h3>
          {localCandidates.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No local candidates</p>
          ) : (
            <table className="ice-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {sortedLocalCandidates.slice(0, 5).map((candidate) => (
                  <tr
                    key={candidate.id}
                    className={isSelected(candidate.id, true) ? 'selected' : ''}
                  >
                    <td>
                      <span className={`candidate-badge ${getBadgeClass(candidate.candidateType)}`}>
                        {candidate.candidateType}
                      </span>
                    </td>
                    <td>{maskAddress(candidate.address)}</td>
                  </tr>
                ))}
                {localCandidates.length > 5 && (
                  <tr>
                    <td colSpan={2} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      +{localCandidates.length - 5} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="ice-table-wrapper">
          <h3 className="ice-table-title">Remote</h3>
          {remoteCandidates.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No remote candidates</p>
          ) : (
            <table className="ice-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {sortedRemoteCandidates.slice(0, 5).map((candidate) => (
                  <tr
                    key={candidate.id}
                    className={isSelected(candidate.id, false) ? 'selected' : ''}
                  >
                    <td>
                      <span className={`candidate-badge ${getBadgeClass(candidate.candidateType)}`}>
                        {candidate.candidateType}
                      </span>
                    </td>
                    <td>{maskAddress(candidate.address)}</td>
                  </tr>
                ))}
                {remoteCandidates.length > 5 && (
                  <tr>
                    <td colSpan={2} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      +{remoteCandidates.length - 5} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedPair && (
        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>State: </span>
              <span style={{ color: 'var(--success-green)' }}>{selectedPair.state}</span>
            </div>
            {selectedPair.currentRoundTripTime && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>RTT: </span>
                <span>{(selectedPair.currentRoundTripTime * 1000).toFixed(0)}ms</span>
              </div>
            )}
            {selectedPair.availableOutgoingBitrate && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Bitrate: </span>
                <span>{(selectedPair.availableOutgoingBitrate / 1000000).toFixed(1)} Mbps</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ICECandidatesTable
