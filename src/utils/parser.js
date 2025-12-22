/**
 * Parse all peer connections from a chrome://webrtc-internals JSON dump
 */
export function parseAllPeerConnections(data) {
  if (!data) {
    throw new Error('No data provided')
  }

  let peerConnections = null

  if (data.PeerConnections) {
    peerConnections = data.PeerConnections
  } else if (data.peerConnections) {
    peerConnections = data.peerConnections
  }

  if (!peerConnections || Object.keys(peerConnections).length === 0) {
    throw new Error('No PeerConnections found in this dump.')
  }

  const results = []

  Object.entries(peerConnections).forEach(([pcId, pcData]) => {
    try {
      const parsed = parseSinglePeerConnection(pcId, pcData)
      results.push(parsed)
    } catch (err) {
      console.warn(`Failed to parse ${pcId}:`, err)
    }
  })

  if (results.length === 0) {
    throw new Error('Could not parse any peer connections.')
  }

  return results
}

/**
 * Parse a single peer connection
 */
function parseSinglePeerConnection(pcId, pcData) {
  const { stats, timestamps } = parseChromeDumpStats(pcData.stats || {})
  const connectionEvents = parseUpdateLog(pcData.updateLog || [])
  const { localCandidates, remoteCandidates, selectedCandidatePair } = extractCandidates(stats)
  const mediaStats = extractMediaStats(stats, timestamps)
  const summary = calculateSummary(stats, mediaStats, selectedCandidatePair, timestamps)
  const { codecs, tracks } = extractCodecsAndTracks(stats)

  // Determine if this is publisher or subscriber based on track directions
  const hasOutbound = Object.values(stats).some(ts => ts[0]?.type === 'outbound-rtp')
  const hasInbound = Object.values(stats).some(ts => ts[0]?.type === 'inbound-rtp')
  let connectionType = 'Unknown'
  if (hasOutbound && !hasInbound) connectionType = 'Publisher'
  else if (hasInbound && !hasOutbound) connectionType = 'Subscriber'
  else if (hasOutbound && hasInbound) connectionType = 'Pub/Sub'

  return {
    id: pcId,
    connectionType,
    summary,
    connectionEvents,
    localCandidates,
    remoteCandidates,
    selectedCandidatePair,
    mediaStats,
    codecs,
    tracks,
    url: pcData.url || 'Unknown',
    rtcConfiguration: pcData.rtcConfiguration || null
  }
}

/**
 * Extract codec and track information
 */
function extractCodecsAndTracks(stats) {
  const codecs = []
  const tracks = []
  const seenCodecs = new Set()

  Object.entries(stats).forEach(([statId, timeSeries]) => {
    if (!timeSeries || timeSeries.length === 0) return
    const latest = timeSeries[timeSeries.length - 1]

    // Extract codecs
    if (latest.type === 'codec') {
      const codecKey = `${latest.mimeType}-${latest.clockRate}`
      if (!seenCodecs.has(codecKey)) {
        seenCodecs.add(codecKey)
        codecs.push({
          id: statId,
          mimeType: latest.mimeType,
          clockRate: latest.clockRate,
          channels: latest.channels,
          sdpFmtpLine: latest.sdpFmtpLine
        })
      }
    }

    // Extract outbound tracks with simulcast info
    if (latest.type === 'outbound-rtp') {
      tracks.push({
        id: statId,
        direction: 'outbound',
        kind: latest.kind,
        rid: latest.rid,
        frameWidth: latest.frameWidth,
        frameHeight: latest.frameHeight,
        framesPerSecond: latest.framesPerSecond,
        qualityLimitationReason: latest.qualityLimitationReason,
        encoderImplementation: latest.encoderImplementation,
        scalabilityMode: latest.scalabilityMode,
        packetsSent: latest.packetsSent,
        bytesSent: latest.bytesSent
      })
    }

    // Extract inbound tracks
    if (latest.type === 'inbound-rtp') {
      tracks.push({
        id: statId,
        direction: 'inbound',
        kind: latest.kind,
        frameWidth: latest.frameWidth,
        frameHeight: latest.frameHeight,
        framesPerSecond: latest.framesPerSecond,
        decoderImplementation: latest.decoderImplementation,
        packetsReceived: latest.packetsReceived,
        packetsLost: latest.packetsLost,
        bytesReceived: latest.bytesReceived
      })
    }
  })

  return { codecs, tracks }
}

