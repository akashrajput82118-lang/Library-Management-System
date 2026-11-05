import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/client'
import { BooksIcon, ShieldIcon } from '../components/Icons'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Please enter both username and password.')
      return
    }

    try {
      setSubmitting(true)
      await login(username.trim(), password)
      const destination = location.state?.from || '/'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-showcase">
        <div className="login-brand">
          <div className="brand-mark">
            <BooksIcon size={24} />
          </div>
          <span>Library Management System</span>
        </div>
        <div className="showcase-copy">
          <span className="eyebrow">Administrator portal</span>
          <h1>Every book, every student, in one calm workspace.</h1>
          <p>
            Manage your catalogue, keep student records tidy, and track issued
            books with live copy counts from your MySQL database.
          </p>
          <ul className="showcase-points">
            <li>Live dashboard and overdue tracking</li>
            <li>Safe issue and return workflow</li>
            <li>Server-validated records</li>
          </ul>
        </div>
        <div className="showcase-foot">
          <ShieldIcon size={18} />
          Protected by BCrypt passwords and signed JWT sessions
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <span className="eyebrow">Welcome back</span>
          <h2>Sign in to continue</h2>
          <p className="login-help">
            Use the administrator account configured for this library. Access
            tokens are kept in this browser tab only.
          </p>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="e.g. librarian"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting && <span className="spinner spinner-light" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="login-note">
            First time? Create or reset an admin with the one-time
            {' '}<code>APP_ADMIN_USERNAME</code> and{' '}
            <code>APP_ADMIN_PASSWORD</code> environment variables. Details are
            in the project README.
          </p>
        </form>
      </section>
    </div>
  )
}
