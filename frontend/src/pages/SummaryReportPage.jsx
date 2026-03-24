import React from 'react'
import SummaryReport from '../components/SummaryReport'

function SummaryReportPage({ patientId, patientName, onPrev, isFirst }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Comprehensive Assessment Report</h2>
        <p>Review all assessment data and generate a printable report</p>
      </div>

      <div className="page-content">
        <SummaryReport patientId={patientId} patientName={patientName} />
      </div>

      <div className="page-navigation">
        {!isFirst && (
          <button onClick={onPrev} className="btn btn-secondary">
            ← Previous
          </button>
        )}
        <div></div>
      </div>
    </div>
  )
}

export default SummaryReportPage
