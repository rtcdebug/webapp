import { useState, useMemo } from 'react'

function RawDataExplorer({ data }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedPaths, setExpandedPaths] = useState(new Set(['root']))
  const [copiedPath, setCopiedPath] = useState(null)

  const toggleExpand = (path) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const copyValue = (value, path) => {
    const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    navigator.clipboard.writeText(text)
    setCopiedPath(path)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  const matchesSearch = (key, value) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    if (String(key).toLowerCase().includes(term)) return true
    if (typeof value === 'string' && value.toLowerCase().includes(term)) return true
    if (typeof value === 'number' && String(value).includes(term)) return true
    return false
  }

  const renderValue = (value, path, key, depth = 0) => {
    const isExpanded = expandedPaths.has(path)
    const isObject = value !== null && typeof value === 'object'
    const isArray = Array.isArray(value)

    if (!matchesSearch(key, value) && !isObject) {
      return null
    }

    const indent = depth * 16

    if (!isObject) {
      return (
        <div
          key={path}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            paddingLeft: indent,
            paddingTop: '4px',
            paddingBottom: '4px'
          }}
        >
          <span style={{ color: 'var(--accent-cyan)' }}>{key}:</span>
          <span style={{
            color: typeof value === 'string' ? 'var(--success-green)' :
                   typeof value === 'number' ? 'var(--accent-pink)' :
                   typeof value === 'boolean' ? 'var(--warning-yellow)' :
                   'var(--text-muted)'
          }}>
            {typeof value === 'string' ? `"${value}"` : String(value)}
          </span>
          <button
            onClick={() => copyValue(value, path)}
            style={{
              background: 'none',
              border: 'none',
              color: copiedPath === path ? 'var(--success-green)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              opacity: 0.6
            }}
            title="Copy value"
          >
            {copiedPath === path ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      )
    }

    const entries = Object.entries(value)
    const childCount = entries.length
    const preview = isArray
      ? `Array(${childCount})`
      : `{${childCount} ${childCount === 1 ? 'key' : 'keys'}}`

    return (
      <div key={path}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: indent,
            paddingTop: '4px',
            paddingBottom: '4px',
            cursor: 'pointer'
          }}
          onClick={() => toggleExpand(path)}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 0.15s'
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ color: 'var(--accent-cyan)' }}>{key}:</span>
          <span style={{ color: 'var(--text-muted)' }}>{preview}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              copyValue(value, path)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: copiedPath === path ? 'var(--success-green)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              opacity: 0.6
            }}
            title="Copy object"
          >
            {copiedPath === path ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>

        {isExpanded && (
          <div>
            {entries.slice(0, 100).map(([childKey, childValue]) =>
              renderValue(childValue, `${path}.${childKey}`, childKey, depth + 1)
            )}
            {entries.length > 100 && (
              <div style={{ paddingLeft: indent + 16, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                ... and {entries.length - 100} more items
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card compact">
      <div className="card-header compact">
        <h2 className="card-title">Raw Data</h2>
      </div>

      <div className="raw-explorer">
        <input
          type="text"
          className="raw-search"
          placeholder="Search keys or values..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
        />

        <div className="json-tree" style={{ maxHeight: '300px', fontSize: '0.8rem' }}>
          {renderValue(data, 'root', 'dump', 0)}
        </div>
      </div>
    </div>
  )
}

export default RawDataExplorer
