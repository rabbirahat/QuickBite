import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'
import { assets } from '../../assets/assets'

const Navbar = () => {

const  [menu, setMenu] = useState("Home");
  return (
    <div className='navbar'>
      <Link to="/" className="navbar-logo-container" onClick={() => setMenu("Home")}>
        <img src={assets.logo} alt="QuickBite Logo" className="logo" />
        <span className="logo-text">QuickBite</span>
      </Link>
      <ul className="navbar-menu">
        <Link to='/' onClick={()=>setMenu("Home")}className={menu==="Home"?"active":""}>Home</Link>
        <a href='#explore-menu' onClick={()=>setMenu("Menu")}className={menu==="Menu"?"active":""}>Menu</a>
        <a href='#app-download' onClick={()=>setMenu("Mobile App")}className={menu==="Mobile App"?"active":""}>Mobile App</a>
        <a href='#footer' onClick={()=>setMenu("Contact Us")}className={menu==="Contact Us"?"active":""}>Contact Us</a>
      </ul>
      <div className='navbar-right'>
        <img src={assets.search_icon} alt="" />
        <div className='navbar-search-icon'>
          <img src={assets.shopping_cart_icon} alt="Shopping Cart" />
          <div className="dot"></div>
        </div>
        <button>Sign in</button>
      </div>
    </div>
  )
}

export default Navbar
