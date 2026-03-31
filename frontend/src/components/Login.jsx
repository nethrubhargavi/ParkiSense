<<<<<<< HEAD
import React, { useState } from 'react'

const API_BASE = 'https://parkisense-zcub.onrender.com'

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

      if (!response.ok) {
        setError(data.detail || data.message || 'Login failed')
        return
      }

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

  const handleDemoLogin = async () => {
    // Demo login using real backend credentials
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.detail || 'Demo login failed')
        return
      }
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('doctorName', data.doctorName)
      localStorage.setItem('doctorId', data.doctorId)
      onLoginSuccess({
        token: data.token,
        doctorName: data.doctorName,
        doctorId: data.doctorId
      })
    } catch (err) {
      console.error('Demo login error:', err)
      setError('Network error - ensure backend is running')
    } finally {
      setIsLoading(false)
    }
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
          <p className="demo-text">Demo credentials: admin / admin123</p>
          <button type="button" onClick={handleDemoLogin} className="btn btn-secondary btn-demo" disabled={isLoading}>
            📝 Continue with Demo
          </button>
        </div>

        <div className="login-footer">
          <p className="info">Use the demo button or enter valid credentials</p>
          <p className="version">Parkinson's Assessment v1.0</p>
        </div>
      </div>
    </div>
  )
}

export default Login

=======
import React, { useState } from 'react'

const API_BASE = 'https://parkisense-zcub.onrender.com'

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

      if (!response.ok) {
        setError(data.detail || data.message || 'Login failed')
        return
      }

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

  const handleDemoLogin = async () => {
    // Demo login using real backend credentials
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.detail || 'Demo login failed')
        return
      }
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('doctorName', data.doctorName)
      localStorage.setItem('doctorId', data.doctorId)
      onLoginSuccess({
        token: data.token,
        doctorName: data.doctorName,
        doctorId: data.doctorId
      })
    } catch (err) {
      console.error('Demo login error:', err)
      setError('Network error - ensure backend is running')
    } finally {
      setIsLoading(false)
    }
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
          <p className="demo-text">Demo credentials: admin / admin123</p>
          <button type="button" onClick={handleDemoLogin} className="btn btn-secondary btn-demo" disabled={isLoading}>
            📝 Continue with Demo
          </button>
        </div>

        <div className="login-footer">
          <p className="info">Use the demo button or enter valid credentials</p>
          <p className="version">Parkinson's Assessment v1.0</p>
        </div>
      </div>
    </div>
  )
}

export default Login

>>>>>>> ae6ffb8bbf49244eb2599dd1f532a652bf633124
