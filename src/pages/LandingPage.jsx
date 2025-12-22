import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import Header from '../components/Header'
import Footer from '../components/Footer'

function LandingPage() {
  const [heroEmail, setHeroEmail] = useState('')
  const [heroSubmitted, setHeroSubmitted] = useState(false)
  const [ctaEmail, setCtaEmail] = useState('')
  const [ctaSubmitted, setCtaSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState('sessions')

  // Scroll reveal for sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.section').forEach(el => observer.observe(el))
    // Make hero visible immediately
    document.querySelector('.hero')?.classList.add('visible')
    return () => observer.disconnect()
  }, [])

  const handleHeroSubmit = (e) => {
    e.preventDefault()
    console.log('Waitlist signup:', heroEmail)
    setHeroSubmitted(true)
  }

  const handleCtaSubmit = (e) => {
    e.preventDefault()
    console.log('Waitlist signup:', ctaEmail)
    setCtaSubmitted(true)
  }

  return (
    <div className="landing-page">
      <Helmet>
        <title>RTCDebug — Stop guessing why WebRTC calls fail</title>
        <meta name="description" content="Automatically diagnose WebRTC call quality issues. Drop in our SDK, make some calls, get a report that tells you exactly what went wrong." />
        <link rel="canonical" href="https://rtcdebug.com/" />
        <meta property="og:url" content="https://rtcdebug.com/" />
        <meta property="og:title" content="RTCDebug — Stop guessing why WebRTC calls fail" />
        <meta property="og:description" content="Automatically diagnose WebRTC call quality issues. Drop in our SDK, make some calls, get a report that tells you exactly what went wrong." />
        <meta name="twitter:url" content="https://rtcdebug.com/" />
        <meta name="twitter:title" content="RTCDebug — Stop guessing why WebRTC calls fail" />
        <meta name="twitter:description" content="Automatically diagnose WebRTC call quality issues. Drop in our SDK, make some calls, get a report that tells you exactly what went wrong." />
      </Helmet>
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>

        <HeroIllustration />

        <div className="container">
          <div className="hero-content">
            <h1>Stop guessing why calls fail</h1>
            <p className="hero-subheadline">
              Drop in our SDK, make some calls, get a report that tells you exactly what went wrong — packet loss, bandwidth issues, one-way audio, whatever.
            </p>
            {heroSubmitted ? (
              <div className="success-message show">
                You're on the list! We'll be in touch soon.
              </div>
            ) : (
              <form className="hero-form" onSubmit={handleHeroSubmit}>
                <input
                  type="email"
                  placeholder="you@company.com"
                  required
                  value={heroEmail}
                  onChange={(e) => setHeroEmail(e.target.value)}
                />
                <button type="submit">Get Early Access</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section problem" id="problem">
        <div className="geo-decoration geo-circle" style={{ top: '-100px', right: '-100px' }}></div>
        <div className="geo-decoration geo-square" style={{ bottom: '50px', left: '-50px' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="section-title">Debugging WebRTC is <span className="gradient-text">painful</span></h2>
          <p className="section-subtitle">You know something went wrong. But figuring out what? That's the hard part.</p>
          <div className="problem-grid">
            <ProblemCard
              icon={<AlertIcon />}
              title="webrtc-internals is overwhelming"
              description="Thousands of data points, no context, and it disappears when you close the tab. Good luck correlating anything."
            />
            <ProblemCard
              icon={<UsersIcon />}
              title="You can't see both sides"
              description="Is it the sender's network? The receiver's CPU? A relay issue? You only have half the picture."
            />
            <ProblemCard
              icon={<ChartIcon />}
              title="Metrics don't tell you WHY"
              description="Great, packet loss spiked at 2:34 PM. But why? What should you actually do about it?"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>From integration to insight in minutes, not months.</p>
          </div>
          <div className="steps">
            <Step1 />
            <Step2 />
            <Step3 />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features" id="features">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header">
            <h2 className="section-title">Built for real-world WebRTC</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>Everything you need to understand call quality — without the enterprise sales process.</p>
          </div>
          <div className="features-grid">
            <FeatureCard icon={<MonitorIcon />} title="Works with any SFU" description="Pion, LiveKit, mediasoup, Jitsi, or your custom stack. If it uses WebRTC, we can diagnose it." />
            <FeatureCard icon={<UsersIcon />} title="Multi-participant correlation" description="See the full picture. Correlate sender and receiver stats to pinpoint exactly where problems occur." />
            <FeatureCard icon={<WrenchIcon />} title="Automated root cause" description="No more guessing. We analyze patterns and tell you whether it's network, CPU, or configuration issues." />
            <FeatureCard icon={<MessageIcon />} title="Actionable recommendations" description="Every issue comes with a specific recommendation. Know exactly what to fix and how." />
            <FeatureCard icon={<GithubIcon />} title="Open source SDK" description="Fully auditable collection. Know exactly what data we're collecting and how." />
            <FeatureCard icon={<BellIcon />} title="Real-time alerts" description="Get notified on Slack, email, or webhooks when call quality degrades. Fix issues before users complain." />
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="section dashboard-section" id="dashboard">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 className="section-title">See it in action</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>Every session, every participant, every issue — at a glance.</p>
          </div>
          <DashboardMockup activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section pricing" id="pricing">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple, startup-friendly pricing</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>Start free, scale as you grow. No sales calls required.</p>
          </div>
          <div className="pricing-grid">
            <PricingCard name="Free" price="$0" desc="For side projects and early development" features={['100 calls/month', 'Basic issue detection', '7-day data retention', 'Community support']} />
            <PricingCard name="Pro" price="$149" desc="For growing products with real users" features={['10,000 calls/month', 'Full root cause analysis', '90-day data retention', 'Slack + email alerts', 'API access']} featured />
            <PricingCard name="Team" price="$499" desc="For teams that need scale and support" features={['100,000 calls/month', 'Everything in Pro', '1-year data retention', 'Priority support', 'Custom integrations']} />
          </div>
          <p className="pricing-note"><strong>Launching soon</strong> — join the waitlist for early access pricing</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta" id="cta" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="floating-orb" style={{ width: '200px', height: '200px', background: 'var(--accent-cyan)', top: '20%', left: '10%', filter: 'blur(80px)', opacity: 0.3 }}></div>
        <div className="floating-orb" style={{ width: '150px', height: '150px', background: 'var(--accent-pink)', bottom: '20%', right: '15%', filter: 'blur(60px)', opacity: 0.3 }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="section-title">Be the first to know</h2>
          <p className="section-subtitle" style={{ margin: '0 auto 40px' }}>Join the waitlist for early access and launch pricing.</p>
          {ctaSubmitted ? (
            <div className="cta-success show">You're on the list! We'll be in touch soon.</div>
          ) : (
            <form className="cta-form" onSubmit={handleCtaSubmit}>
              <input
                type="email"
                placeholder="you@company.com"
                required
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
              />
              <button type="submit">Join Waitlist</button>
            </form>
          )}
          <p className="waitlist-count">Join <strong>127</strong>+ teams on the waitlist</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// Hero Illustration Component
function HeroIllustration() {
  return (
    <div className="hero-visual">
      <svg className="hero-illustration" viewBox="0 0 600 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glowCyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="glowPink" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee"/>
            <stop offset="100%" stopColor="#f472b6"/>
          </linearGradient>
          <path id="flow1" d="M130 120 Q200 100 255 190"/>
          <path id="flow2" d="M470 100 Q400 80 345 190"/>
          <path id="flow3" d="M300 370 L300 265"/>
        </defs>
        <g className="nodes">
          <circle cx="100" cy="120" r="50" fill="url(#glowCyan)" className="node-pulse"/>
          <circle cx="100" cy="120" r="30" fill="#111113" stroke="#22d3ee" strokeWidth="2"/>
          <circle cx="100" cy="110" r="10" fill="#22d3ee" opacity="0.8"/>
          <path d="M85 130 Q100 145 115 130" stroke="#22d3ee" strokeWidth="2" fill="none"/>
          <circle cx="500" cy="100" r="50" fill="url(#glowPink)" className="node-pulse"/>
          <circle cx="500" cy="100" r="30" fill="#111113" stroke="#f472b6" strokeWidth="2"/>
          <circle cx="500" cy="90" r="10" fill="#f472b6" opacity="0.8"/>
          <path d="M485 110 Q500 125 515 110" stroke="#f472b6" strokeWidth="2" fill="none"/>
          <circle cx="300" cy="400" r="50" fill="url(#glowCyan)" className="node-pulse"/>
          <circle cx="300" cy="400" r="30" fill="#111113" stroke="#22d3ee" strokeWidth="2"/>
          <circle cx="300" cy="390" r="10" fill="#22d3ee" opacity="0.8"/>
          <path d="M285 410 Q300 425 315 410" stroke="#22d3ee" strokeWidth="2" fill="none"/>
          <circle cx="300" cy="220" r="70" fill="url(#glowCyan)" className="node-pulse" style={{ animationDelay: '0.5s' }}/>
          <circle cx="300" cy="220" r="45" fill="#111113" stroke="url(#lineGrad)" strokeWidth="3"/>
          <path d="M275 220 L290 235 L325 205" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <g className="connections" opacity="0.6">
          <path className="waveform-line" d="M130 120 Q200 100 255 190" stroke="#22d3ee" strokeWidth="2" fill="none"/>
          <path className="waveform-line" d="M470 100 Q400 80 345 190" stroke="#f472b6" strokeWidth="2" fill="none" style={{ animationDelay: '0.3s' }}/>
          <path className="waveform-line" d="M300 370 L300 265" stroke="#22d3ee" strokeWidth="2" fill="none" style={{ animationDelay: '0.6s' }}/>
        </g>
        <g className="data-flows">
          <circle r="4" fill="#22d3ee">
            <animateMotion dur="2s" repeatCount="indefinite"><mpath href="#flow1"/></animateMotion>
          </circle>
          <circle r="4" fill="#f472b6">
            <animateMotion dur="2.5s" repeatCount="indefinite" begin="0.5s"><mpath href="#flow2"/></animateMotion>
          </circle>
          <circle r="4" fill="#22d3ee">
            <animateMotion dur="1.8s" repeatCount="indefinite" begin="1s"><mpath href="#flow3"/></animateMotion>
          </circle>
        </g>
        <g transform="translate(420, 300)">
          <rect x="0" y="0" width="90" height="80" rx="8" fill="#111113" stroke="#27272a" strokeWidth="1"/>
          <text x="12" y="24" fill="#71717a" fontSize="10" fontFamily="Inter, sans-serif">Quality Score</text>
          <text x="12" y="55" fill="#22c55e" fontSize="28" fontWeight="bold" fontFamily="Inter, sans-serif">92</text>
          <text x="55" y="55" fill="#71717a" fontSize="12" fontFamily="Inter, sans-serif">/100</text>
        </g>
        <g transform="translate(60, 280)">
          <rect x="0" y="0" width="100" height="60" rx="8" fill="#111113" stroke="#ef4444" strokeWidth="1" opacity="0.8"/>
          <circle cx="20" cy="30" r="6" fill="#ef4444"/>
          <text x="34" y="26" fill="#fafafa" fontSize="10" fontFamily="Inter, sans-serif">Packet Loss</text>
          <text x="34" y="42" fill="#ef4444" fontSize="14" fontWeight="bold" fontFamily="Inter, sans-serif">12.3%</text>
        </g>
      </svg>
    </div>
  )
}

// Problem Card Component
function ProblemCard({ icon, title, description }) {
  return (
    <div className="problem-card">
      <div className="problem-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

// Step Components
function Step1() {
  return (
    <div className="step">
      <span className="step-number">1</span>
      <div className="step-content">
        <h3>Add our SDK <span className="step-badge">3 lines</span></h3>
        <p>Works with any WebRTC stack — Pion, LiveKit, mediasoup, Jitsi, or your custom implementation.</p>
        <div className="code-block">
          <div className="code-header">
            <div className="code-dots"><span className="code-dot"></span><span className="code-dot"></span><span className="code-dot"></span></div>
            <span className="code-filename">app.js</span>
          </div>
          <div className="code-content">
            <span className="keyword">import</span> {'{ RTCDebug }'} <span className="keyword">from</span> <span className="string">'@rtcdebug/sdk'</span>;<br/><br/>
            <span className="function">RTCDebug</span>.<span className="property">init</span>({'{'}<br/>
            &nbsp;&nbsp;<span className="property">apiKey</span>: <span className="string">'ct_live_...'</span>,<br/>
            &nbsp;&nbsp;<span className="property">sessionId</span>: <span className="string">'call-123'</span><br/>
            {'}'});
          </div>
        </div>
      </div>
    </div>
  )
}

function Step2() {
  return (
    <div className="step">
      <span className="step-number">2</span>
      <div className="step-content">
        <h3>We collect stats from everyone</h3>
        <p>Our SDK automatically instruments RTCPeerConnection and collects stats from all participants, correlating timestamps across the call.</p>
        <div className="code-block">
          <div className="code-header">
            <div className="code-dots"><span className="code-dot"></span><span className="code-dot"></span><span className="code-dot"></span></div>
            <span className="code-filename">collecting...</span>
          </div>
          <div className="code-content">
            <span className="comment">// Automatic collection - no code needed</span><br/>
            <span className="comment">// inbound-rtp / outbound-rtp</span><br/>
            <span className="comment">// candidate-pair stats</span><br/>
            <span className="comment">// ICE connection events</span><br/>
            <span className="comment">// Media track changes</span><br/>
            <span className="comment">// Browser & network metadata</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step3() {
  return (
    <div className="step">
      <span className="step-number">3</span>
      <div className="step-content">
        <h3>Get a diagnosis, not just data</h3>
        <p>Our analysis engine correlates data from all participants and tells you exactly what went wrong and why.</p>
        <div className="report-preview">
          <div className="report-header">
            <span className="report-title">Session Report: call-123</span>
            <div className="report-score">
              <span className="score-value">34</span>
              <span className="score-label">Quality<br/>Score</span>
            </div>
          </div>
          <div className="report-issue">
            <div className="landing-issue-icon" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
              <WarningIcon />
            </div>
            <div className="landing-issue-content">
              <h4>High Packet Loss Detected</h4>
              <p>Participant "user-456" experienced 12% packet loss from 2:34-2:41 PM due to network congestion on their end.</p>
            </div>
          </div>
          <div className="report-recommendation">
            <div className="rec-icon">
              <HelpIcon />
            </div>
            <div className="rec-content">
              <h4>Recommendation</h4>
              <p>Consider implementing adaptive bitrate or prompting users on poor connections to switch to audio-only mode.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

// Pricing Card Component
function PricingCard({ name, price, desc, features, featured }) {
  return (
    <div className={`pricing-card ${featured ? 'featured' : ''}`}>
      <div className="pricing-name">{name}</div>
      <div className="pricing-price">{price}<span>/mo</span></div>
      <div className="pricing-desc">{desc}</div>
      <ul className="pricing-features">
        {features.map((f, i) => (
          <li key={i}><CheckIcon /> {f}</li>
        ))}
      </ul>
    </div>
  )
}

// Dashboard Mockup Component
function DashboardMockup({ activeTab, setActiveTab }) {
  return (
    <div className="dashboard-mockup">
      <div className="dashboard-window">
        <div className="dashboard-titlebar">
          <div className="titlebar-dots">
            <span className="titlebar-dot red"></span>
            <span className="titlebar-dot yellow"></span>
            <span className="titlebar-dot green"></span>
          </div>
          <span className="titlebar-url">app.rtcdebug.io/{activeTab}</span>
        </div>
        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            <div className={`sidebar-item ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
              <PhoneIcon /> Sessions
            </div>
            <div className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
              <ChartIcon /> Analytics
            </div>
            <div className={`sidebar-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
              <BellIcon /> Alerts
            </div>
            <div className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <SettingsIcon /> Settings
            </div>
          </div>
          <div className="dashboard-main">
            {activeTab === 'sessions' && <SessionsPanel />}
            {activeTab === 'analytics' && <AnalyticsPanel />}
            {activeTab === 'alerts' && <AlertsPanel />}
            {activeTab === 'settings' && <SettingsPanel />}
          </div>
        </div>
      </div>
    </div>
  )
}

function SessionsPanel() {
  return (
    <div className="tab-panel active">
      <div className="dashboard-header">
        <h3 className="dashboard-title">Recent Sessions</h3>
        <div className="dashboard-filters">
          <button className="filter-btn">Last 24 hours</button>
          <button className="filter-btn">All issues</button>
        </div>
      </div>
      <div className="sessions-list">
        <SessionRow id="session_8f2k4n9x" time="2 min ago" duration="4m 32s" participants={3} score={94} status="Healthy" healthy />
        <SessionRow id="session_2m7p1q3w" time="15 min ago" duration="12m 08s" participants={2} score={34} status="2 issues" />
        <SessionRow id="session_5h8j2k1l" time="1 hour ago" duration="28m 15s" participants={5} score={72} status="1 issue" />
        <SessionRow id="session_9t4r6y2u" time="2 hours ago" duration="8m 44s" participants={2} score={88} status="Healthy" healthy />
      </div>
    </div>
  )
}

function SessionRow({ id, time, duration, participants, score, status, healthy }) {
  const scoreClass = score >= 80 ? 'score-good' : score >= 50 ? 'score-ok' : 'score-bad'
  return (
    <div className="session-row">
      <div>
        <div className="session-id">{id}</div>
        <div className="session-meta">{time} · {duration} duration</div>
      </div>
      <div className="session-participants"><UsersSmallIcon />{participants}</div>
      <div className={`session-score ${scoreClass}`}>{score}</div>
      <div className="session-status">
        <span className={`status-dot ${healthy ? 'healthy' : 'issues'}`}></span>
        {status}
      </div>
    </div>
  )
}

function AnalyticsPanel() {
  return (
    <div className="tab-panel active">
      <div className="dashboard-header">
        <h3 className="dashboard-title">Analytics Overview</h3>
        <div className="dashboard-filters">
          <button className="filter-btn">Last 7 days</button>
        </div>
      </div>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-label">Total Sessions</div>
          <div className="analytics-value">1,284</div>
          <div className="analytics-change positive">+12% from last week</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Avg Quality Score</div>
          <div className="analytics-value">87</div>
          <div className="analytics-change positive">+3 points</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Issues Detected</div>
          <div className="analytics-value">43</div>
          <div className="analytics-change negative">+8 from last week</div>
        </div>
      </div>
      <div className="chart-placeholder">
        <svg viewBox="0 0 400 150" style={{ width: '100%', height: '150px' }}>
          <polyline points="0,100 50,80 100,90 150,60 200,70 250,40 300,50 350,30 400,45" fill="none" stroke="#22d3ee" strokeWidth="2"/>
          <polyline points="0,120 50,110 100,115 150,100 200,105 250,85 300,90 350,75 400,80" fill="none" stroke="#f472b6" strokeWidth="2" opacity="0.5"/>
        </svg>
      </div>
    </div>
  )
}

function AlertsPanel() {
  return (
    <div className="tab-panel active">
      <div className="dashboard-header">
        <h3 className="dashboard-title">Active Alerts</h3>
        <div className="dashboard-filters">
          <button className="filter-btn">All severities</button>
        </div>
      </div>
      <div className="alerts-list">
        <AlertRow type="critical" title="High packet loss detected" meta="session_2m7p1q3w · 15 min ago" />
        <AlertRow type="warning" title="Resolution dropped below 720p" meta="session_5h8j2k1l · 1 hour ago" />
        <AlertRow type="info" title="TURN relay fallback used" meta="session_5h8j2k1l · 1 hour ago" />
      </div>
    </div>
  )
}

function AlertRow({ type, title, meta }) {
  return (
    <div className={`alert-row ${type}`}>
      <div className="alert-icon">
        {type === 'critical' && <WarningIcon />}
        {type === 'warning' && <AlertIcon />}
        {type === 'info' && <InfoIcon />}
      </div>
      <div className="alert-content">
        <div className="alert-title">{title}</div>
        <div className="alert-meta">{meta}</div>
      </div>
      <div className={`alert-badge ${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</div>
    </div>
  )
}

function SettingsPanel() {
  return (
    <div className="tab-panel active">
      <div className="dashboard-header">
        <h3 className="dashboard-title">Project Settings</h3>
      </div>
      <div className="settings-section">
        <div className="settings-group">
          <label className="settings-label">API Key</label>
          <div className="settings-input-group">
            <input type="text" className="settings-input" defaultValue="ct_live_k8f2m9n4x7p1q3w6" readOnly />
            <button className="settings-btn">Copy</button>
          </div>
        </div>
        <div className="settings-group">
          <label className="settings-label">Project Name</label>
          <input type="text" className="settings-input" defaultValue="Production App" />
        </div>
        <div className="settings-group">
          <label className="settings-label">Webhook URL</label>
          <input type="text" className="settings-input" defaultValue="https://api.example.com/webhooks/rtcdebug" placeholder="https://..." />
        </div>
      </div>
    </div>
  )
}

// Icon Components
function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function UsersSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  )
}

export default LandingPage