/**
 * Parse Chrome webrtc-internals dump format
 * Stats are stored as "{statId}-{propertyName}" with arrays of values
 */
function parseChromeDumpStats(rawStats) {
  const statsById = {}
  let startTime = null
  let endTime = null
  let sampleCount = 0

  // Group properties by stat ID
  Object.entries(rawStats).forEach(([key, data]) => {
    if (!data || typeof data !== 'object') return

    // Parse the key: "{statId}-{propertyName}"
    const lastDashIndex = key.lastIndexOf('-')
    if (lastDashIndex === -1) return

    const statId = key.substring(0, lastDashIndex)
    const propertyName = key.substring(lastDashIndex + 1)

    // Get metadata
    const statsType = data.statsType
    if (!statsType) return

    // Parse timestamps
    if (data.startTime && !startTime) {
      startTime = new Date(data.startTime).getTime()
    }
    if (data.endTime) {
      endTime = new Date(data.endTime).getTime()
    }

    // Parse values array
    let values = []
    if (data.values) {
      try {
        values = typeof data.values === 'string' ? JSON.parse(data.values) : data.values
      } catch {
        values = [data.values]
      }
    }

    if (values.length > sampleCount) {
      sampleCount = values.length
    }

    // Initialize stat object if needed
    if (!statsById[statId]) {
      statsById[statId] = {
        id: statId,
        type: statsType,
        properties: {}
      }
    }

    statsById[statId].properties[propertyName] = values
  })

  // Generate timestamps array
  const timestamps = []
  if (startTime && endTime && sampleCount > 1) {
    const interval = (endTime - startTime) / (sampleCount - 1)
    for (let i = 0; i < sampleCount; i++) {
      timestamps.push(startTime + i * interval)
    }
  } else if (sampleCount > 0) {
    // Fallback: use indices
    for (let i = 0; i < sampleCount; i++) {
      timestamps.push(i * 1000) // 1 second intervals
    }
  }

  // Convert to time series format
  const stats = {}
  Object.entries(statsById).forEach(([statId, statData]) => {
    const timeSeries = []
    const props = statData.properties
    const count = Object.values(props)[0]?.length || 0

    for (let i = 0; i < count; i++) {
      const point = {
        timestamp: timestamps[i] || i * 1000,
        type: statData.type
      }
      Object.entries(props).forEach(([propName, values]) => {
        point[propName] = values[i]
      })
      timeSeries.push(point)
    }

    stats[statId] = timeSeries
  })

  return { stats, timestamps }
}

function parseUpdateLog(updateLog) {
  const events = []

  if (!Array.isArray(updateLog)) return events

  updateLog.forEach(entry => {
    if (!entry) return

    const { time, type, value } = entry

    // Parse ICE and signaling state changes
    if (type === 'iceConnectionStateChange' ||
        type === 'iceGatheringStateChange' ||
        type === 'signalingStateChange' ||
        type === 'connectionStateChange') {
      events.push({
        timestamp: typeof time === 'string' ? new Date(time).getTime() : parseFloat(time),
        type: type.replace('Change', ''),
        value: value,
        category: getEventCategory(type)
      })
    }

    // Parse ICE candidate events
    if (type === 'addIceCandidate' || type === 'onicecandidate') {
      events.push({
        timestamp: typeof time === 'string' ? new Date(time).getTime() : parseFloat(time),
        type: 'iceCandidate',
        value: value,
        category: 'ice'
      })
    }
  })

  return events.sort((a, b) => a.timestamp - b.timestamp)
}

function getEventCategory(type) {
  if (type.includes('ice')) return 'ice'
  if (type.includes('signaling')) return 'signaling'
  if (type.includes('connection')) return 'connection'
  return 'other'
}

