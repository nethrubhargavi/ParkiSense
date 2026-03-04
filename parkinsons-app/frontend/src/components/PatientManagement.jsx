import React, { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000'

function PatientManagement({ doctorName, doctorId, onStartAssessment }) {
  const [patients, setPatients] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    mrnNumber: '',
    email: '',
    notes: ''
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/patients`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      const data = await response.json()
      if (data.status === 'success') {
        setPatients(data.patients || [])
      } else {
        setError('Failed to load patients')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPatient = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...formData,
          doctorId,
          createdAt: new Date().toISOString()
        })
      })

      const data = await response.json()
      if (data.status === 'success') {
        setPatients([...patients, data.patient])
        setFormData({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          mrnNumber: '',
          email: '',
          notes: ''
        })
        setShowAddForm(false)
        setError('')
      } else {
        setError(data.message || 'Failed to add patient')
      }
    } catch (error) {
      console.error('Add patient error:', error)
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient record?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/patients/${patientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      const data = await response.json()
      if (data.status === 'success') {
        setPatients(patients.filter(p => p.id !== patientId))
        setSelectedPatient(null)
      } else {
        setError('Failed to delete patient')
      }
    } catch (error) {
      console.error('Delete error:', error)
      setError('Network error')
    }
  }

  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mrnNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="patient-management-container">
      <div className="doctor-header">
        <div className="doctor-info">
          <h2>👨‍⚕️ {doctorName}</h2>
          <p>Patient Management Dashboard</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="management-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or MRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-success"
        >
          {showAddForm ? '✕ Cancel' : '➕ Add New Patient'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-patient-form-container">
          <h3>Add New Patient</h3>
          <form onSubmit={handleAddPatient} className="add-patient-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>MRN (Medical Record Number)</label>
                <input
                  type="text"
                  value={formData.mrnNumber}
                  onChange={(e) => setFormData({ ...formData, mrnNumber: e.target.value })}
                  placeholder="e.g., MRN123456"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="patient@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Clinical Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Initial assessment, symptoms, etc..."
                  rows="4"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? '⏳ Saving...' : '💾 Save Patient'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="patients-section">
        <h3>Patients ({filteredPatients.length})</h3>

        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <p>No patients found</p>
            {patients.length === 0 && (
              <p className="note">Click "Add New Patient" to get started</p>
            )}
          </div>
        ) : (
          <div className="patients-grid">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className={`patient-card ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="patient-card-header">
                  <h4>{patient.firstName} {patient.lastName}</h4>
                  <span className="mrn-badge">{patient.mrnNumber}</span>
                </div>

                <div className="patient-card-content">
                  {patient.dateOfBirth && (
                    <p><strong>DOB:</strong> {patient.dateOfBirth}</p>
                  )}
                  {patient.email && (
                    <p><strong>Email:</strong> {patient.email}</p>
                  )}
                  {patient.notes && (
                    <p className="notes"><strong>Notes:</strong> {patient.notes.substring(0, 100)}...</p>
                  )}
                </div>

                <div className="patient-card-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartAssessment && onStartAssessment(patient)
                    }}
                    className="btn btn-small btn-primary"
                  >
                    📋 Run Assessment
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePatient(patient.id)
                    }}
                    className="btn btn-small btn-danger"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="patient-detail-panel">
          <h3>Patient Details</h3>
          <div className="detail-content">
            <p><strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</p>
            <p><strong>MRN:</strong> {selectedPatient.mrnNumber}</p>
            {selectedPatient.dateOfBirth && <p><strong>DOB:</strong> {selectedPatient.dateOfBirth}</p>}
            {selectedPatient.email && <p><strong>Email:</strong> {selectedPatient.email}</p>}
            {selectedPatient.notes && (
              <p><strong>Notes:</strong> <br/>{selectedPatient.notes}</p>
            )}
            {selectedPatient.createdAt && (
              <p><strong>Added:</strong> {new Date(selectedPatient.createdAt).toLocaleDateString()}</p>
            )}
          </div>
          <button
            onClick={() => setSelectedPatient(null)}
            className="btn btn-secondary"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  )
}

export default PatientManagement
