import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Navbar.css'
import { assets } from '../../assets/assets'

const Navbar = () => {
  const [menu, setMenu] = useState("Home");
  const location = useLocation();
  const navigate = useNavigate();

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
        <Link to='/' onClick={()=>setMenu("Home")} className={menu==="Home"?"active":""}>Home</Link>
        <a href='#explore-menu' onClick={(e) => handleSectionClick(e, 'explore-menu')} className={menu==="Menu"?"active":""}>Menu</a>
        {/* <a href='#app-download' onClick={(e) => handleSectionClick(e, 'app-download')} className={menu==="Mobile App"?"active":""}>Mobile App</a> */}
        <a href='#footer' onClick={(e) => handleSectionClick(e, 'footer')} className={menu==="Contact Us"?"active":""}>Contact Us</a>
      </ul>
      <div className='navbar-right'>
        <img src={assets.search_icon} alt="" />
        <div className='navbar-search-icon'>
          <Link to='/cart'><img src={assets.shopping_cart_icon} alt="Shopping Cart" /></Link>
          <div className="dot"></div>
        </div>
        <Link to="/login">
          <button>Sign in</button>
        </Link>
      </div>
    </div>
  )
}

export default Navbar
