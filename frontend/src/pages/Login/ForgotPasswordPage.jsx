import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import './ForgotPasswordPage.css'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, send password reset request here
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="fp-container">
        <div className="fp-card text-center">
          <div className="fp-center">
            <div className="fp-icon-lg">
              <CheckCircle className="check-icon" />
            </div>
          </div>

          <h1 className="fp-title">Check Your Email</h1>
          <p className="fp-text">
            We've sent a password reset link to <strong className="fp-check-strong">{email}</strong>
          </p>

          <p className="fp-text">
            Click the link in the email to reset your password. If you don't see the email, check your spam folder.
          </p>

          <Link to="/login" className="fp-link" >
            <ArrowLeft />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fp-container">
      <div className="fp-card">
        <div className="fp-center">
          <div className="fp-icon-sm">
            <Mail />
          </div>
        </div>

        <h1 className="fp-title">Forgot Password?</h1>
        <p className="fp-text">No worries! Enter your email and we'll send you a reset link.</p>

        <form onSubmit={handleSubmit} className="fp-form">
          <div>
            <label className="fp-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="fp-input"
            />
          </div>

          <button type="submit" className="fp-button">Send Reset Link</button>
        </form>

        <div className="fp-center-link">
          <Link to="/login" className="fp-link">
            <ArrowLeft />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
