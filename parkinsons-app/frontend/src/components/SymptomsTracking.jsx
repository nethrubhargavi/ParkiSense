import React, { useState } from 'react'

const API_BASE = 'http://localhost:8000'

const SYMPTOM_OPTIONS = [
  { id: 'resting-tremor', label: 'Resting Tremor', icon: '🤝' },
  { id: 'bradykinesia', label: 'Bradykinesia (Slow Movement)', icon: '🐢' },
  { id: 'rigidity', label: 'Rigidity', icon: '💪' },
  { id: 'balance-issues', label: 'Balance Issues', icon: '⚖️' },
  { id: 'gait-changes', label: 'Gait Changes', icon: '🚶' },
  { id: 'micrographia', label: 'Micrographia (Small Handwriting)', icon: '✍️' },
  { id: 'voice-changes', label: 'Voice Changes', icon: '🎤' },
  { id: 'rem-sleep', label: 'REM Sleep Problems', icon: '😴' },
  { id: 'other', label: 'Other Symptoms', icon: '📋' }
]

const PROGRESSION_OPTIONS = [
  { value: 'static', label: 'Static (No Change)', icon: '⏸️' },
  { value: 'slowly-progressive', label: 'Slowly Progressive', icon: '📈' },
  { value: 'rapidly-progressive', label: 'Rapidly Progressive', icon: '📊' }
]

function SymptomsTracking({ patientId, onSaveSuccess }) {
  const [onsetDate, setOnsetDate] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [symptomSeverity, setSymptomSeverity] = useState({})
  const [otherSymptomsText, setOtherSymptomsText] = useState('')
  const [progressionSpeed, setProgressionSpeed] = useState('')
  const [notes, setNotes] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const maxDate = new Date().toISOString().split('T')[0]

  const handleSymptomToggle = (symptomId) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    )
    
    // Initialize severity for new symptom
    if (!selectedSymptoms.includes(symptomId)) {
      setSymptomSeverity(prev => ({
        ...prev,
        [symptomId]: 5
      }))
    }
  }

  const handleSeverityChange = (symptomId, value) => {
    setSymptomSeverity(prev => ({
      ...prev,
      [symptomId]: parseInt(value)
    }))
  }

  const validateForm = () => {
    if (!onsetDate) {
      setError('Please select the onset date of first symptom')
      return false
    }

    if (new Date(onsetDate) > new Date()) {
      setError('Onset date cannot be in the future')
      return false
    }

    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom')
      return false
    }

    if (!progressionSpeed) {
      setError('Please select symptom progression speed')
      return false
    }

    if (selectedSymptoms.includes('other') && !otherSymptomsText.trim()) {
      setError('Please describe other symptoms')
      return false
    }

    return true
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const symptomsData = selectedSymptoms.map(symptomId => ({
        symptomId,
        label: SYMPTOM_OPTIONS.find(s => s.id === symptomId)?.label,
        severity: symptomSeverity[symptomId] || 5,
        ...(symptomId === 'other' && { otherDescription: otherSymptomsText })
      }))

      const payload = {
        patientId,
        onsetDate,
        symptoms: symptomsData,
        progressionSpeed,
        notes,
        recordedAt: new Date().toISOString()
      }

      const response = await fetch(`${API_BASE}/symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.status === 'success') {
        setSuccess('Symptoms tracked successfully!')
        
        // Reset form
        setTimeout(() => {
          setOnsetDate('')
          setSelectedSymptoms([])
          setSymptomSeverity({})
          setOtherSymptomsText('')
          setProgressionSpeed('')
          setNotes('')
          
          if (onSaveSuccess) {
            onSaveSuccess()
          }
        }, 1500)
      } else {
        setError(data.message || 'Failed to save symptoms')
      }
    } catch (error) {
      console.error('Save error:', error)
      setError('Network error - ensure backend is running')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="symptoms-tracking-container">
      <div className="symptoms-header">
        <h3>📋 Symptoms Tracking</h3>
        <p className="subtitle">Document patient's symptoms, severity, and progression</p>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <form onSubmit={handleSave} className="symptoms-form">
        {/* Onset Date Section */}
        <section className="form-section">
          <h4>🗓️ Symptom Onset</h4>
          <div className="form-group">
            <label htmlFor="onset-date">Date of First Symptom *</label>
            <input
              id="onset-date"
              type="date"
              value={onsetDate}
              onChange={(e) => setOnsetDate(e.target.value)}
              max={maxDate}
              required
              disabled={isLoading}
              className="date-input"
            />
            <p className="help-text">Select the date when symptoms first appeared</p>
          </div>
        </section>

        {/* Symptoms Checklist Section */}
        <section className="form-section">
          <h4>✅ Symptoms Checklist (Select All That Apply)</h4>
          <div className="symptoms-grid">
            {SYMPTOM_OPTIONS.map(symptom => (
              <div key={symptom.id} className="symptom-checkbox-wrapper">
                <label className="symptom-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(symptom.id)}
                    onChange={() => handleSymptomToggle(symptom.id)}
                    disabled={isLoading}
                  />
                  <span className="symptom-label">
                    <span className="symptom-icon">{symptom.icon}</span>
                    {symptom.label}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Other Symptoms Text */}
        {selectedSymptoms.includes('other') && (
          <section className="form-section">
            <h4>📝 Describe Other Symptoms</h4>
            <div className="form-group">
              <textarea
                value={otherSymptomsText}
                onChange={(e) => setOtherSymptomsText(e.target.value)}
                placeholder="Describe any other symptoms the patient is experiencing..."
                rows="3"
                disabled={isLoading}
                required
              />
            </div>
          </section>
        )}

        {/* Symptom Severity Section */}
        {selectedSymptoms.length > 0 && (
          <section className="form-section">
            <h4>📊 Symptom Severity (0 = None, 10 = Severe)</h4>
            <div className="severity-sliders">
              {selectedSymptoms.map(symptomId => {
                const symptom = SYMPTOM_OPTIONS.find(s => s.id === symptomId)
                const severity = symptomSeverity[symptomId] || 5

                return (
                  <div key={symptomId} className="severity-slider-group">
                    <div className="severity-header">
                      <label>{symptom?.label}</label>
                      <span className="severity-value">
                        {severity}
                        <span className="severity-unit">/10</span>
                      </span>
                    </div>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={severity}
                        onChange={(e) => handleSeverityChange(symptomId, e.target.value)}
                        disabled={isLoading}
                        className="severity-slider"
                      />
                      <div className="slider-labels">
                        <span>None</span>
                        <span>Moderate</span>
                        <span>Severe</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Progression Speed Section */}
        <section className="form-section">
          <h4>🚀 Symptom Progression Speed</h4>
          <div className="progression-options">
            {PROGRESSION_OPTIONS.map(option => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name="progression"
                  value={option.value}
                  checked={progressionSpeed === option.value}
                  onChange={(e) => setProgressionSpeed(e.target.value)}
                  disabled={isLoading}
                />
                <span className="radio-label">
                  <span className="radio-icon">{option.icon}</span>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Additional Notes Section */}
        <section className="form-section">
          <h4>📌 Additional Clinical Notes</h4>
          <div className="form-group">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional observations, medication effects, recent changes, etc..."
              rows="4"
              disabled={isLoading}
            />
          </div>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-large" disabled={isLoading}>
            {isLoading ? '⏳ Saving...' : '💾 Save Symptoms'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SymptomsTracking
