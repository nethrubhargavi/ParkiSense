import React from 'react'
import SymptomsTracking from '../components/SymptomsTracking'

function SymptomsTrackingPage({ patientId, onNext, onPrev, isFirst, isLast, onSaveSuccess }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Symptoms Assessment</h2>
      </div>
      
      <div className="page-content">
        <SymptomsTracking patientId={patientId} onSaveSuccess={onSaveSuccess} />
      </div>
      
      <div className="page-navigation">
        {!isFirst && (
          <button onClick={onPrev} className="btn btn-secondary">
            ← Previous
          </button>
        )}
        <div></div>
        {!isLast && (
          <button onClick={onNext} className="btn btn-secondary">
            Next →
          </button>
        )}
      </div>
    </div>
  )
}

export default SymptomsTrackingPage
