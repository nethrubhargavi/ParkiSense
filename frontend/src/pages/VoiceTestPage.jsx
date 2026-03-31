<<<<<<< HEAD
import React from 'react'
import VoiceTest from '../components/VoiceTest'

function VoiceTestPage({ onNext, onPrev, isFirst, isLast }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Voice Tremor Assessment</h2>
        <p>Record a 5-second voice sample by repeating "aaaah" and analyze for voice characteristics.</p>
      </div>
      <div className="page-content">
        <VoiceTest />
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

export default VoiceTestPage
=======
import React from 'react'
import VoiceTest from '../components/VoiceTest'

function VoiceTestPage({ onNext, onPrev, isFirst, isLast }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Voice Tremor Assessment</h2>
        <p>Record a 5-second voice sample by repeating "aaaah" and analyze for voice characteristics.</p>
      </div>
      <div className="page-content">
        <VoiceTest />
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

export default VoiceTestPage
>>>>>>> ae6ffb8bbf49244eb2599dd1f532a652bf633124
