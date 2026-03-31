import React from 'react'
import HandTremor from '../components/HandTremor'

function HandTremorPage({ onNext, onPrev, isFirst, isLast }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Hand Tremor Assessment</h2>
        <p>Record a 10-second video of your hands and analyze for tremor characteristics.</p>
      </div>
      <div className="page-content">
        <HandTremor />
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

export default HandTremorPage
