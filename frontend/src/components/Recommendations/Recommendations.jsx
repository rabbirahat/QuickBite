import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { recommendationAPI } from '../../utils/api'
import FoodItem from '../FoodItem/FoodItem'
import { food_list as static_food_list } from '../../assets/assets'
import './Recommendations.css'

const Recommendations = ({ topN = 5 }) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const currentUser = useMemo(() => {
    const stored = localStorage.getItem('user')
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }, [])

  const isAuthenticated = !!currentUser && !!localStorage.getItem('token')

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await recommendationAPI.getMyRecommendations(topN)
        console.log('Recommendations API response:', response)
        if (response.success) {
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            setRecommendations(response.data)
            console.log(`Loaded ${response.data.length} recommendations`)
          } else {
            setError(response.message || 'No recommendations available. Try rating more foods!')
            setRecommendations([])
          }
        } else {
          setError(response.message || 'No recommendations available')
          setRecommendations([])
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setError(err.message || 'Failed to load recommendations')
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [isAuthenticated, topN])

  if (!isAuthenticated) {
    return (
      <div className="recommendations-section">
        <h2 className="recommendations-title">Personalized Recommendations</h2>
        <p className="recommendations-message">
          Please <button 
            onClick={() => navigate('/login')} 
            className="login-link-btn"
          >
            login
          </button> to see personalized food recommendations based on your ratings!
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="recommendations-section">
        <h2 className="recommendations-title">Personalized Recommendations</h2>
        <p className="recommendations-loading">Loading recommendations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="recommendations-section">
        <h2 className="recommendations-title">Personalized Recommendations</h2>
        <p className="recommendations-error">{error}</p>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-section">
        <h2 className="recommendations-title">Personalized Recommendations</h2>
        <p className="recommendations-message">
          Rate some foods to get personalized recommendations based on your preferences!
        </p>
      </div>
    )
  }

  return (
    <div className="recommendations-section">
      <h2 className="recommendations-title">
        Recommended for You
        <span className="recommendations-subtitle">
          Based on your ratings using AI-powered NMF algorithm
        </span>
      </h2>
      <div className="recommendations-list">
        {recommendations.map((rec, index) => {
          // If food is from static list (ID is "1", "2", "3", etc.), get image from static list
          const staticFood = static_food_list.find(f => f._id === rec.food._id);
          const foodImage = staticFood?.image || rec.food.image || '';
          const foodDescription = staticFood?.description || rec.food.description || '';
          const foodPrice = staticFood?.price || rec.food.price || 0;
          
          return (
            <div key={rec.food._id || index} className="recommendation-item-wrapper">
              <FoodItem
                id={rec.food._id}
                name={rec.food.name}
                description={foodDescription}
                price={foodPrice}
                image={foodImage}
              />
            <div className="predicted-rating-badge">
              <span className="predicted-rating-label">Predicted Rating:</span>
              <span className="predicted-rating-value">
                {rec.predictedRating && rec.predictedRating > 0 
                  ? `${rec.predictedRating.toFixed(1)} ⭐` 
                  : 'N/A'}
              </span>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  )
}

export default Recommendations