function extractCandidates(stats) {
  const localCandidates = []
  const remoteCandidates = []
  let selectedPair = null

  Object.entries(stats).forEach(([statId, timeSeries]) => {
    if (!timeSeries || timeSeries.length === 0) return
    const latest = timeSeries[timeSeries.length - 1]

    if (latest.type === 'local-candidate') {
      localCandidates.push({
        id: statId,
        candidateType: latest.candidateType,
        address: latest.address || latest.ip || 'N/A',
        port: latest.port,
        protocol: latest.protocol,
        priority: latest.priority,
        networkType: latest.networkType
      })
    }

    if (latest.type === 'remote-candidate') {
      remoteCandidates.push({
        id: statId,
        candidateType: latest.candidateType,
        address: latest.address || latest.ip || 'N/A',
        port: latest.port,
        protocol: latest.protocol,
        priority: latest.priority
      })
    }

    if (latest.type === 'candidate-pair') {
      // Check if this pair succeeded or is nominated
      const state = latest.state
      if (state === 'succeeded' || latest.nominated === true) {
        if (!selectedPair || latest.nominated) {
          selectedPair = {
            id: statId,
            localCandidateId: latest.localCandidateId,
            remoteCandidateId: latest.remoteCandidateId,
            state: state,
            nominated: latest.nominated,
            currentRoundTripTime: latest.currentRoundTripTime,
            availableOutgoingBitrate: latest.availableOutgoingBitrate
          }
        }
      }
    }
  })

  return { localCandidates, remoteCandidates, selectedCandidatePair: selectedPair }
}

