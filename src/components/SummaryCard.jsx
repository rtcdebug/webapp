function SummaryCard({ data }) {
  const { summary } = data

  const getScoreClass = (value, thresholds) => {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.warning) return 'warning'
    return 'bad'
  }

  const packetLossClass = getScoreClass(parseFloat(summary.packetLossPercent), { good: 1, warning: 3 })
  const rttClass = summary.avgRtt ? getScoreClass(parseFloat(summary.avgRtt), { good: 100, warning: 300 }) : ''
  const freezeClass = summary.freezeCount > 0 ? (summary.freezeCount > 3 ? 'bad' : 'warning') : 'good'
  const qualityClass = summary.qualityLimitedPercent > 50 ? 'bad' : summary.qualityLimitedPercent > 20 ? 'warning' : 'good'

  return (
    <div className="card compact">
      <div className="summary-grid compact">
        <div className="summary-item">
          <div className="summary-label">Duration</div>
          <div className="summary-value">{summary.duration}</div>
        </div>

        <div className="summary-item">
          <div className="summary-label">ICE</div>
          <div className={`summary-value ${summary.iceState === 'succeeded' ? 'good' : ''}`}>
            {summary.iceState}
          </div>
        </div>

        <div className="summary-item">
          <div className="summary-label">Bitrate</div>
          <div className="summary-value">
            {formatBitrate(summary.avgSendBitrate || summary.avgRecvBitrate)}
          </div>
        </div>

        <div className="summary-item">
          <div className="summary-label">Loss</div>
          <div className={`summary-value ${packetLossClass}`}>
            {summary.packetLossPercent}%
          </div>
        </div>

        {summary.avgRtt && (
          <div className="summary-item">
            <div className="summary-label">RTT</div>
            <div className={`summary-value ${rttClass}`}>
              {summary.avgRtt}ms
            </div>
          </div>
        )}

        {summary.qualityLimitedPercent > 0 && (
          <div className="summary-item">
            <div className="summary-label">Limited</div>
            <div className={`summary-value ${qualityClass}`}>
              {summary.qualityLimitedPercent}%
            </div>
          </div>
        )}

        {summary.freezeCount > 0 && (
          <div className="summary-item">
            <div className="summary-label">Freezes</div>
            <div className={`summary-value ${freezeClass}`}>
              {summary.freezeCount}
            </div>
          </div>
        )}

        {(summary.nackTotal > 0 || summary.pliTotal > 0) && (
          <div className="summary-item">
            <div className="summary-label">Recovery</div>
            <div className="summary-value" style={{ fontSize: '0.9rem' }}>
              {summary.nackTotal + summary.pliTotal}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatBitrate(kbps) {
  if (!kbps || kbps === 0) return 'N/A'
  if (kbps >= 1000) return (kbps / 1000).toFixed(1) + ' Mbps'
  return Math.round(kbps) + ' kbps'
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num?.toString() || '0'
}

export default SummaryCard
