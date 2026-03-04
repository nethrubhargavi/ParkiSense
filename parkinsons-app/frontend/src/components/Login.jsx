import React, { useState } from 'react'

const API_BASE = 'http://localhost:8000'

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      })

      const data = await response.json()

      if (data.status === 'success') {
        // Store auth token/doctor info in localStorage
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('doctorName', data.doctorName)
        localStorage.setItem('doctorId', data.doctorId)
        onLoginSuccess({
          token: data.token,
          doctorName: data.doctorName,
          doctorId: data.doctorId
        })
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error - ensure backend is running')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    // Demo login for testing
    const demoData = {
      token: 'demo-token-' + Date.now(),
      doctorName: 'Dr. Demo',
      doctorId: 'demo-001'
    }
    localStorage.setItem('authToken', demoData.token)
    localStorage.setItem('doctorName', demoData.doctorName)
    localStorage.setItem('doctorId', demoData.doctorId)
    onLoginSuccess(demoData)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🏥 Parkinson's Assessment Dashboard</h1>
          <p className="subtitle">Doctor's Portal</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary btn-login" disabled={isLoading || !username || !password}>
            {isLoading ? '⏳ Logging in...' : '🔐 Login'}
          </button>
        </form>

        <div className="demo-section">
          <p className="demo-text">Demo credentials:</p>
          <button type="button" onClick={handleDemoLogin} className="btn btn-secondary btn-demo">
            📝 Continue with Demo
          </button>
        </div>

        <div className="login-footer">
          <p className="info">For test purposes, use any username/password</p>
          <p className="version">Parkinson's Assessment v1.0</p>
        </div>
      </div>
    </div>
  )
}

export default Login
