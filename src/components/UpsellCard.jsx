function UpsellCard() {
  return (
    <div className="upsell-card">
      <h3>Want automatic diagnostics for every call?</h3>
      <p>
        RTCDebug captures stats from all participants and tells you exactly why calls fail —
        no manual dump exports needed.
      </p>
      <a href="/#cta" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        Get Early Access
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </a>
    </div>
  )
}

export default UpsellCard
