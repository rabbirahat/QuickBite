import React from 'react'
import './Header.css'
import { assets } from '../../assets/assets'
const Header = () => {
  const scrollToExplore = () => {
    const exploreSection = document.getElementById('explore-menu');
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className='header' style={{backgroundImage: `url(${assets.header_img})`}}>
      <div className="header-contents">
        <h2>Welcome to QuickBite</h2>
        <p>Delicious Food Delivered to Your Door</p>
        <button onClick={scrollToExplore}>View Menu</button>
      </div>
    </div>
  )
}

export default Header
