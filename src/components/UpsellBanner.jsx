import { useState } from 'react'
import { Link } from 'react-router-dom'

function UpsellBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="upsell-banner">
      <div className="upsell-content">
        <div className="upsell-text">
          <strong>Want automated debugging?</strong>
          <span>RTCDebug SDK captures stats from both sides, correlates issues, and tells you exactly what went wrong.</span>
        </div>
        <div className="upsell-actions">
          <Link to="/#cta" className="upsell-cta">Get Early Access</Link>
          <button className="upsell-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpsellBanner
