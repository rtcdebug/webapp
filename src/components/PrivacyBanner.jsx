import { useState } from 'react'

function PrivacyBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="privacy-banner">
      <div className="container privacy-banner-content">
        <p>
          <span>🔒 Privacy first:</span> Your dump is analyzed entirely in your browser. No data is uploaded to any server.
        </p>
        <button
          className="privacy-banner-close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default PrivacyBanner
