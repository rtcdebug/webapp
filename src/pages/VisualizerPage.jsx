import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PrivacyBanner from '../components/PrivacyBanner'
import UpsellBanner from '../components/UpsellBanner'
import UploadSection from '../components/UploadSection'
import DenseMetricsStrip from '../components/DenseMetricsStrip'
import ConnectionHealthTimeline from '../components/ConnectionHealthTimeline'
import ChartGrid from '../components/ChartGrid'
import DetailTabs from '../components/DetailTabs'
import { parseAllPeerConnections } from '../utils/parser'

function VisualizerPage() {
  const [allConnections, setAllConnections] = useState([])
  const [selectedPcIndex, setSelectedPcIndex] = useState(0)
  const [rawData, setRawData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async (jsonData) => {
    setIsLoading(true)
    setError(null)

    try {
      const connections = parseAllPeerConnections(jsonData)
      setAllConnections(connections)
      setRawData(jsonData)
      setSelectedPcIndex(0)
    } catch (err) {
      setError(err.message)
      setAllConnections([])
      setRawData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setAllConnections([])
    setRawData(null)
    setError(null)
    setSelectedPcIndex(0)
  }

  const currentPc = allConnections[selectedPcIndex]

  return (
    <div className="app">
      <Helmet>
        <title>WebRTC Dump Visualizer — Free Online Tool | RTCDebug</title>
        <meta name="description" content="Free online tool to visualize and analyze chrome://webrtc-internals dumps. Understand call quality issues, ICE candidates, codecs, and media stats instantly." />
        <link rel="canonical" href="https://rtcdebug.com/visualizer" />
        <meta property="og:url" content="https://rtcdebug.com/visualizer" />
        <meta property="og:title" content="WebRTC Dump Visualizer — Free Online Tool | RTCDebug" />
        <meta property="og:description" content="Free online tool to visualize and analyze chrome://webrtc-internals dumps. Understand call quality issues, ICE candidates, codecs, and media stats instantly." />
        <meta name="twitter:url" content="https://rtcdebug.com/visualizer" />
        <meta name="twitter:title" content="WebRTC Dump Visualizer — Free Online Tool | RTCDebug" />
        <meta name="twitter:description" content="Free online tool to visualize and analyze chrome://webrtc-internals dumps. Understand call quality issues, ICE candidates, codecs, and media stats instantly." />
      </Helmet>
      <Header />
      <PrivacyBanner />

      <main className="main-content">
        <div className="container">
          {!currentPc && (
            <div className="page-title compact">
              <h1>WebRTC Dump Visualizer</h1>
              <p>Upload your chrome://webrtc-internals dump to visualize call stats.</p>
            </div>
          )}

          <UploadSection
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            error={error}
            isLoading={isLoading}
            hasResults={allConnections.length > 0}
          />

          {allConnections.length > 0 && currentPc && (
            <div className="dashboard fade-in">
              {/* Peer Connection Selector */}
              {allConnections.length > 1 && (
                <div className="pc-selector">
                  {allConnections.map((pc, idx) => (
                    <button
                      key={pc.id}
                      className={`pc-tab ${idx === selectedPcIndex ? 'active' : ''}`}
                      onClick={() => setSelectedPcIndex(idx)}
                    >
                      <span className="pc-tab-id">{pc.id}</span>
                      <span className="pc-tab-type">{pc.connectionType}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Dense Metrics Strip */}
              <DenseMetricsStrip data={currentPc} />

              {/* Connection Health Timeline */}
              <ConnectionHealthTimeline
                events={currentPc.connectionEvents}
                qualityLimitation={currentPc.mediaStats?.qualityLimitation}
                duration={currentPc.summary?.durationMs}
              />

              {/* Charts Grid */}
              <ChartGrid stats={currentPc.mediaStats} codecs={currentPc.codecs} />

              {/* Detail Tabs */}
              <DetailTabs data={currentPc} rawData={rawData} />

              {/* Feedback Link */}
              <div className="dashboard-feedback">
                Something missing or broken?{' '}
                <a
                  href="https://github.com/rtcdebug/webapp/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report it on GitHub
                </a>
              </div>
            </div>
          )}

          <UpsellBanner />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default VisualizerPage
