import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import PatientManagement from './components/PatientManagement'
import Navigation from './components/Navigation'
import FamilyHistoryPage from './pages/FamilyHistoryPage'
import HandTremorPage from './pages/HandTremorPage'
import VoiceTestPage from './pages/VoiceTestPage'
import FaceAssessmentPage from './pages/FaceAssessmentPage'
import SymptomsTrackingPage from './pages/SymptomsTrackingPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' or 'assessment'
  const [selectedPatient, setSelectedPatient] = useState(null)
  
  const pages = ['family-history', 'symptoms', 'hand-tremor', 'voice-test', 'face-assessment']
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const currentPage = pages[currentPageIndex]
  
  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const doctorName = localStorage.getItem('doctorName')
    const doctorId = localStorage.getItem('doctorId')
    
    if (token && doctorName && doctorId) {
      setIsAuthenticated(true)
      setDoctorInfo({
        token,
        doctorName,
        doctorId
      })
    }
  }, [])
  
  const handleLoginSuccess = (info) => {
    setIsAuthenticated(true)
    setDoctorInfo(info)
    setCurrentView('dashboard')
  }
  
  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('doctorName')
    localStorage.removeItem('doctorId')
    setIsAuthenticated(false)
    setDoctorInfo(null)
    setCurrentView('dashboard')
    setSelectedPatient(null)
  }
  
  const handleStartAssessment = (patient) => {
    setSelectedPatient(patient)
    setCurrentView('assessment')
    setCurrentPageIndex(0)
  }
  
  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedPatient(null)
    setCurrentPageIndex(0)
  }
  
  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }
  
  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }

  const handleSaveSuccess = () => {
    // Move to next page after successful save
    handleNextPage()
  }
  
  const renderPage = () => {
    switch(currentPage) {
      case 'family-history':
        return <FamilyHistoryPage patientId={selectedPatient?.id} onNext={handleNextPage} onPrev={handlePrevPage} isFirst={currentPageIndex === 0} isLast={currentPageIndex === pages.length - 1} onSaveSuccess={handleSaveSuccess} />
      case 'symptoms':
        return <SymptomsTrackingPage patientId={selectedPatient?.id} onNext={handleNextPage} onPrev={handlePrevPage} isFirst={currentPageIndex === 0} isLast={currentPageIndex === pages.length - 1} onSaveSuccess={handleSaveSuccess} />
      case 'hand-tremor':
        return <HandTremorPage onNext={handleNextPage} onPrev={handlePrevPage} isFirst={currentPageIndex === 0} isLast={currentPageIndex === pages.length - 1} />
      case 'voice-test':
        return <VoiceTestPage onNext={handleNextPage} onPrev={handlePrevPage} isFirst={currentPageIndex === 0} isLast={currentPageIndex === pages.length - 1} />
      case 'face-assessment':
        return <FaceAssessmentPage onNext={handleNextPage} onPrev={handlePrevPage} isFirst={currentPageIndex === 0} isLast={currentPageIndex === pages.length - 1} />
      default:
        return <FamilyHistoryPage patientId={selectedPatient?.id} onNext={handleNextPage} onPrev={handlePrevPage} isFirst={currentPageIndex === 0} isLast={currentPageIndex === pages.length - 1} onSaveSuccess={handleSaveSuccess} />
    }
  }
  
  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  // Show assessment pages if in assessment view
  if (currentView === 'assessment' && selectedPatient) {
    return (
      <div className="app">
        <div className="assessment-top-bar">
          <div className="assessment-patient-info">
            <button onClick={handleBackToDashboard} className="btn btn-secondary btn-small">
              ← Back to Dashboard
            </button>
            <span className="patient-badge">👤 {selectedPatient.firstName} {selectedPatient.lastName}</span>
          </div>
          <div className="nav-logout">
            <button onClick={handleLogout} className="btn btn-danger btn-small">
              🚪 Logout
            </button>
          </div>
        </div>
        
        <Navigation currentPage={currentPage} onPageChange={(page) => setCurrentPageIndex(pages.indexOf(page))} />
        
        <header className="app-header">
          <h1>🏥 Parkinson's Disease Assessment</h1>
          <p className="subtitle">Physical Examination Module - Decision Support Tool (Not Diagnostic)</p>
        </header>
        
        <main className="app-main">
          {renderPage()}
        </main>
        
        <footer className="app-footer">
          <p>© 2026 Parkinson's Assessment Tool - For clinical use only</p>
        </footer>
      </div>
    )
  }
  
  // Show dashboard (patient management)
  return (
    <div className="app">
      <div className="dashboard-top-bar">
        <div className="dashboard-header">
          <h1>🏥 Parkinson's Assessment Dashboard</h1>
        </div>
        <div className="nav-logout">
          <button onClick={handleLogout} className="btn btn-danger btn-small">
            🚪 Logout
          </button>
        </div>
      </div>
      
      <main className="dashboard-main">
        <PatientManagement 
          doctorName={doctorInfo?.doctorName} 
          doctorId={doctorInfo?.doctorId}
          onStartAssessment={handleStartAssessment}
        />
      </main>
      
      <footer className="app-footer">
        <p>© 2026 Parkinson's Assessment Tool - For clinical use only</p>
      </footer>
    </div>
  )
}

export default App
