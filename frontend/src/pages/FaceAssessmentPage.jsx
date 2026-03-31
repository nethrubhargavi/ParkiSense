import React from 'react'
import FaceAssessment from '../components/FaceAssessment'

function FaceAssessmentPage({ onNext, onPrev, isFirst, isLast }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Facial Masking & Blink Rate</h2>
        <p>Record a 10-second video of your face and analyze for blink rate and facial masking traits.</p>
      </div>
      <div className="page-content">
        <FaceAssessment />
      </div>
      <div className="page-navigation">
        <button onClick={onPrev} disabled={isFirst} className="btn btn-secondary">
          ← Previous
        </button>
        <button onClick={onNext} disabled={isLast} className="btn btn-primary">
          Next →
        </button>
      </div>
    </div>
  )
}

export default FaceAssessmentPage
