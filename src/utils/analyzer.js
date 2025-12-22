/**
 * Analyze parsed WebRTC data for issues
 */
export function analyzeIssues(parsedData) {
  const issues = []

  // Check packet loss
  const packetLossIssue = checkPacketLoss(parsedData)
  if (packetLossIssue) issues.push(packetLossIssue)

  // Check RTT/latency
  const latencyIssue = checkLatency(parsedData)
  if (latencyIssue) issues.push(latencyIssue)

  // Check for TURN fallback
  const turnIssue = checkTurnFallback(parsedData)
  if (turnIssue) issues.push(turnIssue)

  // Check for ICE failures
  const iceIssues = checkIceFailures(parsedData)
  issues.push(...iceIssues)

  // Check video resolution drops
  const resolutionIssue = checkResolutionDrops(parsedData)
  if (resolutionIssue) issues.push(resolutionIssue)

  // Check frame rate drops
  const fpsIssue = checkFrameRateDrops(parsedData)
  if (fpsIssue) issues.push(fpsIssue)

  // Sort by severity (critical first)
  return issues.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

function checkPacketLoss(data) {
  const { mediaStats, summary } = data
  const packetLossData = mediaStats.packetLoss || []

  // Find periods with high packet loss
  const highLossPeriods = packetLossData.filter(p => p.loss > 2)

  if (highLossPeriods.length === 0) return null

  const maxLoss = Math.max(...highLossPeriods.map(p => p.loss))
  const avgLoss = parseFloat(summary.packetLossPercent)

  if (maxLoss < 2) return null

  const severity = maxLoss > 5 ? 'critical' : 'warning'

  return {
    id: 'packet-loss',
    severity,
    title: `High packet loss detected (${maxLoss.toFixed(1)}% peak)`,
    description: `Packet loss exceeded 2% during ${highLossPeriods.length} intervals. Average loss: ${avgLoss}%. This can cause audio glitches and video freezing.`,
    timestamp: formatTime(highLossPeriods[0].time),
    timeRange: highLossPeriods.length > 1
      ? `${formatTime(highLossPeriods[0].time)} - ${formatTime(highLossPeriods[highLossPeriods.length - 1].time)}`
      : null,
    details: `Peak packet loss of ${maxLoss.toFixed(1)}% indicates network congestion or instability. Consider implementing adaptive bitrate or recommending users check their network connection.`
  }
}

function checkLatency(data) {
  const { mediaStats } = data
  const rttData = mediaStats.rtt || []

  if (rttData.length === 0) return null

  const highLatencyPeriods = rttData.filter(r => r.rtt > 300)
  const maxRtt = Math.max(...rttData.map(r => r.rtt))
  const avgRtt = rttData.reduce((sum, r) => sum + r.rtt, 0) / rttData.length

  if (maxRtt < 300) return null

  const severity = maxRtt > 500 ? 'critical' : 'warning'

  return {
    id: 'high-latency',
    severity,
    title: `High latency (${maxRtt.toFixed(0)}ms peak RTT)`,
    description: `Round-trip time exceeded 300ms during ${highLatencyPeriods.length} measurements. Average RTT: ${avgRtt.toFixed(0)}ms. This can cause noticeable delays in conversation.`,
    timestamp: formatTime(highLatencyPeriods[0]?.time),
    details: `High latency is often caused by geographic distance between participants, network routing issues, or the use of relay servers. Consider using servers closer to participants.`
  }
}

function checkTurnFallback(data) {
  const { selectedCandidatePair, localCandidates } = data

  if (!selectedCandidatePair) return null

  // Find the selected local candidate
  const selectedLocal = localCandidates.find(
    c => c.id === selectedCandidatePair.localCandidateId
  )

  if (!selectedLocal || selectedLocal.candidateType !== 'relay') return null

  return {
    id: 'turn-fallback',
    severity: 'warning',
    title: 'Connection used TURN relay',
    description: 'Direct peer-to-peer connection failed, falling back to TURN relay server. This may indicate firewall or NAT issues.',
    timestamp: null,
    details: `TURN relay connections route all media through a server, adding latency and potentially reducing quality. This usually happens when strict firewalls block direct UDP connections. Consider checking firewall settings or using more TURN servers in different regions.`
  }
}

function checkIceFailures(data) {
  const { connectionEvents } = data
  const issues = []

  // Look for failed ICE states
  const failedEvents = connectionEvents.filter(
    e => e.value === 'failed' || e.value === 'disconnected'
  )

  failedEvents.forEach(event => {
    issues.push({
      id: `ice-failure-${event.timestamp}`,
      severity: event.value === 'failed' ? 'critical' : 'warning',
      title: event.value === 'failed'
        ? 'ICE connection failed'
        : 'ICE connection disconnected',
      description: event.value === 'failed'
        ? 'The ICE connection process failed to establish a connection.'
        : 'The ICE connection was temporarily lost.',
      timestamp: formatTime(event.timestamp),
      details: event.value === 'failed'
        ? 'ICE failures typically occur when all candidate pairs fail connectivity checks. This can happen with restrictive firewalls, symmetric NATs, or insufficient TURN server coverage.'
        : 'Disconnections can occur due to network changes (e.g., switching from WiFi to cellular) or temporary network outages.'
    })
  })

  return issues
}

function checkResolutionDrops(data) {
  const { mediaStats } = data
  const videoData = mediaStats.video || []

  if (videoData.length < 2) return null

  // Find resolution changes
  let maxHeight = 0
  let minHeight = Infinity
  let dropTime = null

  videoData.forEach(v => {
    if (v.height) {
      if (v.height > maxHeight) maxHeight = v.height
      if (v.height < minHeight) {
        minHeight = v.height
        dropTime = v.time
      }
    }
  })

  // Only report if there was a significant drop (more than 25%)
  if (maxHeight === 0 || minHeight === Infinity) return null
  if (minHeight >= maxHeight * 0.75) return null

  return {
    id: 'resolution-drop',
    severity: 'warning',
    title: `Video resolution dropped from ${maxHeight}p to ${minHeight}p`,
    description: `Video quality was automatically reduced, likely due to bandwidth constraints or CPU limitations.`,
    timestamp: formatTime(dropTime),
    details: `Resolution adaptation is normal behavior to maintain smooth video during network congestion. If this happens frequently, consider recommending users check their internet connection or close bandwidth-heavy applications.`
  }
}

function checkFrameRateDrops(data) {
  const { mediaStats } = data
  const videoData = mediaStats.video || []

  if (videoData.length === 0) return null

  const lowFpsPeriods = videoData.filter(v => v.fps && v.fps < 15)

  if (lowFpsPeriods.length === 0) return null

  const minFps = Math.min(...lowFpsPeriods.map(v => v.fps))

  return {
    id: 'fps-drop',
    severity: minFps < 10 ? 'critical' : 'warning',
    title: `Frame rate dropped below 15fps (${minFps.toFixed(0)}fps minimum)`,
    description: `Low frame rate was detected during ${lowFpsPeriods.length} measurements. This causes choppy, stuttering video.`,
    timestamp: formatTime(lowFpsPeriods[0].time),
    details: `Low frame rates are typically caused by CPU overload (encoding/decoding), network congestion triggering aggressive adaptation, or the sender's camera having issues. Check CPU usage on both ends and network quality.`
  }
}

function formatTime(timestamp) {
  if (!timestamp) return null

  const date = new Date(timestamp)
  if (isNaN(date.getTime())) {
    // Timestamp might be in seconds or a relative value
    const seconds = Math.floor(timestamp / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return date.toLocaleTimeString()
}
