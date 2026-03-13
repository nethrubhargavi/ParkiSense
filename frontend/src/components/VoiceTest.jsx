import React, { useState, useRef } from 'react'

const API_BASE = 'http://localhost:8000'

function VoiceTest() {
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState('Ready to record')
  const [results, setResults] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasRecording, setHasRecording] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  
  // Start recording
  const startRecording = async () => {
    try {
      // Clear any previous audio chunks and state
      audioChunksRef.current = []
      setResults(null)
      setHasRecording(false)
      setStatus('Requesting microphone access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => {
          try {
            track.stop()
          } catch (e) {
            console.error('Error stopping track:', e)
          }
        })
        // Mark recording as complete after recorder stops
        if (audioChunksRef.current.length > 0) {
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
      setStatus('Recording... Say "aaaah" for 10 seconds')
      
      // Timer countdown with stored reference
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
      setStatus('Microphone access denied or unavailable')
      console.error('Microphone error:', error)
      setIsRecording(false)
    }
  }
  
  // Mark recording as complete
  const markRecordingComplete = () => {
    if (audioChunksRef.current.length > 0) {
      setHasRecording(true)
    }
  }
  
  // Stop recording
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
  
  // Analyze voice (sends recorded audio to backend API)
  const analyzeVoice = async () => {
    if (audioChunksRef.current.length === 0) {
      setStatus('No recording available')
      return
    }
    
    setIsProcessing(true)
    setStatus('Processing voice analysis...')
    setResults(null)
    
    try {
      // Create audio blob from recorded chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      // Check if blob is empty
      if (audioBlob.size === 0) {
        setStatus('Audio file is empty - please record again')
        setResults({
          status: 'error',
          message: 'No audio data captured'
        })
        setIsProcessing(false)
        return
      }
      
      // Create FormData to send audio file
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice_recording.webm')
      
      const response = await fetch(`${API_BASE}/run-voice-test`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Parse metrics from response
        setResults({
          jitter: data.jitter || 'N/A',
          shimmer: data.shimmer || 'N/A',
          f0_mean: data.f0_mean || 'N/A',
          confidence: data.confidence || 'N/A',
          interpretation: data.clinical_interpretation || 'Analysis complete',
          status: 'success'
        })
        setStatus('Analysis complete')
      } else {
        setStatus('Analysis failed: ' + (data.message || 'Unknown error'))
        setResults({
          status: 'error',
          message: data.message || 'Voice analysis failed'
        })
      }
    } catch (error) {
      setStatus('Network error - ensure backend is running')
      console.error('API error:', error)
      setResults({
        status: 'error',
        message: error.message
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="assessment-container">
      <div className="assessment-header">
        <h3>🟢 Voice Tremor Assessment</h3>
        <p className="instruction">
          Click "Start Recording" and sustain the sound "aaaah" for 10 seconds. 
          Keep volume steady and avoid background noise.
        </p>
      </div>
      
      <div className="audio-container">
        {isRecording ? (
          <div className="recording-indicator">
            <div className="pulse-ring"></div>
            <p className="recording-text">🎤 Recording in progress</p>
            <p className="timer">{recordingTime} / 10 seconds</p>
          </div>
        ) : (
          <div className="audio-placeholder">
            <p>🎤 Ready to record</p>
            <p className="note">Your voice will be analyzed for tremor characteristics</p>
          </div>
        )}
      </div>
      
      <div className="status-bar">
        <span className={`status-indicator ${isProcessing ? 'processing' : ''}`}>
          {status}
        </span>
      </div>
      
      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording} className="btn btn-primary">
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="btn btn-danger">
            Stop Recording
          </button>
        )}
      </div>
      
      {hasRecording && (
        <div className="analysis-section">
          <button 
            onClick={analyzeVoice} 
            className="btn btn-success btn-large"
            disabled={isProcessing}
          >
            {isProcessing ? '⏳ Processing...' : '▶ Analyze Voice'}
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
                  <span className="metric-label">Jitter</span>
                  <span className="metric-value">{results.jitter}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Shimmer</span>
                  <span className="metric-value">{results.shimmer}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">F0 Mean</span>
                  <span className="metric-value">{results.f0_mean} Hz</span>
                </div>
              </div>
              
              <div className="interpretation-box">
                <p><strong>Assessment:</strong> {results.interpretation}</p>
              </div>
              
              {/* Full raw response removed for privacy/clean UI */}
              
              <div className="graph-placeholder">
                <p>📊 Waveform & pitch visualization placeholder</p>
                <p className="note">Visual analysis available in extended version</p>
              </div>
            </div>
          ) : (
            <div className="error-output">
              <p><strong>Error:</strong></p>
              <pre>{results.stderr || results.message || 'Unknown error'}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VoiceTest
