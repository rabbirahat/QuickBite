import { useState } from 'react';
import { Link } from 'react-router-dom';
import './SignupPage.css';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateName = (name) => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Full name should only contain letters and spaces';
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    
    if (field === 'name') {
      const error = validateName(name);
      setErrors({ ...errors, name: error });
    } else if (field === 'email') {
      const error = validateEmail(email);
      setErrors({ ...errors, email: error });
    } else if (field === 'password') {
      const error = validatePassword(password);
      setErrors({ ...errors, password: error });
      // Also validate confirm password if it's been touched
      if (touched.confirmPassword) {
        setErrors({ ...errors, password: error, confirmPassword: validateConfirmPassword(confirmPassword, password) });
      }
    } else if (field === 'confirmPassword') {
      const error = validateConfirmPassword(confirmPassword, password);
      setErrors({ ...errors, confirmPassword: error });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password);
    
    const newErrors = {
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    };
    
    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    
    // Check if there are any errors
    if (!nameError && !emailError && !passwordError && !confirmPasswordError) {
      console.log('Signup submitted:', { name, email, password, confirmPassword });
      // Form is valid, proceed with signup
    }
  };

  const handleSocialSignup = (provider) => {
    console.log(`Sign up with ${provider}`);
  };

  return (
    <div className="signup-page-container">
      <div className="signup-card">
        <div className="signup-icon-container">
          <div className="signup-icon-wrapper">
            <svg className="signup-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
        </div>
        <h1 className="signup-title">Create Account</h1>
        <p className="signup-subtitle">Join QuickBite today</p>

        {errors.general && (
          <div className="error-message">
            {errors.general}
          </div>
        )}

        {/* Social Signup Buttons */}
        <div className="social-buttons-container">
          <button
            onClick={() => handleSocialSignup('Google')}
            className="social-button"
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="social-button-text">Sign up with Google</span>
          </button>
          <button
            onClick={() => handleSocialSignup('Facebook')}
            className="social-button"
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="social-button-text">Sign up with Facebook</span>
          </button>
        </div>

        {/* Divider */}
        <div className="divider-container">
          <div className="divider-line"></div>
          <span className="divider-text">Or sign up with email</span>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (touched.name) {
                  setErrors({ ...errors, name: validateName(e.target.value) });
                }
              }}
              onBlur={() => handleBlur('name')}
              placeholder="John Doe"
              className={`form-input ${touched.name && errors.name ? 'form-input-error' : ''}`}
            />
            {touched.name && errors.name && (
              <span className="error-text">{errors.name}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) {
                  setErrors({ ...errors, email: validateEmail(e.target.value) });
                }
              }}
              onBlur={() => handleBlur('email')}
              placeholder="your@email.com"
              className={`form-input ${touched.email && errors.email ? 'form-input-error' : ''}`}
            />
            {touched.email && errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) {
                  setErrors({ ...errors, password: validatePassword(e.target.value) });
                }
                // Re-validate confirm password if it's been touched
                if (touched.confirmPassword) {
                  setErrors({ ...errors, password: validatePassword(e.target.value), confirmPassword: validateConfirmPassword(confirmPassword, e.target.value) });
                }
              }}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              className={`form-input ${touched.password && errors.password ? 'form-input-error' : ''}`}
            />
            {touched.password && errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (touched.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: validateConfirmPassword(e.target.value, password) });
                }
              }}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="••••••••"
              className={`form-input ${touched.confirmPassword && errors.confirmPassword ? 'form-input-error' : ''}`}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>
          <button
            type="submit"
            className="submit-button"
          >
            Create Account
          </button>
        </form>

        <div className="signup-footer">
          <p className="signup-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="signup-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

