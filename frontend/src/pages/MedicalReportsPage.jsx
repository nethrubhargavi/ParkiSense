import React from 'react'
import MedicalReports from '../components/MedicalReports'

export default function MedicalReportsPage({ onNext, onPrev, isFirst, isLast }) {
  return (
    <div className="page-container medical-reports-page">
      <div className="page-header">
        <h2>Medical Reports & Insights</h2>
        <p>Upload your medical reports to get AI-generated summaries and insights.</p>
      </div>
      <div className="page-content">
        <MedicalReports />
      </div>
      <div className="page-navigation">
        {!isFirst && (
          <button onClick={onPrev} className="btn btn-secondary">
            ← Previous
          </button>
        )}
        <div></div>
        {!isLast && (
          <button onClick={onNext} className="btn btn-primary">
            Next →
          </button>
        )}
      </div>
    </div>
  )
}
