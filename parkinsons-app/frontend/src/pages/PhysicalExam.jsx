import React from 'react'
import HandTremor from '../components/HandTremor'
import VoiceTest from '../components/VoiceTest'
import FaceAssessment from '../components/FaceAssessment'

function PhysicalExam() {
  return (
    <div className="physical-exam-page">
      <div className="exam-header">
        <h2>Physical Examination Tests</h2>
        <p>Complete the assessments below. Tests can be run independently or together.</p>
      </div>
      
      <div className="exam-grid">
        {/* Hand Tremor Assessment Card */}
        <div className="exam-card">
          <HandTremor />
        </div>
        
        {/* Voice Tremor Assessment Card */}
        <div className="exam-card">
          <VoiceTest />
        </div>
        
        {/* Facial Assessment Card */}
        <div className="exam-card">
          <FaceAssessment />
        </div>
      </div>
    </div>
  )
}

export default PhysicalExam
