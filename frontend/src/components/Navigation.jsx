import React from 'react'

function Navigation({ currentPage, onPageChange }) {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>🏥 Parkinson's Assessment</h2>
        </div>
        
        <ul className="nav-menu">
          <li>
            <button className={`nav-link ${currentPage === 'family-history' ? 'active' : ''}`}
              onClick={() => onPageChange('family-history')}>
              👨‍👩‍👧 Family History
            </button>
          </li>
          <li>
            <button className={`nav-link ${currentPage === 'symptoms' ? 'active' : ''}`}
              onClick={() => onPageChange('symptoms')}>
              📋 Symptoms
            </button>
          </li>
          <li>
            <button className={`nav-link ${currentPage === 'hand-tremor' ? 'active' : ''}`}
              onClick={() => onPageChange('hand-tremor')}>
              🔵 Hand Tremor
            </button>
          </li>
          <li>
            <button className={`nav-link ${currentPage === 'voice-test' ? 'active' : ''}`}
              onClick={() => onPageChange('voice-test')}>
              🟢 Voice Test
            </button>
          </li>
          <li>
            <button className={`nav-link ${currentPage === 'face-assessment' ? 'active' : ''}`}
              onClick={() => onPageChange('face-assessment')}>
              🟡 Facial Masking
            </button>
          </li>
          <li>
            <button className={`nav-link ${currentPage === 'medical-reports' ? 'active' : ''}`}
              onClick={() => onPageChange('medical-reports')}>
              📄 Medical Reports
            </button>
          </li>
          <li>
            <button className={`nav-link ${currentPage === 'summary-report' ? 'active' : ''}`}
              onClick={() => onPageChange('summary-report')}>
              📊 Summary Report
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navigation