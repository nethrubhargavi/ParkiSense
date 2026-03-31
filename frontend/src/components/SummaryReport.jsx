import React, { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000'

function SummaryReport({ patientId, patientName }) {
  const [patientData, setPatientData] = useState(null)
  const [tremorResults, setTremorResults] = useState(null)
  const [voiceResults, setVoiceResults] = useState(null)
  const [faceResults, setFaceResults] = useState(null)
  const [medicalResults, setMedicalResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatedDate] = useState(new Date().toLocaleString())

  useEffect(() => {
    loadAllData()
  }, [patientId])

  const loadAllData = async () => {
    setLoading(true)

    // Load localStorage data (session-based tests)
    try {
      const tremor = localStorage.getItem('lastTremorResults')
      if (tremor) setTremorResults(JSON.parse(tremor))
    } catch (e) { console.error('Error loading tremor data:', e) }

    try {
      const voice = localStorage.getItem('lastVoiceResults')
      if (voice) setVoiceResults(JSON.parse(voice))
    } catch (e) { console.error('Error loading voice data:', e) }

    try {
      const face = localStorage.getItem('lastFaceResults')
      if (face) setFaceResults(JSON.parse(face))
    } catch (e) { console.error('Error loading face data:', e) }

    try {
      const medical = localStorage.getItem('lastMedicalReportResults')
      if (medical) setMedicalResults(JSON.parse(medical))
    } catch (e) { console.error('Error loading medical report data:', e) }

    // Fetch backend-stored patient data (family history & symptoms)
    if (patientId) {
      try {
        const [familyRes, symptomsRes, patientRes] = await Promise.all([
          fetch(`${API_BASE}/family-history/${patientId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch(`${API_BASE}/symptoms/${patientId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch(`${API_BASE}/patients/${patientId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          })
        ])

        const familyData = await familyRes.json()
        const symptomsData = await symptomsRes.json()
        const patientInfo = await patientRes.json()

        setPatientData({
          patient: patientInfo.patient || {},
          familyHistory: familyData.familyHistory || [],
          symptoms: symptomsData.symptoms || []
        })
      } catch (e) {
        console.error('Error fetching patient data:', e)
        setPatientData({ patient: {}, familyHistory: [], symptoms: [] })
      }
    }

    setLoading(false)
  }

  const getCompletionCount = () => {
    let completed = 0
    const total = 6
    if (patientData?.familyHistory?.length > 0) completed++
    if (patientData?.symptoms?.length > 0) completed++
    if (tremorResults) completed++
    if (voiceResults) completed++
    if (faceResults) completed++
    if (medicalResults) completed++
    return { completed, total }
  }

  const getRiskLevel = () => {
    let riskFactors = 0
    let totalFactors = 0

    // Family history risk
    if (patientData?.familyHistory?.length > 0) {
      totalFactors++
      const latest = patientData.familyHistory[patientData.familyHistory.length - 1]
      if (latest.hasFamilyHistory) riskFactors++
    }

    // Symptoms risk
    if (patientData?.symptoms?.length > 0) {
      totalFactors++
      const latest = patientData.symptoms[patientData.symptoms.length - 1]
      const symptomsArr = latest.symptoms || []
      const avgSeverity = symptomsArr.reduce((sum, s) => sum + (s.severity || 0), 0) / (symptomsArr.length || 1)
      if (avgSeverity >= 6 || symptomsArr.length >= 4) riskFactors++
    }

    // Tremor risk
    if (tremorResults) {
      totalFactors++
      const strength = parseFloat(tremorResults.tremor_strength)
      if (!isNaN(strength) && strength > 2) riskFactors++
    }

    // Voice risk
    if (voiceResults) {
      totalFactors++
      const jitter = parseFloat(voiceResults.jitter)
      if (!isNaN(jitter) && jitter > 1.5) riskFactors++
    }

    // Face risk
    if (faceResults) {
      totalFactors++
      const blinkRate = parseFloat(faceResults.blink_rate)
      if (!isNaN(blinkRate) && blinkRate < 10) riskFactors++
    }

    if (totalFactors === 0) return { level: 'Insufficient Data', color: '#6c757d', score: 0 }

    const ratio = riskFactors / totalFactors
    if (ratio >= 0.6) return { level: 'Elevated', color: '#dc3545', score: Math.round(ratio * 100) }
    if (ratio >= 0.3) return { level: 'Moderate', color: '#fd7e14', score: Math.round(ratio * 100) }
    return { level: 'Low', color: '#28a745', score: Math.round(ratio * 100) }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="summary-report-container">
        <div className="report-loading">
          <div className="loading-spinner"></div>
          <p>Generating comprehensive report...</p>
        </div>
      </div>
    )
  }

  const { completed, total } = getCompletionCount()
  const risk = getRiskLevel()
  const patient = patientData?.patient || {}

  return (
    <div className="summary-report-container">
      {/* Report Header */}
      <div className="report-header">
        <div className="report-title-area">
          <h2>📊 Comprehensive Assessment Report</h2>
          <p className="report-subtitle">Parkinson's Disease Decision Support Summary</p>
        </div>
        <div className="report-meta">
          <p><strong>Generated:</strong> {generatedDate}</p>
          <p><strong>Assessments Completed:</strong> {completed}/{total}</p>
        </div>
      </div>

      {/* Patient Information */}
      <div className="report-section patient-info-section">
        <div className="section-header">
          <h3>👤 Patient Information</h3>
        </div>
        <div className="patient-info-grid">
          <div className="info-item">
            <span className="info-label">Name</span>
            <span className="info-value">{patient.firstName || '—'} {patient.lastName || ''}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Date of Birth</span>
            <span className="info-value">{patient.dateOfBirth || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">MRN</span>
            <span className="info-value">{patient.mrnNumber || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{patient.email || '—'}</span>
          </div>
        </div>
      </div>

      {/* Overall Risk Indicator */}
      <div className="report-section risk-section">
        <div className="section-header">
          <h3>⚡ Overall Risk Assessment</h3>
        </div>
        <div className="risk-indicator-container">
          <div className="risk-gauge" style={{ borderColor: risk.color }}>
            <span className="risk-score" style={{ color: risk.color }}>{risk.score}%</span>
            <span className="risk-label" style={{ color: risk.color }}>{risk.level} Risk</span>
          </div>
          <div className="risk-bar-track">
            <div className="risk-bar-fill" style={{
              width: `${risk.score}%`,
              background: `linear-gradient(90deg, #28a745 0%, #fd7e14 50%, #dc3545 100%)`
            }}></div>
          </div>
          <p className="risk-disclaimer">
            ⚠️ This is a decision-support indicator only — not a medical diagnosis. 
            Clinical interpretation is required.
          </p>
        </div>
      </div>

      {/* Family History Section */}
      <div className="report-section">
        <div className="section-header">
          <h3>👨‍👩‍👧 Family History</h3>
          <span className={`status-badge ${patientData?.familyHistory?.length > 0 ? 'completed' : 'pending'}`}>
            {patientData?.familyHistory?.length > 0 ? '✅ Completed' : '⚠️ Pending'}
          </span>
        </div>
        {patientData?.familyHistory?.length > 0 ? (
          <div className="section-content">
            {patientData.familyHistory.map((record, idx) => (
              <div key={idx} className="record-block">
                <p>
                  <strong>Family History Status:</strong>{' '}
                  {record.hasFamilyHistory ? (
                    <span className="positive-text">Positive — has relatives with Parkinson's</span>
                  ) : (
                    <span className="negative-text">Negative — no known relatives with Parkinson's</span>
                  )}
                </p>
                {record.familyMembers?.length > 0 && (
                  <div className="family-members-summary">
                    <strong>Affected Relatives ({record.familyMembers.length}):</strong>
                    <ul>
                      {record.familyMembers.map((member, i) => (
                        <li key={i}>
                          {member.relationLabel || member.relation} — diagnosed at age {member.ageAtDiagnosis}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {record.notes && <p className="record-notes"><strong>Notes:</strong> {record.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data-text">No family history data recorded for this patient.</p>
        )}
      </div>

      {/* Symptoms Section */}
      <div className="report-section">
        <div className="section-header">
          <h3>📋 Symptoms Tracking</h3>
          <span className={`status-badge ${patientData?.symptoms?.length > 0 ? 'completed' : 'pending'}`}>
            {patientData?.symptoms?.length > 0 ? '✅ Completed' : '⚠️ Pending'}
          </span>
        </div>
        {patientData?.symptoms?.length > 0 ? (
          <div className="section-content">
            {patientData.symptoms.map((record, idx) => (
              <div key={idx} className="record-block">
                {record.onsetDate && (
                  <p><strong>Onset Date:</strong> {record.onsetDate}</p>
                )}
                {record.progressionSpeed && (
                  <p><strong>Progression:</strong> {record.progressionSpeed}</p>
                )}
                {record.symptoms?.length > 0 && (
                  <div className="symptoms-summary-grid">
                    {record.symptoms.map((symptom, i) => (
                      <div key={i} className="symptom-summary-item">
                        <span className="symptom-name">{symptom.label || symptom.symptomId}</span>
                        <div className="severity-bar-mini">
                          <div
                            className="severity-fill-mini"
                            style={{
                              width: `${(symptom.severity || 0) * 10}%`,
                              backgroundColor: symptom.severity >= 7 ? '#dc3545' : symptom.severity >= 4 ? '#fd7e14' : '#28a745'
                            }}
                          ></div>
                        </div>
                        <span className="severity-text">{symptom.severity}/10</span>
                      </div>
                    ))}
                  </div>
                )}
                {record.notes && <p className="record-notes"><strong>Notes:</strong> {record.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data-text">No symptoms data recorded for this patient.</p>
        )}
      </div>

      {/* Hand Tremor Section */}
      <div className="report-section">
        <div className="section-header">
          <h3>🔵 Hand Tremor Analysis</h3>
          <span className={`status-badge ${tremorResults ? 'completed' : 'pending'}`}>
            {tremorResults ? '✅ Completed' : '⚠️ Pending'}
          </span>
        </div>
        {tremorResults ? (
          <div className="section-content">
            <div className="report-metric-grid">
              <div className="report-metric">
                <span className="report-metric-label">Tremor Strength</span>
                <span className="report-metric-value">{tremorResults.tremor_strength} Hz</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Tremor Frequency</span>
                <span className="report-metric-value">{tremorResults.tremor_frequency} Hz</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Confidence</span>
                <span className="report-metric-value">{tremorResults.confidence}</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Hands Detected</span>
                <span className="report-metric-value">{tremorResults.hands_detected}</span>
              </div>
            </div>
            <div className="report-interpretation">
              <strong>Assessment:</strong> {tremorResults.interpretation}
            </div>
            {tremorResults.timestamp && (
              <p className="test-timestamp">Tested: {new Date(tremorResults.timestamp).toLocaleString()}</p>
            )}
          </div>
        ) : (
          <p className="no-data-text">Hand tremor test not performed in this session.</p>
        )}
      </div>

      {/* Voice Test Section */}
      <div className="report-section">
        <div className="section-header">
          <h3>🟢 Voice Tremor Analysis</h3>
          <span className={`status-badge ${voiceResults ? 'completed' : 'pending'}`}>
            {voiceResults ? '✅ Completed' : '⚠️ Pending'}
          </span>
        </div>
        {voiceResults ? (
          <div className="section-content">
            <div className="report-metric-grid">
              <div className="report-metric">
                <span className="report-metric-label">Jitter</span>
                <span className="report-metric-value">{voiceResults.jitter}%</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Shimmer</span>
                <span className="report-metric-value">{voiceResults.shimmer}%</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">F0 Mean</span>
                <span className="report-metric-value">{voiceResults.f0_mean} Hz</span>
              </div>
            </div>
            <div className="report-interpretation">
              <strong>Assessment:</strong> {voiceResults.interpretation}
            </div>
            {voiceResults.timestamp && (
              <p className="test-timestamp">Tested: {new Date(voiceResults.timestamp).toLocaleString()}</p>
            )}
          </div>
        ) : (
          <p className="no-data-text">Voice test not performed in this session.</p>
        )}
      </div>

      {/* Face Assessment Section */}
      <div className="report-section">
        <div className="section-header">
          <h3>🟡 Facial Masking & Blink Rate</h3>
          <span className={`status-badge ${faceResults ? 'completed' : 'pending'}`}>
            {faceResults ? '✅ Completed' : '⚠️ Pending'}
          </span>
        </div>
        {faceResults ? (
          <div className="section-content">
            <div className="report-metric-grid">
              <div className="report-metric">
                <span className="report-metric-label">Blink Rate</span>
                <span className="report-metric-value">{faceResults.blink_rate} blinks/min</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Total Blinks</span>
                <span className="report-metric-value">{faceResults.blink_count}</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Duration</span>
                <span className="report-metric-value">{faceResults.duration_seconds}s</span>
              </div>
            </div>
            <div className="report-interpretation">
              <strong>Assessment:</strong> {faceResults.interpretation}
            </div>
            <p className="reference-note">
              Normal blink rate: 15–20 blinks/min. Parkinson's often shows reduced rate (&lt;10 blinks/min).
            </p>
            {faceResults.timestamp && (
              <p className="test-timestamp">Tested: {new Date(faceResults.timestamp).toLocaleString()}</p>
            )}
          </div>
        ) : (
          <p className="no-data-text">Facial assessment not performed in this session.</p>
        )}
      </div>

      {/* Medical Reports Section */}
      <div className="report-section">
        <div className="section-header">
          <h3>📄 Medical Reports Analysis</h3>
          <span className={`status-badge ${medicalResults ? 'completed' : 'pending'}`}>
            {medicalResults ? '✅ Completed' : '⚠️ Pending'}
          </span>
        </div>
        {medicalResults?.analysis ? (
          <div className="section-content">
            <div className="medical-summary-block">
              <h4>Summary</h4>
              <p>{medicalResults.analysis.summary || 'No summary available.'}</p>
            </div>
            {medicalResults.analysis.keyFindings?.length > 0 && (
              <div className="medical-summary-block">
                <h4>Key Findings</h4>
                <ul>
                  {medicalResults.analysis.keyFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {medicalResults.analysis.abnormalIndicators?.length > 0 && (
              <div className="medical-summary-block">
                <h4>Abnormal Indicators</h4>
                <ul>
                  {medicalResults.analysis.abnormalIndicators.map((ai, i) => (
                    <li key={i}>
                      <strong>{ai.values?.join(', ')}</strong> — {ai.sentence}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {medicalResults.analysis.healthInsights?.length > 0 && (
              <div className="medical-summary-block">
                <h4>Health Insights</h4>
                <ul>
                  {medicalResults.analysis.healthInsights.map((hi, i) => (
                    <li key={i}>{hi}</li>
                  ))}
                </ul>
              </div>
            )}
            {medicalResults.timestamp && (
              <p className="test-timestamp">Analyzed: {new Date(medicalResults.timestamp).toLocaleString()}</p>
            )}
          </div>
        ) : (
          <p className="no-data-text">No medical reports analyzed in this session.</p>
        )}
      </div>

      {/* Actions */}
      <div className="report-actions no-print">
        <button onClick={handlePrint} className="btn btn-primary btn-large print-btn">
          🖨️ Print Report
        </button>
        <button onClick={loadAllData} className="btn btn-secondary">
          🔄 Refresh Data
        </button>
      </div>

      {/* Footer Disclaimer */}
      <div className="report-footer-disclaimer">
        <p>
          <strong>⚠️ Disclaimer:</strong> This report is generated by a decision-support tool and is 
          <strong> not a medical diagnosis</strong>. All findings should be reviewed and interpreted by 
          a qualified healthcare professional. Clinical judgment should always take precedence.
        </p>
        <p className="report-generated-by">
          Generated by Parkinson's Disease Assessment Tool — {generatedDate}
        </p>
      </div>
    </div>
  )
}

export default SummaryReport
