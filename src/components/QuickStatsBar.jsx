function QuickStatsBar({ data }) {
  const { summary } = data

  const getStatusClass = (value, thresholds) => {
    if (value <= thresholds.good) return 'status-good'
    if (value <= thresholds.warning) return 'status-warning'
    return 'status-bad'
  }

  const lossClass = getStatusClass(parseFloat(summary.packetLossPercent), { good: 1, warning: 3 })
  const rttClass = summary.avgRtt ? getStatusClass(parseFloat(summary.avgRtt), { good: 100, warning: 300 }) : ''
  const iceClass = summary.iceState === 'succeeded' ? 'status-good' :
                   summary.iceState === 'failed' ? 'status-bad' : ''

  return (
    <div className="quick-stats-bar">
      <div className="stat-item">
        <span className="stat-value">{summary.duration}</span>
        <span className="stat-label">Duration</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <span className={`stat-value ${iceClass}`}>{summary.iceState}</span>
        <span className="stat-label">Connection</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <span className="stat-value">{formatBitrate(summary.avgSendBitrate || summary.avgRecvBitrate)}</span>
        <span className="stat-label">Avg Bitrate</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <span className={`stat-value ${lossClass}`}>{summary.packetLossPercent}%</span>
        <span className="stat-label">Packet Loss</span>
      </div>

      {summary.avgRtt && (
        <>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className={`stat-value ${rttClass}`}>{summary.avgRtt}ms</span>
            <span className="stat-label">Avg RTT</span>
          </div>
        </>
      )}

      {summary.freezeCount > 0 && (
        <>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value status-warning">{summary.freezeCount}</span>
            <span className="stat-label">Freezes</span>
          </div>
        </>
      )}
    </div>
  )
}

function formatBitrate(kbps) {
  if (!kbps || kbps === 0) return 'N/A'
  if (kbps >= 1000) return (kbps / 1000).toFixed(1) + ' Mbps'
  return Math.round(kbps) + ' kbps'
}

export default QuickStatsBar
