<<<<<<< HEAD
import React from 'react'
import FamilyHistory from '../components/FamilyHistory'

function FamilyHistoryPage({ patientId, onNext, onPrev, isFirst, isLast, onSaveSuccess }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Family History Assessment</h2>
      </div>
      
      <div className="page-content">
        <FamilyHistory patientId={patientId} onSaveSuccess={onSaveSuccess} />
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

export default FamilyHistoryPage
=======
import React from 'react'
import FamilyHistory from '../components/FamilyHistory'

function FamilyHistoryPage({ patientId, onNext, onPrev, isFirst, isLast, onSaveSuccess }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Family History Assessment</h2>
      </div>
      
      <div className="page-content">
        <FamilyHistory patientId={patientId} onSaveSuccess={onSaveSuccess} />
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

export default FamilyHistoryPage
>>>>>>> ae6ffb8bbf49244eb2599dd1f532a652bf633124
