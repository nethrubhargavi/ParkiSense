import React, { useState } from 'react'

/* Backend URL */
const API_BASE = "https://parkisense-zcub.onrender.com"

/* ──── helpers ──── */
function formatFileSize(bytes) {
  if (!bytes) return ''
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

/* ──── report categories ──── */
const REPORT_CATEGORIES = [
  {
    id: 'blood',
    label: 'Blood Report',
    icon: '🩸',
    accent: '#e53e3e',
    description: 'CBC, metabolic panel, lipid profile, liver & thyroid',
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    id: 'mri',
    label: 'MRI Report',
    icon: '🧠',
    accent: '#3182ce',
    description: 'Brain, spine, and other MRI scan reports',
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    id: 'ppg',
    label: 'PPG Report',
    icon: '💓',
    accent: '#38a169',
    description: 'Photoplethysmography, heart rate, SpO2 reports',
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    id: 'general',
    label: "General / Doctor's Report",
    icon: '📋',
    accent: '#805ad5',
    description: 'Prescriptions, clinical notes, discharge summaries',
    accept: '.pdf,.jpg,.jpeg,.png',
  },
]

const emptyState = () => ({
  files: [],
  loading: false,
  progress: 0,
  result: null,
  error: null,
  collapsed: false,
})

export default function MedicalReports() {

  const [sections, setSections] = useState(() =>
    Object.fromEntries(REPORT_CATEGORIES.map((c) => [c.id, emptyState()]))
  )

  function update(catId, patch) {
    setSections((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], ...patch },
    }))
  }

  function toggleCollapse(catId) {
    update(catId, { collapsed: !sections[catId].collapsed })
  }

  function addFiles(catId, fileList) {
    const newFiles = Array.from(fileList).map((f) => ({
      file: f,
      name: f.name,
      size: f.size
    }))

    update(catId, { files: [...sections[catId].files, ...newFiles] })
  }

  function removeFile(catId, index) {
    update(catId, {
      files: sections[catId].files.filter((_, i) => i !== index)
    })
  }

  function handleDrop(catId) {
    return (e) => {
      e.preventDefault()
      addFiles(catId, e.dataTransfer.files)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  /* ─── analyze reports ─── */
  async function handleAnalyze(catId) {

    update(catId, { error: null, result: null, loading: true, progress: 10 })

    try {

      const form = new FormData()

      sections[catId].files.forEach((f) =>
        form.append('files', f.file)
      )

      const res = await fetch(
        `${API_BASE}/reports/analyze?report_type=${catId}`,
        {
          method: 'POST',
          body: form
        }
      )

      update(catId, { progress: 60 })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Server error: ${res.status} ${text}`)
      }

      const data = await res.json()

      update(catId, {
        progress: 100,
        result: data
      })

    } catch (err) {

      update(catId, {
        error: err.message
      })

    } finally {

      setTimeout(() =>
        update(catId, {
          loading: false,
          progress: 0
        }),
        600
      )
    }
  }

  return (
    <div className="reports-container">

      <h2>Medical Reports & Insights</h2>

      <p>
        Upload reports in the appropriate category below.
        Accepted formats: <strong>PDF, JPG, PNG</strong>.
      </p>

      {REPORT_CATEGORIES.map((cat) => {

        const s = sections[cat.id]

        return (
          <div
            key={cat.id}
            className="report-category-section"
            style={{ '--cat-accent': cat.accent }}
          >

            <button
              className="section-header"
              onClick={() => toggleCollapse(cat.id)}
            >

              <span className="section-icon">{cat.icon}</span>

              <span className="section-title">{cat.label}</span>

              {s.files.length > 0 && (
                <span className="file-count-badge">{s.files.length}</span>
              )}

              <span className="collapse-chevron">
                {s.collapsed ? '▸' : '▾'}
              </span>

            </button>

            {!s.collapsed && (

              <div className="section-body">

                <p className="section-desc">{cat.description}</p>

                <div
                  className="drop-area"
                  onDrop={handleDrop(cat.id)}
                  onDragOver={handleDragOver}
                >

                  <p>Drag & drop files here, or click to select</p>

                  <input
                    type="file"
                    multiple
                    accept={cat.accept}
                    onChange={(e) => {
                      addFiles(cat.id, e.target.files)
                      e.target.value = ''
                    }}
                  />

                </div>

                <div className="files-list">

                  {s.files.length === 0 && (
                    <p className="muted">No files selected</p>
                  )}

                  {s.files.map((f, idx) => (

                    <div key={`${f.name}-${idx}`} className="file-row">

                      <div className="file-info">
                        <strong>{f.name}</strong>
                        <span className="file-size">
                          {formatFileSize(f.size)}
                        </span>
                      </div>

                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => removeFile(cat.id, idx)}
                      >
                        Remove
                      </button>

                    </div>
                  ))}

                </div>

                <div className="actions">

                  <button
                    className="btn btn-primary"
                    onClick={() => handleAnalyze(cat.id)}
                    disabled={s.files.length === 0 || s.loading}
                  >

                    {s.loading
                      ? 'Analysing…'
                      : `Analyse ${cat.label}`}

                  </button>

                  {s.loading && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                  )}

                </div>

                <div className="results-area">

                  {s.error && (
                    <div className="error-card">
                      Error: {s.error}
                    </div>
                  )}

                  {s.result && (

                    <div className="cards">

                      <div className="card">
                        <h3>Summary</h3>
                        <p>
                          {s.result.analysis?.summary ||
                            'No summary available.'}
                        </p>
                      </div>

                      <div className="card">
                        <h3>Key Findings</h3>

                        {s.result.analysis?.keyFindings?.length ? (
                          <ul>
                            {s.result.analysis.keyFindings.map((kf, i) => (
                              <li key={i}>{kf}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted">
                            No key findings identified.
                          </p>
                        )}

                      </div>

                      <div className="card">

                        <h3>Abnormal Indicators</h3>

                        {s.result.analysis?.abnormalIndicators?.length ? (

                          <ul>
                            {s.result.analysis.abnormalIndicators.map((ai, i) => (
                              <li key={i}>
                                <strong>{ai.values.join(', ')}</strong>
                                {' — '}
                                {ai.sentence}
                              </li>
                            ))}
                          </ul>

                        ) : (

                          <p className="muted">
                            No abnormal indicators found.
                          </p>

                        )}

                      </div>

                      <div className="card">

                        <h3>Health Insights</h3>

                        <ul>
                          {s.result.analysis?.healthInsights?.map((hi, i) => (
                            <li key={i}>{hi}</li>
                          ))}
                        </ul>

                      </div>

                    </div>

                  )}

                </div>

              </div>

            )}

          </div>
        )
      })}

    </div>
  )
}
