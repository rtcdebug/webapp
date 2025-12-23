import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Bar
} from 'recharts'

const COLORS = {
  send: '#22d3ee',
  recv: '#f472b6',
  available: '#22c55e',
  loss: '#ef4444',
  rtt: '#22d3ee',
  jitter: '#f472b6',
  fps: '#f472b6',
  resolution: '#22d3ee',
  freeze: '#ef4444',
  dropped: '#eab308',
  nack: '#eab308',
  pli: '#ef4444',
  fir: '#a855f7',
  cpu: '#eab308',
  bandwidth: '#ef4444',
  none: '#22c55e',
  audio: '#22d3ee',
  other: '#a855f7',
  // Simulcast RID colors
  rid: {
    h: '#22c55e',   // High - green
    m: '#eab308',   // Medium - yellow
    l: '#ef4444',   // Low - red
    f: '#22d3ee',   // Full (default)
    q: '#a855f7'    // Quarter
  }
}

function ChartGrid({ stats, codecs }) {
  const [collapsedRids, setCollapsedRids] = useState({})

  // Extract codec names from codecs array
  const getCodecName = (type, direction) => {
    const codec = codecs?.find(c =>
      c.mimeType?.startsWith(type) &&
      (c.direction === direction || c.direction === 'both')
    )
    return codec?.mimeType?.split('/')[1]?.toUpperCase()
  }

  const videoOutCodec = getCodecName('video', 'send')
  const videoInCodec = getCodecName('video', 'recv')
  const audioInCodec = getCodecName('audio', 'recv')

  const toggleRid = (rid) => {
    setCollapsedRids(prev => ({ ...prev, [rid]: !prev[rid] }))
  }

  const minTime = useMemo(() => {
    if (stats.bitrate?.length) return stats.bitrate[0]?.time || 0
    if (stats.rtt?.length) return stats.rtt[0]?.time || 0
    return 0
  }, [stats])

  const formatTime = (timestamp) => {
    const offset = (timestamp - minTime) / 1000
    const mins = Math.floor(offset / 60)
    const secs = Math.floor(offset % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-time">{formatTime(label)}</div>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            {entry.unit || ''}
          </div>
        ))}
      </div>
    )
  }

  const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 }
  const axisProps = {
    stroke: '#27272a',
    tick: { fill: '#71717a', fontSize: 10 },
    tickLine: false,
    axisLine: false,
    width: 35
  }

  const hasData = (arr) => arr?.length > 0

  // Calculate stats for headers
  const calcStats = (data, key) => {
    if (!data?.length) return null
    const values = data.map(d => d[key]).filter(v => v != null && !isNaN(v))
    if (values.length === 0) return null
    const sorted = [...values].sort((a, b) => a - b)
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
    }
  }

  const formatStat = (val, unit = '') => {
    if (val == null || isNaN(val)) return '—'
    if (unit === 'kbps' && val >= 1000) return `${(val / 1000).toFixed(1)}M`
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k${unit}`
    return `${Math.round(val)}${unit}`
  }

  const charts = []

  // 1. Bitrate Chart
  if (hasData(stats.bitrate)) {
    const sendStats = calcStats(stats.bitrate, 'sendBitrate')
    const recvStats = calcStats(stats.bitrate, 'recvBitrate')
    charts.push(
      <div key="bitrate" className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Bitrate</h3>
          <ChartLegend items={[
            { color: COLORS.send, label: 'Send' },
            { color: COLORS.recv, label: 'Recv' },
            { color: COLORS.available, label: 'Avail', dashed: true }
          ]} />
        </div>
        <ChartHeaderStats stats={[
          { label: 'Send avg', value: formatStat(sendStats?.avg, 'kbps') },
          { label: 'Recv avg', value: formatStat(recvStats?.avg, 'kbps') },
          { label: 'Peak', value: formatStat(Math.max(sendStats?.max || 0, recvStats?.max || 0), 'kbps') }
        ]} />
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart data={stats.bitrate} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}M` : `${v}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="sendBitrate" stroke={COLORS.send} fill={COLORS.send} fillOpacity={0.1} name="Send" unit=" kbps" strokeWidth={1.5} />
            <Area type="monotone" dataKey="recvBitrate" stroke={COLORS.recv} fill={COLORS.recv} fillOpacity={0.1} name="Recv" unit=" kbps" strokeWidth={1.5} />
            <Line type="monotone" dataKey="available" stroke={COLORS.available} name="Avail" unit=" kbps" dot={false} strokeWidth={1} strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 2. Packet Loss Chart
  if (hasData(stats.packetLoss)) {
    const lossStats = calcStats(stats.packetLoss, 'loss')
    charts.push(
      <div key="packetloss" className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Packet Loss</h3>
          <ChartLegend items={[{ color: COLORS.loss, label: 'Loss %' }]} />
        </div>
        <ChartHeaderStats stats={[
          { label: 'Avg', value: `${lossStats?.avg?.toFixed(2) || '—'}%` },
          { label: 'Max', value: `${lossStats?.max?.toFixed(2) || '—'}%` },
          { label: 'P95', value: `${lossStats?.p95?.toFixed(2) || '—'}%` }
        ]} />
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={stats.packetLoss} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
            <YAxis domain={[0, 'auto']} {...axisProps} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={2} stroke={COLORS.loss} strokeDasharray="3 3" strokeWidth={1} label={{ value: '2%', fill: '#71717a', fontSize: 10 }} />
            <defs>
              <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.loss} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS.loss} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="loss" stroke={COLORS.loss} fill="url(#lossGrad)" name="Loss" unit="%" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 3. RTT & Jitter Chart
  if (hasData(stats.rtt) || hasData(stats.jitter)) {
    const rttStats = calcStats(stats.rtt, 'rtt')
    const jitterStats = calcStats(stats.jitter, 'jitter')

    // Combine RTT and jitter data by time
    const combinedData = []
    const timeMap = new Map()
    stats.rtt?.forEach(r => timeMap.set(r.time, { time: r.time, rtt: r.rtt }))
    stats.jitter?.forEach(j => {
      const existing = timeMap.get(j.time)
      if (existing) existing.jitter = j.jitter
      else timeMap.set(j.time, { time: j.time, jitter: j.jitter })
    })
    timeMap.forEach(v => combinedData.push(v))
    combinedData.sort((a, b) => a.time - b.time)

    charts.push(
      <div key="rtt-jitter" className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">RTT & Jitter</h3>
          <ChartLegend items={[
            hasData(stats.rtt) && { color: COLORS.rtt, label: 'RTT' },
            hasData(stats.jitter) && { color: COLORS.jitter, label: 'Jitter' }
          ].filter(Boolean)} />
        </div>
        <ChartHeaderStats stats={[
          { label: 'RTT avg', value: formatStat(rttStats?.avg, 'ms') },
          { label: 'RTT p95', value: formatStat(rttStats?.p95, 'ms') },
          { label: 'Jitter avg', value: formatStat(jitterStats?.avg, 'ms') }
        ]} />
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={combinedData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
            <YAxis domain={[0, 'auto']} {...axisProps} tickFormatter={(v) => `${Math.round(v)}`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={100} stroke="#71717a" strokeDasharray="2 2" strokeWidth={1} />
            <ReferenceLine y={300} stroke={COLORS.loss} strokeDasharray="2 2" strokeWidth={1} />
            {hasData(stats.rtt) && (
              <Line type="monotone" dataKey="rtt" stroke={COLORS.rtt} name="RTT" unit=" ms" dot={false} strokeWidth={1.5} />
            )}
            {hasData(stats.jitter) && (
              <Line type="monotone" dataKey="jitter" stroke={COLORS.jitter} name="Jitter" unit=" ms" dot={false} strokeWidth={1.5} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 4. Video Quality Charts (handles simulcast, pub/sub, and single direction)

  // Helper to render a video quality chart
  const renderVideoChart = (key, title, data, color = COLORS.resolution, codec = null) => {
    const fpsStats = calcStats(data, 'fps')
    const resStats = calcStats(data, 'height')
    return (
      <div key={key} className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">
            {title}
            {codec && <span className="codec-badge">{codec}</span>}
          </h3>
          <ChartLegend items={[
            { color, label: 'Resolution' },
            { color: COLORS.fps, label: 'FPS' }
          ]} />
        </div>
        <ChartHeaderStats stats={[
          { label: 'Res avg', value: resStats?.avg ? `${Math.round(resStats.avg)}p` : '—' },
          { label: 'FPS avg', value: fpsStats?.avg?.toFixed(1) || '—' },
          { label: 'FPS min', value: fpsStats?.min?.toFixed(0) || '—' }
        ]} />
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
            <YAxis yAxisId="left" domain={[0, 'auto']} {...axisProps} tickFormatter={(v) => `${v}p`} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 60]} {...axisProps} width={25} />
            <Tooltip content={<CustomTooltip />} />
            <Line yAxisId="left" type="stepAfter" dataKey="height" stroke={color} name="Res" unit="p" dot={false} strokeWidth={1.5} />
            <Line yAxisId="right" type="monotone" dataKey="fps" stroke={COLORS.fps} name="FPS" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Video Out: show if there's outbound video data
  if (stats.isSimulcast && stats.simulcastLayers && stats.simulcastVideo) {
    // Simulcast: show per-RID collapsible charts
    charts.push(
      <div key="video-out" className="chart-card chart-card-simulcast">
        <div className="chart-card-header">
          <h3 className="chart-card-title">
            Video Out
            {videoOutCodec && <span className="codec-badge">{videoOutCodec}</span>}
          </h3>
          <span className="simulcast-badge">{stats.simulcastLayers.length} layers</span>
        </div>
        <div className="simulcast-layers">
          {stats.simulcastLayers.map(rid => {
            const ridData = stats.simulcastVideo[rid] || []
            const ridColor = COLORS.rid[rid] || COLORS.resolution
            const fpsStats = calcStats(ridData, 'fps')
            const resStats = calcStats(ridData, 'height')
            const bitrateStats = calcStats(ridData, 'bitrate')
            const isCollapsed = collapsedRids[rid]

            return (
              <div key={rid} className="simulcast-layer">
                <button
                  className="simulcast-layer-header"
                  onClick={() => toggleRid(rid)}
                >
                  <span className="simulcast-rid" style={{ color: ridColor }}>
                    {isCollapsed ? '▸' : '▾'} RID: {rid}
                  </span>
                  <span className="simulcast-summary">
                    {resStats?.avg ? `${Math.round(resStats.avg)}p` : '—'} • {fpsStats?.avg?.toFixed(0) || '—'}fps • {bitrateStats?.avg ? formatStat(bitrateStats.avg, 'kbps') : '—'}
                  </span>
                </button>
                {!isCollapsed && (
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={ridData} margin={chartMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
                      <YAxis yAxisId="left" domain={[0, 'auto']} {...axisProps} tickFormatter={(v) => `${v}p`} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 60]} {...axisProps} width={25} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line yAxisId="left" type="stepAfter" dataKey="height" stroke={ridColor} name="Res" unit="p" dot={false} strokeWidth={1.5} />
                      <Line yAxisId="right" type="monotone" dataKey="fps" stroke={COLORS.fps} name="FPS" dot={false} strokeWidth={1.5} opacity={0.7} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  } else if (hasData(stats.videoOut)) {
    // Non-simulcast outbound
    charts.push(renderVideoChart('video-out', 'Video Out', stats.videoOut, COLORS.send, videoOutCodec))
  }

  // Video In: show if there's inbound video data
  if (hasData(stats.videoIn)) {
    charts.push(renderVideoChart('video-in', 'Video In', stats.videoIn, COLORS.recv, videoInCodec))
  }

  // 5. Quality Limitation Chart
  if (hasData(stats.qualityLimitation)) {
    const limitCounts = stats.qualityLimitation.reduce((acc, q) => {
      acc[q.reason] = (acc[q.reason] || 0) + 1
      return acc
    }, {})
    const total = stats.qualityLimitation.length
    const nonePercent = ((limitCounts.none || 0) / total * 100).toFixed(0)
    const cpuPercent = ((limitCounts.cpu || 0) / total * 100).toFixed(0)
    const bwPercent = ((limitCounts.bandwidth || 0) / total * 100).toFixed(0)

    charts.push(
      <div key="quality-limit" className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Quality Limitation</h3>
          <ChartLegend items={[
            { color: COLORS.none, label: 'None' },
            { color: COLORS.cpu, label: 'CPU' },
            { color: COLORS.bandwidth, label: 'BW' }
          ]} />
        </div>
        <ChartHeaderStats stats={[
          { label: 'Good', value: `${nonePercent}%` },
          { label: 'CPU', value: `${cpuPercent}%` },
          { label: 'BW', value: `${bwPercent}%` }
        ]} />
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart data={stats.qualityLimitation} margin={chartMargin}>
            <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
            <YAxis hide domain={[0, 1]} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const reason = payload[0]?.payload?.reason || 'none'
              return (
                <div className="chart-tooltip">
                  <div className="chart-tooltip-time">{formatTime(label)}</div>
                  <div style={{ color: COLORS[reason] || COLORS.none }}>
                    {reason === 'none' ? 'No limitation' : reason}
                  </div>
                </div>
              )
            }} />
            {stats.limitationSegments?.map((segment, i) => (
              <ReferenceArea
                key={i}
                x1={segment.start}
                x2={segment.end}
                y1={0}
                y2={1}
                fill={COLORS[segment.reason] || COLORS.none}
                fillOpacity={0.6}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 6. Recovery (NACK/PLI/FIR) Chart
  if (hasData(stats.recovery) && stats.recovery.some(r => r.nackCount > 0 || r.pliCount > 0 || r.firCount > 0)) {
    const nackTotal = stats.recovery.reduce((sum, r) => sum + r.nackCount, 0)
    const pliTotal = stats.recovery.reduce((sum, r) => sum + r.pliCount, 0)
    const firTotal = stats.recovery.reduce((sum, r) => sum + r.firCount, 0)

    charts.push(
      <div key="recovery" className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Recovery Requests</h3>
          <ChartLegend items={[
            { color: COLORS.nack, label: 'NACK' },
            { color: COLORS.pli, label: 'PLI' },
            { color: COLORS.fir, label: 'FIR' }
          ]} />
        </div>
        <ChartHeaderStats stats={[
          { label: 'NACK', value: formatStat(nackTotal) },
          { label: 'PLI', value: formatStat(pliTotal) },
          { label: 'FIR', value: formatStat(firTotal) }
        ]} />
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart data={stats.recovery} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="nackCount" fill={COLORS.nack} name="NACK" stackId="recovery" />
            <Bar dataKey="pliCount" fill={COLORS.pli} name="PLI" stackId="recovery" />
            <Bar dataKey="firCount" fill={COLORS.fir} name="FIR" stackId="recovery" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 7. Audio In Chart (level, jitter, concealment)
  if (hasData(stats.audioIn)) {
    const levelStats = calcStats(stats.audioIn, 'level')
    const jitterStats = calcStats(stats.audioIn, 'jitter')
    const concealStats = calcStats(stats.audioIn, 'concealmentPercent')
    charts.push(
      <div key="audio-in" className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">
            Audio In
            {audioInCodec && <span className="codec-badge">{audioInCodec}</span>}
          </h3>
          <ChartLegend items={[
            { color: COLORS.audio, label: 'Level' },
            { color: COLORS.jitter, label: 'Jitter' }
          ]} />
        </div>
        <ChartHeaderStats stats={[
          { label: 'Level avg', value: levelStats?.avg?.toFixed(2) || '—' },
          { label: 'Jitter avg', value: jitterStats?.avg ? `${jitterStats.avg.toFixed(1)}ms` : '—' },
          { label: 'Conceal', value: concealStats?.avg ? `${concealStats.avg.toFixed(2)}%` : '—' }
        ]} />
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart data={stats.audioIn} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
            <YAxis yAxisId="left" domain={[0, 1]} {...axisProps} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} {...axisProps} width={30} tickFormatter={(v) => `${v}ms`} />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="audioInGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.audio} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS.audio} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area yAxisId="left" type="monotone" dataKey="level" stroke={COLORS.audio} fill="url(#audioInGrad)" name="Level" strokeWidth={1} />
            <Line yAxisId="right" type="monotone" dataKey="jitter" stroke={COLORS.jitter} name="Jitter" unit="ms" dot={false} strokeWidth={1.5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 8. Video Events (Freezes & Dropped Frames) Chart
  if (hasData(stats.videoEvents) && stats.videoEvents.some(e => e.freezeCount > 0 || e.framesDropped > 0)) {
    const freezeTotal = stats.videoEvents.reduce((sum, e) => sum + e.freezeCount, 0)
    const droppedTotal = stats.videoEvents.reduce((sum, e) => sum + e.framesDropped, 0)

    charts.push(
      <div key="video-events" className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Video Events</h3>
          <ChartLegend items={[
            { color: COLORS.freeze, label: 'Freeze' },
            { color: COLORS.dropped, label: 'Dropped' }
          ]} />
        </div>
        <ChartHeaderStats stats={[
          { label: 'Freezes', value: formatStat(freezeTotal) },
          { label: 'Dropped', value: formatStat(droppedTotal) }
        ]} />
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart data={stats.videoEvents} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="freezeCount" fill={COLORS.freeze} name="Freezes" />
            <Bar dataKey="framesDropped" fill={COLORS.dropped} name="Dropped" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (charts.length === 0) {
    return (
      <div className="chart-grid-empty">
        <p>No time-series data available</p>
      </div>
    )
  }

  return (
    <div className="chart-grid chart-grid-8">
      {charts}
    </div>
  )
}

function ChartLegend({ items }) {
  return (
    <div className="chart-legend">
      {items.map((item, i) => (
        <div key={i} className="chart-legend-item">
          <div
            className="chart-legend-color"
            style={{
              background: item.dashed
                ? `repeating-linear-gradient(90deg, ${item.color} 0px, ${item.color} 2px, transparent 2px, transparent 4px)`
                : item.color
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function ChartHeaderStats({ stats }) {
  return (
    <div className="chart-header-stats">
      {stats.map((stat, i) => (
        <div key={i} className="chart-header-stat">
          <span className="chart-header-stat-label">{stat.label}:</span>
          <span className="chart-header-stat-value">{stat.value}</span>
        </div>
      ))}
    </div>
  )
}

export default ChartGrid
