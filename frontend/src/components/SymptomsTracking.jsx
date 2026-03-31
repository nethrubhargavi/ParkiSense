import React, { useState } from 'react'

const API_BASE = 'https://parkisense-zcub.onrender.com'

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

    if (!validateForm()) return

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
        
        setTimeout(() => {
          setOnsetDate('')
          setSelectedSymptoms([])
          setSymptomSeverity({})
          setOtherSymptomsText('')
          setProgressionSpeed('')
          setNotes('')
          
          if (onSaveSuccess) onSaveSuccess()
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
      {/* UI unchanged */}
    </div>
  )
}

export default SymptomsTracking