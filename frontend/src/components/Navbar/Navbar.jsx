import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Navbar.css'
import { assets } from '../../assets/assets'

const Navbar = () => {
  const [menu, setMenu] = useState("Home");
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      setUser(null);
    }
  }, [location]); // Re-check when route changes

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
    navigate('/');
  };

  const handleSectionClick = (e, sectionId) => {
    e.preventDefault();

    if (location.pathname === '/') {
      // If we're on home page, scroll smoothly to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // If we're on another page, navigate to home with hash
      navigate(`/#${sectionId}`);
    }

    // Update menu state
    if (sectionId === 'explore-menu') setMenu("Menu");
    else if (sectionId === 'app-download') setMenu("Mobile App");
    else if (sectionId === 'footer') setMenu("Contact Us");
  };


  return (
    <div className='navbar'>
      <Link to="/" className="navbar-logo-container" onClick={() => setMenu("Home")}>
        {/* <img src={assets.logo} alt="QuickBite Logo" className="logo" /> */}
        <span className="logo-text">QuickBite</span>
      </Link>
      <ul className="navbar-menu">
        <Link to='/' onClick={() => setMenu("Home")} className={menu === "Home" ? "active" : ""}>Home</Link>
        <a href='#explore-menu' onClick={(e) => handleSectionClick(e, 'explore-menu')} className={menu === "Menu" ? "active" : ""}>Menu</a>
        {/* <a href='#app-download' onClick={(e) => handleSectionClick(e, 'app-download')} className={menu==="Mobile App"?"active":""}>Mobile App</a> */}
        <a href='#footer' onClick={(e) => handleSectionClick(e, 'footer')} className={menu === "Contact Us" ? "active" : ""}>Contact Us</a>
      </ul>
      <div className='navbar-right'>
        <img src={assets.search_icon} alt="" />
        <div className='navbar-search-icon'>
          <Link to='/cart'><img src={assets.shopping_cart_icon} alt="Shopping Cart" /></Link>
          <div className="dot"></div>
        </div>
        {user ? (
          <div className="user-menu-container">
            <button
              type="button"
              className="user-info"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="user-name">
                {user.name || "User"}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="user-dropdown-info">
                    <div className="user-dropdown-name">
                      {user.name || "User"}
                    </div>
                    <div className="user-dropdown-email">
                      {user.email || ""}
                    </div>
                  </div>
                </div>

                <div className="user-dropdown-divider" />

                <button
                  type="button"
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <button>Sign in</button>
          </Link>
        )}
      </div>
    </div>
  )
}

export default Navbar