function extractMediaStats(stats, timestamps) {
  const packets = []
  const packetLoss = []
  const rtt = []
  const jitter = []
  const video = []
  const audio = []
  const bitrate = []
  const qualityLimitation = []
  const videoEvents = []
  const recovery = []

  // Find all outbound-rtp, inbound-rtp, and candidate-pair stats
  const outboundRtp = Object.values(stats).filter(ts => ts[0]?.type === 'outbound-rtp')
  const inboundRtp = Object.values(stats).filter(ts => ts[0]?.type === 'inbound-rtp')
  const candidatePairs = Object.values(stats).filter(ts => ts[0]?.type === 'candidate-pair')

  // Get the sample count from the first available time series
  const sampleCount = timestamps.length ||
    (outboundRtp[0]?.length) ||
    (inboundRtp[0]?.length) || 0

  let prevTotalSent = 0
  let prevTotalReceived = 0
  let prevTotalLost = 0
  let prevBytesSent = 0
  let prevBytesReceived = 0
  let prevNackCount = 0
  let prevPliCount = 0
  let prevFirCount = 0
  let prevFreezeCount = 0
  let prevFramesDropped = 0

  for (let i = 0; i < sampleCount; i++) {
    const time = timestamps[i] || i * 1000
    const interval = i > 0 ? (time - (timestamps[i - 1] || (i - 1) * 1000)) / 1000 : 1 // seconds

    // Sum up packets from all streams at this time point
    let totalSent = 0
    let totalReceived = 0
    let totalLost = 0
    let totalBytesSent = 0
    let totalBytesReceived = 0
    let currentJitter = null
    let frameHeight = null
    let frameWidth = null
    let fps = null
    let audioLevel = null
    let qualityReason = 'none'
    let nackCount = 0
    let pliCount = 0
    let firCount = 0
    let freezeCount = 0
    let framesDropped = 0
    let availableBitrate = null

    outboundRtp.forEach(ts => {
      const point = ts[i]
      if (point) {
        totalSent += point.packetsSent || 0
        totalBytesSent += point.bytesSent || 0
        nackCount += point.nackCount || 0
        pliCount += point.pliCount || 0
        firCount += point.firCount || 0
        if (point.kind === 'video') {
          frameHeight = point.frameHeight || frameHeight
          frameWidth = point.frameWidth || frameWidth
          fps = point.framesPerSecond || fps
          // Track quality limitation - prioritize non-none values
          if (point.qualityLimitationReason && point.qualityLimitationReason !== 'none') {
            qualityReason = point.qualityLimitationReason
          }
        }
      }
    })

    inboundRtp.forEach(ts => {
      const point = ts[i]
      if (point) {
        totalReceived += point.packetsReceived || 0
        totalLost += point.packetsLost || 0
        totalBytesReceived += point.bytesReceived || 0
        if (point.jitter !== undefined) {
          currentJitter = point.jitter
        }
        if (point.audioLevel !== undefined) {
          audioLevel = point.audioLevel
        }
        if (point.kind === 'video') {
          freezeCount += point.freezeCount || 0
          framesDropped += point.framesDropped || 0
        }
      }
    })

    // Get RTT and available bitrate from candidate pairs
    let currentRtt = null
    candidatePairs.forEach(ts => {
      const point = ts[i]
      if (point && (point.state === 'succeeded' || point.nominated)) {
        if (point.currentRoundTripTime !== undefined) {
          currentRtt = point.currentRoundTripTime
        }
        if (point.availableOutgoingBitrate !== undefined) {
          availableBitrate = point.availableOutgoingBitrate
        }
      }
    })

    // Calculate deltas
    const sentDelta = totalSent - prevTotalSent
    const receivedDelta = totalReceived - prevTotalReceived
    const lostDelta = totalLost - prevTotalLost
    const bytesSentDelta = totalBytesSent - prevBytesSent
    const bytesReceivedDelta = totalBytesReceived - prevBytesReceived
    const nackDelta = nackCount - prevNackCount
    const pliDelta = pliCount - prevPliCount
    const firDelta = firCount - prevFirCount
    const freezeDelta = freezeCount - prevFreezeCount
    const droppedDelta = framesDropped - prevFramesDropped

    if (i > 0) {
      packets.push({ time, sent: sentDelta, received: receivedDelta })

      const lossPercent = receivedDelta + lostDelta > 0
        ? (lostDelta / (receivedDelta + lostDelta)) * 100
        : 0
      packetLoss.push({ time, loss: Math.max(0, Math.min(100, lossPercent)) })

      // Bitrate in kbps
      const sendBitrate = interval > 0 ? (bytesSentDelta * 8) / interval / 1000 : 0
      const recvBitrate = interval > 0 ? (bytesReceivedDelta * 8) / interval / 1000 : 0
      bitrate.push({
        time,
        sendBitrate: Math.round(sendBitrate),
        recvBitrate: Math.round(recvBitrate),
        available: availableBitrate ? Math.round(availableBitrate / 1000) : null
      })

      // Recovery stats (NACK/PLI/FIR)
      recovery.push({
        time,
        nackCount: Math.max(0, nackDelta),
        pliCount: Math.max(0, pliDelta),
        firCount: Math.max(0, firDelta)
      })

      // Video events (freezes, dropped frames)
      videoEvents.push({
        time,
        freezeCount: Math.max(0, freezeDelta),
        framesDropped: Math.max(0, droppedDelta)
      })
    }

    // Quality limitation (record at every sample)
    qualityLimitation.push({ time, reason: qualityReason })

    if (currentRtt !== null) {
      rtt.push({ time, rtt: currentRtt * 1000 }) // Convert to ms
    }

    if (currentJitter !== null) {
      jitter.push({ time, jitter: currentJitter * 1000 }) // Convert to ms
    }

    if (frameHeight || fps) {
      video.push({
        time,
        resolution: frameHeight ? `${frameWidth}x${frameHeight}` : null,
        height: frameHeight,
        fps: fps
      })
    }

    if (audioLevel !== null) {
      audio.push({ time, level: audioLevel, packets: receivedDelta })
    }

    prevTotalSent = totalSent
    prevTotalReceived = totalReceived
    prevTotalLost = totalLost
    prevBytesSent = totalBytesSent
    prevBytesReceived = totalBytesReceived
    prevNackCount = nackCount
    prevPliCount = pliCount
    prevFirCount = firCount
    prevFreezeCount = freezeCount
    prevFramesDropped = framesDropped
  }

  // Build quality limitation segments for timeline visualization
  const limitationSegments = buildLimitationSegments(qualityLimitation)

  return {
    packets,
    packetLoss,
    rtt,
    jitter,
    video,
    audio,
    bitrate,
    qualityLimitation,
    limitationSegments,
    videoEvents,
    recovery
  }
}

/**
 * Build segments from quality limitation data for timeline visualization
 */
function buildLimitationSegments(qualityLimitation) {
  const segments = []
  if (qualityLimitation.length === 0) return segments

  let currentSegment = {
    start: qualityLimitation[0].time,
    end: qualityLimitation[0].time,
    reason: qualityLimitation[0].reason
  }

  for (let i = 1; i < qualityLimitation.length; i++) {
    const point = qualityLimitation[i]
    if (point.reason === currentSegment.reason) {
      currentSegment.end = point.time
    } else {
      segments.push(currentSegment)
      currentSegment = {
        start: point.time,
        end: point.time,
        reason: point.reason
      }
    }
  }
  segments.push(currentSegment)

  return segments
}

