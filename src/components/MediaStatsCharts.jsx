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

const LIMITATION_COLORS = {
  'none': '#22c55e',
  'cpu': '#eab308',
  'bandwidth': '#ef4444',
  'other': '#71717a'
}

function MediaStatsCharts({ stats }) {
  const getMinTime = () => {
    if (stats.packets?.length) return stats.packets[0]?.time || 0
    if (stats.bitrate?.length) return stats.bitrate[0]?.time || 0
    return 0
  }

  const formatTime = (timestamp) => {
    const minTime = getMinTime()
    const offset = (timestamp - minTime) / 1000
    const mins = Math.floor(offset / 60)
    const secs = Math.floor(offset % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '6px 8px',
        fontSize: '0.7rem'
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
          {formatTime(label)}
        </div>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            {entry.unit || ''}
          </div>
        ))}
      </div>
    )
  }

  const chartProps = {
    margin: { top: 5, right: 5, left: 0, bottom: 0 }
  }

  const axisProps = {
    stroke: '#27272a',
    tick: { fill: '#71717a', fontSize: 9 },
    tickLine: false,
    axisLine: false
  }

  const chartHeight = 140

  // Helper to check if data exists
  const hasData = (arr) => arr?.length > 0

  return (
    <div className="card compact">
      <div className="card-header compact">
        <h2 className="card-title">Media Stats</h2>
      </div>

      <div className="charts-grid">
        {/* Bitrate Chart */}
        {hasData(stats.bitrate) && (
          <div className="chart-cell">
            <div className="chart-label">Bitrate (kbps)</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <ComposedChart data={stats.bitrate} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="sendBitrate" stroke="#22d3ee" name="Send" unit=" kbps" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="recvBitrate" stroke="#f472b6" name="Recv" unit=" kbps" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="available" stroke="#22c55e" name="Avail" unit=" kbps" dot={false} strokeWidth={1} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
            <ChartLegend items={[
              { color: '#22d3ee', label: 'Send' },
              { color: '#f472b6', label: 'Recv' },
              { color: '#22c55e', label: 'Avail', dashed: true }
            ]} />
          </div>
        )}

        {/* Packet Loss Chart */}
        {hasData(stats.packetLoss) && (
          <div className="chart-cell">
            <div className="chart-label">Packet Loss (%)</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={stats.packetLoss} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
                <YAxis domain={[0, 'auto']} {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                <Area type="monotone" dataKey="loss" stroke="#ef4444" fill="url(#lossGrad)" name="Loss" unit="%" strokeWidth={1.5} />
                <defs>
                  <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RTT Chart */}
        {hasData(stats.rtt) && (
          <div className="chart-cell">
            <div className="chart-label">RTT (ms)</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={stats.rtt} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
                <YAxis domain={[0, 'auto']} {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={300} stroke="#eab308" strokeDasharray="3 3" strokeWidth={1} />
                <Line type="monotone" dataKey="rtt" stroke="#22d3ee" name="RTT" unit=" ms" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quality Limitation Chart */}
        {hasData(stats.qualityLimitation) && (
          <div className="chart-cell">
            <div className="chart-label">Quality Limitation</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <ComposedChart data={stats.qualityLimitation} {...chartProps}>
                <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
                <YAxis hide domain={[0, 1]} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const reason = payload[0]?.payload?.reason || 'none'
                  return (
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '0.7rem'
                    }}>
                      <div style={{ color: 'var(--text-muted)' }}>{formatTime(label)}</div>
                      <div style={{ color: LIMITATION_COLORS[reason] }}>
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
                    fill={LIMITATION_COLORS[segment.reason]}
                    fillOpacity={0.6}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
            <ChartLegend items={[
              { color: '#22c55e', label: 'None' },
              { color: '#eab308', label: 'CPU' },
              { color: '#ef4444', label: 'BW' }
            ]} />
          </div>
        )}

        {/* Video Resolution & FPS */}
        {hasData(stats.video) && (
          <div className="chart-cell">
            <div className="chart-label">Video</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={stats.video} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
                <YAxis yAxisId="left" domain={[0, 'auto']} {...axisProps} tickFormatter={(v) => `${v}p`} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 60]} {...axisProps} hide />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="left" type="stepAfter" dataKey="height" stroke="#22d3ee" name="Res" unit="p" dot={false} strokeWidth={1.5} />
                <Line yAxisId="right" type="monotone" dataKey="fps" stroke="#f472b6" name="FPS" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
            <ChartLegend items={[
              { color: '#22d3ee', label: 'Resolution' },
              { color: '#f472b6', label: 'FPS' }
            ]} />
          </div>
        )}

        {/* Jitter Chart */}
        {hasData(stats.jitter) && (
          <div className="chart-cell">
            <div className="chart-label">Jitter (ms)</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={stats.jitter} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
                <YAxis domain={[0, 'auto']} {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="jitter" stroke="#f472b6" name="Jitter" unit=" ms" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recovery (NACK/PLI/FIR) */}
        {hasData(stats.recovery) && stats.recovery.some(r => r.nackCount > 0 || r.pliCount > 0 || r.firCount > 0) && (
          <div className="chart-cell">
            <div className="chart-label">Recovery (NACK/PLI)</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={stats.recovery} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="nackCount" stroke="#eab308" name="NACK" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="pliCount" stroke="#ef4444" name="PLI" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
            <ChartLegend items={[
              { color: '#eab308', label: 'NACK' },
              { color: '#ef4444', label: 'PLI' }
            ]} />
          </div>
        )}

        {/* Video Events (Freezes) */}
        {hasData(stats.videoEvents) && stats.videoEvents.some(e => e.freezeCount > 0 || e.framesDropped > 0) && (
          <div className="chart-cell">
            <div className="chart-label">Freezes & Drops</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <ComposedChart data={stats.videoEvents} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" tickFormatter={formatTime} {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="freezeCount" fill="#ef4444" name="Freezes" />
                <Line type="monotone" dataKey="framesDropped" stroke="#eab308" name="Dropped" dot={false} strokeWidth={1.5} />
              </ComposedChart>
            </ResponsiveContainer>
            <ChartLegend items={[
              { color: '#ef4444', label: 'Freezes' },
              { color: '#eab308', label: 'Dropped' }
            ]} />
          </div>
        )}
      </div>
    </div>
  )
}

function ChartLegend({ items }) {
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '4px', fontSize: '0.65rem' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
          <div style={{
            width: '10px',
            height: '2px',
            background: item.dashed
              ? `repeating-linear-gradient(90deg, ${item.color} 0px, ${item.color} 2px, transparent 2px, transparent 4px)`
              : item.color,
            borderRadius: '1px'
          }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}

export default MediaStatsCharts
