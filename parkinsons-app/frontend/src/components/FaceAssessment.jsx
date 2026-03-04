import React, { useState, useRef, useEffect } from 'react'

const API_BASE = 'http://localhost:8000'

function FaceAssessment() {
  const [cameraActive, setCameraActive] = useState(false)
  const [status, setStatus] = useState('Camera not started')
  const [results, setResults] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasRecording, setHasRecording] = useState(false)
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  
  // Start camera
  const startCamera = async () => {
    try {
      setStatus('Requesting camera access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
        setStatus('Camera ready - Look directly at the camera')
      }
    } catch (error) {
      setStatus('Camera access denied or unavailable')
      console.error('Camera error:', error)
    }
  }
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setCameraActive(false)
      setStatus('Camera stopped')
    }
  }
  
  // Start video recording for analysis
  const startRecording = () => {
    if (!streamRef.current) return
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      setResults(null)
      setHasRecording(false)
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        // Mark recording as complete after recorder stops
        if (chunksRef.current.length > 0) {
          setHasRecording(true)
        }
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setIsRecording(false)
        clearInterval(timerRef.current)
        setStatus('Recording error occurred')
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setStatus('Recording... Look at camera and blink naturally')
      
      // Record for 10 seconds
      const recordingTimer = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          if (newTime >= 10) {
            // Stop recording after 10 seconds
            clearInterval(recordingTimer)
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop()
            }
            setIsRecording(false)
            setStatus('Recording stopped - ready to analyze')
          }
          return newTime
        })
      }, 1000)
      
      timerRef.current = recordingTimer
      
    } catch (error) {
      setStatus('Recording failed')
      console.error('Recording error:', error)
      setIsRecording(false)
    }
  }
  
  // Mark recording as complete
  const markRecordingComplete = () => {
    if (chunksRef.current.length > 0) {
      setHasRecording(true)
    }
  }
  
  // Stop video recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      } catch (error) {
        console.error('Error stopping recorder:', error)
      }
      setIsRecording(false)
      clearInterval(timerRef.current)
      setStatus('Recording stopped - ready to analyze')
      markRecordingComplete()
    }
  }
  
  // Run face analysis (calls new backend API)
  const runFaceAnalysis = async () => {
    if (chunksRef.current.length === 0) {
      setStatus('No recording available - please record first')
      return
    }
    
    setIsProcessing(true)
    setStatus('Processing facial analysis...')
    setResults(null)
    
    try {
      // Create video blob from recorded chunks
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' })
      
      // Create FormData to send video file
      const formData = new FormData()
      formData.append('video', videoBlob, 'face_recording.webm')
      
      const response = await fetch(`${API_BASE}/run-face-test`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        setResults(data)
        setStatus('Analysis complete')
      } else {
        setStatus('Analysis failed')
        setResults(data)
      }
    } catch (error) {
      setStatus('Network error - ensure backend is running')
      console.error('API error:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])
  
  return (
    <div className="assessment-container">
      <div className="assessment-header">
        <h3>🟡 Facial Masking & Blink Rate</h3>
        <p className="instruction">
          Position your face in the camera frame. Look directly at the camera 
          and blink naturally for 10 seconds during recording.
        </p>
      </div>
      
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-preview"
        />
        {!cameraActive && (
          <div className="video-placeholder">
            <p>📹 Front camera preview will appear here</p>
          </div>
        )}
        {isRecording && (
          <div className="recording-overlay">
            <div className="rec-indicator">● REC {recordingTime}/10s</div>
          </div>
        )}
      </div>
      
      <div className="status-bar">
        <span className={`status-indicator ${isProcessing ? 'processing' : ''}`}>
          {status}
        </span>
      </div>
      
      <div className="controls">
        {!cameraActive ? (
          <button onClick={startCamera} className="btn btn-primary">
            Start Camera
          </button>
        ) : (
          <>
            <button onClick={stopCamera} className="btn btn-secondary">
              Stop Camera
            </button>
            {!isRecording ? (
              <button onClick={startRecording} className="btn btn-warning">
                Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="btn btn-danger">
                Stop Recording
              </button>
            )}
          </>
        )}
      </div>
      
      {hasRecording && (
        <div className="analysis-section">
          <button 
            onClick={runFaceAnalysis} 
            className="btn btn-success btn-large"
            disabled={isProcessing}
          >
            {isProcessing ? '⏳ Processing...' : '▶ Run Face Analysis'}
          </button>
        </div>
      )}
      
      {results && (
        <div className="results-panel">
          <h4>Results</h4>
          
          {results.status === 'success' ? (
            <div className="results-content">
              <div className="metric-grid">
                <div className="metric-card">
                  <span className="metric-label">Blink Rate</span>
                  <span className="metric-value">{results.blink_rate} blinks/min</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Total Blinks</span>
                  <span className="metric-value">{results.blink_count}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Duration</span>
                  <span className="metric-value">{results.duration_seconds}s</span>
                </div>
              </div>
              
              <div className="interpretation">
                <h5>Clinical Interpretation:</h5>
                <p className="interpretation-text">{results.interpretation}</p>
                <p className="note">
                  Normal blink rate: 15-20 blinks/min<br/>
                  Parkinson's often shows reduced blink rate (&lt;10 blinks/min)
                </p>
              </div>
              
              {/* Technical details removed for cleaner UI */}
            </div>
          ) : (
            <div className="error-output">
              <p><strong>Error:</strong></p>
              <pre>{results.message || 'Unknown error'}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FaceAssessment
