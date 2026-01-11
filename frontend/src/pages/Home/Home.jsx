import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import Recommendations from '../../components/Recommendations/Recommendations'
import { AppDownload } from '../../components/AppDownload/AppDownload'

const Home = () => {
  const [category, setCategory] = useState("All");
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.substring(1);
      // Wait a bit for components to render
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    }
  }, [location]);

  return (
    <div>
      <Header/>
      <ExploreMenu category={category} setCategory={setCategory}/>
      <div className="home-main-content">
        <div className="home-main-section">
          <FoodDisplay category={category}/>
        </div>
        <div className="home-sidebar-section">
          <Recommendations topN={5} />
        </div>
      </div>
    </div>
  )
}

export default Home