function calculateSummary(stats, mediaStats, selectedPair, timestamps) {
  // Calculate duration
  const startTime = timestamps[0] || 0
  const endTime = timestamps[timestamps.length - 1] || 0
  const durationMs = endTime - startTime

  const durationSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  // Calculate totals from the last data point
  let totalPacketsSent = 0
  let totalPacketsReceived = 0
  let totalPacketsLost = 0

  Object.values(stats).forEach(timeSeries => {
    if (!timeSeries || timeSeries.length === 0) return
    const latest = timeSeries[timeSeries.length - 1]

    if (latest.type === 'outbound-rtp') {
      totalPacketsSent += latest.packetsSent || 0
    }
    if (latest.type === 'inbound-rtp') {
      totalPacketsReceived += latest.packetsReceived || 0
      totalPacketsLost += latest.packetsLost || 0
    }
  })

  // Calculate average RTT
  const avgRtt = mediaStats.rtt.length > 0
    ? mediaStats.rtt.reduce((sum, r) => sum + r.rtt, 0) / mediaStats.rtt.length
    : null

  // Calculate average bitrate
  const avgSendBitrate = mediaStats.bitrate.length > 0
    ? Math.round(mediaStats.bitrate.reduce((sum, b) => sum + b.sendBitrate, 0) / mediaStats.bitrate.length)
    : 0
  const avgRecvBitrate = mediaStats.bitrate.length > 0
    ? Math.round(mediaStats.bitrate.reduce((sum, b) => sum + b.recvBitrate, 0) / mediaStats.bitrate.length)
    : 0
  const peakBitrate = mediaStats.bitrate.length > 0
    ? Math.max(...mediaStats.bitrate.map(b => Math.max(b.sendBitrate, b.recvBitrate)))
    : 0

  // Calculate quality limitation stats
  const limitedSamples = mediaStats.qualityLimitation.filter(q => q.reason !== 'none').length
  const qualityLimitedPercent = mediaStats.qualityLimitation.length > 0
    ? Math.round((limitedSamples / mediaStats.qualityLimitation.length) * 100)
    : 0

  // Find primary limitation reason
  const limitationCounts = {}
  mediaStats.qualityLimitation.forEach(q => {
    if (q.reason !== 'none') {
      limitationCounts[q.reason] = (limitationCounts[q.reason] || 0) + 1
    }
  })
  const primaryLimitation = Object.entries(limitationCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'

  // Calculate freeze/event stats
  const freezeCount = mediaStats.videoEvents.reduce((sum, e) => sum + e.freezeCount, 0)
  const framesDropped = mediaStats.videoEvents.reduce((sum, e) => sum + e.framesDropped, 0)

  // Calculate recovery stats
  const nackTotal = mediaStats.recovery.reduce((sum, r) => sum + r.nackCount, 0)
  const pliTotal = mediaStats.recovery.reduce((sum, r) => sum + r.pliCount, 0)

  // Determine connection type from selected pair
  let connectionType = 'Unknown'
  if (selectedPair && selectedPair.localCandidateId) {
    // Find the local candidate
    const localCandidate = stats[selectedPair.localCandidateId]
    if (localCandidate && localCandidate.length > 0) {
      const candidateType = localCandidate[localCandidate.length - 1].candidateType
      if (candidateType === 'host') connectionType = 'Direct (host)'
      else if (candidateType === 'srflx') connectionType = 'STUN (srflx)'
      else if (candidateType === 'relay') connectionType = 'TURN Relay'
      else connectionType = candidateType || 'Unknown'
    }
  }

  // Get final ICE state from selected pair or any succeeded pair
  let iceState = 'unknown'
  if (selectedPair) {
    iceState = selectedPair.state || 'unknown'
  }

  return {
    duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    durationMs,
    connectionType,
    iceState,
    totalPacketsSent,
    totalPacketsReceived,
    totalPacketsLost,
    packetLossPercent: totalPacketsReceived + totalPacketsLost > 0
      ? ((totalPacketsLost / (totalPacketsReceived + totalPacketsLost)) * 100).toFixed(2)
      : '0.00',
    avgRtt: avgRtt ? avgRtt.toFixed(0) : null,
    // New metrics
    avgSendBitrate,
    avgRecvBitrate,
    peakBitrate,
    qualityLimitedPercent,
    primaryLimitation,
    freezeCount,
    framesDropped,
    nackTotal,
    pliTotal
  }
}
