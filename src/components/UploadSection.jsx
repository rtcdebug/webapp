import { useState, useRef } from 'react'
import { sampleDump } from '../utils/sampleData'

function UploadSection({ onAnalyze, onReset, error, isLoading, hasResults }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [jsonText, setJsonText] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  const handleFile = (f) => {
    setFile(f)
    setJsonText('')
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAnalyze = async () => {
    let data
    if (file) {
      const text = await file.text()
      try {
        data = JSON.parse(text)
      } catch {
        onAnalyze(null)
        return
      }
    } else if (jsonText.trim()) {
      try {
        data = JSON.parse(jsonText)
      } catch {
        onAnalyze(null)
        return
      }
    }

    if (data) {
      onAnalyze(data)
    }
  }

  const handleSampleData = () => {
    onAnalyze(sampleDump)
  }

  const handleReset = () => {
    setFile(null)
    setJsonText('')
    setShowPaste(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onReset()
  }

  const hasInput = file || jsonText.trim()

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (hasResults) {
    return (
      <div className="upload-section">
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleReset}>
            Analyze Another Dump
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="upload-section">
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <svg className="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <h3>Drop your webrtc-internals dump here</h3>
        <p>or click to browse files (.json, .txt)</p>

        {file && (
          <div className="file-info" onClick={(e) => e.stopPropagation()}>
            <svg className="file-info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span className="file-info-name">{file.name}</span>
            <span className="file-info-size">{formatFileSize(file.size)}</span>
            <button className="file-info-remove" onClick={removeFile}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="paste-section">
        <button
          className={`paste-toggle ${showPaste ? 'expanded' : ''}`}
          onClick={() => setShowPaste(!showPaste)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          or paste JSON directly
        </button>

        {showPaste && (
          <textarea
            className="paste-textarea"
            placeholder="Paste your webrtc-internals JSON dump here..."
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value)
              setFile(null)
            }}
          />
        )}
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <br />
          <small>
            Make sure you clicked "Download the PeerConnection updates and stats data"
            in chrome://webrtc-internals
          </small>
        </div>
      )}

      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={!hasInput || isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Dump'}
        </button>
        <button className="btn btn-ghost" onClick={handleSampleData}>
          Try with sample data
        </button>
      </div>

      <div className="empty-state" style={{ marginTop: '48px' }}>
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <h3>How to export from Chrome</h3>
        <p>
          Open <code style={{ color: 'var(--accent-cyan)' }}>chrome://webrtc-internals</code> during
          a call, then click "Download the PeerConnection updates and stats data" to save the dump.
        </p>
      </div>
    </div>
  )
}

export default UploadSection
