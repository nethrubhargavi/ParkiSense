import React, { useState, useRef } from 'react'

function formatFileSize(bytes) {
  if (!bytes) return ''
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export default function MedicalReports() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const dropRef = useRef(null)

  function handleFilesAdd(fileList) {
    const newFiles = Array.from(fileList).map((f) => ({ file: f, name: f.name, size: f.size }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFilesAdd(e.dataTransfer.files)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleAnalyze() {
    setError(null)
    setResult(null)
    setLoading(true)
    setProgress(10)

    try {
      const form = new FormData()
      files.forEach((f) => form.append('files', f.file))

      // Update URL if backend runs on a different host/port
      const res = await fetch('http://localhost:8000/reports/analyze', {
        method: 'POST',
        body: form
      })

      setProgress(60)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Server error: ${res.status} ${text}`)
      }

      const data = await res.json()
      setProgress(100)
      setResult(data)
      // Persist for Summary Report
      localStorage.setItem('lastMedicalReportResults', JSON.stringify({ ...data, timestamp: new Date().toISOString() }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 800)
    }
  }

  return (
    <div className="reports-container">
      <h2>Medical Reports & Insights</h2>
      <p>Upload your medical reports to get AI-generated summaries and insights.</p>

      <div
        ref={dropRef}
        className="drop-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p>Drag & drop files here, or click to select</p>
        <input
          type="file"
          multiple
          accept=".pdf,image/png,image/jpeg"
          onChange={(e) => handleFilesAdd(e.target.files)}
        />
      </div>

      <div className="files-list">
        {files.length === 0 && <p className="muted">No files selected</p>}
        {files.map((f, idx) => (
          <div key={`${f.name}-${idx}`} className="file-row">
            <div className="file-info">
              <strong>{f.name}</strong>
              <span className="file-size">{formatFileSize(f.size)}</span>
            </div>
            <div>
              <button className="btn btn-small btn-danger" onClick={() => removeFile(idx)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={files.length === 0 || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Reports'}
        </button>
        {loading && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="results-area">
        {error && <div className="error-card">Error: {error}</div>}

        {result && (
          <div className="cards">
            <div className="card">
              <h3>Summary</h3>
              <p>{result.analysis?.summary || 'No summary available.'}</p>
            </div>

            <div className="card">
              <h3>Key Findings</h3>
              {result.analysis?.keyFindings?.length ? (
                <ul>
                  {result.analysis.keyFindings.map((kf, i) => <li key={i}>{kf}</li>)}
                </ul>
              ) : <p className="muted">No key findings identified.</p>}
            </div>

            <div className="card">
              <h3>Abnormal Indicators</h3>
              {result.analysis?.abnormalIndicators?.length ? (
                <ul>
                  {result.analysis.abnormalIndicators.map((ai, i) => (
                    <li key={i}><strong>{ai.values.join(', ')}</strong> — {ai.sentence}</li>
                  ))}
                </ul>
              ) : <p className="muted">No abnormal indicators found.</p>}
            </div>

            <div className="card">
              <h3>Health Insights</h3>
              <ul>
                {result.analysis?.healthInsights?.map((hi, i) => <li key={i}>{hi}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
