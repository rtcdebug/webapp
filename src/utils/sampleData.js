/**
 * Sample WebRTC dump data for demonstration
 * This simulates a real call with:
 * - Successful initial connection
 * - TURN relay fallback
 * - Packet loss spike mid-call
 * - Resolution drop from 1080p to 720p
 */

const baseTime = Date.now() - 300000 // 5 minutes ago

function t(offset) {
  return (baseTime + offset).toString()
}

export const sampleDump = {
  PeerConnections: {
    "0-1": {
      url: "https://app.example.com/room/abc123",
      rtcConfiguration: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "turn:turn.example.com:3478", username: "user", credential: "pass" }
        ]
      },
      updateLog: [
        { time: t(0), type: "iceGatheringStateChange", value: "gathering" },
        { time: t(500), type: "signalingStateChange", value: "have-local-offer" },
        { time: t(1000), type: "signalingStateChange", value: "have-remote-offer" },
        { time: t(1500), type: "iceConnectionStateChange", value: "checking" },
        { time: t(3000), type: "iceGatheringStateChange", value: "complete" },
        { time: t(4000), type: "iceConnectionStateChange", value: "connected" },
        { time: t(5000), type: "connectionStateChange", value: "connected" },
        { time: t(120000), type: "iceConnectionStateChange", value: "disconnected" },
        { time: t(122000), type: "iceConnectionStateChange", value: "connected" }
      ],
      stats: generateStats()
    }
  }
}

function generateStats() {
  const stats = {}
  const duration = 240000 // 4 minutes
  const interval = 1000 // 1 second intervals

  for (let offset = 0; offset <= duration; offset += interval) {
    const timestamp = t(offset)
    stats[timestamp] = generateSnapshot(offset, duration)
  }

  return stats
}

function generateSnapshot(offset, duration) {
  const progress = offset / duration

  // Simulate packet loss spike around 50% through the call
  let packetLossRate = 0.005 // 0.5% baseline
  if (progress > 0.45 && progress < 0.55) {
    packetLossRate = 0.08 + Math.random() * 0.04 // 8-12% during spike
  }

  // Simulate resolution drop after packet loss spike
  let frameHeight = 1080
  let frameWidth = 1920
  if (progress > 0.55) {
    frameHeight = 720
    frameWidth = 1280
  }

  // Simulate varying RTT
  let rtt = 0.045 + Math.random() * 0.02 // 45-65ms baseline
  if (progress > 0.45 && progress < 0.55) {
    rtt = 0.35 + Math.random() * 0.1 // 350-450ms during issues
  }

  const packetsBase = Math.floor(offset / 20)
  const packetsLost = Math.floor(packetsBase * packetLossRate)

  // FPS drops during packet loss
  let fps = 30
  if (progress > 0.45 && progress < 0.55) {
    fps = 12 + Math.random() * 5
  }

  return {
    // Local candidate (relay - simulating TURN fallback)
    "RTCIceCandidate_local_1": JSON.stringify({
      type: "local-candidate",
      candidateType: "relay",
      address: "192.0.2.1",
      port: 50000,
      protocol: "udp",
      priority: 2130706431,
      networkType: "wifi"
    }),

    // Local candidate (host - not selected)
    "RTCIceCandidate_local_2": JSON.stringify({
      type: "local-candidate",
      candidateType: "host",
      address: "192.168.1.100",
      port: 54321,
      protocol: "udp",
      priority: 2122194687,
      networkType: "wifi"
    }),

    // Remote candidate
    "RTCIceCandidate_remote_1": JSON.stringify({
      type: "remote-candidate",
      candidateType: "relay",
      address: "198.51.100.1",
      port: 60000,
      protocol: "udp",
      priority: 2130706431
    }),

    // Remote candidate (srflx)
    "RTCIceCandidate_remote_2": JSON.stringify({
      type: "remote-candidate",
      candidateType: "srflx",
      address: "203.0.113.50",
      port: 45678,
      protocol: "udp",
      priority: 1677721855
    }),

    // Selected candidate pair
    "RTCIceCandidatePair_1": JSON.stringify({
      type: "candidate-pair",
      state: "succeeded",
      nominated: true,
      localCandidateId: "RTCIceCandidate_local_1",
      remoteCandidateId: "RTCIceCandidate_remote_1",
      currentRoundTripTime: rtt,
      availableOutgoingBitrate: 2500000 - (progress > 0.55 ? 1000000 : 0)
    }),

    // Outbound video RTP
    "RTCOutboundRTPVideoStream_1": JSON.stringify({
      type: "outbound-rtp",
      kind: "video",
      packetsSent: packetsBase,
      bytesSent: packetsBase * 1200,
      frameHeight: frameHeight,
      frameWidth: frameWidth,
      framesPerSecond: fps,
      framesEncoded: Math.floor(offset / 33)
    }),

    // Outbound audio RTP
    "RTCOutboundRTPAudioStream_1": JSON.stringify({
      type: "outbound-rtp",
      kind: "audio",
      packetsSent: Math.floor(offset / 20),
      bytesSent: Math.floor(offset / 20) * 160
    }),

    // Inbound video RTP
    "RTCInboundRTPVideoStream_1": JSON.stringify({
      type: "inbound-rtp",
      kind: "video",
      packetsReceived: packetsBase - packetsLost,
      packetsLost: packetsLost,
      bytesReceived: (packetsBase - packetsLost) * 1200,
      jitter: 0.01 + (progress > 0.45 && progress < 0.55 ? 0.03 : 0),
      framesDecoded: Math.floor(offset / 33)
    }),

    // Inbound audio RTP
    "RTCInboundRTPAudioStream_1": JSON.stringify({
      type: "inbound-rtp",
      kind: "audio",
      packetsReceived: Math.floor(offset / 20) - Math.floor(Math.floor(offset / 20) * packetLossRate),
      packetsLost: Math.floor(Math.floor(offset / 20) * packetLossRate),
      bytesReceived: Math.floor(offset / 20) * 160,
      jitter: 0.005,
      audioLevel: 0.3 + Math.random() * 0.4
    })
  }
}
