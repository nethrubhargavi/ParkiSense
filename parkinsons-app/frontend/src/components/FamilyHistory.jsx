import React, { useState } from 'react'

const API_BASE = 'http://localhost:8000'

const RELATION_OPTIONS = [
  { value: 'mother', label: '👩 Mother' },
  { value: 'father', label: '👨 Father' },
  { value: 'sibling', label: '👥 Sibling (Brother/Sister)' },
  { value: 'child', label: '👶 Child (Son/Daughter)' },
  { value: 'grandparent', label: '👴 Grandparent' },
  { value: 'other', label: '❓ Other First-Degree Relative' }
]

function FamilyHistory({ patientId, onSaveSuccess }) {
  const [hasFamilyHistory, setHasFamilyHistory] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [currentMember, setCurrentMember] = useState({
    relation: '',
    ageAtDiagnosis: ''
  })
  const [notes, setNotes] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddFamilyMember = () => {
    if (!currentMember.relation || !currentMember.ageAtDiagnosis) {
      setError('Please fill in all family member details')
      return
    }

    const age = parseInt(currentMember.ageAtDiagnosis)
    if (isNaN(age) || age < 0 || age > 150) {
      setError('Please enter a valid age (0-150)')
      return
    }

    const relationLabel = RELATION_OPTIONS.find(r => r.value === currentMember.relation)?.label
    
    setFamilyMembers([
      ...familyMembers,
      {
        id: Date.now(),
        relation: currentMember.relation,
        relationLabel,
        ageAtDiagnosis: age
      }
    ])

    setCurrentMember({ relation: '', ageAtDiagnosis: '' })
    setError('')
  }

  const handleRemoveFamilyMember = (memberId) => {
    setFamilyMembers(familyMembers.filter(m => m.id !== memberId))
  }

  const validateForm = () => {
    if (hasFamilyHistory === null) {
      setError('Please indicate whether patient has first-degree relatives with Parkinson\'s')
      return false
    }

    if (hasFamilyHistory && familyMembers.length === 0) {
      setError('Please add at least one family member with Parkinson\'s disease')
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
      const payload = {
        patientId,
        hasFamilyHistory,
        familyMembers: hasFamilyHistory ? familyMembers : [],
        notes,
        recordedAt: new Date().toISOString()
      }

      const response = await fetch(`${API_BASE}/family-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === 'success' || response.ok) {
        setSuccess('Family history recorded successfully!')
        setIsLoading(false)
        
        // Call the success callback immediately
        if (onSaveSuccess) {
          setTimeout(() => {
            onSaveSuccess()
          }, 1000)
        }
        
        // Reset form after a delay
        setTimeout(() => {
          setHasFamilyHistory(null)
          setFamilyMembers([])
          setCurrentMember({ relation: '', ageAtDiagnosis: '' })
          setNotes('')
        }, 1500)
      } else {
        setError(data.message || 'Failed to save family history')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Save error:', error)
      setError('Network error - ensure backend is running on http://localhost:8000')
      setIsLoading(false)
    }
  }

  return (
    <div className="family-history-container">
      <div className="family-history-header">
        <h3>👨‍👩‍👧 Family History</h3>
        <p className="subtitle">Assess family history of Parkinson's disease</p>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <form onSubmit={handleSave} className="family-history-form">
        {/* Primary Question */}
        <section className="form-section">
          <h4>🔍 First-Degree Relatives Assessment</h4>
          
          <div className="family-question">
            <p className="question-text">
              Does the patient have any first-degree relatives (mother, father, siblings, or children) with Parkinson's disease?
            </p>
            
            <div className="yes-no-buttons">
              <button
                type="button"
                onClick={() => {
                  setHasFamilyHistory(true)
                  setError('')
                }}
                className={`yes-no-btn ${hasFamilyHistory === true ? 'active yes' : ''}`}
                disabled={isLoading}
              >
                <span className="btn-icon">✅</span>
                <span className="btn-text">Yes</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setHasFamilyHistory(false)
                  setFamilyMembers([])
                  setError('')
                }}
                className={`yes-no-btn ${hasFamilyHistory === false ? 'active no' : ''}`}
                disabled={isLoading}
              >
                <span className="btn-icon">❌</span>
                <span className="btn-text">No</span>
              </button>
            </div>
          </div>
        </section>

        {/* Family Members Details - Only show if "Yes" */}
        {hasFamilyHistory === true && (
          <section className="form-section">
            <h4>👥 Add Family Members with Parkinson's</h4>
            
            <div className="family-member-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="relation">Relation to Patient *</label>
                  <select
                    id="relation"
                    value={currentMember.relation}
                    onChange={(e) => setCurrentMember({ ...currentMember, relation: e.target.value })}
                    disabled={isLoading}
                    className="relation-select"
                  >
                    <option value="">-- Select relation --</option>
                    {RELATION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="age-diagnosis">Age at Diagnosis *</label>
                  <input
                    id="age-diagnosis"
                    type="number"
                    min="0"
                    max="150"
                    value={currentMember.ageAtDiagnosis}
                    onChange={(e) => setCurrentMember({ ...currentMember, ageAtDiagnosis: e.target.value })}
                    placeholder="e.g., 65"
                    disabled={isLoading}
                    className="age-input"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddFamilyMember}
                  disabled={isLoading}
                  className="btn btn-secondary btn-add"
                >
                  ➕ Add
                </button>
              </div>
            </div>

            {/* Family Members List */}
            {familyMembers.length > 0 && (
              <div className="family-members-list">
                <h5>Family Members ({familyMembers.length})</h5>
                <div className="members-grid">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="member-card">
                      <div className="member-info">
                        <p className="member-relation">{member.relationLabel}</p>
                        <p className="member-age">
                          <span className="age-label">Diagnosed at:</span>
                          <span className="age-value">{member.ageAtDiagnosis} years old</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFamilyMember(member.id)}
                        disabled={isLoading}
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Additional Notes */}
        <section className="form-section">
          <h4>📝 Additional Notes</h4>
          <div className="form-group">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant family history information, such as mother diagnosed at 70, father with suspected Parkinson's, etc..."
              rows="3"
              disabled={isLoading}
            />
          </div>
        </section>

        {/* Summary Box */}
        {hasFamilyHistory !== null && (
          <section className="form-section summary-section">
            <h4>📊 Summary</h4>
            <div className="summary-content">
              <p>
                <strong>Family History Status:</strong>{' '}
                {hasFamilyHistory ? (
                  <span className="positive">✅ Positive (has relatives with Parkinson's)</span>
                ) : (
                  <span className="negative">❌ Negative (no known relatives with Parkinson's)</span>
                )}
              </p>
              {hasFamilyHistory && familyMembers.length > 0 && (
                <p>
                  <strong>Affected Relatives:</strong>{' '}
                  <span className="record-count">{familyMembers.length} family member{familyMembers.length !== 1 ? 's' : ''} recorded</span>
                </p>
              )}
            </div>
          </section>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-large" disabled={isLoading}>
            {isLoading ? '⏳ Saving...' : '💾 Save Family History'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FamilyHistory
