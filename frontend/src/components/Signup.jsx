import React, { useState } from 'react'

const API_BASE = 'https://parkisense-zcub.onrender.com'

function Signup({ onSignupSuccess, onGoToLogin }) {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.fullName.trim()) {
      setError('Full name is required')
      return
    }
    if (!form.username.trim()) {
      setError('Username is required')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          fullName: form.fullName,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.detail || data.message || 'Registration failed')
        return
      }
      if (data.status === 'success') {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('doctorName', data.doctorName)
        localStorage.setItem('doctorId', data.doctorId)
        onSignupSuccess({
          token: data.token,
          doctorName: data.doctorName,
          doctorId: data.doctorId,
        })
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      console.error('Signup error:', err)
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
          <p className="subtitle">Create Doctor Account</p>
        </div>

        <form onSubmit={handleSignup} className="login-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Dr. Jane Smith"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="Choose a username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-login"
            disabled={
              isLoading ||
              !form.fullName ||
              !form.username ||
              !form.password ||
              !form.confirmPassword
            }
          >
            {isLoading ? '⏳ Creating account...' : '✅ Create Account'}
          </button>
        </form>

        <div className="login-footer">
          <p className="info">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              className="signup-link-btn"
              disabled={isLoading}
            >
              Log in
            </button>
          </p>
          <p className="version">Parkinson's Assessment v1.0</p>
        </div>
      </div>
    </div>
  )
}

export default Signup