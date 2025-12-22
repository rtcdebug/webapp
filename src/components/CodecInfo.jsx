function CodecInfo({ codecs, tracks }) {
  if ((!codecs || codecs.length === 0) && (!tracks || tracks.length === 0)) {
    return null
  }

  const videoTracks = tracks?.filter(t => t.kind === 'video') || []
  const audioTracks = tracks?.filter(t => t.kind === 'audio') || []

  // Group video tracks by direction for simulcast detection
  const outboundVideo = videoTracks.filter(t => t.direction === 'outbound')
  const inboundVideo = videoTracks.filter(t => t.direction === 'inbound')

  const hasSimulcast = outboundVideo.length > 1 || outboundVideo.some(t => t.rid)

  return (
    <div className="card compact">
      <div className="card-header compact">
        <h2 className="card-title">Codecs & Tracks</h2>
        {hasSimulcast && <span className="badge simulcast">Simulcast</span>}
      </div>

      <div className="codec-grid">
        {/* Codecs */}
        {codecs && codecs.length > 0 && (
          <div className="codec-section">
            <h4 className="section-label">Codecs</h4>
            <div className="codec-list">
              {codecs.map((codec, idx) => (
                <div key={idx} className="codec-item">
                  <span className="codec-name">{codec.mimeType}</span>
                  <span className="codec-detail">{codec.clockRate}Hz</span>
                  {codec.channels && <span className="codec-detail">{codec.channels}ch</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outbound Video Tracks */}
        {outboundVideo.length > 0 && (
          <div className="codec-section">
            <h4 className="section-label">Outbound Video</h4>
            <div className="track-list">
              {outboundVideo.map((track, idx) => (
                <div key={idx} className="track-item">
                  {track.rid && <span className="track-rid">{track.rid}</span>}
                  <span className="track-resolution">
                    {track.frameWidth && track.frameHeight
                      ? `${track.frameWidth}x${track.frameHeight}`
                      : 'N/A'}
                  </span>
                  {track.framesPerSecond && (
                    <span className="track-fps">{Math.round(track.framesPerSecond)}fps</span>
                  )}
                  {track.encoderImplementation && (
                    <span className="track-encoder">{track.encoderImplementation}</span>
                  )}
                  {track.qualityLimitationReason && track.qualityLimitationReason !== 'none' && (
                    <span className="track-limitation">{track.qualityLimitationReason}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inbound Video Tracks */}
        {inboundVideo.length > 0 && (
          <div className="codec-section">
            <h4 className="section-label">Inbound Video</h4>
            <div className="track-list">
              {inboundVideo.map((track, idx) => (
                <div key={idx} className="track-item">
                  <span className="track-resolution">
                    {track.frameWidth && track.frameHeight
                      ? `${track.frameWidth}x${track.frameHeight}`
                      : 'N/A'}
                  </span>
                  {track.framesPerSecond && (
                    <span className="track-fps">{Math.round(track.framesPerSecond)}fps</span>
                  )}
                  {track.decoderImplementation && (
                    <span className="track-encoder">{track.decoderImplementation}</span>
                  )}
                  {track.packetsLost > 0 && (
                    <span className="track-loss">{track.packetsLost} lost</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio Tracks Summary */}
        {audioTracks.length > 0 && (
          <div className="codec-section">
            <h4 className="section-label">Audio</h4>
            <div className="track-list">
              <div className="track-item">
                <span className="track-count">
                  {audioTracks.filter(t => t.direction === 'outbound').length} out
                </span>
                <span className="track-count">
                  {audioTracks.filter(t => t.direction === 'inbound').length} in
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CodecInfo
