/**
 * Dense horizontal strip showing all key call metrics with actual numbers
 */
function DenseMetricsStrip({ data }) {
  const { summary, mediaStats, connectionTimings } = data

  // Get connection timings
  const iceTime = connectionTimings?.iceConnectionTime
  const dtlsTime = connectionTimings?.dtlsConnectionTime

  // Calculate P95 RTT
  const rttValues = mediaStats?.rtt?.map(r => r.rtt).filter(v => v != null) || []
  const p95Rtt = rttValues.length > 0 ? percentile(rttValues, 95) : null

  // Calculate avg jitter
  const jitterValues = mediaStats?.jitter?.map(j => j.jitter).filter(v => v != null) || []
  const avgJitter = jitterValues.length > 0
    ? jitterValues.reduce((a, b) => a + b, 0) / jitterValues.length
    : null

  // Calculate average video resolution and FPS from time-series data
  const videoData = mediaStats?.video || []
  const fpsValues = videoData.map(v => v.fps).filter(v => v != null && v > 0)
  const avgFps = fpsValues.length > 0
    ? Math.round(fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length)
    : null

  // For resolution, find the most common height (mode)
  const heightValues = videoData.map(v => v.height).filter(v => v != null && v > 0)
  const resolution = heightValues.length > 0
    ? `${findMode(heightValues)}p`
    : null

  // Define all metrics with tooltips
  const metrics = [
    // Timing
    {
      label: 'Duration',
      value: summary.duration,
      format: 'raw',
      tooltip: 'Total call duration'
    },
    {
      label: 'ICE',
      value: iceTime,
      format: 'ms',
      thresholds: { good: 2000, warn: 5000 },
      tooltip: 'ICE connection time (time to establish connectivity)'
    },
    {
      label: 'DTLS',
      value: dtlsTime,
      format: 'ms',
      thresholds: { good: 500, warn: 1000 },
      tooltip: 'DTLS handshake time (encryption setup)'
    },

    // Network quality
    {
      label: 'Avg RTT',
      value: summary.avgRtt ? parseFloat(summary.avgRtt) : null,
      format: 'ms',
      thresholds: { good: 100, warn: 300 },
      tooltip: 'Average Round Trip Time - network latency'
    },
    {
      label: 'P95 RTT',
      value: p95Rtt,
      format: 'ms',
      thresholds: { good: 150, warn: 400 },
      tooltip: '95th percentile RTT - worst-case latency'
    },
    {
      label: 'Jitter',
      value: avgJitter ? avgJitter * 1000 : null,
      format: 'ms',
      thresholds: { good: 30, warn: 50 },
      tooltip: 'Average jitter - variation in packet arrival time'
    },
    {
      label: 'Loss',
      value: parseFloat(summary.packetLossPercent),
      format: '%',
      thresholds: { good: 1, warn: 3 },
      tooltip: 'Packet loss percentage'
    },

    // Bitrate
    {
      label: 'Send',
      value: summary.avgSendBitrate,
      format: 'bitrate',
      tooltip: 'Average outbound bitrate (kbps)'
    },
    {
      label: 'Recv',
      value: summary.avgRecvBitrate,
      format: 'bitrate',
      tooltip: 'Average inbound bitrate (kbps)'
    },
    {
      label: 'Peak',
      value: summary.peakBitrate,
      format: 'bitrate',
      tooltip: 'Peak bitrate during the call'
    },

    // Video
    {
      label: 'Res',
      value: resolution,
      format: 'raw',
      tooltip: 'Most common video resolution during the call'
    },
    {
      label: 'FPS',
      value: avgFps,
      format: 'fps',
      thresholds: { good: 24, warn: 15 },
      reverse: true,
      tooltip: 'Average frames per second'
    },

    // Quality issues
    {
      label: 'Freezes',
      value: summary.freezeCount,
      format: 'count',
      thresholds: { good: 0, warn: 3 },
      tooltip: 'Number of video freeze events'
    },
    {
      label: 'Limited',
      value: summary.qualityLimitedPercent,
      format: '%',
      thresholds: { good: 10, warn: 30 },
      tooltip: 'Percentage of time quality was limited (CPU/bandwidth)'
    },

    // Recovery
    {
      label: 'NACK',
      value: summary.nackTotal,
      format: 'count',
      tooltip: 'Negative ACKs - requests to resend lost packets'
    },
    {
      label: 'PLI',
      value: summary.pliTotal,
      format: 'count',
      tooltip: 'Picture Loss Indication - requests for new keyframe'
    },
  ]

  return (
    <div className="dense-metrics-strip">
      {metrics.map((metric, i) => (
        <MetricCell key={metric.label} metric={metric} isLast={i === metrics.length - 1} />
      ))}
    </div>
  )
}

function MetricCell({ metric, isLast }) {
  const { label, value, format, thresholds, reverse, tooltip } = metric

  const formattedValue = formatValue(value, format)
  const statusClass = getStatusClass(value, thresholds, reverse)

  return (
    <>
      <div className="dense-metric" title={tooltip}>
        <span className={`dense-metric-value ${statusClass}`}>
          {formattedValue}
        </span>
        <span className="dense-metric-label">{label}</span>
      </div>
      {!isLast && <div className="dense-metric-divider" />}
    </>
  )
}

function formatValue(value, format) {
  if (value === null || value === undefined) return '—'

  switch (format) {
    case 'ms':
      if (value >= 1000) return `${(value / 1000).toFixed(1)}s`
      return `${Math.round(value)}ms`
    case '%':
      return `${value.toFixed(1)}%`
    case 'bitrate':
      if (!value || value === 0) return '—'
      if (value >= 1000) return `${(value / 1000).toFixed(1)}M`
      return `${Math.round(value)}K`
    case 'fps':
      return value ? `${value}` : '—'
    case 'count':
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
      return String(value)
    case 'raw':
    default:
      return String(value)
  }
}

function getStatusClass(value, thresholds, reverse = false) {
  if (!thresholds || value === null || value === undefined) return ''

  if (reverse) {
    // For metrics where lower is worse (like FPS)
    if (value >= thresholds.good) return 'status-good'
    if (value >= thresholds.warn) return 'status-warning'
    return 'status-bad'
  } else {
    // For metrics where lower is better (like RTT, loss)
    if (value <= thresholds.good) return 'status-good'
    if (value <= thresholds.warn) return 'status-warning'
    return 'status-bad'
  }
}

function percentile(arr, p) {
  if (arr.length === 0) return null
  const sorted = [...arr].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

function findMode(arr) {
  if (arr.length === 0) return null
  const counts = {}
  let maxCount = 0
  let mode = arr[0]
  for (const val of arr) {
    counts[val] = (counts[val] || 0) + 1
    if (counts[val] > maxCount) {
      maxCount = counts[val]
      mode = val
    }
  }
  return mode
}

export default DenseMetricsStrip
